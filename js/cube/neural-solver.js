// Mon réseau de neurones qui résout le Rubik's Cube, exécuté sur la carte graphique avec WebGPU, ou à défaut sur le
// processeur en WebAssembly SIMD (téléphones et navigateurs sans WebGPU). Chargé par solver-worker.js, à côté de cubejs.
// Le réseau lit la couleur des 54 facettes (dans l'ordre de cube.asString()) et donne, pour chacun des 12 quarts
// de tour, la probabilité π(a | s) qu'il mène vers la solution, et sa valeur V(s), le nombre de coups estimé
// jusqu'au cube résolu. Une recherche en faisceau développe à chaque profondeur ses états et garde les enfants de
// plus petit coût V(s) - log π(a | s) : la politique classe les frères, la valeur du parent les familles, en une
// seule évaluation du réseau par état. Elle part de quatre versions équivalentes du cube (lui-même, son inverse et
// deux conjugués par les rotations de 120° autour de la diagonale URF), dont les erreurs du réseau diffèrent.
// Les poids viennent de scripts/export-model.py : BatchNorm fusionnées, int8 avec une échelle par sortie.
self.NeuralSolver = (() => {
  const MODEL_URL = new URL('../../assets/model/neural-solver.bin', self.location.href);
  const ACTIONS = ['F', "F'", 'B', "B'", 'L', "L'", 'R', "R'", 'U', "U'", 'D', "D'"]; // ordre des sorties du réseau
  const COLOUR = Object.fromEntries([...'URFDLB'].map((face, i) => [face, i]));
  const SOLVED = [...'URFDLB'].map((face) => face.repeat(9)).join('');
  // états gardés à chaque profondeur : sur la carte graphique, tous les cubes résolus en 24 quarts de tour en moyenne ;
  // sur le processeur, 8 fois moins pour rester autour d'une seconde
  const GPU_WIDTH = 256;
  const CPU_WIDTH = 32;
  const MAX_DEPTH = 40;
  const LAMBDA = 1; // poids de la politique dans le coût
  const ROWS = 8; // états calculés ensemble par un fil du GPU (GPU_WIDTH en est un multiple)
  const RELU = 1;
  const RESIDUAL = 2;

  // Une couche : y = biais + échelle x somme(q x entrée) / 127. Son tampon reprend le fichier : les échelles et les
  // biais (float32), puis les poids int8, 4 sorties par mot ; un seul tampon par couche, pour rester sous la limite
  // de 4 tampons de stockage par shader du mode compatibilité (téléphones Android sans Vulkan)
  const HEADER = /* wgsl */ `
    struct Layer { k: u32, o4: u32, flags: u32, pad: u32 }
    @group(0) @binding(0) var<uniform> layer: Layer;
    @group(0) @binding(1) var<storage, read> w: array<u32>;
    @group(0) @binding(5) var<storage, read_write> y: array<vec4f>;
    fn floats(i: u32) -> vec4f { return bitcast<vec4f>(vec4u(w[i], w[i + 1u], w[i + 2u], w[i + 3u])); }
    fn scale(o: u32) -> vec4f { return floats(4u * o); }
    fn bias(o: u32) -> vec4f { return floats(4u * (layer.o4 + o)); }
    fn weights(k: u32, o: u32) -> vec4f { return unpack4x8snorm(w[8u * layer.o4 + k * layer.o4 + o]); }
  `;
  // La première couche lit un one-hot : la somme se réduit aux 54 lignes des couleurs présentes
  const EMBED = /* wgsl */ `${HEADER}
    @group(0) @binding(3) var<storage, read> colours: array<u32>;
    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3u) {
      let o = id.x;
      if (o >= layer.o4) { return; }
      var acc = vec4f(0.0);
      for (var i = 0u; i < 54u; i++) {
        acc += weights(i * 6u + colours[id.y * 54u + i], o);
      }
      y[id.y * layer.o4 + o] = max(acc * scale(o) + bias(o), vec4f(0.0));
    }`;
  const DENSE = /* wgsl */ `${HEADER}
    @group(0) @binding(3) var<storage, read> x: array<f32>;
    @group(0) @binding(4) var<storage, read> res: array<vec4f>;
    const ROWS = ${ROWS}u;
    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3u) {
      let o = id.x;
      if (o >= layer.o4) { return; }
      let b0 = id.y * ROWS;
      var acc: array<vec4f, ROWS>;
      for (var k = 0u; k < layer.k; k++) {
        let wk = weights(k, o);
        for (var r = 0u; r < ROWS; r++) {
          acc[r] += wk * x[(b0 + r) * layer.k + k];
        }
      }
      for (var r = 0u; r < ROWS; r++) {
        let i = (b0 + r) * layer.o4 + o;
        var v = acc[r] * scale(o) + bias(o);
        if ((layer.flags & ${RESIDUAL}u) != 0u) { v += res[i]; }
        if ((layer.flags & ${RELU}u) != 0u) { v = max(v, vec4f(0.0)); }
        y[i] = v;
      }
    }`;

  // Sur le processeur, une couche en WebAssembly SIMD : layer(x, w, y, K, O, B) ajoute à y[b][o] la somme sur k de
  // w[k][o] (int8) x x[b][k] (float32), 16 sorties par tour, en sautant les entrées nulles (la moitié, après ReLU) ;
  // O est un multiple de 16. Le module (343 octets) est assemblé ici, octet par octet : pas d'outil ni de fichier.
  const LAYER_WASM = (() => {
    const uleb = (n) => {
      const out = [];
      do out.push((n & 0x7f) | (n > 0x7f ? 0x80 : 0));
      while ((n >>>= 7));
      return out;
    };
    const seq = (...parts) => parts.flat(Infinity);
    const vec = (items) => seq(uleb(items.length), items);
    const section = (id, bytes) => seq(id, uleb(bytes.length), bytes);
    const name = (s) => vec([...s].map((c) => c.charCodeAt(0)));
    // les instructions utilisées
    const get = (i) => [0x20, i];
    const set = (i) => [0x21, i];
    const int = (n) => [0x41, n]; // i32.const, petits entiers positifs
    const [add, mul, geU, shl] = [[0x6a], [0x6c], [0x4f], [0x74]];
    const [loadF32, zeroF32, notEqualF32] = [[0x2a, 2, 0], [0x43, 0, 0, 0, 0], [0x5c]];
    const [block, loopStart, ifStart, end] = [[0x02, 0x40], [0x03, 0x40], [0x04, 0x40], [0x0b]];
    const brIf = (depth) => [0x0d, depth];
    const br = (depth) => [0x0c, depth];
    const simd = (op, ...rest) => [0xfd, ...uleb(op), ...rest];
    const load = (offset) => simd(0x00, 0, offset); // v128.load
    const store = (offset) => simd(0x0b, 0, offset); // v128.store
    const [low8, high8, low16, high16] = [0x87, 0x88, 0xa7, 0xa8].map((op) => simd(op)); // extend_*_s
    const [toF32, addF32, mulF32, splat] = [0xfa, 0xe4, 0xe6, 0x13].map((op) => simd(op));
    // paramètres x w y K O B ; locaux i32 k b o row yrow addr ; f32 v ; v128 vv q lo hi
    const [x, w, y, K, O, B, k, b, o, row, yrow, addr, v, vv, q, lo, hi] = [...Array(17).keys()];

    // for (counter = …; counter < limit; …) { inner } ; inner fait avancer le compteur
    const loop = (counter, limit, inner) =>
      seq(block, loopStart, get(counter), get(limit), geU, brIf(1), inner, br(0), end, end);
    // y[o + offset / 4 .. + 4] += float(4 poids de half) x v
    const quarter = (offset, half, ext) =>
      seq(get(addr), get(addr), load(offset), get(half), ext, toF32, get(vv), mulF32, addF32, store(offset));
    const body = loop(k, K, [
      seq(get(w), get(k), get(O), mul, add, set(row)), // row = w + k O : la ligne de poids de l'entrée k
      seq(int(0), set(b)),
      loop(b, B, [
        seq(get(x), get(b), get(K), mul, get(k), add, int(2), shl, add, loadF32, set(v)), // v = x[b][k]
        seq(get(v), zeroF32, notEqualF32, ifStart), // les entrées nulles ne coûtent rien
        seq(get(v), splat, set(vv)),
        seq(get(y), get(b), get(O), mul, int(2), shl, add, set(yrow)), // yrow = y[b]
        seq(int(0), set(o)),
        loop(o, O, [
          seq(get(row), get(o), add, load(0), set(q)), // 16 poids int8
          seq(get(q), low8, set(lo), get(q), high8, set(hi)), // en deux fois 8 entiers 16 bits
          seq(get(yrow), get(o), int(2), shl, add, set(addr)),
          quarter(0, lo, low16),
          quarter(16, lo, high16),
          quarter(32, hi, low16),
          quarter(48, hi, high16),
          seq(get(o), int(16), add, set(o)),
        ]),
        end, // fin du si
        seq(get(b), int(1), add, set(b)),
      ]),
      seq(get(k), int(1), add, set(k)),
    ]);
    const locals = vec([
      [6, 0x7f],
      [1, 0x7d],
      [4, 0x7b],
    ]);
    const code = seq(locals, body, end);
    return new Uint8Array(
      seq(
        [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00],
        section(1, vec([seq(0x60, vec(Array(6).fill(0x7f)), 0)])), // (i32 x 6) -> ()
        section(3, vec([0])),
        section(5, vec([[0x00, 1]])), // une page de mémoire, agrandie au chargement
        section(7, vec([seq(name('layer'), 0x00, 0), seq(name('memory'), 0x02, 0)])),
        section(10, vec([seq(uleb(code.length), code)])),
      ),
    );
  })();

  // La carte graphique, ou null. Les téléphones Android sans Vulkan n'ont WebGPU qu'en mode compatibilité, demandé en
  // second ; une carte émulée par le processeur serait plus lente que le WebAssembly
  async function findAdapter() {
    if (!navigator.gpu) return null;
    const request = (options) => navigator.gpu.requestAdapter(options).catch(() => null);
    const adapter = (await request()) || (await request({ featureLevel: 'compatibility' }));
    return adapter && !(adapter.info?.isFallbackAdapter || adapter.isFallbackAdapter) ? adapter : null;
  }
  let adapterFound = null;
  const gpuAdapter = () => (adapterFound ||= findAdapter());

  // Taille du fichier d'après son en-tête (le serveur le compresse et n'en donne pas la longueur), ou 0 s'il manque
  function fileSize(head) {
    const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
    const n = head.length >= 8 ? view.getUint32(4, true) : Infinity;
    if (head.length < 8 + 8 * n) return 0;
    let size = 8 + 8 * n;
    for (let l = 0; l < n; l++) {
      const [k, o] = [view.getUint32(8 + 8 * l, true), view.getUint32(12 + 8 * l, true)];
      size += 8 * o + k * o;
    }
    return size;
  }

  // Les poids (4 Mo), en suivant le téléchargement : onProgress(part reçue, de 0 à 1)
  async function download(onProgress) {
    const response = await fetch(MODEL_URL);
    if (!response.ok) throw new Error(`${MODEL_URL} : ${response.status}`);
    if (!response.body) return response.arrayBuffer();
    const chunks = [];
    let received = 0;
    let total = 0;
    const reader = response.body.getReader();
    for (let part = await reader.read(); !part.done; part = await reader.read()) {
      chunks.push(part.value);
      received += part.value.length;
      total ||= fileSize(chunks[0]);
      if (total) onProgress(Math.min(received / total, 1));
    }
    const file = new Uint8Array(received);
    chunks.reduce((at, chunk) => (file.set(chunk, at), at + chunk.length), 0);
    return file.buffer;
  }

  // Les couches du fichier : { k entrées, o sorties, at : position de leurs échelles, biais puis poids }
  function readLayers(file) {
    if (new TextDecoder().decode(new Uint8Array(file, 0, 4)) !== 'CUBE') throw new Error('fichier de poids inconnu');
    const n = new Uint32Array(file, 4, 1)[0];
    const dims = new Uint32Array(file, 8, 2 * n);
    const layers = [];
    let at = 8 + 8 * n;
    for (let l = 0; l < n; l++) {
      const [k, o] = [dims[2 * l], dims[2 * l + 1]];
      layers.push({ k, o, at });
      at += 8 * o + k * o;
    }
    // le tronc, la politique (12 sorties), puis la tête de valeur (deux couches)
    const policy = layers.findIndex((L) => L.o === ACTIONS.length);
    if (layers[0].k !== 54 * 6 || policy < 2 || layers.length !== policy + 3) throw new Error('réseau inattendu');
    return { layers, policy };
  }

  // Le réseau sur le GPU : run(couleurs, n) donne les 12 logits et la valeur de chacun des n états
  async function gpuNetwork(adapter, file) {
    const { layers, policy } = readLayers(file);
    const device = await adapter.requestDevice();
    const usage = GPUBufferUsage;
    const buffer = (size, use) => device.createBuffer({ size, usage: use });
    const upload = (data, use) => {
      const b = buffer(data.byteLength, use | usage.COPY_DST);
      device.queue.writeBuffer(b, 0, data);
      return b;
    };
    layers.forEach((L) => {
      L.o4 = L.o / 4;
      L.w = upload(new Uint8Array(file, L.at, 8 * L.o + L.k * L.o), usage.STORAGE);
    });

    const width = GPU_WIDTH;
    const input = buffer(width * 54 * 4, usage.STORAGE | usage.COPY_DST);
    const hidden = buffer(width * layers[0].o4 * 16, usage.STORAGE);
    const [p0, p1, p2] = [0, 1, 2].map(() => buffer(width * layers[1].o4 * 16, usage.STORAGE));
    const logits = buffer(width * 48, usage.STORAGE | usage.COPY_SRC);
    const valueHidden = buffer(width * layers[policy + 1].o4 * 16, usage.STORAGE);
    const values = buffer(width * 16, usage.STORAGE | usage.COPY_SRC);
    const readback = buffer(width * 64, usage.MAP_READ | usage.COPY_DST); // les logits, puis les valeurs
    const noResidual = buffer(16, usage.STORAGE); // un tampon ne sert qu'une fois par couche
    const pipeline = (code) =>
      device.createComputePipeline({
        layout: 'auto',
        compute: { module: device.createShaderModule({ code }), entryPoint: 'main' },
      });
    const embed = pipeline(EMBED);
    const dense = pipeline(DENSE);

    const steps = [];
    const step = (kind, l, x, y, flags, res = noResidual) => {
      const { k, o4, w } = layers[l];
      const entries = [upload(new Uint32Array([k, o4, flags, 0]), usage.UNIFORM), w, null, x, res, y];
      if (kind === embed) entries[4] = null; // la première couche n'a pas de résidu
      const group = device.createBindGroup({
        layout: kind.getBindGroupLayout(0),
        entries: entries.flatMap((b, binding) => (b ? [{ binding, resource: { buffer: b } }] : [])),
      });
      steps.push({ kind, group, groups: o4, rows: kind === embed ? 1 : ROWS });
    };
    // l'entrée, une couche cachée, des blocs résiduels relu(z + couche(relu(couche(z)))), puis les deux têtes
    step(embed, 0, input, hidden, RELU);
    step(dense, 1, hidden, p0, RELU);
    let [z, out] = [p0, p2];
    for (let l = 2; l < policy; l += 2) {
      step(dense, l, z, p1, RELU);
      step(dense, l + 1, p1, out, RELU | RESIDUAL, z);
      [z, out] = [out, z];
    }
    step(dense, policy, z, logits, 0);
    step(dense, policy + 1, z, valueHidden, RELU);
    step(dense, policy + 2, valueHidden, values, 0);

    const run = async (colours, count) => {
      device.queue.writeBuffer(input, 0, colours, 0, count * 54);
      // une commande par couche, et la copie à part : une ressource n'y sert qu'une fois (Safari 26.4 se trompait
      // dans le compte des tampons utilisés plusieurs fois dans une même commande)
      const commands = steps.map((s) => {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(s.kind);
        pass.setBindGroup(0, s.group);
        pass.dispatchWorkgroups(Math.ceil(s.groups / 64), Math.ceil(count / s.rows));
        pass.end();
        return encoder.finish();
      });
      const copy = device.createCommandEncoder();
      copy.copyBufferToBuffer(logits, 0, readback, 0, count * 48);
      copy.copyBufferToBuffer(values, 0, readback, width * 48, count * 16);
      device.queue.submit([...commands, copy.finish()]);
      await readback.mapAsync(GPUMapMode.READ);
      const result = new Float32Array(readback.getMappedRange().slice(0));
      readback.unmap();
      return { logits: result.subarray(0, count * 12), values: result.subarray(width * 12, width * 12 + count * 4) };
    };
    return { width, run };
  }

  // Le même réseau sur le processeur : les poids int8 dans la mémoire du module WebAssembly, et une zone par couche
  // pour sa sortie ; les petites couches (12 et 4 sorties) restent en JavaScript
  async function cpuNetwork(file) {
    const { layers, policy } = readLayers(file);
    const { instance } = await WebAssembly.instantiate(LAYER_WASM);
    const { layer, memory } = instance.exports;
    const width = CPU_WIDTH;
    let heap = 0;
    const alloc = (bytes) => (heap += (bytes + 15) & ~15) - ((bytes + 15) & ~15);
    const input = alloc(width * 54 * 6 * 4); // le one-hot des couleurs
    layers.forEach((L) => {
      L.weights = alloc(L.k * L.o);
      L.out = alloc(width * L.o * 4);
      L.factor = new Float32Array(file, L.at, L.o).map((s) => s / 127);
      L.bias = new Float32Array(file, L.at + 4 * L.o, L.o);
    });
    memory.grow(Math.ceil(heap / 65536));
    const bytes = new Int8Array(memory.buffer);
    const floats = (at, n) => new Float32Array(memory.buffer, at, n);
    layers.forEach((L) => bytes.set(new Int8Array(file, L.at + 8 * L.o, L.k * L.o), L.weights));

    // y = biais + échelle x somme(q x entrée) / 127, puis le résidu et ReLU
    const apply = (L, from, count, relu, residual) => {
      const { k: K, o: O } = L;
      const y = floats(L.out, count * O).fill(0);
      if (O % 16 === 0) layer(from, L.weights, L.out, K, O, count);
      else {
        const x = floats(from, count * K);
        for (let b = 0; b < count; b++)
          for (let k = 0; k < K; k++) {
            const v = x[b * K + k];
            if (v) for (let o = 0; o < O; o++) y[b * O + o] += bytes[L.weights + k * O + o] * v;
          }
      }
      const res = residual && floats(residual.out, count * O);
      for (let i = 0; i < y.length; i++) {
        let value = y[i] * L.factor[i % O] + L.bias[i % O] + (res ? res[i] : 0);
        if (relu && value < 0) value = 0;
        y[i] = value;
      }
      return L.out;
    };
    const run = async (colours, count) => {
      const x = floats(input, count * 54 * 6).fill(0);
      for (let i = 0; i < count * 54; i++) x[i * 6 + colours[i]] = 1;
      let z = apply(layers[1], apply(layers[0], input, count, true), count, true);
      let trunk = layers[1];
      for (let l = 2; l < policy; l += 2) {
        apply(layers[l + 1], apply(layers[l], z, count, true), count, true, trunk);
        [z, trunk] = [layers[l + 1].out, layers[l + 1]];
      }
      apply(layers[policy], z, count, false);
      apply(layers[policy + 2], apply(layers[policy + 1], z, count, true), count, false);
      return {
        logits: floats(layers[policy].out, count * 12).slice(),
        values: floats(layers[policy + 2].out, count * 4).slice(),
      };
    };
    return { width, run };
  }

  // Le réseau prêt à servir, sur la carte graphique s'il y en a une, sinon sur le processeur
  async function load(onProgress) {
    const adapter = await gpuAdapter();
    const file = await download(onProgress);
    return adapter ? gpuNetwork(adapter, file) : cpuNetwork(file);
  }

  // Les quatre versions du cube obtenu par l'algorithme alg, et pour chacune la traduction d'une de ses solutions
  // en solution du cube : l'inverse se résout à rebours, un conjugué r⁻¹ · alg · r avec les faces tournées par r
  const ROTATION = 'x y'; // 120° autour de la diagonale URF : le contenu de F passe en U, U en R, R en F
  const INVERSE = Cube.inverse(ROTATION);
  const invert = (actions) => actions.map((a) => (a.endsWith("'") ? a[0] : `${a}'`)).reverse();
  // la face f vue après la rotation r : la même suite de facettes que r · f · r⁻¹
  const relabel = (r, rInverse) => {
    const map = {};
    for (const f of 'URFDLB') {
      const target = new Cube().move(`${r} ${f} ${rInverse}`).asString();
      map[f] = [...'URFDLB'].find((g) => new Cube().move(g).asString() === target);
    }
    return (actions) => actions.map((a) => map[a[0]] + a.slice(1));
  };
  const views = [
    { root: (alg) => alg, back: (actions) => actions },
    { root: (alg) => Cube.inverse(alg), back: invert },
    { root: (alg) => `${INVERSE} ${alg} ${ROTATION}`, back: relabel(ROTATION, INVERSE) },
    { root: (alg) => `${ROTATION} ${alg} ${INVERSE}`, back: relabel(INVERSE, ROTATION) },
  ];

  // Les 12 quarts de tour comme permutations des facettes : après le coup a, la facette en position i vient de la
  // position MOVES[a][i]. Déduites de cubejs en comparant des cubes au hasard avant et après le coup ; le faisceau
  // ne manipule ensuite que des chaînes de facettes, trois fois plus vite qu'avec cubejs
  const MOVES = ACTIONS.map((action) => {
    const samples = Array.from({ length: 16 }, () => {
      const cube = Cube.random();
      return [cube.asString(), cube.move(action).asString()];
    });
    return Array.from({ length: 54 }, (_, i) =>
      [...Array(54).keys()].find((j) => samples.every(([before, after]) => before[j] === after[i])),
    );
  });
  const apply = (key, move) => {
    let next = '';
    for (let i = 0; i < 54; i++) next += key[move[i]];
    return next;
  };

  // Recherche en faisceau : les coups qui résolvent le cube de l'algorithme alg, ou null
  async function search({ width, run }, alg) {
    const roots = [];
    for (const [view, { root }] of views.entries()) {
      const key = new Cube().move(root(alg)).asString();
      if (key === SOLVED) return [];
      if (!roots.some((r) => r.key === key)) roots.push({ key, parent: null, view });
    }
    const colours = new Uint32Array(width * 54);
    const seen = new Set(roots.map((r) => r.key));
    let beam = roots;
    const path = (node) => (node.parent ? [...path(node.parent), node.action] : []);
    for (let depth = 0; depth < MAX_DEPTH && beam.length; depth++) {
      beam.forEach((s, b) => [...s.key].forEach((face, i) => (colours[b * 54 + i] = COLOUR[face])));
      const { logits, values } = await run(colours, beam.length);
      const children = [];
      for (const [b, parent] of beam.entries()) {
        const z = logits.subarray(b * 12, b * 12 + 12);
        const max = Math.max(...z);
        const logSum = max + Math.log(z.reduce((sum, v) => sum + Math.exp(v - max), 0));
        for (const [a, action] of ACTIONS.entries()) {
          const cost = values[b * 4] + LAMBDA * (logSum - z[a]); // V(s) - λ log π(a | s)
          const child = { key: apply(parent.key, MOVES[a]), cost, parent, action, view: parent.view };
          if (child.key === SOLVED) return views[child.view].back(path(child));
          children.push(child);
        }
      }
      // les width meilleurs enfants jamais vus
      children.sort((p, q) => p.cost - q.cost);
      beam = [];
      for (const child of children) {
        if (seen.has(child.key)) continue;
        seen.add(child.key);
        if (beam.push(child) === width) break;
      }
    }
    return null;
  }

  // F F → F2 : deux quarts de tour de suite sur la même face se jouent en un demi-tour
  function notation(actions) {
    const moves = [];
    for (const action of actions) {
      const last = moves.at(-1);
      const quarters = action.endsWith("'") ? 3 : 1;
      if (last?.face === action[0]) {
        last.quarters = (last.quarters + quarters) % 4;
        if (!last.quarters) moves.pop();
      } else {
        moves.push({ face: action[0], quarters });
      }
    }
    return moves.map(({ face, quarters }) => face + ['', '', '2', "'"][quarters]).join(' ');
  }

  let model = null;
  const ready = (onProgress = () => {}) => (model ||= load(onProgress));
  return {
    // null si le réseau peut tourner ici, sinon 'old' : ni WebGPU ni WebAssembly SIMD, un navigateur trop ancien
    unusable: async () => ((await gpuAdapter()) || WebAssembly.validate(LAYER_WASM) ? null : 'old'),
    load: ready,
    // La solution du cube de l'algorithme alg (ses centres à leur place), en notation standard (« R U2 F' … », ou
    // null si le faisceau n'a rien trouvé), et la durée de la recherche (sans le téléchargement des poids)
    async solve(alg) {
      const network = await ready();
      const start = performance.now();
      const actions = await search(network, alg);
      return { solution: actions && notation(actions), ms: performance.now() - start };
    },
  };
})();
