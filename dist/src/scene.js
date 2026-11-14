import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { loadCourtyardSlice } from "./courtyard.js";

const TEMPLE_MODEL_URL = new URL("../assets/lux3d/main-hall-turbo/main-hall-turbo.glb", import.meta.url).href;
const GATE_MODEL_URL = new URL("../assets/lux3d/temple-shell-turbo/temple-shell-turbo.glb", import.meta.url).href;

const TAU = Math.PI * 2;
const SEAT_ROWS = 5;
const SEAT_COLS = 7;
const ACTION_LENGTH = { gassho: 2.4, bow: 3.2, moktak: 1.4, meditate: 60 };

const palette = {
  void: 0x06110e,
  fog: 0x0a1d18,
  jade: 0x65e3b4,
  jadeDark: 0x123b31,
  cyan: 0x70f2e5,
  gold: 0xe6bd72,
  ink: 0x101814,
  stone: 0x25332d,
  stoneLight: 0x425149,
  wood: 0x3c241c,
  robe: 0x8c6446,
};

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.08, ...options });
}

function box(width, height, depth, mat, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radius, height, mat, position = [0, 0, 0], segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addEdges(mesh, color = palette.jade, opacity = 0.18) {
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 28),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  lines.scale.copy(mesh.scale);
  mesh.parent?.add(lines);
  return lines;
}

function createMountainRing() {
  const group = new THREE.Group();
  const mountainMats = [
    material(0x0c281f, { flatShading: true, roughness: 1 }),
    material(0x12352a, { flatShading: true, roughness: 1 }),
    material(0x183f33, { flatShading: true, roughness: 1 }),
  ];
  for (let layer = 0; layer < 3; layer += 1) {
    const count = 25 + layer * 7;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * TAU + layer * 0.13;
      const radius = 50 + layer * 10 + Math.sin(index * 2.37 + layer) * 5;
      const height = 7 + layer * 3 + (Math.sin(index * 1.71) + 1) * 4;
      const geometry = new THREE.ConeGeometry(3.8 + layer * 1.4 + (index % 4) * 0.35, height, 6);
      const peak = new THREE.Mesh(geometry, mountainMats[layer]);
      peak.position.set(Math.cos(angle) * radius, height / 2 - 1.8, Math.sin(angle) * radius);
      peak.rotation.y = angle + index * 0.31;
      group.add(peak);
    }
  }
  return group;
}

function createBambooCluster(scale = 1) {
  const group = new THREE.Group();
  const stalkMat = material(0x315f45, { roughness: 0.9 });
  const jointMat = material(0x172f25, { roughness: 1 });
  const leafMat = material(0x244f3b, { roughness: 1, side: THREE.DoubleSide });
  const leafGeometry = new THREE.ConeGeometry(0.12, 0.72, 5);

  for (let index = 0; index < 7; index += 1) {
    const height = 3.7 + (index % 4) * 0.55;
    const x = Math.sin(index * 2.1) * 0.62;
    const z = Math.cos(index * 1.7) * 0.55;
    group.add(cylinder(0.045, height, stalkMat, [x, height / 2, z], 8));
    for (let joint = 1; joint < 5; joint += 1) {
      group.add(cylinder(0.06, 0.045, jointMat, [x, (height / 5) * joint, z], 8));
    }
    for (let leaf = 0; leaf < 5; leaf += 1) {
      const blade = new THREE.Mesh(leafGeometry, leafMat);
      blade.position.set(x + Math.sin(leaf * 1.9) * 0.3, height * (0.54 + leaf * 0.08), z + Math.cos(leaf * 2.3) * 0.28);
      blade.rotation.set(Math.PI / 2.2, leaf * 1.25, 0.35);
      group.add(blade);
    }
  }
  group.scale.setScalar(scale);
  return group;
}

function createLantern(color = palette.gold) {
  const group = new THREE.Group();
  const capMat = material(0x201b14);
  const glowMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 2.3,
    transparent: true,
    opacity: 0.9,
  });
  group.add(cylinder(0.08, 0.08, capMat, [0, 0.23, 0], 8));
  group.add(cylinder(0.12, 0.34, glowMat, [0, 0, 0], 8));
  group.add(cylinder(0.08, 0.08, capMat, [0, -0.23, 0], 8));
  const light = new THREE.PointLight(color, 1.1, 4.5, 2);
  group.add(light);
  return group;
}

