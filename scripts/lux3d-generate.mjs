import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetId = process.argv[2];
const shouldWait = process.argv.includes("--wait");
const dryRun = process.argv.includes("--dry-run");
const resumeIndex = process.argv.indexOf("--task-id");
const resumeTaskId = resumeIndex >= 0 ? Number(process.argv[resumeIndex + 1]) : null;
let apiKey = process.env.LUX3D_API_KEY;
if (!apiKey && !dryRun && process.argv.includes("--key-stdin")) {
  console.error("Ready for Lux3D API key on stdin (input is hidden).");
  const input = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  apiKey = (await input.question(""))?.trim();
  input.close();
}

if (!assetId) throw new Error("Usage: node scripts/lux3d-generate.mjs ARCH-005 [--wait]");
if (!apiKey && !dryRun) throw new Error("LUX3D_API_KEY is required");

const batchDirectory = resolve(root, "assets/scene-pack/generation-batches");
const promptPath = resolve(root, "assets/scene-pack/prompts/lux3d-prompt-library.md");
let batch;
let task;
for (const fileName of readdirSync(batchDirectory).filter((name) => /^batch-.*\.json$/.test(name)).sort()) {
  const candidate = JSON.parse(readFileSync(resolve(batchDirectory, fileName), "utf8"));
  const matchedTask = candidate.tasks?.find((item) => item.asset_id === assetId && item.prompt_section);
  if (!matchedTask) continue;
  batch = candidate;
  task = matchedTask;
  break;
}
if (!batch || !task) throw new Error(`Unknown generated asset: ${assetId}`);

const promptLibrary = readFileSync(promptPath, "utf8");
const extractBlock = (heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingMatch = promptLibrary.match(new RegExp("(?:^|\\n)#{2,3} " + escaped + "\\n"));
  if (!headingMatch) throw new Error(`Prompt heading not found: ${heading}`);
  const sectionStart = (headingMatch.index ?? 0) + headingMatch[0].length;
  const following = promptLibrary.slice(sectionStart);
  const nextHeading = following.search(/\n#{2,3} /);
  const section = nextHeading === -1 ? following : following.slice(0, nextHeading);
  const blockMatch = section.match(/```text\n([\s\S]*?)\n```/);
  if (!blockMatch) throw new Error(`Prompt block not found: ${heading}`);
  return blockMatch[1].trim();
};

const prompt = extractBlock(task.prompt_section)
  .replace("{{COMMON_PREFIX}}", extractBlock("通用前缀"))
  .replace("{{ENV_PREFIX}}", extractBlock("自然环境前缀"))
  .replace("{{PROP_PREFIX}}", extractBlock("道具前缀"))
  .replace("{{COMMON_SUFFIX}}", extractBlock("通用后缀"));

if (dryRun) {
  console.log(JSON.stringify({ assetId, promptLength: prompt.length, faceCount: task.face_target }));
  process.exit(0);
}

const request = async (path, options = {}) => {
  const response = await fetch(`https://api.aholo.cn${path}`, {
    ...options,
    headers: {
      Authorization: apiKey,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok || payload.c !== "0") {
    throw new Error(`Lux3D request failed: ${response.status} ${payload.c ?? ""} ${payload.m ?? ""}`.trim());
  }
  return payload.d;
};

const taskId = resumeTaskId || await request("/lux3d/v1/generate/text-to-3d/task/create", {
  method: "POST",
  body: JSON.stringify({
    prompt,
    style: batch.style,
    version: batch.model,
    faceCount: task.face_target,
    outputFormat: batch.output_formats,
    enablePbr: batch.enable_pbr,
    aiPredictSize: true,
  }),
});

console.log(JSON.stringify({ assetId, taskId, status: resumeTaskId ? "resumed" : "submitted" }));
if (!shouldWait) process.exit(0);

let result;
while (true) {
  await new Promise((resolveWait) => setTimeout(resolveWait, 15000));
  result = await request(`/lux3d/v1/generate/task/get?taskid=${taskId}`);
  console.log(JSON.stringify({ assetId, taskId, status: result.status }));
  if ([3, 4, 6].includes(result.status)) break;
}

if (result.status !== 3) throw new Error(`Lux3D task ${taskId} ended with status ${result.status}`);
const outputs = (result.outputs ?? []).map((item) => item.content).filter((value) => /^https?:/.test(value));
if (outputs.length < 2) throw new Error(`Lux3D task ${taskId} did not return ZIP and GLB outputs`);

const targetDirectory = resolve(root, `assets/scene-pack/source/${assetId}`);
mkdirSync(targetDirectory, { recursive: true });
for (const [index, extension] of ["zip", "glb"].entries()) {
  const response = await fetch(outputs[index]);
  if (!response.ok) throw new Error(`Download failed for ${extension}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) throw new Error(`Downloaded ${extension} is unexpectedly small`);
  writeFileSync(resolve(targetDirectory, `${assetId}.${extension}`), bytes);
}

console.log(JSON.stringify({ assetId, taskId, status: "downloaded", directory: `assets/scene-pack/source/${assetId}` }));
