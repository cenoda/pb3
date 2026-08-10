/**
 * Deterministic, dependency-free Phase 3 synthetic GLB author.
 * Units: mm, Y-up. Box meshes (and visual-only XZ planes). Runtime scale identity.
 *
 * Usage: node scripts/author-phys3-glbs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const IDENTITY_QUAT = [0, 0, 0, 1];

/** Unit cube centered at origin → scaled in POSITION by half-extents. */
function buildBoxGeometry(hx, hy, hz) {
  // 24 unique verts (4 per face) for flat normals
  const faces = [
    // +X
    [
      [hx, -hy, -hz],
      [hx, -hy, hz],
      [hx, hy, hz],
      [hx, hy, -hz],
    ],
    // -X
    [
      [-hx, -hy, hz],
      [-hx, -hy, -hz],
      [-hx, hy, -hz],
      [-hx, hy, hz],
    ],
    // +Y
    [
      [-hx, hy, -hz],
      [hx, hy, -hz],
      [hx, hy, hz],
      [-hx, hy, hz],
    ],
    // -Y
    [
      [-hx, -hy, hz],
      [hx, -hy, hz],
      [hx, -hy, -hz],
      [-hx, -hy, -hz],
    ],
    // +Z
    [
      [-hx, -hy, hz],
      [-hx, hy, hz],
      [hx, hy, hz],
      [hx, -hy, hz],
    ],
    // -Z
    [
      [hx, -hy, -hz],
      [hx, hy, -hz],
      [-hx, hy, -hz],
      [-hx, -hy, -hz],
    ],
  ];
  const normals = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
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

/** Flat quad in the XZ plane at Y=0 — visual-only, zero Y extent. */
function buildPlaneGeometry(hx, hz) {
  const positions = [-hx, 0, -hz, hx, 0, -hz, hx, 0, hz, -hx, 0, hz];
  const norms = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  const indices = [0, 1, 2, 0, 2, 3];
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(norms),
    indices: new Uint16Array(indices),
    min: [-hx, 0, -hz],
    max: [hx, 0, hz],
    vertexCount: 4,
    indexCount: 6,
  };
}

function align4(n) {
  return (n + 3) & ~3;
}

function writeGlb(outPath, { nodes, meshes, materials, generator }) {
  // Pack BIN: for each mesh, positions, normals, indices (pad to 4)
  const binChunks = [];
  let binOffset = 0;
  const accessors = [];
  const bufferViews = [];

  for (let mi = 0; mi < meshes.length; mi++) {
    const mesh = meshes[mi];
    const geo =
      mesh.kind === "plane"
        ? buildPlaneGeometry(mesh.hx, mesh.hz)
        : buildBoxGeometry(mesh.hx, mesh.hy, mesh.hz);

    const posBytes = Buffer.from(geo.positions.buffer);
    const norBytes = Buffer.from(geo.normals.buffer);
    const idxBytes = Buffer.from(geo.indices.buffer);

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

    const posAccessor = accessors.length;
    accessors.push({
      bufferView: bufferViews.length,
      componentType: 5126,
      count: geo.vertexCount,
      type: "VEC3",
      max: geo.max,
      min: geo.min,
    });
    bufferViews.push({
      buffer: 0,
      byteOffset: posView,
      byteLength: posBytes.length,
      target: 34962,
    });

    const norAccessor = accessors.length;
    accessors.push({
      bufferView: bufferViews.length,
      componentType: 5126,
      count: geo.vertexCount,
      type: "VEC3",
    });
    bufferViews.push({
      buffer: 0,
      byteOffset: norView,
      byteLength: norBytes.length,
      target: 34962,
    });

    const idxAccessor = accessors.length;
    accessors.push({
      bufferView: bufferViews.length,
      componentType: 5123,
      count: geo.indexCount,
      type: "SCALAR",
    });
    bufferViews.push({
      buffer: 0,
      byteOffset: idxView,
      byteLength: idxBytes.length,
      target: 34963,
    });

    mesh._accessors = { posAccessor, norAccessor, idxAccessor };
  }

  const gltfMeshes = meshes.map((m, i) => ({
    name: m.name,
    primitives: [
      {
        attributes: {
          POSITION: m._accessors.posAccessor,
          NORMAL: m._accessors.norAccessor,
        },
        indices: m._accessors.idxAccessor,
        material: m.materialIndex ?? 0,
      },
    ],
  }));

  const gltfNodes = nodes.map((n) => {
    const node = { name: n.name };
    if (n.meshIndex !== undefined) node.mesh = n.meshIndex;
    if (n.translation) node.translation = [...n.translation];
    if (n.rotation) node.rotation = [...n.rotation];
    // Never write non-identity scale — size is baked into mesh.
    if (n.children) node.children = [...n.children];
    return node;
  });

  const json = {
    asset: {
      version: "2.0",
      generator: generator ?? "pb3-phys3-synthetic",
    },
    scene: 0,
    scenes: [{ name: "Scene", nodes: nodes.map((_, i) => i).filter((i) => !nodes[i].parented) }],
    nodes: gltfNodes,
    meshes: gltfMeshes,
    materials: materials.map((m) => ({
      name: m.name,
      pbrMetallicRoughness: {
        baseColorFactor: m.color,
        metallicFactor: 0.1,
        roughnessFactor: 0.7,
      },
      doubleSided: true,
    })),
    accessors,
    bufferViews,
    buffers: [{ byteLength: binOffset }],
  };

  // Root nodes only: those without parented flag
  json.scenes[0].nodes = nodes
    .map((n, i) => ({ n, i }))
    .filter(({ n }) => !n.parented)
    .map(({ i }) => i);

  let jsonStr = JSON.stringify(json);
  const jsonPad = align4(jsonStr.length) - jsonStr.length;
  if (jsonPad) jsonStr += " ".repeat(jsonPad);

  const jsonBuf = Buffer.from(jsonStr, "utf8");
  const binBuf = Buffer.concat(binChunks);
  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // glTF
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // JSON

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuf.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // BIN\0

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]));
  console.log("wrote", path.relative(repoRoot, outPath), `(${totalLength} bytes)`);
}

