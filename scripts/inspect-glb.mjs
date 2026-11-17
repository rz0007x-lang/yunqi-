import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createHash } from "node:crypto";

for (const filePath of process.argv.slice(2)) {
  const bytes = readFileSync(filePath);
  if (bytes.toString("utf8", 0, 4) !== "glTF") throw new Error(`${filePath} is not a binary glTF`);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/g, ""));
  let triangles = 0;
  const boundsMin = [Infinity, Infinity, Infinity];
  const boundsMax = [-Infinity, -Infinity, -Infinity];

  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const indexAccessor = json.accessors?.[primitive.indices];
      if (indexAccessor?.count) triangles += indexAccessor.count / 3;
      const positionAccessor = json.accessors?.[primitive.attributes?.POSITION];
      if (!positionAccessor?.min || !positionAccessor?.max) continue;
      for (let axis = 0; axis < 3; axis += 1) {
        boundsMin[axis] = Math.min(boundsMin[axis], positionAccessor.min[axis]);
        boundsMax[axis] = Math.max(boundsMax[axis], positionAccessor.max[axis]);
      }
    }
  }

  console.log(JSON.stringify({
    file: basename(filePath),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    meshes: json.meshes?.length ?? 0,
    materials: json.materials?.length ?? 0,
    textures: json.textures?.length ?? 0,
    triangles: Math.round(triangles),
    boundsMin: boundsMin.map((value) => Number(value.toFixed(3))),
    boundsMax: boundsMax.map((value) => Number(value.toFixed(3))),
    boundsSize: boundsMax.map((value, axis) => Number((value - boundsMin[axis]).toFixed(3))),
    skins: json.skins?.length ?? 0,
    joints: json.skins?.reduce((sum, skin) => sum + (skin.joints?.length ?? 0), 0) ?? 0,
    skeletonNodes: (json.nodes ?? []).filter((node) => node.name && /hip|spine|neck|head|arm|hand|leg|foot/i.test(node.name)).map((node) => node.name).slice(0, 80),
    sceneRoots: (json.scenes?.[json.scene ?? 0]?.nodes ?? []).map((nodeIndex) => ({ index: nodeIndex, name: json.nodes?.[nodeIndex]?.name ?? null })),
    nodeSummary: (json.nodes ?? []).map((node, index) => ({
      index,
      name: node.name ?? null,
      mesh: node.mesh ?? null,
      children: node.children ?? [],
    })).slice(0, 80),
    animations: json.animations?.length ?? 0,
  }));
}