function createMonk({ color = palette.robe, self = false } = {}) {
  const root = new THREE.Group();
  root.userData.baseY = 0;
  root.userData.action = null;
  root.userData.actionAt = 0;

  const robeMat = material(color, { roughness: 0.95 });
  const trimMat = material(self ? palette.gold : 0xcda073, { emissive: self ? 0x664214 : 0x000000, emissiveIntensity: 0.45 });
  const skinMat = material(0xc9936d, { roughness: 0.9 });
  const darkMat = material(0x211b17);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.52, 4, 10), robeMat);
  body.position.y = 0.58;
  body.scale.set(1.1, 1, 0.9);
  body.castShadow = true;
  root.add(body);

  const sash = box(0.08, 0.68, 0.04, trimMat, [0.11, 0.6, 0.235]);
  sash.rotation.z = -0.24;
  root.add(sash);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.225, 16, 12), skinMat);
  head.position.y = 1.18;
  head.scale.y = 1.05;
  head.castShadow = true;
  root.add(head);

  const eyeGeometry = new THREE.SphereGeometry(0.018, 6, 4);
  [-0.075, 0.075].forEach((x) => {
    const eye = new THREE.Mesh(eyeGeometry, darkMat);
    eye.position.set(x, 1.205, 0.205);
    eye.scale.y = 0.45;
    root.add(eye);
  });

  const armGeometry = new THREE.CapsuleGeometry(0.07, 0.37, 3, 8);
  const arms = [];
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(armGeometry, robeMat);
    arm.position.set(side * 0.3, 0.7, 0.02);
    arm.rotation.z = side * -0.22;
    arm.castShadow = true;
    root.add(arm);
    arms.push(arm);
  });

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.39, 0.012, 6, 48),
    new THREE.MeshBasicMaterial({ color: self ? palette.gold : palette.jade, transparent: true, opacity: self ? 0.75 : 0.18 }),
  );
  halo.position.set(0, 0.6, -0.18);
  halo.rotation.x = Math.PI / 2;
  root.add(halo);

  root.userData.parts = { body, head, arms, sash, halo };
  root.userData.setSeated = (seated) => {
    root.userData.seated = seated;
    body.scale.y = seated ? 0.72 : 1;
    body.position.y = seated ? 0.39 : 0.58;
    head.position.y = seated ? 0.91 : 1.18;
    sash.scale.y = seated ? 0.72 : 1;
    sash.position.y = seated ? 0.43 : 0.6;
    arms.forEach((arm) => { arm.position.y = seated ? 0.51 : 0.7; });
  };
  root.userData.perform = (action) => {
    root.userData.action = action;
    root.userData.actionAt = performance.now() / 1000;
  };
  root.userData.update = (time) => {
    const { action, actionAt, seated } = root.userData;
    const elapsed = time - actionAt;
    const breath = Math.sin(time * 1.55 + root.id) * 0.008;
    root.position.y = root.userData.baseY + breath;
    halo.rotation.z = time * 0.14;

    arms[0].rotation.set(0, 0, -0.22);
    arms[1].rotation.set(0, 0, 0.22);
    arms[0].position.x = -0.3;
    arms[1].position.x = 0.3;
    body.rotation.x = 0;
    head.rotation.x = 0;

    if (action === "gassho") {
      const strength = Math.sin(Math.min(1, elapsed / 0.4) * Math.PI / 2);
      arms[0].rotation.z = -1.08 * strength;
      arms[1].rotation.z = 1.08 * strength;
      arms[0].position.x = THREE.MathUtils.lerp(-0.3, -0.1, strength);
      arms[1].position.x = THREE.MathUtils.lerp(0.3, 0.1, strength);
    } else if (action === "bow") {
      const phase = Math.sin(Math.min(1, elapsed / 2.5) * Math.PI);
      root.rotation.x = phase * 0.64;
    } else if (action === "moktak") {
      arms[1].rotation.x = Math.sin(elapsed * 12) * 0.7;
    } else if (action === "meditate" || seated) {
      arms[0].rotation.z = -0.82;
      arms[1].rotation.z = 0.82;
      arms[0].position.x = -0.2;
      arms[1].position.x = 0.2;
    }

    if (action && elapsed > (ACTION_LENGTH[action] ?? 2.2)) {
      root.userData.action = null;
      root.rotation.x = 0;
    }
  };
  return root;
}

