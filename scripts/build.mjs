import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(resolve(dist, "src"), { recursive: true });
mkdirSync(resolve(dist, "assets/lux3d/main-hall-turbo"), { recursive: true });

cpSync(resolve(root, "index.html"), resolve(dist, "index.html"));
cpSync(resolve(root, "src"), resolve(dist, "src"), { recursive: true });
cpSync(
  resolve(root, "assets/lux3d/main-hall-turbo/main-hall-turbo.glb"),
  resolve(dist, "assets/lux3d/main-hall-turbo/main-hall-turbo.glb"),
);

console.log("Built static Site with the Lux3D hall asset.");
