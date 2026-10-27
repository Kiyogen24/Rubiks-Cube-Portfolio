// Mon réseau de neurones qui résout le Rubik's Cube, exécuté sur la carte graphique avec WebGPU.
// Chargé par solver-worker.js, à côté de cubejs.
// Le réseau lit la couleur des 54 facettes (dans l'ordre de cube.asString()) et donne, pour chacun des 12 quarts
// de tour, la probabilité qu'il mène vers la solution. Une recherche en faisceau garde à chaque profondeur les
// chemins les plus probables (log-probabilité cumulée de leurs coups), jusqu'à tomber sur le cube résolu.
// Les poids viennent de scripts/export-model.py : BatchNorm fusionnées, int8 avec une échelle par sortie.
self.NeuralSolver = (() => {
  const MODEL_URL = new URL('../../assets/model/neural-solver.bin', self.location.href);
  const ACTIONS = ['F', "F'", 'B', "B'", 'L', "L'", 'R', "R'", 'U', "U'", 'D', "D'"]; // ordre des sorties du réseau
  const COLOUR = Object.fromEntries([...'URFDLB'].map((face, i) => [face, i]));
  const SOLVED = [...'URFDLB'].map((face) => face.repeat(9)).join('');
  const WIDTH = 64; // chemins gardés à chaque profondeur : tous les cubes résolus, en 26 quarts de tour en moyenne
  const MAX_DEPTH = 60;
  const ROWS = 8; // états calculés ensemble par un fil du GPU (WIDTH en est un multiple)
  const RELU = 1;
  const RESIDUAL = 2;

  // Une couche : y = biais + échelle x somme(q x entrée) / 127, avec 4 sorties par mot de poids
  const HEADER = /* wgsl */ `
    struct Layer { k: u32, o4: u32, flags: u32, pad: u32 }
    @group(0) @binding(0) var<uniform> layer: Layer;
    @group(0) @binding(1) var<storage, read> w: array<u32>;
    @group(0) @binding(2) var<storage, read> sb: array<vec4f>;
    @group(0) @binding(5) var<storage, read_write> y: array<vec4f>;
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
        acc += unpack4x8snorm(w[(i * 6u + colours[id.y * 54u + i]) * layer.o4 + o]);
      }
      y[id.y * layer.o4 + o] = max(acc * sb[o] + sb[layer.o4 + o], vec4f(0.0));
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
        let wk = unpack4x8snorm(w[k * layer.o4 + o]);
        for (var r = 0u; r < ROWS; r++) {
          acc[r] += wk * x[(b0 + r) * layer.k + k];
        }
      }
      for (var r = 0u; r < ROWS; r++) {
        let i = (b0 + r) * layer.o4 + o;
        var v = acc[r] * sb[o] + sb[layer.o4 + o];
        if ((layer.flags & ${RESIDUAL}u) != 0u) { v += res[i]; }
        if ((layer.flags & ${RELU}u) != 0u) { v = max(v, vec4f(0.0)); }
        y[i] = v;
      }
    }`;

  // Le réseau sur le GPU : retourne run(couleurs, n), les 12 logits de chacun des n états
  async function load() {
    const adapter = await navigator.gpu.requestAdapter();
    // une carte émulée par le processeur serait trop lente : Kociemba fera mieux
    if (!adapter || adapter.info?.isFallbackAdapter || adapter.isFallbackAdapter) {
      throw new Error('pas de carte graphique WebGPU');
    }
    const device = await adapter.requestDevice();
    const response = await fetch(MODEL_URL);
    if (!response.ok) throw new Error(`${MODEL_URL} : ${response.status}`);
    const file = await response.arrayBuffer();
    if (new TextDecoder().decode(new Uint8Array(file, 0, 4)) !== 'CUBE') throw new Error('fichier de poids inconnu');

    const usage = GPUBufferUsage;
    const buffer = (size, use) => device.createBuffer({ size, usage: use });
    const upload = (data, use) => {
      const b = buffer(data.byteLength, use | usage.COPY_DST);
      device.queue.writeBuffer(b, 0, data);
      return b;
    };
    const n = new Uint32Array(file, 4, 1)[0];
    const dims = new Uint32Array(file, 8, 2 * n);
    const layers = [];
    let offset = 8 + 8 * n;
    for (let l = 0; l < n; l++) {
      const [k, o] = [dims[2 * l], dims[2 * l + 1]];
      const sb = upload(new Uint8Array(file, offset, 8 * o), usage.STORAGE);
      const w = upload(new Uint8Array(file, offset + 8 * o, k * o), usage.STORAGE);
      layers.push({ k, o4: o / 4, sb, w });
      offset += 8 * o + k * o;
    }
    if (layers[0].k !== 54 * 6 || layers.at(-1).o4 * 4 !== ACTIONS.length) throw new Error('réseau inattendu');

    const input = buffer(WIDTH * 54 * 4, usage.STORAGE | usage.COPY_DST);
    const hidden = buffer(WIDTH * layers[0].o4 * 16, usage.STORAGE);
    const [p0, p1, p2] = [0, 1, 2].map(() => buffer(WIDTH * layers[1].o4 * 16, usage.STORAGE));
    const logits = buffer(WIDTH * 48, usage.STORAGE | usage.COPY_SRC);
    const readback = buffer(WIDTH * 48, usage.MAP_READ | usage.COPY_DST);
    const pipeline = (code) =>
      device.createComputePipeline({
        layout: 'auto',
        compute: { module: device.createShaderModule({ code }), entryPoint: 'main' },
      });
    const embed = pipeline(EMBED);
    const dense = pipeline(DENSE);

    const steps = [];
    const step = (kind, l, x, y, flags, res = x) => {
      const { k, o4, sb, w } = layers[l];
      const entries = [upload(new Uint32Array([k, o4, flags, 0]), usage.UNIFORM), w, sb, x, res, y];
      if (kind === embed) entries[4] = null; // la première couche n'a pas de résidu
      const group = device.createBindGroup({
        layout: kind.getBindGroupLayout(0),
        entries: entries.flatMap((b, binding) => (b ? [{ binding, resource: { buffer: b } }] : [])),
      });
      steps.push({ kind, group, groups: o4, rows: kind === embed ? 1 : ROWS });
    };
    // l'entrée, une couche cachée, des blocs résiduels relu(z + couche(relu(couche(z)))), puis la politique
    step(embed, 0, input, hidden, RELU);
    step(dense, 1, hidden, p0, RELU);
    let [z, out] = [p0, p2];
    for (let l = 2; l < n - 1; l += 2) {
      step(dense, l, z, p1, RELU);
      step(dense, l + 1, p1, out, RELU | RESIDUAL, z);
      [z, out] = [out, z];
    }
    step(dense, n - 1, z, logits, 0);

    return async (colours, count) => {
      device.queue.writeBuffer(input, 0, colours, 0, count * 54);
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      for (const s of steps) {
        pass.setPipeline(s.kind);
        pass.setBindGroup(0, s.group);
        pass.dispatchWorkgroups(Math.ceil(s.groups / 64), Math.ceil(count / s.rows));
      }
      pass.end();
      encoder.copyBufferToBuffer(logits, 0, readback, 0, count * 48);
      device.queue.submit([encoder.finish()]);
      await readback.mapAsync(GPUMapMode.READ, 0, count * 48);
      const result = new Float32Array(readback.getMappedRange(0, count * 48).slice(0));
      readback.unmap();
      return result;
    };
  }

  // Recherche en faisceau : les coups du chemin trouvé, ou null
  async function search(run, facelets) {
    if (facelets === SOLVED) return [];
    const colours = new Uint32Array(WIDTH * 54);
    const seen = new Set([facelets]);
    let beam = [{ cube: Cube.fromString(facelets), key: facelets, cost: 0, parent: null }];
    const path = (node) => (node.parent ? [...path(node.parent), node.action] : []);
    for (let depth = 0; depth < MAX_DEPTH && beam.length; depth++) {
      beam.forEach((s, b) => [...s.key].forEach((face, i) => (colours[b * 54 + i] = COLOUR[face])));
      const logits = await run(colours, beam.length);
      const children = [];
      for (const [b, parent] of beam.entries()) {
        const z = logits.subarray(b * 12, b * 12 + 12);
        const max = Math.max(...z);
        const logSum = max + Math.log(z.reduce((sum, v) => sum + Math.exp(v - max), 0));
        for (const [a, action] of ACTIONS.entries()) {
          const cube = parent.cube.clone().move(action);
          const child = { cube, key: cube.asString(), cost: parent.cost + logSum - z[a], parent, action };
          if (child.key === SOLVED) return path(child);
          children.push(child);
        }
      }
      // les WIDTH meilleurs enfants jamais vus
      children.sort((p, q) => p.cost - q.cost);
      beam = [];
      for (const child of children) {
        if (seen.has(child.key)) continue;
        seen.add(child.key);
        if (beam.push(child) === WIDTH) break;
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
  const ready = () => (model ||= load());
  return {
    // WebGPU présent, et pas d'économie de données demandée : les poids pèsent 15 Mo
    available: () => Boolean(navigator.gpu) && !navigator.connection?.saveData,
    load: ready,
    // La solution en notation standard (« R U2 F' … »), ou null si le faisceau n'a rien trouvé
    async solve(facelets) {
      const actions = await search(await ready(), facelets);
      return actions && notation(actions);
    },
  };
})();
