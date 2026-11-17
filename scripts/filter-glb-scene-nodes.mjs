import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "");
const outputPath = resolve(process.argv[3] ?? "");
const hiddenNodes = new Set((process.argv[4] ?? "").split(",").filter(Boolean).map(Number));
if (!process.argv[2] || !process.argv[3] || !hiddenNodes.size) {
  throw new Error("Usage: node scripts/filter-glb-scene-nodes.mjs <input.glb> <output.glb> <node-index[,node-index]> ");
}

const source = readFileSync(inputPath);
if (source.readUInt32LE(0) !== 0x46546c67 || source.readUInt32LE(4) !== 2) {
  throw new Error("Only binary glTF 2.0 GLB files are supported");
}

const chunks = [];
let offset = 12;
while (offset < source.length) {
  const length = source.readUInt32LE(offset);
  const type = source.readUInt32LE(offset + 4);
  chunks.push({ type, data: source.subarray(offset + 8, offset + 8 + length) });
  offset += 8 + length;
}

const jsonChunk = chunks.find((chunk) => chunk.type === 0x4e4f534a);
if (!jsonChunk) throw new Error("GLB has no JSON chunk");
const json = JSON.parse(jsonChunk.data.toString("utf8").replace(/\0+$/, ""));
let removed = 0;
for (const scene of json.scenes ?? []) {
  const before = scene.nodes ?? [];
  scene.nodes = before.filter((nodeIndex) => !hiddenNodes.has(nodeIndex));
  removed += before.length - scene.nodes.length;
}
if (!removed) throw new Error(`None of the requested nodes were scene roots: ${[...hiddenNodes].join(",")}`);

const jsonBytes = Buffer.from(JSON.stringify(json), "utf8");
const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc(jsonPadding, 0x20)]);
const outputChunks = chunks.map((chunk) => chunk.type === 0x4e4f534a ? { ...chunk, data: paddedJson } : chunk);
const totalLength = 12 + outputChunks.reduce((sum, chunk) => sum + 8 + chunk.data.length, 0);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(totalLength, 8);
const parts = [header];
for (const chunk of outputChunks) {
  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(chunk.data.length, 0);
  chunkHeader.writeUInt32LE(chunk.type, 4);
  parts.push(chunkHeader, chunk.data);
}
writeFileSync(outputPath, Buffer.concat(parts));
console.log(JSON.stringify({ input: inputPath, output: outputPath, removedSceneNodes: [...hiddenNodes], bytes: totalLength }));
