import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/split-integrated-gate.mjs <input.glb> <output.glb>");
}

const bytes = readFileSync(inputPath);
if (bytes.toString("utf8", 0, 4) !== "glTF") throw new Error("Expected a binary glTF file");
const jsonLength = bytes.readUInt32LE(12);
const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/g, ""));
const binHeader = 20 + jsonLength;
const binLength = bytes.readUInt32LE(binHeader);
const binOffset = binHeader + 8;
const originalBin = bytes.subarray(binOffset, binOffset + binLength);

const primitive = json.meshes[0].primitives[0];
const indexAccessor = json.accessors[primitive.indices];
const positionAccessor = json.accessors[primitive.attributes.POSITION];
const accessorOffset = (accessor) =>
  (json.bufferViews[accessor.bufferView].byteOffset ?? 0) + (accessor.byteOffset ?? 0);

const indices = new Uint32Array(
  originalBin.buffer,
  originalBin.byteOffset + accessorOffset(indexAccessor),
  indexAccessor.count,
);
const positions = new Float32Array(
  originalBin.buffer,
  originalBin.byteOffset + accessorOffset(positionAccessor),
  positionAccessor.count * 3,
);

const parent = new Int32Array(positionAccessor.count);
const rank = new Uint8Array(positionAccessor.count);
for (let index = 0; index < parent.length; index += 1) parent[index] = index;
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

for (let index = 0; index < indices.length; index += 3) {
  union(indices[index], indices[index + 1]);
  union(indices[index], indices[index + 2]);
}

const componentBounds = new Map();
for (let index = 0; index < indices.length; index += 3) {
  const root = find(indices[index]);
  let bounds = componentBounds.get(root);
  if (!bounds) {
    bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    componentBounds.set(root, bounds);
  }
  for (let corner = 0; corner < 3; corner += 1) {
    const vertex = indices[index + corner];
    for (let axis = 0; axis < 3; axis += 1) {
      const value = positions[vertex * 3 + axis];
      bounds.min[axis] = Math.min(bounds.min[axis], value);
      bounds.max[axis] = Math.max(bounds.max[axis], value);
    }
  }
}

const doorComponents = new Set();
componentBounds.forEach((bounds, root) => {
  if (
    bounds.min[0] >= -1.36 && bounds.max[0] <= 1.36
    && bounds.min[1] >= -2.22 && bounds.max[1] <= 0.24
    && bounds.min[2] >= -0.48 && bounds.max[2] <= 0.48
  ) doorComponents.add(root);
});

const parts = { building: [], left: [], right: [] };
let leftHinge = Infinity;
let rightHinge = -Infinity;
for (let index = 0; index < indices.length; index += 3) {
  const triangle = [indices[index], indices[index + 1], indices[index + 2]];
  if (!doorComponents.has(find(triangle[0]))) {
    parts.building.push(...triangle);
    continue;
  }
  const centerX = triangle.reduce((sum, vertex) => sum + positions[vertex * 3], 0) / 3;
  if (centerX < 0) {
    parts.left.push(...triangle);
    triangle.forEach((vertex) => { leftHinge = Math.min(leftHinge, positions[vertex * 3]); });
  } else {
    parts.right.push(...triangle);
    triangle.forEach((vertex) => { rightHinge = Math.max(rightHinge, positions[vertex * 3]); });
  }
}

if (!parts.left.length || !parts.right.length) throw new Error("Could not identify both door leaves");

const binaryParts = [Buffer.from(originalBin)];
let nextByteOffset = originalBin.length;
const appendIndices = (name, values) => {
  const padding = (4 - (nextByteOffset % 4)) % 4;
  if (padding) {
    binaryParts.push(Buffer.alloc(padding));
    nextByteOffset += padding;
  }
  const typed = new Uint32Array(values);
  const data = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  const bufferView = json.bufferViews.length;
  json.bufferViews.push({ buffer: 0, byteOffset: nextByteOffset, byteLength: data.length, target: 34963 });
  binaryParts.push(data);
  nextByteOffset += data.length;
  const accessor = json.accessors.length;
  let minimum = Infinity;
  let maximum = -Infinity;
  values.forEach((value) => {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  });
  json.accessors.push({
    name: `${name}-indices`,
    bufferView,
    componentType: 5125,
    count: values.length,
    type: "SCALAR",
    min: [minimum],
    max: [maximum],
  });
  return accessor;
};

const buildingAccessor = appendIndices("gate-building-fixed", parts.building);
const leftAccessor = appendIndices("gate-door-left", parts.left);
const rightAccessor = appendIndices("gate-door-right", parts.right);
const makeMesh = (name, accessor) => ({
  name,
  primitives: [{ ...primitive, attributes: { ...primitive.attributes }, indices: accessor }],
});
const buildingMesh = json.meshes.push(makeMesh("gate-building-fixed", buildingAccessor)) - 1;
const leftMesh = json.meshes.push(makeMesh("gate-door-left", leftAccessor)) - 1;
const rightMesh = json.meshes.push(makeMesh("gate-door-right", rightAccessor)) - 1;

const geometryNodeIndex = json.nodes.findIndex((node) => node.mesh === 0);
if (geometryNodeIndex < 0) throw new Error("Could not find the source geometry node");
const buildingNode = json.nodes.push({ name: "gate-building-fixed", mesh: buildingMesh }) - 1;
const leftVisualNode = json.nodes.push({
  name: "gate-door-left-visual",
  mesh: leftMesh,
  translation: [-leftHinge, 0, 0],
}) - 1;
const leftPivotNode = json.nodes.push({
  name: "gate-door-left",
  translation: [leftHinge, 0, 0],
  children: [leftVisualNode],
}) - 1;
const rightVisualNode = json.nodes.push({
  name: "gate-door-right-visual",
  mesh: rightMesh,
  translation: [-rightHinge, 0, 0],
}) - 1;
const rightPivotNode = json.nodes.push({
  name: "gate-door-right",
  translation: [rightHinge, 0, 0],
  children: [rightVisualNode],
}) - 1;
delete json.nodes[geometryNodeIndex].mesh;
json.nodes[geometryNodeIndex].children = [buildingNode, leftPivotNode, rightPivotNode];

const binary = Buffer.concat(binaryParts);
json.buffers[0].byteLength = binary.length;
const jsonBytes = Buffer.from(JSON.stringify(json));
const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc(jsonPadding, 0x20)]);
const binaryPadding = (4 - (binary.length % 4)) % 4;
const paddedBinary = Buffer.concat([binary, Buffer.alloc(binaryPadding)]);
const output = Buffer.alloc(12 + 8 + paddedJson.length + 8 + paddedBinary.length);
output.write("glTF", 0);
output.writeUInt32LE(2, 4);
output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(paddedJson.length, 12);
output.writeUInt32LE(0x4e4f534a, 16);
paddedJson.copy(output, 20);
const outputBinHeader = 20 + paddedJson.length;
output.writeUInt32LE(paddedBinary.length, outputBinHeader);
output.writeUInt32LE(0x004e4942, outputBinHeader + 4);
paddedBinary.copy(output, outputBinHeader + 8);
writeFileSync(outputPath, output);

console.log(JSON.stringify({
  outputPath,
  buildingTriangles: parts.building.length / 3,
  leftDoorTriangles: parts.left.length / 3,
  rightDoorTriangles: parts.right.length / 3,
  leftHinge: Number(leftHinge.toFixed(4)),
  rightHinge: Number(rightHinge.toFixed(4)),
  doorComponents: doorComponents.size,
}, null, 2));
