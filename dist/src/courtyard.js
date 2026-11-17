import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const ASSET_URLS = {
  sideHall: new URL("../assets/scene-pack/runtime/lod2/ARCH-003/ARCH-003.glb", import.meta.url).href,
  corridor: new URL("../assets/scene-pack/runtime/lod2/ARCH-004/ARCH-004.glb", import.meta.url).href,
  corridorCorner: new URL("../assets/scene-pack/runtime/lod2/ARCH-005/ARCH-005.glb", import.meta.url).href,
  wall: new URL("../assets/scene-pack/runtime/lod2/ARCH-006/ARCH-006.glb", import.meta.url).href,
  wallCorner: new URL("../assets/scene-pack/runtime/lod2/ARCH-007/ARCH-007.glb", import.meta.url).href,
  sideGate: new URL("../assets/scene-pack/runtime/lod2/ARCH-008/ARCH-008.glb", import.meta.url).href,
  pavilion: new URL("../assets/scene-pack/runtime/lod2/ARCH-009/ARCH-009.glb", import.meta.url).href,
  bridge: new URL("../assets/scene-pack/runtime/lod2/ARCH-010/ARCH-010.glb?v=bridge-original-restored-1", import.meta.url).href,
  stairs: new URL("../assets/scene-pack/runtime/lod2/ARCH-011/ARCH-011.glb", import.meta.url).href,
  rockWall: new URL("../assets/scene-pack/runtime/lod2/ENV-001/ENV-001.glb", import.meta.url).href,
  bamboo: new URL("../assets/scene-pack/runtime/lod2/ENV-003/ENV-003.glb", import.meta.url).href,
  pondBank: new URL("../assets/scene-pack/runtime/lod2/ENV-007/ENV-007.glb", import.meta.url).href,
  lotus: new URL("../assets/scene-pack/runtime/lod2/ENV-010/ENV-010.glb", import.meta.url).href,
  windsweptPine: new URL("../assets/scene-pack/runtime/lod2/ENV-006/ENV-006.glb", import.meta.url).href,
  stoneLantern: new URL("../assets/scene-pack/runtime/lod2/PROP-001/PROP-001.glb", import.meta.url).href,
  pathLantern: new URL("../assets/scene-pack/runtime/lod2/PROP-002/PROP-002.glb", import.meta.url).href,
  incenseBurner: new URL("../assets/scene-pack/runtime/lod2/PROP-003/PROP-003.glb", import.meta.url).href,
  templeBell: new URL("../assets/scene-pack/runtime/lod2/PROP-004/PROP-004.glb", import.meta.url).href,
  ritualDrum: new URL("../assets/scene-pack/runtime/lod2/PROP-005/PROP-005.glb", import.meta.url).href,
  offeringTable: new URL("../assets/scene-pack/runtime/lod2/PROP-006/PROP-006.glb", import.meta.url).href,
  waterJar: new URL("../assets/scene-pack/runtime/lod2/PROP-008/PROP-008.glb", import.meta.url).href,
  areaSign: new URL("../assets/scene-pack/runtime/lod2/PROP-009/PROP-009.glb", import.meta.url).href,
};

const wallInstances = [
  [-13.25, 0, 25.2, 0], [-9.25, 0, 25.2, 0], [-5.25, 0, 25.2, 0],
  [5.25, 0, 25.2, 0], [9.25, 0, 25.2, 0], [13.25, 0, 25.2, 0],
  [-15.3, 0, 22.8, Math.PI / 2], [-15.3, 0, 18.8, Math.PI / 2], [-15.3, 0, 14.8, Math.PI / 2], [-15.3, 0, 10.8, Math.PI / 2], [-15.3, 0, 6.8, Math.PI / 2],
  [15.3, 0, 22.8, Math.PI / 2], [15.3, 0, 18.8, Math.PI / 2], [15.3, 0, 10.8, Math.PI / 2], [15.3, 0, 6.8, Math.PI / 2],
].map(([x, y, z, rotationY]) => ({ position: [x, y, z], rotationY }));