export class TempleScene {
  constructor({ canvas, labels, onSeatSelected, onSeatUnavailable, onAssetProgress, onCourtyardStatus }) {
    this.canvas = canvas;
    this.labelsRoot = labels;
    this.onSeatSelected = onSeatSelected;
    this.onSeatUnavailable = onSeatUnavailable;
    this.onAssetProgress = onAssetProgress;
    this.onCourtyardStatus = onCourtyardStatus;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(palette.void);
    this.scene.fog = new THREE.FogExp2(palette.fog, 0.033);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 160);
    this.camera.position.set(0, 8.2, 39);
    this.cameraTarget = new THREE.Vector3(0, 2.7, 25);
    this.desiredCameraPosition = new THREE.Vector3();
    this.desiredCameraTarget = new THREE.Vector3();
    this.camera.lookAt(this.cameraTarget);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
    const lowPowerDevice = window.innerWidth < 720 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    this.pixelRatioCap = lowPowerDevice ? 1.25 : 1.75;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.pixelRatioCap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.seats = [];
    this.characters = new Map();
    this.labels = new Map();
    this.botIds = [];
    this.pointerDown = null;
    this.cameraYaw = 0;
    this.view = "gate";
    this.ambientMotions = [];
    this.courtyardSlice = new THREE.Group();
    this.courtyardSlice.name = "lux3d-courtyard-slice";
    this.scene.add(this.courtyardSlice);

