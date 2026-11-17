import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiKey = process.env.LUX3D_API_KEY;
const sourcePath = resolve(root, process.argv[2] ?? "");
const outputPath = resolve(root, process.argv[3] ?? "assets/scene-pack/source/CHAR-001/CHAR-001-rig.glb");
if (!apiKey) throw new Error("LUX3D_API_KEY is required");
if (!process.argv[2]) throw new Error("Usage: node scripts/lux3d-rig.mjs <source.glb> [output.glb]");

const openApiRequest = async (path, options = {}) => {
  const response = await fetch(`https://api.aholo.cn${path}`, {
    ...options,
    headers: {
      Authorization: apiKey,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok || ("c" in payload && payload.c !== "0")) throw new Error(`Aholo request failed: ${response.status} ${payload.c ?? ""} ${payload.m ?? ""}`.trim());
  return payload.d ?? payload;
};

const ousRequest = async (domain, token, path, options = {}) => {
  const response = await fetch(`${domain}${path}`, {
    ...options,
    headers: { "ous-token-v2": token, ...options.headers },
  });
  const payload = await response.json();
  if (!response.ok || payload.c !== "0") throw new Error(`OUS request failed: ${response.status} ${payload.c ?? ""} ${payload.m ?? ""}`.trim());
  return payload.d;
};

const upload = async (path) => {
  const bytes = readFileSync(path);
  const md5 = createHash("md5").update(bytes).digest("hex");
  const tokenData = await openApiRequest("/asset/v1/token");
  const { ousToken, globalDomain, blockSize } = tokenData;
  const name = basename(path);
  if (bytes.length <= blockSize) {
    const form = new FormData();
    form.append("md5", md5);
    form.append("file", new Blob([bytes], { type: "application/octet-stream" }), name);
    await ousRequest(globalDomain, ousToken, "/ous/api/v2/single/upload", { method: "POST", body: form });
  } else {
    const blocks = Math.ceil(bytes.length / blockSize);
    const query = new URLSearchParams({ md5, blocks: String(blocks), size: String(bytes.length), name });
    const init = await ousRequest(globalDomain, ousToken, `/ous/api/v2/block/upload/init?${query}`, { method: "POST" });
    if (!init.deduplicated) {
      for (let block = 1; block <= blocks; block += 1) {
        const start = (block - 1) * blockSize;
        const end = Math.min(bytes.length, start + blockSize);
        const form = new FormData();
        form.append("block", String(block));
        form.append("file", new Blob([bytes.subarray(start, end)], { type: "application/octet-stream" }), `${name}.part${block}`);
        await ousRequest(globalDomain, ousToken, "/ous/api/v2/block/upload/part", { method: "POST", body: form });
        console.log(JSON.stringify({ stage: "upload", block, blocks }));
      }
    }
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    const status = await ousRequest(globalDomain, ousToken, "/ous/api/v2/upload/status");
    if (status.status === 5 && status.url) return status.url;
    if ([3, 4].includes(status.status)) throw new Error(`OUS upload ended with status ${status.status}: ${status.errorMsg ?? "unknown error"}`);
  }
  throw new Error("OUS upload status timed out");
};

const publicUrl = await upload(sourcePath);
console.log(JSON.stringify({ stage: "uploaded", file: basename(sourcePath) }));
const taskId = await openApiRequest("/lux3d/v1/animations/rig/task/create", {
  method: "POST",
  body: JSON.stringify({ modelUrl: publicUrl }),
});
console.log(JSON.stringify({ stage: "rig-submitted", taskId }));

let result;
while (true) {
  await new Promise((resolveWait) => setTimeout(resolveWait, 15000));
  result = await openApiRequest(`/lux3d/v1/generate/task/get?taskid=${taskId}`);
  console.log(JSON.stringify({ stage: "rig", taskId, status: result.status }));
  if ([3, 4, 6].includes(result.status)) break;
}
if (result.status !== 3) throw new Error(`Lux3D rig task ${taskId} ended with status ${result.status}: ${result.outputs?.[0]?.content ?? ""}`);
const rigUrl = result.outputs?.map((item) => item.content).find((value) => /^https?:/.test(value));
if (!rigUrl) throw new Error(`Lux3D rig task ${taskId} returned no GLB URL`);
const response = await fetch(rigUrl);
if (!response.ok) throw new Error(`Rigged GLB download failed: ${response.status}`);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
console.log(JSON.stringify({ stage: "downloaded", taskId, output: outputPath.slice(root.length + 1) }));
