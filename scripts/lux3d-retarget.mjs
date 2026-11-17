import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiKey = process.env.LUX3D_API_KEY;
const rigTaskId = Number(process.argv[2]);
const outputPath = resolve(root, process.argv[3] ?? "assets/scene-pack/source/CHAR-001/CHAR-001-animated.glb");
if (!apiKey) throw new Error("LUX3D_API_KEY is required");
if (!rigTaskId) throw new Error("Usage: node scripts/lux3d-retarget.mjs <rig-task-id> [output.glb]");

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
  if (!response.ok || payload.c !== "0") throw new Error(`Lux3D request failed: ${response.status} ${payload.c ?? ""} ${payload.m ?? ""}`.trim());
  return payload.d;
};

const rigResult = await request(`/lux3d/v1/generate/task/get?taskid=${rigTaskId}`);
if (rigResult.status !== 3) throw new Error(`Rig task ${rigTaskId} is not successful`);
const rigModelUrl = rigResult.outputs?.map((item) => item.content).find((value) => /^https?:/.test(value));
if (!rigModelUrl) throw new Error(`Rig task ${rigTaskId} returned no model URL`);

const animationIds = ["Idle_Loop", "Walk_Loop", "Sitting_Enter", "Sitting_Idle_Loop", "Sitting_Exit"];
const taskId = await request("/lux3d/v1/animations/retarget/task/create", {
  method: "POST",
  body: JSON.stringify({
    rigModelUrl,
    animationIds,
    animationOutputMode: "combined",
    outFormat: "glb",
    animateInPlace: true,
  }),
});
console.log(JSON.stringify({ stage: "retarget-submitted", taskId, animationIds }));

let result;
while (true) {
  await new Promise((resolveWait) => setTimeout(resolveWait, 15000));
  result = await request(`/lux3d/v1/generate/task/get?taskid=${taskId}`);
  console.log(JSON.stringify({ stage: "retarget", taskId, status: result.status }));
  if ([3, 4, 6].includes(result.status)) break;
}
if (result.status !== 3) throw new Error(`Lux3D retarget task ${taskId} ended with status ${result.status}: ${result.outputs?.[0]?.content ?? ""}`);
const outputPayload = JSON.parse(result.outputs?.[0]?.content ?? "{}");
const actions = outputPayload.actions ?? [];
const failed = actions.filter((action) => action.status !== "success");
if (failed.length) throw new Error(`Retarget actions failed: ${JSON.stringify(failed)}`);
const animationUrl = actions.map((action) => action.animationGlbUrl).find((value) => /^https?:/.test(value));
if (!animationUrl) throw new Error(`Retarget task ${taskId} returned no animation GLB URL: ${JSON.stringify(outputPayload)}`);
const response = await fetch(animationUrl);
if (!response.ok) throw new Error(`Animated GLB download failed: ${response.status}`);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
console.log(JSON.stringify({ stage: "downloaded", taskId, output: outputPath.slice(root.length + 1), actions: animationIds }));
