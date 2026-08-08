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
| case | `case.mid-tower-atx-01` | large dark chassis box |
| motherboard | `mb.atx-b650-01` | flat green board |
| cooler | `cooler.air-twin-tower-01` | silver tower box |
| cpu | `cpu.zen4-7600` | small grey IHS |
| cpu | `cpu.zen4-7800x3d` | small red-accent IHS |
| gpu | `gpu.rtx4070` | **shorter / thinner, blue** |
| gpu | `gpu.rtx4080` | **longer / thicker, orange** |

GPU placeholders are intentionally different so mesh swap is obvious in the viewport.

Contract and field shapes: [`docs/vertical-slice-data-contract.md`](../docs/vertical-slice-data-contract.md)  
Scope limits: [`docs/phase-0.md`](../docs/phase-0.md)

Do not add production fields (price, collision, anchors, etc.) in phase 0.
Units: mm, Y-up. Runtime anchor/socket/collision nodes are not required yet.
