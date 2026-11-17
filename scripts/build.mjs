import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(resolve(dist, "src"), { recursive: true });
mkdirSync(resolve(dist, "assets/lux3d/main-hall-turbo"), { recursive: true });
mkdirSync(resolve(dist, "assets/scene-pack/runtime/lod1/CHAR-001"), { recursive: true });
mkdirSync(resolve(dist, "assets/scene-pack/textures"), { recursive: true });
mkdirSync(resolve(dist, "assets/scene-pack/source/PROP-014"), { recursive: true });

cpSync(resolve(root, "index.html"), resolve(dist, "index.html"));
cpSync(resolve(root, "src"), resolve(dist, "src"), { recursive: true });
cpSync(
  resolve(root, "assets/lux3d/main-hall-turbo/main-hall-turbo.glb"),
  resolve(dist, "assets/lux3d/main-hall-turbo/main-hall-turbo.glb"),
);
cpSync(
  resolve(root, "assets/scene-pack/runtime/lod1/CHAR-001/CHAR-001-animated.glb"),
  resolve(dist, "assets/scene-pack/runtime/lod1/CHAR-001/CHAR-001-animated.glb"),
);
cpSync(
  resolve(root, "assets/scene-pack/textures/hall-mythic-mural-v1.png"),
  resolve(dist, "assets/scene-pack/textures/hall-mythic-mural-v1.png"),
);
cpSync(
  resolve(root, "assets/scene-pack/source/PROP-014/PROP-014.glb"),
  resolve(dist, "assets/scene-pack/source/PROP-014/PROP-014.glb"),
);

const runtimeAssets = [
  ["lod1", "ARCH-012"],
  ["lod1", "ARCH-013"],
  ["lod1", "ARCH-014"],
  ["lod1", "ARCH-016"],
  ["lod1", "PROP-011"],
  ["lod2", "PROP-012"],
  ["lod2", "PROP-013"],
  ["lod2", "ARCH-003"],
  ["lod2", "ARCH-004"],
  ["lod2", "ARCH-005"],
  ["lod2", "ARCH-006"],
  ["lod2", "ARCH-007"],
  ["lod2", "ARCH-008"],
  ["lod2", "ARCH-009"],
  ["lod2", "ARCH-010"],
  ["lod2", "ARCH-011"],
  ["lod2", "ENV-001"],
  ["lod2", "ENV-003"],
  ["lod2", "ENV-007"],
  ["lod2", "ENV-010"],
  ["lod2", "ENV-006"],
  ["lod2", "PROP-001"],
  ["lod2", "PROP-002"],
  ["lod2", "PROP-003"],
  ["lod2", "PROP-004"],
  ["lod2", "PROP-005"],
  ["lod2", "PROP-006"],
  ["lod2", "PROP-008"],
  ["lod2", "PROP-009"],
  ["lod2", "PROP-010"],
];

for (const [lod, assetId] of runtimeAssets) {
  const sourceDirectory = resolve(root, `assets/scene-pack/runtime/${lod}/${assetId}`);
  const targetDirectory = resolve(dist, `assets/scene-pack/runtime/${lod}/${assetId}`);
  mkdirSync(targetDirectory, { recursive: true });
  cpSync(resolve(sourceDirectory, `${assetId}.glb`), resolve(targetDirectory, `${assetId}.glb`));
}

console.log("Built static Site with compressed runtime LODs, the Lux3D gate lantern, the side-wall-integrated ancient gate, physical ritual props, the closed hall roof, the hall Buddha and the rigged monk.");
