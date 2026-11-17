import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "");
const outputPath = resolve(process.argv[3] ?? "");
const assignments = process.argv.slice(4);
if (!process.argv[2] || !process.argv[3] || !assignments.length) {
  throw new Error("Usage: node scripts/name-glb-scene-nodes.mjs <input.glb> <output.glb> <node-index=name> [...]");
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
for (const assignment of assignments) {
  const separator = assignment.indexOf("=");
  if (separator < 1) throw new Error(`Invalid node assignment: ${assignment}`);
  const index = Number(assignment.slice(0, separator));
  const name = assignment.slice(separator + 1);
  if (!Number.isInteger(index) || !json.nodes?.[index]) throw new Error(`Unknown node index: ${index}`);
  if (!name) throw new Error(`Empty node name for index: ${index}`);
  json.nodes[index].name = name;
}

const jsonBytes = Buffer.from(JSON.stringify(json), "utf8");
const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20)]);
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
console.log(JSON.stringify({ input: inputPath, output: outputPath, assignments, bytes: totalLength }));
