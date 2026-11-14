import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(resolve(dist, "src"), { recursive: true });
mkdirSync(resolve(dist, "assets/lux3d/main-hall-turbo"), { recursive: true });
mkdirSync(resolve(dist, "assets/lux3d/temple-shell-turbo"), { recursive: true });

cpSync(resolve(root, "index.html"), resolve(dist, "index.html"));
cpSync(resolve(root, "src"), resolve(dist, "src"), { recursive: true });
cpSync(
  resolve(root, "assets/lux3d/main-hall-turbo/main-hall-turbo.glb"),
  resolve(dist, "assets/lux3d/main-hall-turbo/main-hall-turbo.glb"),
);
cpSync(
  resolve(root, "assets/lux3d/temple-shell-turbo/temple-shell-turbo.glb"),
  resolve(dist, "assets/lux3d/temple-shell-turbo/temple-shell-turbo.glb"),
);

const runtimeAssets = [
  ["lod1", "ARCH-003"],
  ["lod1", "ARCH-004"],
  ["lod2", "ARCH-006"],
  ["lod1", "ARCH-009"],
  ["lod1", "ARCH-010"],
];

for (const [lod, assetId] of runtimeAssets) {
  const sourceDirectory = resolve(root, `assets/scene-pack/runtime/${lod}/${assetId}`);
  const targetDirectory = resolve(dist, `assets/scene-pack/runtime/${lod}/${assetId}`);
  mkdirSync(targetDirectory, { recursive: true });
  cpSync(resolve(sourceDirectory, `${assetId}.glb`), resolve(targetDirectory, `${assetId}.glb`));
}

console.log("Built static Site with compressed runtime LODs for the courtyard slice.");
