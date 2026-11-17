import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/split-gate-platform.mjs <input.glb> <output.glb>");
}

const bytes = readFileSync(inputPath);
if (bytes.toString("utf8", 0, 4) !== "glTF") throw new Error("Expected a binary glTF file");
const jsonLength = bytes.readUInt32LE(12);
const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/g, ""));
const binHeader = 20 + jsonLength;
const binLength = bytes.readUInt32LE(binHeader);
const binOffset = binHeader + 8;
const originalBin = bytes.subarray(binOffset, binOffset + binLength);

const fixedMeshIndex = json.meshes.findIndex((mesh) => mesh.name === "gate-building-fixed");
if (fixedMeshIndex < 0) throw new Error("gate-building-fixed mesh not found");
const primitive = json.meshes[fixedMeshIndex].primitives[0];
const indexAccessor = json.accessors[primitive.indices];
const positionAccessor = json.accessors[primitive.attributes.POSITION];
const accessorOffset = (accessor) =>
  (json.bufferViews[accessor.bufferView].byteOffset ?? 0) + (accessor.byteOffset ?? 0);
if (indexAccessor.componentType !== 5125 || positionAccessor.componentType !== 5126) {
  throw new Error("ARCH-016 platform split expects Uint32 indices and Float32 positions");
}

const indices = new Uint32Array(originalBin.buffer, originalBin.byteOffset + accessorOffset(indexAccessor), indexAccessor.count);
const positions = new Float32Array(originalBin.buffer, originalBin.byteOffset + accessorOffset(positionAccessor), positionAccessor.count * 3);
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
const union = (left, right) => {
  let rootLeft = find(left);
  let rootRight = find(right);
  if (rootLeft === rootRight) return;
  if (rank[rootLeft] < rank[rootRight]) [rootLeft, rootRight] = [rootRight, rootLeft];
  parent[rootRight] = rootLeft;
  if (rank[rootLeft] === rank[rootRight]) rank[rootLeft] += 1;
};
for (let index = 0; index < indices.length; index += 3) {
  union(indices[index], indices[index + 1]);
  union(indices[index], indices[index + 2]);
}

const boundsByRoot = new Map();
for (let index = 0; index < indices.length; index += 3) {
  const root = find(indices[index]);
  let bounds = boundsByRoot.get(root);
  if (!bounds) {
    bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    boundsByRoot.set(root, bounds);
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

const floorComponents = new Set();
boundsByRoot.forEach((bounds, root) => {
  const sizeX = bounds.max[0] - bounds.min[0];
  const sizeZ = bounds.max[2] - bounds.min[2];
  const centerX = (bounds.min[0] + bounds.max[0]) / 2;
  if (bounds.max[1] < -2.08 && (sizeX > 1.5 || sizeZ > 1.2 || Math.abs(centerX) > 1.7)) {
    floorComponents.add(root);
  }
});

const buildingIndices = [];
const floorIndices = [];
for (let index = 0; index < indices.length; index += 3) {
  const target = floorComponents.has(find(indices[index])) ? floorIndices : buildingIndices;
  target.push(indices[index], indices[index + 1], indices[index + 2]);
}
if (floorIndices.length < 1500 || buildingIndices.length < 1500) throw new Error("Could not isolate the gate platform");

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

const buildingAccessor = appendIndices("gate-building-fixed", buildingIndices);
const floorAccessor = appendIndices("gate-floor-platform", floorIndices);
json.meshes[fixedMeshIndex].primitives[0].indices = buildingAccessor;
const floorMeshIndex = json.meshes.push({
  name: "gate-floor-platform",
  primitives: [{ ...primitive, attributes: { ...primitive.attributes }, indices: floorAccessor }],
}) - 1;
const floorNodeIndex = json.nodes.push({ name: "gate-floor-platform", mesh: floorMeshIndex }) - 1;
const geometryNode = json.nodes.find((node) => node.name === "geometry_0");
if (!geometryNode?.children) throw new Error("geometry_0 node not found");
geometryNode.children.push(floorNodeIndex);

const binary = Buffer.concat(binaryParts);
json.buffers[0].byteLength = binary.length;
const jsonBytes = Buffer.from(JSON.stringify(json));
const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20)]);
const paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - (binary.length % 4)) % 4)]);
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
  floorComponents: floorComponents.size,
  buildingTriangles: buildingIndices.length / 3,
  floorTriangles: floorIndices.length / 3,
  outputPath,
}, null, 2));