const wallCornerInstances = [
  [-15.3, 0, 25.2, 0],
  [15.3, 0, 25.2, -Math.PI / 2],
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
    id: "ARCH-005",
    label: "转角回廊",
    url: ASSET_URLS.corridorCorner,
    scale: [0.667, 1, 0.667],
    instances: [{ position: [-12, 0, 18.4], rotationY: 0 }],
  },
  {
    id: "ARCH-006",
    label: "寺院围墙",
    url: ASSET_URLS.wall,
    scale: [1.333, 1.226, 0.417],
    instances: wallInstances,
  },
  {
    id: "ARCH-007",
    label: "围墙转角",
    url: ASSET_URLS.wallCorner,
    scale: [1.333, 1.036, 1.619],
    instances: wallCornerInstances,
  },
  {
    id: "ARCH-008",
    label: "庭院侧门",
    url: ASSET_URLS.sideGate,
    scale: [1.111, 1.058, 0.909],
    instances: [{ position: [15.3, 0, 14.8], rotationY: Math.PI / 2 }],
  },
  {
    id: "ARCH-009",
    label: "竹林静坐亭",
    url: ASSET_URLS.pavilion,
    scale: [1.333, 1.333, 1.333],
    instances: [{ position: [-7.8, 0, 18.4], rotationY: 0 }],
  },
  {
    id: "ARCH-010",
    label: "石桥",
    url: ASSET_URLS.bridge,
    scale: [10, 7.65, 7.778],
    instances: [{ position: [8.6, 0.08, 14.5], rotationY: 0 }],
  },
  {
    id: "ARCH-011",
    label: "石阶",
    url: ASSET_URLS.stairs,
    scale: [3.333, 1.139, 2.5],
    instances: [{ position: [-12, 0, 8.2], rotationY: Math.PI }],
  },
  {
    id: "ENV-001",
    label: "近景岩壁",
    url: ASSET_URLS.rockWall,
    scale: [26.667, 25.714, 13.636],
    instances: [
      { position: [-22.4, -0.15, 17.5], rotationY: 0.18 },
      { position: [22.8, -0.2, 8.5], rotationY: Math.PI - 0.22 },
    ],
  },
  {
    id: "ENV-003",
    label: "高竹组合",
    url: ASSET_URLS.bamboo,
    scale: [1.429, 2.8, 1.818],
    instances: [
      { position: [-10.9, -0.12, 21.8], rotationY: -0.42 },
      { position: [-14.2, -0.12, 13.2], rotationY: 0.55 },
      { position: [14.2, -0.12, 9.8], rotationY: 2.48 },
    ],
  },
  {
    id: "ENV-007",
    label: "水池边缘",
    url: ASSET_URLS.pondBank,
    scale: [1.667, 0.952, 1.183],
    instances: [
      { position: [8.6, -0.04, 11.9], rotationY: 0 },
      { position: [8.6, -0.04, 17.1], rotationY: Math.PI },
      { position: [11.95, -0.04, 14.5], rotationY: -Math.PI / 2 },
    ],
  },
  {
    id: "ENV-010",
    label: "池塘莲花",
    url: ASSET_URLS.lotus,
    scale: [2.4615, 0.9595, 1.9704],
    instances: [
      { position: [5.2, -0.08, 13.4], rotationY: -0.35, scaleMultiplier: 0.88 },
      { position: [12.2, -0.08, 13.5], rotationY: 0.62, scaleMultiplier: 0.82 },
      { position: [12.0, -0.08, 15.8], rotationY: -0.95, scaleMultiplier: 0.68 },
    ],
  },
  {
    id: "ENV-006",
    label: "迎风松",
    url: ASSET_URLS.windsweptPine,
    scale: [1.322, 1.333, 1.035],
    materialTint: 0x71856a,
    instances: [
      { position: [13.8, -0.08, 7.2], rotationY: -0.4 },
      { position: [-13.6, -0.08, 26.6], rotationY: 2.55, scaleMultiplier: 0.86 },
    ],
  },
  {
    id: "PROP-001",
    label: "石灯",
    url: ASSET_URLS.stoneLantern,
    scale: [2.174, 2, 2.194],
    instances: [
      { position: [-4.6, 0, 12.2], rotationY: 0.18 },
      { position: [4.7, 0, 19.2], rotationY: -0.15, scaleMultiplier: 0.92 },
      { position: [-9.8, 0, 18.8], rotationY: 0.4, scaleMultiplier: 0.88 },
    ],
  },
  {
    id: "PROP-002",
    label: "木制引路灯",
    url: ASSET_URLS.pathLantern,
    scale: [1.025, 0.955, 0.99],
    instances: [
      { position: [-3.25, 0, 11.4], rotationY: 0 }, { position: [3.25, 0, 11.4], rotationY: Math.PI },
      { position: [-3.25, 0, 20.2], rotationY: 0 }, { position: [3.25, 0, 20.2], rotationY: Math.PI },
      { position: [-3.25, 0, 24.6], rotationY: 0 }, { position: [3.25, 0, 24.6], rotationY: Math.PI },
    ],
  },
  {
    id: "PROP-003",
    label: "香炉",
    url: ASSET_URLS.incenseBurner,
    scale: [2.5, 4.3, 3.3],
    instances: [{ position: [0, 0.64, 6.6], rotationY: 0 }],
  },
  {
    id: "PROP-004",
    label: "寺院钟",
    url: ASSET_URLS.templeBell,
    scale: [5.158, 6.286, 6.164],
    instances: [{ position: [11.8, 0, 5.1], rotationY: -Math.PI / 2 }],
  },
  {
    id: "PROP-005",
    label: "仪式鼓",
    url: ASSET_URLS.ritualDrum,
    scale: [2.614, 2, 1.739],
    instances: [{ position: [9.2, 0, 5.1], rotationY: -Math.PI / 2 }],
  },
  {
    id: "PROP-006",
    label: "供桌",
    url: ASSET_URLS.offeringTable,
    scale: [1.333, 1.077, 1.169],
    instances: [{ position: [0, 0.64, -5.8], rotationY: 0 }],
  },
  {
    id: "PROP-008",
    label: "蓄水陶缸",
    url: ASSET_URLS.waterJar,
    scale: [3.929, 4.301, 3.971],
    waterSurface: true,
    instances: [
      { position: [-9.4, 0, 9.6], rotationY: 0.2 },
      { position: [12.9, 0, 18.2], rotationY: -0.4, scaleMultiplier: 0.92 },
    ],
  },
  {
    id: "PROP-009",
    label: "木制区域牌",
    url: ASSET_URLS.areaSign,
    scale: [0.782, 0.818, 0.539],
    runtimeText: "云庭 / 静坐亭",
    instances: [{ position: [4.8, 0, 22], rotationY: -0.3 }],
  },
];

