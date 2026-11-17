import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gltfpack = process.env.GLTFPACK_BIN || "gltfpack";
const preserveSourceTextures = process.env.GLTFPACK_NO_TEXTURE_COMPRESSION === "1";
const requestedAssets = new Set(process.argv.slice(2));
const profiles = {
  "ARCH-003": { lod1: [0.42, 0.015], lod2: [0.25, 0.04] },
  "ARCH-004": { lod1: [0.45, 0.02], lod2: [0.20, 0.04] },
  "ARCH-005": { lod1: [0.45, 0.02], lod2: [0.20, 0.04] },
  "ARCH-006": { lod1: [0.30, 0.02], lod2: [0.10, 0.05] },
  "ARCH-007": { lod1: [0.55, 0.02], lod2: [0.25, 0.045] },
  "ARCH-008": { lod1: [0.45, 0.02], lod2: [0.20, 0.04] },
  "ARCH-009": { lod1: [0.47, 0.015], lod2: [0.25, 0.035] },
  "ARCH-010": { lod1: [0.50, 0.015], lod2: [0.25, 0.04] },
  "ARCH-011": { lod1: [0.35, 0.02], lod2: [0.15, 0.045] },
  "ARCH-012": { lod1: [0.68, 0.012], lod2: [0.42, 0.028] },
  "ARCH-013": { lod1: [0.66, 0.012], lod2: [0.38, 0.03] },
  "ARCH-014": { lod1: [0.66, 0.012], lod2: [0.38, 0.03] },
  "ARCH-016": { lod1: [0.82, 0.008], lod2: [0.52, 0.02] },
  "ARCH-017": { lod1: [0.65, 0.012], lod2: [0.36, 0.03] },
  "ENV-001": { lod1: [0.48, 0.02], lod2: [0.22, 0.05] },
  "ENV-003": { lod1: [0.58, 0.015], lod2: [0.30, 0.035] },
  "ENV-006": { lod1: [0.58, 0.015], lod2: [0.30, 0.035] },
  "ENV-007": { lod1: [0.45, 0.02], lod2: [0.20, 0.05] },
  "ENV-010": { lod1: [0.68, 0.012], lod2: [0.42, 0.028] },
  "PROP-001": { lod1: [0.55, 0.015], lod2: [0.28, 0.035] },
  "PROP-002": { lod1: [0.55, 0.015], lod2: [0.28, 0.035] },
  "PROP-003": { lod1: [0.62, 0.012], lod2: [0.35, 0.03] },
  "PROP-004": { lod1: [0.62, 0.012], lod2: [0.35, 0.03] },
  "PROP-005": { lod1: [0.62, 0.012], lod2: [0.35, 0.03] },
  "PROP-006": { lod1: [0.58, 0.015], lod2: [0.30, 0.035] },
  "PROP-007": { lod1: [0.55, 0.015], lod2: [0.28, 0.035] },
  "PROP-008": { lod1: [0.50, 0.018], lod2: [0.25, 0.04] },
  "PROP-009": { lod1: [0.55, 0.015], lod2: [0.28, 0.035] },
  "PROP-010": { lod1: [0.45, 0.02], lod2: [0.20, 0.045] },
  "PROP-011": { lod1: [0.72, 0.01], lod2: [0.42, 0.025] },
  "PROP-012": { lod1: [0.72, 0.01], lod2: [0.42, 0.025] },
  "PROP-013": { lod1: [0.70, 0.012], lod2: [0.40, 0.028] },
  "PROP-014": { lod1: [0.62, 0.014], lod2: [0.34, 0.032] },
  "CHAR-001": { lod1: [0.62, 0.012], lod2: [0.38, 0.025] },
};

for (const [assetId, profile] of Object.entries(profiles)) {
  if (requestedAssets.size && !requestedAssets.has(assetId)) continue;
  const inputName = assetId === "ARCH-012"
    ? "ARCH-012-clean.glb"
    : assetId === "ARCH-016"
      ? "ARCH-016-platform-split.glb"
    : assetId === "PROP-013"
      ? "PROP-013-runtime-source.glb"
      : `${assetId}.glb`;
  const input = resolve(root, `assets/scene-pack/source/${assetId}/${inputName}`);
  for (const [lod, [ratio, error]] of Object.entries(profile)) {
    const output = resolve(root, `assets/scene-pack/runtime/${lod}/${assetId}/${assetId}.glb`);
    const quality = lod === "lod1" ? "8" : "7";
    const textureLimit = ["ARCH-012", "PROP-011", "ARCH-013", "ARCH-014", "ARCH-016", "PROP-012", "PROP-013", "PROP-014"].includes(assetId)
      ? lod === "lod1" ? "2048" : "1024"
      : lod === "lod1" ? "1024" : "512";
    mkdirSync(dirname(output), { recursive: true });
    const textureArguments = preserveSourceTextures ? [] : ["-tw", "-tq", quality, "-tl", textureLimit];
    const result = spawnSync(gltfpack, [
      "-i", input,
      "-o", output,
      "-cc",
      "-si", String(ratio),
      "-se", String(error),
      ...textureArguments,
      "-kn",
    ], { stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

console.log(`Generated LOD1 and LOD2 runtime assets with meshopt geometry and ${preserveSourceTextures ? "source" : "WebP"} textures.`);