function boxNode(name, hx, hy, hz, translation, materialIndex, meshIndex) {
  return {
    node: {
      name,
      meshIndex,
      translation: translation ?? [0, 0, 0],
      rotation: IDENTITY_QUAT,
    },
    mesh: { name: `${name}-mesh`, hx, hy, hz, materialIndex },
  };
}

function emptyNode(name, translation, rotation) {
  return {
    name,
    translation: translation ?? [0, 0, 0],
    rotation: rotation ?? IDENTITY_QUAT,
  };
}

function authorPart(relDir, color, defs) {
  const materials = [{ name: "mat", color: [...color, 1] }];
  const meshes = [];
  const nodes = [];

  for (const d of defs) {
    if (d.kind === "box") {
      const meshIndex = meshes.length;
      meshes.push({
        kind: "box",
        name: `${d.name}-mesh`,
        hx: d.hx,
        hy: d.hy,
        hz: d.hz,
        materialIndex: 0,
      });
      nodes.push({
        name: d.name,
        meshIndex,
        translation: d.translation ?? [0, 0, 0],
        rotation: d.rotation ?? IDENTITY_QUAT,
      });
    } else if (d.kind === "plane") {
      const meshIndex = meshes.length;
      meshes.push({
        kind: "plane",
        name: `${d.name}-mesh`,
        hx: d.hx,
        hz: d.hz,
        materialIndex: 0,
      });
      nodes.push({
        name: d.name,
        meshIndex,
        translation: d.translation ?? [0, 0, 0],
        rotation: d.rotation ?? IDENTITY_QUAT,
      });
    } else {
      nodes.push(emptyNode(d.name, d.translation, d.rotation));
    }
  }

  const outPath = path.join(repoRoot, relDir, "model.glb");
  writeGlb(outPath, {
    nodes,
    meshes,
    materials,
    generator: "pb3-phys3-synthetic-20260808",
  });
}

// --- Physical-core geometry (synthetic Experimental) ---

authorPart("parts/case/case.fractal-design-north-tg-dark", [0.25, 0.25, 0.28], [
  { kind: "box", name: "visual:case", hx: 150, hy: 200, hz: 200, translation: [0, 200, 0] },
  { kind: "box", name: "collision:case-floor", hx: 150, hy: 5, hz: 200, translation: [0, 5, 0] },
  {
    kind: "box",
    name: "clearance:cooler-sidekeepout",
    hx: 40,
    hy: 80,
    hz: 40,
    translation: [-90, 120, -40],
  },
  { kind: "empty", name: "anchor:mb", translation: [0, 20, -40] },
  { kind: "empty", name: "anchor:psu", translation: [0, 40, 160] },
]);