    this.#buildLights();
    this.#buildWorld();
    this.ready = this.#buildTemple();
    this.#buildSeats();
    this.#seedBots();
    this.#bindEvents();
    this.resize();
    this.animate();
  }

  setSelf(profile) {
    if (!this.self) {
      const monk = createMonk({ color: 0x9c724c, self: true });
      monk.position.set(0, 0.04, 8.6);
      monk.rotation.y = Math.PI;
      this.scene.add(monk);
      this.self = monk;
      this.characters.set(profile.id, monk);
      this.#createLabel(profile.id, profile.name, true);
    }
    this.self.userData.profile = profile;
    this.#applyProfile(this.self, profile);
  }

  syncPeers(peers) {
    const peerIds = new Set(peers.map((peer) => peer.id));
    for (const peer of peers) {
      let monk = this.characters.get(peer.id);
      if (!monk) {
        monk = createMonk({ color: peer.color ?? 0x6f8a6e });
        monk.position.set((Math.random() - 0.5) * 3, 0.04, 8.2 + Math.random());
        monk.rotation.y = Math.PI;
        this.scene.add(monk);
        this.characters.set(peer.id, monk);
        this.#createLabel(peer.id, peer.name, false);
      }
      this.#applyProfile(monk, peer);
    }
    for (const [id, monk] of this.characters) {
      if (monk === this.self || this.botIds.includes(id) || peerIds.has(id)) continue;
      monk.removeFromParent();
      this.characters.delete(id);
      this.labels.get(id)?.remove();
      this.labels.delete(id);
    }
  }

  perform(action, actorId) {
    const monk = this.characters.get(actorId) ?? this.self;
    monk?.userData.perform(action);
  }

  setView(view) {
    if (!["gate", "courtyard", "hall"].includes(view)) return;
    this.view = view;
    this.cameraYaw = 0;
    if (view === "courtyard") this.#ensureCourtyardSlice();
  }

  #ensureCourtyardSlice() {
    if (this.courtyardLoadPromise) return this.courtyardLoadPromise;
    this.courtyardLoadPromise = loadCourtyardSlice({
      parent: this.courtyardSlice,
      renderer: this.renderer,
      onStatus: this.onCourtyardStatus,
    });
    return this.courtyardLoadPromise;
  }

  leaveSeat() {
    if (!this.self) return;
    this.self.userData.targetSeat = null;
    this.self.userData.setSeated(false);
    this.self.position.set(0, 0.04, 8.6);
    this.self.userData.baseY = 0.04;
    this.self.rotation.y = Math.PI;
    this.#refreshSeats();
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.pixelRatioCap));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.renderer.dispose();
    this.resizeObserver?.disconnect();
  }

  #buildLights() {
    this.scene.add(new THREE.HemisphereLight(0x99d7c2, 0x07100d, 1.7));
    const moon = new THREE.DirectionalLight(0xb8fff0, 2.7);
    moon.position.set(-8, 16, 11);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -18;
    moon.shadow.camera.right = 18;
    moon.shadow.camera.top = 18;
    moon.shadow.camera.bottom = -18;
    moon.shadow.bias = -0.0004;
    this.scene.add(moon);

    const altarGlow = new THREE.PointLight(palette.jade, 12, 18, 2);
    altarGlow.position.set(0, 4, -7.2);
    this.scene.add(altarGlow);

    const warmKey = new THREE.DirectionalLight(0xffcf91, 1.85);
    warmKey.position.set(7, 11, 9);
    this.scene.add(warmKey);

    [[-4.8, 3.3, -2.2], [4.8, 3.3, -2.2], [-4.8, 3.1, 4.3], [4.8, 3.1, 4.3]].forEach((position) => {
      const glow = new THREE.PointLight(0xffb86b, 4.8, 9, 2);
      glow.position.set(...position);
      this.scene.add(glow);
    });
  }

  #buildWorld() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(82, 96),
      material(0x081a15, { roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(createMountainRing());

    const starsGeometry = new THREE.BufferGeometry();
    const positions = [];
    for (let index = 0; index < 420; index += 1) {
      const radius = 30 + Math.random() * 42;
      const angle = Math.random() * TAU;
      positions.push(Math.cos(angle) * radius, 9 + Math.random() * 28, Math.sin(angle) * radius - 8);
    }
    starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: palette.jade, size: 0.045, transparent: true, opacity: 0.55 }),
    );
    this.scene.add(stars);

    const courtyard = new THREE.Group();
    courtyard.name = "cloud-courtyard";
    this.scene.add(courtyard);

    const pathMats = [material(0x3f4b44), material(0x4a554e), material(0x35423b)];
    for (let index = 0; index < 24; index += 1) {
      const z = 9.8 + index * 1.05;
      const slab = box(3.4 + (index % 3) * 0.22, 0.12, 0.78, pathMats[index % pathMats.length], [Math.sin(index * 1.7) * 0.12, 0.07, z]);
      slab.rotation.y = Math.sin(index * 2.3) * 0.025;
      courtyard.add(slab);
    }

    [10.8, 18.2].forEach((z, row) => {
      for (let index = 0; index < 7; index += 1) {
        const spur = box(0.86, 0.11, 1.75, pathMats[(index + row) % pathMats.length], [2.15 + index * 1.04, 0.065, z]);
        spur.rotation.y = Math.sin((index + row) * 1.8) * 0.018;
        courtyard.add(spur);
      }
      courtyard.add(box(3.9, 0.18, 1.65, material(0x46524b), [8.6, 0.09, z]));
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x164a43,
      emissive: 0x0b3932,
      emissiveIntensity: 0.7,
      roughness: 0.18,
      metalness: 0.42,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    });
    [1].forEach((side) => {
      const pond = new THREE.Mesh(new THREE.CircleGeometry(3.3, 48), waterMat.clone());
      pond.rotation.x = -Math.PI / 2;
      pond.scale.set(1.65, 1, 0.72);
      pond.position.set(side * 8.6, 0.055, 14.5);
      courtyard.add(pond);
      this.ambientMotions.push({ object: pond, kind: "water", phase: side });

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(3.3, 0.12, 6, 48),
        material(0x2f3c36, { roughness: 1 }),
      );
      rim.rotation.x = Math.PI / 2;
      rim.scale.set(1.65, 0.72, 1);
      rim.position.copy(pond.position);
      courtyard.add(rim);
    });

    [[-10.5, 10.5, 1.1], [13.2, 11.5, 1.05], [-9.2, 20.8, 1.3], [13.2, 20.5, 1.22], [-7.6, 28, 0.95], [13, 26.8, 1.02]].forEach(([x, z, scale]) => {
      const bamboo = createBambooCluster(scale);
      bamboo.position.set(x, 0, z);
      bamboo.rotation.y = x * 0.17;
      courtyard.add(bamboo);
    });

    [11.4, 15.8, 20.2, 24.6, 29].forEach((z, index) => {
      [-1, 1].forEach((side) => {
        const post = cylinder(0.08, 1.8, material(0x2a1b14), [side * 3.25, 0.9, z], 8);
        courtyard.add(post);
        const lantern = createLantern(index % 2 ? palette.jade : palette.gold);
        lantern.scale.setScalar(0.82);
        lantern.position.set(side * 3.25, 1.92, z);
        courtyard.add(lantern);
      });
    });

    const fireflyPositions = [];
    for (let index = 0; index < 120; index += 1) {
      fireflyPositions.push((Math.random() - 0.5) * 22, 0.7 + Math.random() * 4.8, 8 + Math.random() * 24);
    }
    const fireflyGeometry = new THREE.BufferGeometry();
    fireflyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(fireflyPositions, 3));
    const fireflies = new THREE.Points(
      fireflyGeometry,
      new THREE.PointsMaterial({ color: 0xb9ffe5, size: 0.075, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    courtyard.add(fireflies);
    this.ambientMotions.push({ object: fireflies, kind: "fireflies", phase: 0 });

    const gateFallback = new THREE.Group();
    gateFallback.name = "gate-fallback";
    gateFallback.add(box(10.8, 0.45, 5.4, material(0x28352f), [0, 0.18, 25.2]));
    [-4.2, 4.2].forEach((x) => gateFallback.add(cylinder(0.27, 5.2, material(0x3a241a), [x, 2.8, 25.2], 14)));
    gateFallback.add(box(10.5, 0.42, 0.6, material(0x1d342c), [0, 5.25, 25.2]));
    this.scene.add(gateFallback);
    this.gateFallback = gateFallback;
  }

  #buildTemple() {
    const stone = material(palette.stone);
    const stoneLight = material(palette.stoneLight);
    const wood = material(palette.wood);
    const darkWood = material(0x241610);
    const roof = material(0x18342c, { metalness: 0.18, roughness: 0.7, transparent: true, opacity: 0.46, depthWrite: false });

    const fallback = new THREE.Group();
    fallback.name = "procedural-temple-fallback";
    this.templeFallback = fallback;
    this.scene.add(fallback);

    const foundation = box(14.8, 0.6, 19, stone, [0, 0.22, -0.8]);
    this.scene.add(foundation);
    addEdges(foundation, palette.jade, 0.08);

    for (let step = 0; step < 3; step += 1) {
      this.scene.add(box(5.5 + step * 1.2, 0.18, 0.8, stoneLight, [0, 0.1 + step * 0.16, 9.3 - step * 0.28]));
    }

    const floor = box(13.8, 0.24, 17.6, material(0x18221d), [0, 0.62, -0.8]);
    fallback.add(floor);

    [-6.1, 6.1].forEach((x) => {
      [-8, -4, 0, 4, 8].forEach((z) => {
        const column = cylinder(0.23, 5.4, wood, [x, 3.3, z], 16);
        fallback.add(column);
        fallback.add(cylinder(0.34, 0.18, darkWood, [x, 0.68, z], 12));
        fallback.add(cylinder(0.36, 0.22, darkWood, [x, 5.98, z], 12));
      });
    });

    [-8.2, -4.1, 0, 4.1, 8.2].forEach((z) => {
      fallback.add(box(13.1, 0.25, 0.25, darkWood, [0, 5.86, z]));
    });

    const roofLower = box(16.4, 0.5, 20.5, roof, [0, 6.25, -0.8]);
    roofLower.rotation.z = 0.012;
    fallback.add(roofLower);
    addEdges(roofLower, palette.cyan, 0.13);
    const roofUpper = box(12.4, 0.38, 16.5, material(0x13231d, { transparent: true, opacity: 0.28, depthWrite: false }), [0, 6.67, -0.8]);
    fallback.add(roofUpper);

    for (let index = 0; index < 9; index += 1) {
      const x = -5.2 + index * 1.3;
      const beam = box(0.11, 0.11, 18.6, material(0x285044, { emissive: 0x0b2c23, emissiveIntensity: 0.8 }), [x, 6.01, -0.8]);
      fallback.add(beam);
    }

    const altarWall = box(11, 4.1, 0.3, material(0x0d1b16), [0, 2.76, -9.1]);
    fallback.add(altarWall);
    const altarPlatform = box(5.4, 0.65, 2.1, stoneLight, [0, 0.95, -7.7]);
    this.scene.add(altarPlatform);

    const core = new THREE.Group();
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: palette.jade,
      emissive: palette.jade,
      emissiveIntensity: 2.2,
      roughness: 0.3,
      metalness: 0.55,
    });
    [0.95, 1.28, 1.62].forEach((radius, index) => {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035 + index * 0.008, 8, 64), torusMaterial);
      torus.rotation.y = index * 0.8;
      core.add(torus);
    });
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6, 2),
      new THREE.MeshStandardMaterial({ color: 0xf5df9b, emissive: 0x9e6d25, emissiveIntensity: 2.6, metalness: 0.6, roughness: 0.25 }),
    );
    core.add(orb);
    core.position.set(0, 3.1, -7.15);
    core.userData.spin = true;
    this.scene.add(core);
    this.core = core;

    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * TAU;
      const lantern = createLantern(index % 3 === 0 ? palette.jade : palette.gold);
      lantern.position.set(Math.cos(angle) * 4.2, 2.2 + (index % 2) * 0.45, -6.85 + Math.sin(angle) * 1.1);
      this.scene.add(lantern);
    }

    [-5.3, 5.3].forEach((x) => {
      [-6, -2, 2, 6].forEach((z, index) => {
        const lantern = createLantern(index % 2 ? palette.jade : palette.gold);
        lantern.position.set(x, 3.8, z);
        this.scene.add(lantern);
      });
    });

    const hallPromise = new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(
        TEMPLE_MODEL_URL,
        (gltf) => {
          const model = gltf.scene;
          const rawBounds = new THREE.Box3().setFromObject(model);
          const rawSize = rawBounds.getSize(new THREE.Vector3());
          const rawCenter = rawBounds.getCenter(new THREE.Vector3());
          const scale = 15.8 / rawSize.x;

          model.scale.setScalar(scale);
          model.position.set(-rawCenter.x * scale, 0.56 - rawBounds.min.y * scale, -0.8 - rawCenter.z * scale);
          model.name = "lux3d-main-hall";
          model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((meshMaterial) => {
              meshMaterial.envMapIntensity = 0.72;
              if (meshMaterial.map) meshMaterial.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
              meshMaterial.needsUpdate = true;
            });
          });

          this.scene.add(model);
          this.templeModel = model;
          fallback.visible = false;
          this.onAssetProgress?.(0.78);
          resolve({ source: "lux3d", dimensions: rawSize.multiplyScalar(scale) });
        },
        (event) => {
          if (event.total > 0) this.onAssetProgress?.(Math.min(0.76, (event.loaded / event.total) * 0.76));
        },
        (error) => {
          console.warn("Lux3D temple model could not be loaded; using procedural fallback.", error);
          this.onAssetProgress?.(0.78);
          resolve({ source: "fallback" });
        },
      );
    });

    const gatePromise = new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(
        GATE_MODEL_URL,
        (gltf) => {
          const model = gltf.scene;
          const rawBounds = new THREE.Box3().setFromObject(model);
          const rawSize = rawBounds.getSize(new THREE.Vector3());
          const rawCenter = rawBounds.getCenter(new THREE.Vector3());
          const scale = 10.4 / rawSize.x;

          model.scale.setScalar(scale);
          model.position.set(-rawCenter.x * scale, 0.24 - rawBounds.min.y * scale, 25.2 - rawCenter.z * scale);
          model.name = "lux3d-mountain-gate";
          model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((meshMaterial) => {
              meshMaterial.envMapIntensity = 0.7;
              if (meshMaterial.map) meshMaterial.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
              meshMaterial.needsUpdate = true;
            });
          });

          this.scene.add(model);
          this.gateModel = model;
          this.gateFallback.visible = false;
          this.onAssetProgress?.(1);
          resolve({ source: "lux3d", dimensions: rawSize.multiplyScalar(scale) });
        },
        (event) => {
          if (event.total > 0) this.onAssetProgress?.(0.78 + Math.min(0.21, (event.loaded / event.total) * 0.21));
        },
        (error) => {
          console.warn("Lux3D mountain gate could not be loaded; using procedural fallback.", error);
          this.onAssetProgress?.(1);
          resolve({ source: "fallback" });
        },
      );
    });

    return Promise.all([hallPromise, gatePromise]);
  }

  #buildSeats() {
    const seatMaterial = material(0x425b4f, { roughness: 1 });
    for (let row = 0; row < SEAT_ROWS; row += 1) {
      for (let col = 0; col < SEAT_COLS; col += 1) {
        const index = row * SEAT_COLS + col;
        const geometry = new THREE.CylinderGeometry(0.48, 0.53, 0.13, 16);
        const seat = new THREE.Mesh(geometry, seatMaterial.clone());
        seat.position.set((col - (SEAT_COLS - 1) / 2) * 1.52, 0.83, 5.4 - row * 2.0);
        seat.scale.z = 0.78;
        seat.castShadow = true;
        seat.receiveShadow = true;
        seat.userData.seatIndex = index;
        seat.userData.occupiedBy = null;
        this.seats.push(seat);
        this.scene.add(seat);
      }
    }
  }

  #seedBots() {
    const names = ["松间缓存", "无相信号", "月下重启", "缓慢回声", "一盏微光", "空山来客", "云端旧梦", "安静像素", "未读的信", "第七码云", "不急", "小小山岚", "雨后程序", "等待黎明", "温柔故障", "星河暂停", "此刻在线", "松针与风", "白噪旅人", "零号心事"];
    const occupied = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 23, 25, 27, 29, 31, 33];
    occupied.forEach((seatIndex, index) => {
      const id = `bot-${index}`;
      const monk = createMonk({ color: index % 3 === 0 ? 0x6e7f63 : index % 3 === 1 ? 0x80634e : 0x5f786e });
      const seat = this.seats[seatIndex];
      monk.position.copy(seat.position).add(new THREE.Vector3(0, 0.12, 0));
      monk.rotation.y = Math.PI;
      monk.userData.baseY = monk.position.y;
      monk.userData.setSeated(true);
      monk.userData.profile = { id, name: names[index], seat: seatIndex };
      if (index % 5 === 0) monk.userData.perform("gassho");
      seat.userData.occupiedBy = id;
      this.scene.add(monk);
      this.characters.set(id, monk);
      this.botIds.push(id);
      this.#createLabel(id, names[index], false);
    });
  }

  #createLabel(id, name, self) {
    const label = document.createElement("span");
    label.className = `world-label${self ? " is-self" : ""}`;
    label.textContent = self ? `你 · ${name}` : name;
    this.labelsRoot.append(label);
    this.labels.set(id, label);
  }

  #applyProfile(monk, profile) {
    monk.userData.profile = profile;
    if (profile.seat !== null && profile.seat !== undefined) {
      const seat = this.seats[profile.seat];
      if (seat) {
        monk.position.copy(seat.position).add(new THREE.Vector3(0, 0.12, 0));
        monk.userData.baseY = monk.position.y;
        monk.rotation.y = Math.PI;
        monk.userData.setSeated(true);
        monk.userData.targetSeat = profile.seat;
      }
    } else if (monk !== this.self) {
      monk.userData.setSeated(false);
    }
    if (profile.action && profile.actionNonce !== monk.userData.lastNetworkAction) {
      monk.userData.lastNetworkAction = profile.actionNonce;
      monk.userData.perform(profile.action);
    }
    this.#refreshSeats();
  }

  #refreshSeats() {
    this.seats.forEach((seat, index) => {
      const botOccupant = this.characters.get(seat.userData.occupiedBy);
      const dynamicOccupant = [...this.characters.values()].find((monk) => monk.userData.profile?.seat === index);
      const occupied = Boolean(botOccupant || dynamicOccupant);
      seat.material.emissive.setHex(occupied ? 0x07100d : 0x123d31);
      seat.material.emissiveIntensity = occupied ? 0.15 : 0.42;
    });
  }

  #selectSeat(index) {
    const seat = this.seats[index];
    const occupant = [...this.characters.values()].find((monk) => monk !== this.self && monk.userData.profile?.seat === index);
    if (seat.userData.occupiedBy || occupant) {
      this.onSeatUnavailable?.(index);
      return;
    }
    this.self.userData.targetSeat = index;
    this.self.position.copy(seat.position).add(new THREE.Vector3(0, 0.12, 0));
    this.self.userData.baseY = this.self.position.y;
    this.self.rotation.y = Math.PI;
    this.self.userData.setSeated(true);
    this.#refreshSeats();
    this.onSeatSelected?.(index);
  }

  #bindEvents() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointerDown = { x: event.clientX, y: event.clientY, yaw: this.cameraYaw };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointerDown) return;
      const delta = event.clientX - this.pointerDown.x;
      if (this.view === "hall" && Math.abs(delta) > 4) this.cameraYaw = THREE.MathUtils.clamp(this.pointerDown.yaw + delta * 0.003, -0.5, 0.5);
      if (this.view === "courtyard" && Math.abs(delta) > 4) this.cameraYaw = THREE.MathUtils.clamp(this.pointerDown.yaw + delta * 0.003, -0.72, 0.72);
    });
    this.canvas.addEventListener("pointerup", (event) => {
      if (!this.pointerDown) return;
      const distance = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
      this.pointerDown = null;
      if (distance > 7) return;
      if (this.view !== "hall") return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.seats, false)[0];
      if (hit) this.#selectSeat(hit.object.userData.seatIndex);
    });
    this.canvas.addEventListener("pointercancel", () => { this.pointerDown = null; });
  }

  #updateCamera(time) {
    const mobile = window.innerWidth < 720;
    const desiredPosition = this.desiredCameraPosition;
    const desiredTarget = this.desiredCameraTarget;

    if (this.view === "gate") {
      desiredPosition.set(0, mobile ? 10.2 : 9.4, mobile ? 46.5 : 45.5);
      desiredTarget.set(0, 2.8, 25.1);
    } else if (this.view === "courtyard") {
      const courtyardDistance = mobile ? 26.8 : 28.8;
      const courtyardAngle = (mobile ? 0.87 : 0.95) + this.cameraYaw;
      desiredTarget.set(-3.2, 2.35, 13.2);
      desiredPosition.set(
        desiredTarget.x + Math.sin(courtyardAngle) * courtyardDistance,
        mobile ? 9.6 : 10.6,
        desiredTarget.z + Math.cos(courtyardAngle) * courtyardDistance,
      );
    } else {
      const baseDistance = mobile ? 19.8 : 18.4;
      const angle = this.cameraYaw + 0.1;
      desiredPosition.set(Math.sin(angle) * baseDistance, mobile ? 8.6 : 7.8, Math.cos(angle) * baseDistance + 0.2);
      desiredTarget.set(0, mobile ? 1.35 : 1.55, -1.6);
    }

    this.camera.position.lerp(desiredPosition, 0.065);
    this.cameraTarget.lerp(desiredTarget, 0.065);
    this.camera.lookAt(this.cameraTarget);
    this.camera.position.y += Math.sin(time * 0.18) * 0.08;
  }

  #updateLabels() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const vector = new THREE.Vector3();
    for (const [id, label] of this.labels) {
      const monk = this.characters.get(id);
      if (this.view !== "hall" || !monk?.visible) { label.hidden = true; continue; }
      vector.setFromMatrixPosition(monk.matrixWorld);
      vector.y += monk.userData.seated ? 1.45 : 1.72;
      vector.project(this.camera);
      const visible = vector.z < 1 && Math.abs(vector.x) < 1.05 && Math.abs(vector.y) < 1.05;
      label.hidden = !visible;
      if (visible) {
        label.style.transform = `translate(-50%, -50%) translate(${(vector.x * 0.5 + 0.5) * width}px, ${(-vector.y * 0.5 + 0.5) * height}px)`;
      }
    }
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();
    this.#updateCamera(time);
    this.core.rotation.y = time * 0.18;
    this.core.children.forEach((child, index) => { child.rotation.x = time * (0.07 + index * 0.025); });

    this.ambientMotions.forEach(({ object, kind, phase }) => {
      if (kind === "water") {
        object.material.emissiveIntensity = 0.58 + Math.sin(time * 0.8 + phase) * 0.12;
      } else if (kind === "fireflies") {
        object.rotation.y = Math.sin(time * 0.07) * 0.08;
        object.material.opacity = 0.58 + Math.sin(time * 1.25) * 0.14;
      }
    });

    for (const [id, monk] of this.characters) {
      monk.userData.update?.(time);
      if (id.startsWith("bot-") && Math.floor(time + Number(id.slice(4)) * 7) % 31 === 0 && !monk.userData.action) {
        monk.userData.perform(Number(id.slice(4)) % 2 ? "gassho" : "bow");
      }
    }

    this.scene.updateMatrixWorld();
    this.#updateLabels();
    this.renderer.render(this.scene, this.camera);
  };
}
