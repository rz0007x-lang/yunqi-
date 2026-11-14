import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const ASSET_URLS = {
  sideHall: new URL("../assets/scene-pack/runtime/lod1/ARCH-003/ARCH-003.glb", import.meta.url).href,
  corridor: new URL("../assets/scene-pack/runtime/lod1/ARCH-004/ARCH-004.glb", import.meta.url).href,
  wall: new URL("../assets/scene-pack/runtime/lod2/ARCH-006/ARCH-006.glb", import.meta.url).href,
  pavilion: new URL("../assets/scene-pack/runtime/lod1/ARCH-009/ARCH-009.glb", import.meta.url).href,
  bridge: new URL("../assets/scene-pack/runtime/lod1/ARCH-010/ARCH-010.glb", import.meta.url).href,
};

const wallInstances = [
  [-11.3, 0, 25.2, 0], [-7.3, 0, 25.2, 0], [7.3, 0, 25.2, 0], [11.3, 0, 25.2, 0],
  [-15.3, 0, 22.8, Math.PI / 2], [-15.3, 0, 18.8, Math.PI / 2], [-15.3, 0, 14.8, Math.PI / 2], [-15.3, 0, 10.8, Math.PI / 2],
  [15.3, 0, 22.8, Math.PI / 2], [15.3, 0, 18.8, Math.PI / 2], [15.3, 0, 14.8, Math.PI / 2], [15.3, 0, 10.8, Math.PI / 2],
].map(([x, y, z, rotationY]) => ({ position: [x, y, z], rotationY }));

const ASSETS = [
  {
    id: "ARCH-003",
    label: "侧殿",
    url: ASSET_URLS.sideHall,
    scale: [1.25, 1.25, 1.25],
    instances: [{ position: [-12, 0, 4.2], rotationY: 0 }],
  },
  {
    id: "ARCH-004",
    label: "直线回廊",
    url: ASSET_URLS.corridor,
    scale: [0.667, 0.667, 0.667],
    instances: [
      { position: [-12, 0, 10.4], rotationY: 0 },
      { position: [-12, 0, 14.4], rotationY: 0 },
    ],
  },
  {
    id: "ARCH-006",
    label: "寺院围墙",
    url: ASSET_URLS.wall,
    scale: [1.333, 1.226, 0.417],
    instances: wallInstances,
  },
  {
    id: "ARCH-009",
    label: "竹林静坐亭",
    url: ASSET_URLS.pavilion,
    scale: [1.333, 1.333, 1.333],
    instances: [{ position: [-12, 0, 19.2], rotationY: 0 }],
  },
  {
    id: "ARCH-010",
    label: "石桥",
    url: ASSET_URLS.bridge,
    scale: [10, 7.65, 7.778],
    instances: [{ position: [8.6, 0.08, 14.5], rotationY: 0 }],
  },
];

function prepareMaterials(model, renderer) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((meshMaterial) => {
      meshMaterial.envMapIntensity = 0.74;
      if (meshMaterial.map) meshMaterial.map.anisotropy = anisotropy;
      meshMaterial.needsUpdate = true;
    });
  });
}

function placeInstance(model, config, assetId, index) {
  model.name = `${assetId.toLowerCase()}-${index + 1}`;
  model.userData.assetId = assetId;
  model.scale.set(...config.scale);
  model.rotation.y = config.instance.rotationY ?? 0;
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const [targetX, targetY, targetZ] = config.instance.position;
  model.position.x += targetX - center.x;
  model.position.y += targetY - bounds.min.y;
  model.position.z += targetZ - center.z;
  model.updateMatrixWorld(true);
  return model;
}

function loadAsset(loader, renderer, config) {
  return new Promise((resolve) => {
    loader.load(
      config.url,
      (gltf) => {
        const template = gltf.scene;
        prepareMaterials(template, renderer);
        const group = new THREE.Group();
        group.name = `${config.id.toLowerCase()}-instances`;
        config.instances.forEach((instance, index) => {
          const model = index === 0 ? template : template.clone(true);
          group.add(placeInstance(model, { ...config, instance }, config.id, index));
        });
        resolve({ id: config.id, group });
      },
      undefined,
      (error) => {
        console.warn(`${config.id} could not be loaded.`, error);
        resolve({ id: config.id, group: null, error });
      },
    );
  });
}

function addSliceLights(parent) {
  [
    [-12, 3.3, 7.8, 0xffc477, 7.5],
    [-12, 3.5, 18.7, 0xffbd68, 6.5],
    [8.6, 1.3, 14.5, 0x7cebd0, 5.2],
    [0, 2.2, 24.2, 0x8be8d2, 4.2],
  ].forEach(([x, y, z, color, intensity]) => {
    const light = new THREE.PointLight(color, intensity, 11, 2);
    light.position.set(x, y, z);
    parent.add(light);
  });
}

export async function loadCourtyardSlice({ parent, renderer, onStatus }) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const total = ASSETS.length;
  let loaded = 0;
  onStatus?.({ state: "loading", loaded, total });

  const results = await Promise.all(ASSETS.map(async (config) => {
    const result = await loadAsset(loader, renderer, config);
    loaded += 1;
    onStatus?.({ state: "loading", loaded, total, assetId: config.id, label: config.label });
    if (result.group) parent.add(result.group);
    return result;
  }));

  addSliceLights(parent);
  const failed = results.filter((result) => !result.group).map((result) => result.id);
  onStatus?.({ state: failed.length ? "partial" : "ready", loaded: total - failed.length, total, failed });
  return { loaded: total - failed.length, total, failed };
}
