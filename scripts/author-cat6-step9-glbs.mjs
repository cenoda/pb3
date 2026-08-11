/**
 * Step 9 catalog growth: visual-only placeholder GLBs.
 *
 * These 8 parts carry no `physicalSpec` (no anchors/sockets/collision nodes),
 * matching the precedent already established for
 * case.lian-li-a3-matx-black, motherboard.asus-tuf-gaming-b860m-plus-wifi,
 * psu.cooler-master-v550-sfx-gold and ram.gskill-trident-z5-rgb-ddr5-8400:
 * authoritative physical checks (clearance-limit evaluator) read
 * `dimensionsMm` / `clearanceLimits` directly from part.json and do not
 * require physicalSpec. A simple visual box is enough to satisfy the cat6
 * integrity requirement that `modelGlbPath` exists and parses as GLB.
 *
 * Units: mm, Y-up. Box mesh, no anchors, no collision. Runtime scale identity.
 *
 * Usage: node scripts/author-cat6-step9-glbs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function buildBoxGeometry(hx, hy, hz) {
  const faces = [
    [[hx, -hy, -hz], [hx, -hy, hz], [hx, hy, hz], [hx, hy, -hz]],
    [[-hx, -hy, hz], [-hx, -hy, -hz], [-hx, hy, -hz], [-hx, hy, hz]],
    [[-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]],
    [[-hx, -hy, hz], [hx, -hy, hz], [hx, -hy, -hz], [-hx, -hy, -hz]],
    [[-hx, -hy, hz], [-hx, hy, hz], [hx, hy, hz], [hx, -hy, hz]],
    [[hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz], [-hx, -hy, -hz]],
  ];
  const normals = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ];

  const positions = [];
  const norms = [];
  const indices = [];
  let vi = 0;
  for (let f = 0; f < 6; f++) {
    const n = normals[f];
    for (const p of faces[f]) {
      positions.push(p[0], p[1], p[2]);
      norms.push(n[0], n[1], n[2]);
    }
    indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
    vi += 4;
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(norms),
    indices: new Uint16Array(indices),
    min: [-hx, -hy, -hz],
    max: [hx, hy, hz],
    vertexCount: 24,
    indexCount: 36,
  };
}

function align4(n) {
  return (n + 3) & ~3;
}

function writeGlb(outPath, { hx, hy, hz, color, name }) {
  const geo = buildBoxGeometry(hx, hy, hz);
  const posBytes = Buffer.from(geo.positions.buffer);
  const norBytes = Buffer.from(geo.normals.buffer);
  const idxBytes = Buffer.from(geo.indices.buffer);

  const binChunks = [];
  let binOffset = 0;

  const posView = binOffset;
  binChunks.push(posBytes);
  binOffset += posBytes.length;
  const norView = binOffset;
  binChunks.push(norBytes);
  binOffset += norBytes.length;
  const idxView = binOffset;
  binChunks.push(idxBytes);
  binOffset += idxBytes.length;
  const pad = align4(binOffset) - binOffset;
  if (pad) {
    binChunks.push(Buffer.alloc(pad));
    binOffset += pad;
  }

  const json = {
    asset: { version: "2.0", generator: "pb3-cat6-step9-visual-placeholder" },
    scene: 0,
    scenes: [{ name: "Scene", nodes: [0] }],
    nodes: [{ name, mesh: 0, translation: [0, hy, 0] }],
    meshes: [
      {
        name: `${name}-mesh`,
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: "mat",
        pbrMetallicRoughness: {
          baseColorFactor: [...color, 1],
          metallicFactor: 0.1,
          roughnessFactor: 0.7,
        },
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: geo.vertexCount,
        type: "VEC3",
        max: geo.max,
        min: geo.min,
      },
      { bufferView: 1, componentType: 5126, count: geo.vertexCount, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: geo.indexCount, type: "SCALAR" },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posView, byteLength: posBytes.length, target: 34962 },
      { buffer: 0, byteOffset: norView, byteLength: norBytes.length, target: 34962 },
      { buffer: 0, byteOffset: idxView, byteLength: idxBytes.length, target: 34963 },
    ],
    buffers: [{ byteLength: binOffset }],
  };

  let jsonStr = JSON.stringify(json);
  const jsonPad = align4(jsonStr.length) - jsonStr.length;
  if (jsonPad) jsonStr += " ".repeat(jsonPad);

  const jsonBuf = Buffer.from(jsonStr, "utf8");
  const binBuf = Buffer.concat(binChunks);
  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuf.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]));
  console.log("wrote", path.relative(repoRoot, outPath), `(${totalLength} bytes)`);
}

function authorPlaceholder(relDir, hx, hy, hz, color) {
  const outPath = path.join(repoRoot, relDir, "model.glb");
  writeGlb(outPath, { hx, hy, hz, color, name: `visual:${path.basename(relDir)}` });
}

authorPlaceholder("parts/gpu/gpu.asus-dual-rtx4060-o8g", 100, 18, 40, [0.15, 0.55, 0.6]);
authorPlaceholder(
  "parts/motherboard/motherboard.asus-tuf-gaming-b650-plus-wifi",
  152,
  2,
  122,
  [0.15, 0.45, 0.2],
);
authorPlaceholder(
  "parts/case/case.fractal-design-meshify-2-compact-black-solid",
  150,
  200,
  200,
  [0.25, 0.25, 0.28],
);
authorPlaceholder("parts/case/case.nzxt-h5-flow", 150, 200, 200, [0.15, 0.45, 0.75]);
authorPlaceholder(
  "parts/psu/psu.corsair-rm850e-cp-9020263-na",
  75,
  40,
  70,
  [0.35, 0.35, 0.4],
);
authorPlaceholder("parts/cooler/cooler.deepcool-ak620", 40, 75, 35, [0.5, 0.5, 0.55]);
authorPlaceholder(
  "parts/cooler/cooler.coolermaster-hyper-212-halo-black",
  40,
  75,
  35,
  [0.4, 0.15, 0.15],
);
authorPlaceholder(
  "parts/ram/ram.teamgroup-t-create-expert-ddr5-6000-64gb",
  10,
  20,
  70,
  [0.2, 0.6, 0.7],
);

console.log("cat6 Step 9 placeholder GLBs authored.");
