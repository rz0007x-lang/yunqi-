import { readFileSync } from "node:fs";

const filePath = process.argv[2];
if (!filePath) throw new Error("Usage: node scripts/analyze-gate-geometry.mjs <file.glb>");

const bytes = readFileSync(filePath);
if (bytes.toString("utf8", 0, 4) !== "glTF") throw new Error("Expected a binary glTF file");
const jsonLength = bytes.readUInt32LE(12);
const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/g, ""));
const binHeader = 20 + jsonLength;
const binLength = bytes.readUInt32LE(binHeader);
const binOffset = binHeader + 8;
const bin = bytes.subarray(binOffset, binOffset + binLength);

const meshArgumentIndex = process.argv.indexOf("--mesh");
const meshIndex = meshArgumentIndex >= 0 ? Number(process.argv[meshArgumentIndex + 1]) : 0;
const primitive = json.meshes[meshIndex].primitives[0];
const indexAccessor = json.accessors[primitive.indices];
const positionAccessor = json.accessors[primitive.attributes.POSITION];

function accessorOffset(accessor) {
  return (json.bufferViews[accessor.bufferView].byteOffset ?? 0) + (accessor.byteOffset ?? 0);
}

const indices = new Uint32Array(
  bin.buffer,
  bin.byteOffset + accessorOffset(indexAccessor),
  indexAccessor.count,
);
const positions = new Float32Array(
  bin.buffer,
  bin.byteOffset + accessorOffset(positionAccessor),
  positionAccessor.count * 3,
);

const parent = new Int32Array(positionAccessor.count);
const rank = new Uint8Array(positionAccessor.count);
for (let i = 0; i < parent.length; i += 1) parent[i] = i;
const find = (value) => {
  let root = value;
  while (parent[root] !== root) root = parent[root];
  while (parent[value] !== value) {
    const next = parent[value];
    parent[value] = root;
    value = next;
  }
  return root;
};
const union = (a, b) => {
  let rootA = find(a);
  let rootB = find(b);
  if (rootA === rootB) return;
  if (rank[rootA] < rank[rootB]) [rootA, rootB] = [rootB, rootA];
  parent[rootB] = rootA;
  if (rank[rootA] === rank[rootB]) rank[rootA] += 1;
};

for (let i = 0; i < indices.length; i += 3) {
  union(indices[i], indices[i + 1]);
  union(indices[i], indices[i + 2]);
}

const components = new Map();
for (let i = 0; i < indices.length; i += 3) {
  const root = find(indices[i]);
  let component = components.get(root);
  if (!component) {
    component = {
      triangles: 0,
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    };
    components.set(root, component);
  }
  component.triangles += 1;
  for (let corner = 0; corner < 3; corner += 1) {
    const vertex = indices[i + corner];
    for (let axis = 0; axis < 3; axis += 1) {
      const value = positions[vertex * 3 + axis];
      component.min[axis] = Math.min(component.min[axis], value);
      component.max[axis] = Math.max(component.max[axis], value);
    }
  }
}

const sorted = [...components.entries()]
  .map(([root, component]) => ({
    root,
    triangles: component.triangles,
    min: component.min.map((value) => Number(value.toFixed(3))),
    max: component.max.map((value) => Number(value.toFixed(3))),
    size: component.max.map((value, axis) => Number((value - component.min[axis]).toFixed(3))),
    center: component.max.map((value, axis) => Number(((value + component.min[axis]) / 2).toFixed(3))),
  }))
  .sort((a, b) => b.triangles - a.triangles);

const doorCandidates = sorted.filter((component) =>
  component.min[0] >= -1.36 && component.max[0] <= 1.36
  && component.min[1] >= -2.22 && component.max[1] <= 0.24
  && component.min[2] >= -0.48 && component.max[2] <= 0.48,
);

console.log(JSON.stringify({
  componentCount: sorted.length,
  doorCandidateCount: doorCandidates.length,
  doorCandidateTriangles: doorCandidates.reduce((sum, component) => sum + component.triangles, 0),
  doorCandidates: doorCandidates.slice(0, 160),
  components: process.argv.includes("--all") ? sorted : sorted.slice(0, 80),
}, null, 2));
