"""
Exporte mon réseau de neurones (network_torch.ResMLP, encodage stickers, tête policy) pour le navigateur :
les BatchNorm sont fusionnées dans les couches linéaires, puis chaque poids est quantifié en int8 avec une
échelle par sortie. Le fichier est lu par js/cube/neural-solver.js.

Format (petit-boutiste) : « CUBE », nombre de couches n, puis (K, O) par couche ; puis, couche par couche,
l'échelle (O float32), le biais (O float32) et les poids (K x O int8, entrée par entrée). Une sortie vaut
biais + échelle x somme(q x entrée) / 127.

Usage :
    python scripts/export-model.py <checkpoint.pt> assets/model/neural-solver.bin --src <sources du réseau>
    (--check fichier.pt : écrit aussi le réseau quantifié en checkpoint, pour l'évaluer avec eval_torch.py)
"""
import argparse
import struct
import sys

import numpy as np
import torch


def fold(linear, bn=None):
    """Poids (O, K) et biais (O,) de linear suivie de bn (en évaluation)."""
    w, b = linear.weight.detach().double(), linear.bias.detach().double()
    if bn is not None:
        s = bn.weight.detach().double() / torch.sqrt(bn.running_var.double() + bn.eps)
        w, b = w * s[:, None], (b - bn.running_mean.double()) * s + bn.bias.detach().double()
    return w.numpy(), b.numpy()


def layers_of(model):
    body = model.body
    layers = [fold(body[0], body[1]), fold(body[3], body[4])]
    for block in body[6:]:
        layers += [fold(block.layers[0], block.layers[1]), fold(block.layers[3], block.layers[4])]
    return layers + [fold(model.heads["policy"])]


def quantize(w):
    """int8 symétrique par sortie : w ≈ q x échelle / 127."""
    scale = np.abs(w).max(axis=1)
    scale[scale == 0] = 1
    q = np.clip(np.round(w / scale[:, None] * 127), -127, 127).astype(np.int8)
    return q, scale


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("checkpoint")
    parser.add_argument("out")
    parser.add_argument("--src", required=True, help="dossier des sources du réseau (network_torch.py)")
    parser.add_argument("--check", help="checkpoint quantifié à écrire pour eval_torch.py")
    args = parser.parse_args()
    sys.path.insert(0, args.src)
    import network_torch as nt

    model, _ = nt.load(args.checkpoint)
    config = model.config
    assert config["encoding"] == "stickers" and "policy" in config["heads"] and not config["canonical"], config
    layers = [(*quantize(w), b) for w, b in layers_of(model)]

    with open(args.out, "wb") as f:
        f.write(b"CUBE" + struct.pack("<I", len(layers)))
        for q, _, _ in layers:
            f.write(struct.pack("<II", q.shape[1], q.shape[0]))
        for q, scale, b in layers:
            f.write(scale.astype("<f4").tobytes() + b.astype("<f4").tobytes())
            f.write(np.ascontiguousarray(q.T).tobytes())
    print(f"{args.out} : {len(layers)} couches, {sum(q.size for q, _, _ in layers):,} poids")

    if args.check:
        # le même réseau, poids déquantifiés et BatchNorm neutres
        linears = [m for m in model.body if isinstance(m, torch.nn.Linear)]
        for block in model.body[6:]:
            linears += [block.layers[0], block.layers[3]]
        linears.append(model.heads["policy"])
        with torch.no_grad():
            for linear, (q, scale, b) in zip(linears, layers):
                linear.weight.copy_(torch.from_numpy(q.astype(np.float64) * scale[:, None] / 127))
                linear.bias.copy_(torch.from_numpy(b))
            for bn in (m for m in model.modules() if isinstance(m, torch.nn.BatchNorm1d)):
                bn.weight.fill_(1), bn.bias.zero_(), bn.running_mean.zero_(), bn.running_var.fill_(1 - bn.eps)
        nt.save(model, args.check)
        print(f"{args.check} : checkpoint quantifié")


if __name__ == "__main__":
    main()