function createRuntimeText(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(4, 20, 16, 0.64)";
  context.fillRect(18, 28, 732, 136);
  context.strokeStyle = "rgba(112, 242, 229, 0.72)";
  context.lineWidth = 3;
  context.strokeRect(22, 32, 724, 128);
  context.fillStyle = "#d7f5e8";
  context.font = "500 54px 'PingFang SC', 'Noto Sans CJK SC', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 384, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.98, 0.28),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
  );
  panel.renderOrder = 4;
  return panel;
}

function prepareMaterials(model, renderer, materialTint, castShadow) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = castShadow;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((meshMaterial) => {
      meshMaterial.envMapIntensity = castShadow ? 0.5 : 0.62;
      if (castShadow && meshMaterial.color) meshMaterial.color.multiply(new THREE.Color(0xc5bca9));
      if (materialTint && meshMaterial.color) meshMaterial.color.multiply(new THREE.Color(materialTint));
      meshMaterial.roughness = Math.max(meshMaterial.roughness ?? 0, castShadow ? 0.72 : 0.58);
      meshMaterial.metalness = Math.min(meshMaterial.metalness ?? 0, castShadow ? 0.08 : 0.22);
      if (meshMaterial.map) {
        meshMaterial.map.colorSpace = THREE.SRGBColorSpace;
        meshMaterial.map.anisotropy = anisotropy;
      }
      meshMaterial.needsUpdate = true;
    });
  });
}

function placeInstance(model, config, assetId, index) {
  model.name = `${assetId.toLowerCase()}-${index + 1}`;
  model.userData.assetId = assetId;
  model.scale.set(...config.scale);
  if (config.instance.scaleMultiplier) model.scale.multiplyScalar(config.instance.scaleMultiplier);
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
        prepareMaterials(template, renderer, config.materialTint, config.id.startsWith("ARCH-"));
        const group = new THREE.Group();
        group.name = `${config.id.toLowerCase()}-instances`;
        config.instances.forEach((instance, index) => {
          const model = index === 0 ? template : template.clone(true);
          group.add(placeInstance(model, { ...config, instance }, config.id, index));
          if (config.runtimeText && index === 0) {
            const bounds = new THREE.Box3().setFromObject(model);
            const center = bounds.getCenter(new THREE.Vector3());
            const panel = createRuntimeText(config.runtimeText);
            const front = new THREE.Vector3(0, 0, 0.27).applyAxisAngle(new THREE.Vector3(0, 1, 0), model.rotation.y);
            panel.position.set(center.x, bounds.min.y + 1.3, center.z).add(front);
            panel.rotation.y = model.rotation.y;
            group.add(panel);
          }
          if (config.waterSurface) {
            const bounds = new THREE.Box3().setFromObject(model);
            const center = bounds.getCenter(new THREE.Vector3());
            const water = new THREE.Mesh(
              new THREE.CircleGeometry(0.39 * (instance.scaleMultiplier ?? 1), 32),
              new THREE.MeshPhysicalMaterial({
                color: 0x173f3b,
                emissive: 0x0b2b28,
                emissiveIntensity: 0.35,
                roughness: 0.12,
                clearcoat: 1,
                transparent: true,
                opacity: 0.82,
              }),
            );
            water.rotation.x = -Math.PI / 2;
            water.position.set(center.x, bounds.max.y - 0.11, center.z);
            group.add(water);
          }
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
    [-12, 3.3, 7.8, 0xffc477, 5.8],
    [-12, 3.5, 18.7, 0xffbd68, 5.2],
    [8.6, 1.3, 14.5, 0x9edbce, 3.8],
    [0, 2.2, 24.2, 0xa7d8cd, 3.4],
    [-3.25, 1.72, 11.4, 0xffc477, 1.5], [3.25, 1.72, 11.4, 0xffc477, 1.5],
    [-3.25, 1.72, 20.2, 0xffc477, 1.35], [3.25, 1.72, 20.2, 0xffc477, 1.35],
    [-3.25, 1.72, 24.6, 0x7cebd0, 1.1], [3.25, 1.72, 24.6, 0x7cebd0, 1.1],
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