authorPart(
  "parts/motherboard/motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3",
  [0.15, 0.45, 0.2],
  [
    {
      kind: "plane",
      name: "visual:motherboard",
      hx: 122,
      hz: 122,
      translation: [0, 0, 0],
    },
    { kind: "empty", name: "socket:case", translation: [0, 0, 0] },
    { kind: "empty", name: "anchor:cpu", translation: [0, 8, 20] },
    { kind: "empty", name: "anchor:cooler", translation: [0, 8, 20] },
    { kind: "empty", name: "anchor:ram", translation: [110, 8, 40] },
    { kind: "empty", name: "anchor:gpu", translation: [0, 8, -100] },
  ],
);

authorPart("parts/motherboard/motherboard.gigabyte-b650-aorus-elite-ax-v2", [0.15, 0.45, 0.2], [
  { kind: "box", name: "visual:motherboard", hx: 152, hy: 2, hz: 122, translation: [0, 2, 0] },
  { kind: "box", name: "collision:mb-board", hx: 152, hy: 2, hz: 122, translation: [0, 2, 0] },
  { kind: "empty", name: "socket:case", translation: [0, 0, 0] },
  { kind: "empty", name: "anchor:cpu", translation: [0, 8, 20] },
  { kind: "empty", name: "anchor:cooler", translation: [0, 8, 20] },
  { kind: "empty", name: "anchor:ram", translation: [110, 8, 40] },
  { kind: "empty", name: "anchor:gpu", translation: [0, 8, -100] },
]);

for (const cpuId of ["cpu.amd-ryzen-5-7600", "cpu.amd-ryzen-7-7800x3d"]) {
  const color = cpuId.includes("7800") ? [0.7, 0.2, 0.2] : [0.6, 0.35, 0.15];
  authorPart(`parts/cpu/${cpuId}`, color, [
    { kind: "box", name: `visual:${cpuId}`, hx: 20, hy: 2, hz: 20, translation: [0, 2, 0] },
    { kind: "empty", name: "socket:motherboard", translation: [0, 0, 0] },
  ]);
}

authorPart("parts/gpu/gpu.asus-dual-rtx4070-o12g", [0.15, 0.55, 0.95], [
  { kind: "box", name: "visual:gpu.asus-dual-rtx4070-o12g", hx: 100, hy: 18, hz: 40, translation: [0, 18, 0] },
  { kind: "box", name: "collision:gpu-body", hx: 100, hy: 18, hz: 40, translation: [0, 18, 0] },
  { kind: "empty", name: "socket:motherboard", translation: [0, 0, 0] },
]);

authorPart("parts/gpu/gpu.asus-proart-rtx4080-o16g", [0.95, 0.45, 0.1], [
  { kind: "box", name: "visual:gpu.asus-proart-rtx4080-o16g", hx: 120, hy: 22, hz: 45, translation: [0, 22, 0] },
  { kind: "box", name: "collision:gpu-body", hx: 120, hy: 22, hz: 45, translation: [0, 22, 0] },
  { kind: "empty", name: "socket:motherboard", translation: [0, 0, 0] },
]);

// Asymmetric +X body: normal clears sidekeepout; rotated-180 overlaps it.
// Compact +Z bias keeps GPU/RAM clear in the default orientation.
authorPart("parts/cooler/cooler.noctua-nh-d15-g2", [0.4, 0.4, 0.45], [
  {
    kind: "box",
    name: "visual:cooler",
    hx: 40,
    hy: 75,
    hz: 35,
    translation: [40, 75, 30],
  },
  {
    kind: "box",
    name: "collision:cooler-body",
    hx: 40,
    hy: 75,
    hz: 35,
    translation: [40, 75, 30],
  },
  { kind: "empty", name: "socket:motherboard", translation: [0, 0, 0] },
]);

authorPart("parts/ram/ram.teamgroup-t-create-expert-ddr5-6000-32gb", [0.2, 0.6, 0.7], [
  { kind: "box", name: "visual:ram", hx: 10, hy: 20, hz: 70, translation: [0, 20, 0] },
  { kind: "box", name: "collision:ram-kit", hx: 10, hy: 20, hz: 70, translation: [0, 20, 0] },
  { kind: "empty", name: "socket:motherboard", translation: [0, 0, 0] },
]);

authorPart("parts/psu/psu.corsair-rm750e", [0.35, 0.35, 0.4], [
  { kind: "box", name: "visual:psu", hx: 75, hy: 40, hz: 70, translation: [0, 40, 0] },
  { kind: "box", name: "collision:psu-body", hx: 75, hy: 40, hz: 70, translation: [0, 40, 0] },
  { kind: "empty", name: "socket:case", translation: [0, 0, 0] },
]);

console.log("phys3 synthetic GLBs authored.");
