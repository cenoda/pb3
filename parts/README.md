# 부품 데이터

## Layout

```text
parts/
└── {category}/
    └── {id}/
        ├── part.json
        └── model.glb
```

## Phase-0 fixtures (checked in)

| Category | ID | GLB note |
|----------|-----|----------|
| case | `case.fractal-design-north-tg-dark` | large dark chassis box |
| motherboard | `motherboard.gigabyte-b650-aorus-elite-ax-v2` | flat green board |
| cooler | `cooler.noctua-nh-d15-g2` | silver tower box |
| cpu | `cpu.amd-ryzen-5-7600` | small grey IHS |
| cpu | `cpu.amd-ryzen-7-7800x3d` | small red-accent IHS |
| gpu | `gpu.asus-dual-rtx4070-o12g` | **shorter / thinner, blue** |
| gpu | `gpu.asus-proart-rtx4080-o16g` | **longer / thicker, orange** |

GPU placeholders are intentionally different so mesh swap is obvious in the viewport.

Contract and field shapes: [`docs/phases/phase-0/specs/vertical-slice-data-contract.md`](../docs/phases/phase-0/specs/vertical-slice-data-contract.md)  
Scope limits: [`docs/phases/phase-0/specs/phase-0.md`](../docs/phases/phase-0/specs/phase-0.md)  
Phase 0 home: [`docs/phases/phase-0/`](../docs/phases/phase-0/)

Do not add production fields (price, collision, anchors, etc.) in phase 0.
Units: mm, Y-up. Runtime anchor/socket/collision nodes are not required yet.
