import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { loadCourtyardSlice } from "./courtyard.js?v=gate-sidewall-integrated-1";

const TEMPLE_MODEL_URL = new URL("../assets/lux3d/main-hall-turbo/main-hall-turbo.glb", import.meta.url).href;
const GATE_MODEL_URL = new URL("../assets/scene-pack/runtime/lod1/ARCH-016/ARCH-016.glb?v=sidewall-integrated-1", import.meta.url).href;
const CUSHION_MODEL_URL = new URL("../assets/scene-pack/runtime/lod2/PROP-010/PROP-010.glb", import.meta.url).href;
const MONK_MODEL_URL = new URL("../assets/scene-pack/runtime/lod1/CHAR-001/CHAR-001-animated.glb", import.meta.url).href;
const BUDDHA_MODEL_URL = new URL("../assets/scene-pack/runtime/lod1/PROP-011/PROP-011.glb", import.meta.url).href;
const HALL_ROOF_MODEL_URL = new URL("../assets/scene-pack/runtime/lod1/ARCH-012/ARCH-012.glb", import.meta.url).href;
const PRAYER_BEADS_MODEL_URL = new URL("../assets/scene-pack/runtime/lod2/PROP-012/PROP-012.glb", import.meta.url).href;
const WOODEN_FISH_MODEL_URL = new URL("../assets/scene-pack/runtime/lod2/PROP-013/PROP-013.glb", import.meta.url).href;
const GATE_LANTERN_MODEL_URL = new URL("../assets/scene-pack/source/PROP-014/PROP-014.glb?v=lux3d-gate-lanterns-1", import.meta.url).href;
const HALL_MURAL_URL = new URL("../assets/scene-pack/textures/hall-mythic-mural-v1.png", import.meta.url).href;

const TAU = Math.PI * 2;
const SEAT_ROWS = 5;
const SEAT_COLS = 7;
const ACTION_LENGTH = { gassho: 3.15, bow: 3.4, beads: 3.6, moktak: 1.6, meditate: 60 };

const palette = {
  void: 0x102820,
  fog: 0x28483b,
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

function splitIntegratedGateMesh(sourceMesh) {
  const geometry = sourceMesh.geometry;
  const position = geometry.getAttribute("position");
  const sourceIndex = geometry.index;
  if (!position || !sourceIndex) return null;

  const indices = sourceIndex.array;
  const parent = new Int32Array(position.count);
  const rank = new Uint8Array(position.count);
  for (let index = 0; index < parent.length; index += 1) parent[index] = index;

  const find = (value) => {
    let root = value;
    while (parent[root] !== root) root = parent[root];
    while (parent[value] !== value) {
      const next = parent[value];
      parent[value] = root;
      value = next;
    }
    return root;
  };
  const union = (a, b) => {
    let rootA = find(a);
    let rootB = find(b);
    if (rootA === rootB) return;
    if (rank[rootA] < rank[rootB]) [rootA, rootB] = [rootB, rootA];
    parent[rootB] = rootA;
    if (rank[rootA] === rank[rootB]) rank[rootA] += 1;
  };

  for (let index = 0; index < indices.length; index += 3) {
    union(indices[index], indices[index + 1]);
    union(indices[index], indices[index + 2]);
  }

  const componentBounds = new Map();
  for (let index = 0; index < indices.length; index += 3) {
    const root = find(indices[index]);
    let bounds = componentBounds.get(root);
    if (!bounds) {
      bounds = {
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity],
      };
      componentBounds.set(root, bounds);
    }
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = indices[index + corner];
      for (let axis = 0; axis < 3; axis += 1) {
        const value = position.getComponent(vertex, axis);
        bounds.min[axis] = Math.min(bounds.min[axis], value);
        bounds.max[axis] = Math.max(bounds.max[axis], value);
      }
    }
  }

  const doorComponents = new Set();
  componentBounds.forEach((bounds, root) => {
    if (
      bounds.min[0] >= -1.36 && bounds.max[0] <= 1.36
      && bounds.min[1] >= -2.22 && bounds.max[1] <= 0.24
      && bounds.min[2] >= -0.48 && bounds.max[2] <= 0.48
    ) doorComponents.add(root);
  });

  const buildingIndices = [];
  const leftIndices = [];
  const rightIndices = [];
  let leftHinge = Infinity;
  let rightHinge = -Infinity;
  for (let index = 0; index < indices.length; index += 3) {
    const triangle = [indices[index], indices[index + 1], indices[index + 2]];
    if (!doorComponents.has(find(triangle[0]))) {
      buildingIndices.push(...triangle);
      continue;
    }
    const centerX = triangle.reduce((sum, vertex) => sum + position.getX(vertex), 0) / 3;
    if (centerX < 0) {
      leftIndices.push(...triangle);
      triangle.forEach((vertex) => { leftHinge = Math.min(leftHinge, position.getX(vertex)); });
    } else {
      rightIndices.push(...triangle);
      triangle.forEach((vertex) => { rightHinge = Math.max(rightHinge, position.getX(vertex)); });
    }
  }

  if (!leftIndices.length || !rightIndices.length) return null;
  const createGeometry = (subset) => {
    const result = new THREE.BufferGeometry();
    Object.entries(geometry.attributes).forEach(([name, attribute]) => result.setAttribute(name, attribute));
    Object.entries(geometry.morphAttributes).forEach(([name, attributes]) => {
      result.morphAttributes[name] = attributes;
    });
    result.morphTargetsRelative = geometry.morphTargetsRelative;
    result.setIndex(new THREE.Uint32BufferAttribute(subset, 1));
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
  };
  const copyMeshSettings = (target) => {
    target.castShadow = true;
    target.receiveShadow = true;
    target.frustumCulled = sourceMesh.frustumCulled;
    target.renderOrder = sourceMesh.renderOrder;
  };

  const splitRoot = new THREE.Group();
  splitRoot.name = "integrated-gate-parts";
  splitRoot.position.copy(sourceMesh.position);
  splitRoot.quaternion.copy(sourceMesh.quaternion);
  splitRoot.scale.copy(sourceMesh.scale);

  const building = new THREE.Mesh(createGeometry(buildingIndices), sourceMesh.material);
  building.name = "gate-building-fixed";
  copyMeshSettings(building);
  splitRoot.add(building);

  const createLeaf = (name, subset, hinge) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.x = hinge;
    const visual = new THREE.Mesh(createGeometry(subset), sourceMesh.material);
    visual.position.x = -hinge;
    visual.name = `${name}-visual`;
    copyMeshSettings(visual);
    pivot.add(visual);
    splitRoot.add(pivot);
    return pivot;
  };

  const left = createLeaf("gate-door-left", leftIndices, leftHinge);
  const right = createLeaf("gate-door-right", rightIndices, rightHinge);
  sourceMesh.parent.add(splitRoot);
  sourceMesh.removeFromParent();
  return { root: splitRoot, building, leaves: [left, right] };
}

function removeGateThresholdObstruction(mesh) {
  const geometry = mesh.geometry;
  const index = geometry?.getIndex();
  const positions = geometry?.getAttribute("position");
  if (!index || !positions) return 0;

  const parent = new Int32Array(positions.count);
  const rank = new Uint8Array(positions.count);
  for (let vertex = 0; vertex < parent.length; vertex += 1) parent[vertex] = vertex;
  const find = (vertex) => {
    let root = vertex;
    while (parent[root] !== root) root = parent[root];
    while (parent[vertex] !== vertex) {
      const next = parent[vertex];
      parent[vertex] = root;
      vertex = next;
    }
    return root;
  };
  const union = (left, right) => {
    let rootLeft = find(left);
    let rootRight = find(right);
    if (rootLeft === rootRight) return;
    if (rank[rootLeft] < rank[rootRight]) [rootLeft, rootRight] = [rootRight, rootLeft];
    parent[rootRight] = rootLeft;
    if (rank[rootLeft] === rank[rootRight]) rank[rootLeft] += 1;
  };

  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset);
    const b = index.getX(offset + 1);
    const c = index.getX(offset + 2);
    union(a, b);
    union(a, c);
  }

  const boundsByRoot = new Map();
  for (let offset = 0; offset < index.count; offset += 3) {
    const root = find(index.getX(offset));
    let bounds = boundsByRoot.get(root);
    if (!bounds) {
      bounds = {
        min: new THREE.Vector3(Infinity, Infinity, Infinity),
        max: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
      };
      boundsByRoot.set(root, bounds);
    }
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = index.getX(offset + corner);
      bounds.min.x = Math.min(bounds.min.x, positions.getX(vertex));
      bounds.min.y = Math.min(bounds.min.y, positions.getY(vertex));
      bounds.min.z = Math.min(bounds.min.z, positions.getZ(vertex));
      bounds.max.x = Math.max(bounds.max.x, positions.getX(vertex));
      bounds.max.y = Math.max(bounds.max.y, positions.getY(vertex));
      bounds.max.z = Math.max(bounds.max.z, positions.getZ(vertex));
    }
  }

  geometry.computeBoundingBox();
  const geometrySize = geometry.boundingBox.getSize(new THREE.Vector3());
  const obstructionRoots = new Set();
  boundsByRoot.forEach((bounds, root) => {
    const size = bounds.max.clone().sub(bounds.min);
    const center = bounds.max.clone().add(bounds.min).multiplyScalar(0.5);
    const normalizedSize = size.clone().divide(geometrySize);
    const normalizedCenter = center.clone().sub(geometry.boundingBox.min).divide(geometrySize);
    // gltfpack quantizes positions, so identify the four stray branch pieces by normalized local bounds.
    if (
      normalizedSize.x < 0.25
      && normalizedSize.y < 0.17
      && normalizedSize.z < 0.08
      && normalizedCenter.x > 0.38 && normalizedCenter.x < 0.53
      && normalizedCenter.y > 0.08 && normalizedCenter.y < 0.2
      && normalizedCenter.z > 0.46 && normalizedCenter.z < 0.54
    ) {
      obstructionRoots.add(root);
    }
  });
  if (!obstructionRoots.size) return 0;

  const keptIndices = [];
  let removedTriangles = 0;
  for (let offset = 0; offset < index.count; offset += 3) {
    if (obstructionRoots.has(find(index.getX(offset)))) {
      removedTriangles += 1;
      continue;
    }
    keptIndices.push(index.getX(offset), index.getX(offset + 1), index.getX(offset + 2));
  }
  geometry.setIndex(keptIndices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return removedTriangles;
}

function createMountainRing() {
  const group = new THREE.Group();
  const mountainMats = [
    material(0x172a26, { roughness: 1 }),
    material(0x203a34, { roughness: 1 }),
    material(0x2c4941, { roughness: 1 }),
  ];
  for (let layer = 0; layer < 3; layer += 1) {
    const count = 34 + layer * 8;
    const geometry = new THREE.SphereGeometry(1, 12, 8);
    const ridge = new THREE.InstancedMesh(geometry, mountainMats[layer], count);
    ridge.name = `mountain-ridge-${layer + 1}`;
    const transform = new THREE.Object3D();
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * TAU + layer * 0.13;
      const radius = 48 + layer * 11 + Math.sin(index * 2.37 + layer) * 4.5;
      const height = 9 + layer * 3.2 + (Math.sin(index * 1.71) + 1) * 3.3;
      const width = 10.5 + layer * 2.4 + (index % 4) * 0.8;
      transform.position.set(Math.cos(angle) * radius, -6.6, Math.sin(angle) * radius);
      transform.rotation.set(Math.sin(index * 0.91) * 0.04, angle + index * 0.31, Math.cos(index * 1.27) * 0.035);
      transform.scale.set(width, height, width * (0.72 + (index % 3) * 0.08));
      transform.updateMatrix();
      ridge.setMatrixAt(index, transform.matrix);
    }
    ridge.instanceMatrix.needsUpdate = true;
    ridge.receiveShadow = true;
    group.add(ridge);
  }
  return group;
}

function createSoftParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48);
  gradient.addColorStop(0, "rgba(255,255,255,.78)");
  gradient.addColorStop(0.34, "rgba(255,255,255,.34)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createMossPatchTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 128, 128);
  context.filter = "blur(9px)";
  for (let index = 0; index < 20; index += 1) {
    const x = 28 + ((index * 37) % 72);
    const y = 25 + ((index * 53) % 78);
    const radius = 10 + (index % 5) * 4;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${0.42 + (index % 3) * 0.11})`);
    gradient.addColorStop(0.62, "rgba(255,255,255,.24)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    context.fill();
  }
  context.filter = "none";
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWaterNormalTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const dx = Math.sin(x * 0.23 + y * 0.07) * 0.48
        + Math.sin(x * 0.08 - y * 0.19) * 0.3
        + Math.sin((x + y) * 0.41) * 0.14;
      const dy = Math.cos(y * 0.21 - x * 0.06) * 0.46
        + Math.cos(y * 0.09 + x * 0.17) * 0.31
        + Math.cos((x - y) * 0.37) * 0.13;
      image.data[index] = 128 + dx * 54;
      image.data[index + 1] = 128 + dy * 54;
      image.data[index + 2] = 232;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.8, 2.4);
  texture.needsUpdate = true;
  return texture;
}

function createMoonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(128, 128, 8, 128, 128, 124);
  glow.addColorStop(0, "rgba(246,249,235,1)");
  glow.addColorStop(0.7, "rgba(220,231,222,.98)");
  glow.addColorStop(0.88, "rgba(180,203,204,.72)");
  glow.addColorStop(1, "rgba(150,186,193,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 256, 256);
  context.globalCompositeOperation = "multiply";
  [
    [91, 88, 18, 0.08], [158, 76, 12, 0.07], [174, 137, 21, 0.065],
    [110, 158, 13, 0.06], [73, 139, 9, 0.055], [142, 111, 7, 0.05],
  ].forEach(([x, y, radius, opacity]) => {
    const crater = context.createRadialGradient(x - radius * 0.22, y - radius * 0.2, 1, x, y, radius);
    crater.addColorStop(0, `rgba(87,111,115,${opacity * 0.45})`);
    crater.addColorStop(0.72, `rgba(76,101,106,${opacity})`);
    crater.addColorStop(1, "rgba(76,101,106,0)");
    context.fillStyle = crater;
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    context.fill();
  });
  context.globalCompositeOperation = "source-over";
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createMoonReflectionMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.52 },
      uColor: { value: new THREE.Color(0xcfe6e7) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float sway = sin(vUv.y * 18.0 + uTime * 0.8) * 0.028
          + sin(vUv.y * 43.0 - uTime * 1.15) * 0.012;
        float distanceToRibbon = abs(vUv.x - 0.5 + sway);
        float taper = smoothstep(0.02, 0.3, vUv.y) * (1.0 - smoothstep(0.78, 1.0, vUv.y));
        float width = mix(0.055, 0.23, vUv.y) * (0.78 + sin(vUv.y * 12.0) * 0.16);
        float ribbon = 1.0 - smoothstep(width * 0.3, width, distanceToRibbon);
        float broken = 0.38 + 0.62 * smoothstep(-0.2, 0.78,
          sin(vUv.y * 96.0 + uTime * 2.2) + sin(vUv.x * 71.0 - uTime * 1.7));
        float spark = pow(max(0.0,
          sin(vUv.y * 122.0 - uTime * 2.6) * cos(vUv.x * 84.0 + uTime * 1.4)), 12.0);
        float edgeFade = smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x));
        float alpha = (ribbon * broken * 0.58 + ribbon * spark * 0.74) * taper * edgeFade * uOpacity;
        gl_FragColor = vec4(uColor * (0.72 + spark * 0.65), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function createPlasterBumpTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const image = context.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const x = (index / 4) % canvas.width;
    const y = Math.floor(index / 4 / canvas.width);
    const value = 116 + Math.sin(x * 0.17) * 7 + Math.cos(y * 0.21) * 6 + Math.random() * 22;
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 1.2);
  return texture;
}

function createContactShadow(width, depth, opacity = 0.28) {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      map: createSoftParticleTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 2;
  return shadow;
}

function createMistField({ count, width, depth, height, center, size, opacity, color }) {
  const positions = [];
  for (let index = 0; index < count; index += 1) {
    positions.push(
      (Math.random() - 0.5) * width,
      Math.random() * height,
      (Math.random() - 0.5) * depth,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const cloud = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color,
      map: createSoftParticleTexture(),
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  cloud.position.set(...center);
  cloud.userData.baseOpacity = opacity;
  return cloud;
}

function createIncenseSmoke() {
  const count = 46;
  const positions = [];
  const phases = [];
  const offsets = [];
  for (let index = 0; index < count; index += 1) {
    const phase = Math.random();
    phases.push(phase);
    offsets.push((Math.random() - 0.5) * 0.32);
    positions.push((Math.random() - 0.5) * 0.18, phase * 3.2, (Math.random() - 0.5) * 0.18);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const smoke = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xd7ddd6,
      map: createSoftParticleTexture(),
      size: 0.5,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  smoke.userData.phases = phases;
  smoke.userData.offsets = offsets;
  return smoke;
}

function createSmokeWisps() {
  const group = new THREE.Group();
  const wispMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8eee7,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  [-0.14, 0, 0.14].forEach((offset, index) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(offset, 0, 0),
      new THREE.Vector3(offset + 0.08, 0.65, 0.03),
      new THREE.Vector3(offset - 0.11, 1.35, -0.02),
      new THREE.Vector3(offset + 0.16, 2.05, 0.04),
      new THREE.Vector3(offset - 0.08, 2.75, 0),
    ]);
    const wisp = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.018 + index * 0.003, 5, false), wispMaterial.clone());
    wisp.userData.phase = index * 1.9;
    group.add(wisp);
  });
  return group;
}

function createLightShaft({ color, opacity, radius, height, position, rotation = [0, 0, 0] }) {
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.2, radius, height, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  shaft.position.set(...position);
  shaft.rotation.set(...rotation);
  return shaft;
}

function installHallAltarCutout(meshMaterial, enabled) {
  meshMaterial.userData.yunqiAltarCutoutEnabled = enabled ? 1 : 0;
  meshMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.yunqiAltarCutout = { value: meshMaterial.userData.yunqiAltarCutoutEnabled };
    meshMaterial.userData.yunqiAltarCutoutUniform = shader.uniforms.yunqiAltarCutout;
    shader.vertexShader = `varying vec3 vYunqiWorldPosition;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvYunqiWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
    );
    shader.fragmentShader = `uniform float yunqiAltarCutout;\nvarying vec3 vYunqiWorldPosition;\n${shader.fragmentShader}`.replace(
      "#include <clipping_planes_fragment>",
      "#include <clipping_planes_fragment>\nif (yunqiAltarCutout > 0.5 && abs(vYunqiWorldPosition.x) < 3.4 && vYunqiWorldPosition.y > 2.25 && vYunqiWorldPosition.y < 6.75 && vYunqiWorldPosition.z > -9.48) discard;",
    );
  };
  meshMaterial.customProgramCacheKey = () => "yunqi-hall-altar-cutout-v2";
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

function createGateHangingLantern(side) {
  const hanger = new THREE.Group();
  hanger.name = `gate-hanging-lantern-${side < 0 ? "left" : "right"}`;
  const cordMaterial = material(0x1b1511, { roughness: 0.98, metalness: 0 });
  const cord = cylinder(0.025, 0.92, cordMaterial, [0, -0.46, 0], 8);
  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.018, 6, 18, Math.PI),
    cordMaterial,
  );
  hook.rotation.z = Math.PI / 2;
  hook.position.y = 0.02;
  const fallbackLantern = createLantern(0xffb55f);
  fallbackLantern.name = "gate-lantern-procedural-fallback";
  fallbackLantern.scale.setScalar(1.58);
  fallbackLantern.position.y = -1.16;
  const fallbackLight = fallbackLantern.children.find((child) => child.isPointLight);
  fallbackLight?.removeFromParent();
  const light = new THREE.PointLight(0xffb45f, 26, 9.5, 1.85);
  light.position.set(0, -1.16, 0.12);
  light.castShadow = false;
  const facadeLight = new THREE.SpotLight(0xffc47a, 48, 10.5, Math.PI / 5.4, 0.82, 1.7);
  facadeLight.position.set(0, -1.05, 0.18);
  facadeLight.target.position.set(side * -1.85, -3.05, -2.3);
  facadeLight.castShadow = false;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createSoftParticleTexture(),
    color: 0xffb45f,
    transparent: true,
    opacity: 0.23,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));
  halo.position.y = -1.16;
  halo.scale.set(1.85, 1.85, 1);
  hanger.add(hook, cord, fallbackLantern, light, facadeLight, facadeLight.target, halo);
  hanger.userData.light = light;
  hanger.userData.facadeLight = facadeLight;
  hanger.userData.halo = halo;
  hanger.userData.baseIntensity = 26;
  hanger.userData.baseFacadeIntensity = 48;
  hanger.userData.baseHaloOpacity = 0.23;
  return hanger;
}

function createFallbackMonk({ color = palette.robe, self = false } = {}) {
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
    } else if (action === "beads") {
      const hold = Math.sin(Math.min(1, elapsed / 0.45) * Math.PI / 2);
      arms[0].rotation.z = -0.72 * hold;
      arms[1].rotation.z = 0.72 * hold + Math.sin(elapsed * 7.5) * 0.08;
      arms[0].position.x = THREE.MathUtils.lerp(-0.3, -0.18, hold);
      arms[1].position.x = THREE.MathUtils.lerp(0.3, 0.18, hold);
    } else if (action === "moktak") {
      arms[1].rotation.x = Math.sin(elapsed * 12) * 0.7;
    } else if (action === "meditate" || seated) {
      arms[0].rotation.z = -0.82;
      arms[1].rotation.z = 0.82;
      arms[0].position.x = -0.2;
      arms[1].position.x = 0.2;
    } else if (root.userData.walking) {
      const stride = Math.sin(time * 7.2);
      body.rotation.z = stride * 0.035;
      arms[0].rotation.x = stride * 0.34;
      arms[1].rotation.x = -stride * 0.34;
    }

    if (action && elapsed > (ACTION_LENGTH[action] ?? 2.2)) {
      root.userData.action = null;
      root.rotation.x = 0;
    }
  };
  return root;
}

function createRigActionClips(meshName, bones) {
  const quaternionTrack = (boneName, times, eulerFrames) => {
    const runtimeBoneName = bones[boneName]?.name;
    if (!runtimeBoneName) throw new Error(`Ritual animation bone is missing: ${boneName}`);
    const values = [];
    eulerFrames.forEach(([x, y, z]) => {
      values.push(...new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ")).toArray());
    });
    return new THREE.QuaternionKeyframeTrack(
      `${meshName}.bones[${runtimeBoneName}].quaternion`,
      times,
      values,
    );
  };
  const clip = (name, duration, definitions) => new THREE.AnimationClip(
    name,
    duration,
    definitions.map(([boneName, times, frames]) => quaternionTrack(boneName, times, frames)),
    THREE.AdditiveAnimationBlendMode,
  );
  const zero = [0, 0, 0];

  const gasshoTimes = [0, 0.42, 2.42, 3.15];
  const gassho = clip("Ritual_Gassho", 3.15, [
    ["LeftArm", gasshoTimes, [zero, [0.03, -0.08, -0.72], [0.03, -0.08, -0.72], zero]],
    ["RightArm", gasshoTimes, [zero, [0.03, 0.08, 0.72], [0.03, 0.08, 0.72], zero]],
    ["LeftForeArm", gasshoTimes, [zero, [0.08, -1.08, -0.08], [0.08, -1.08, -0.08], zero]],
    ["RightForeArm", gasshoTimes, [zero, [0.08, 1.08, 0.08], [0.08, 1.08, 0.08], zero]],
    ["LeftHand", gasshoTimes, [zero, [0, -0.12, -0.16], [0, -0.12, -0.16], zero]],
    ["RightHand", gasshoTimes, [zero, [0, 0.12, 0.16], [0, 0.12, 0.16], zero]],
    ["Spine1", gasshoTimes, [zero, [0.055, 0, 0], [0.055, 0, 0], zero]],
    ["Neck", gasshoTimes, [zero, [-0.035, 0, 0], [-0.035, 0, 0], zero]],
  ]);

  const bowTimes = [0, 0.5, 1.18, 2.28, 3.4];
  const bow = clip("Ritual_Temple_Bow", 3.4, [
    ["LeftArm", bowTimes, [zero, [0, -0.06, -0.7], [0, -0.06, -0.7], [0, -0.06, -0.7], zero]],
    ["RightArm", bowTimes, [zero, [0, 0.06, 0.7], [0, 0.06, 0.7], [0, 0.06, 0.7], zero]],
    ["LeftForeArm", bowTimes, [zero, [0.06, -1.02, -0.06], [0.06, -1.02, -0.06], [0.06, -1.02, -0.06], zero]],
    ["RightForeArm", bowTimes, [zero, [0.06, 1.02, 0.06], [0.06, 1.02, 0.06], [0.06, 1.02, 0.06], zero]],
    ["Spine", bowTimes, [zero, [0.04, 0, 0], [0.34, 0, 0], [0.34, 0, 0], zero]],
    ["Spine1", bowTimes, [zero, [0.05, 0, 0], [0.42, 0, 0], [0.42, 0, 0], zero]],
    ["Spine2", bowTimes, [zero, [0.02, 0, 0], [0.18, 0, 0], [0.18, 0, 0], zero]],
    ["Neck", bowTimes, [zero, [-0.04, 0, 0], [-0.16, 0, 0], [-0.16, 0, 0], zero]],
  ]);

  const beadsTimes = [0, 0.46, 0.92, 1.3, 1.68, 2.06, 2.44, 2.9, 3.6];
  const beads = clip("Ritual_Prayer_Beads", 3.6, [
    ["LeftArm", beadsTimes, [zero, [0.02, -0.05, -0.48], [0.02, -0.05, -0.48], [0.02, -0.05, -0.48], [0.02, -0.05, -0.48], [0.02, -0.05, -0.48], [0.02, -0.05, -0.48], [0.02, -0.05, -0.48], zero]],
    ["RightArm", beadsTimes, [zero, [0.08, 0.12, 0.54], [0.08, 0.12, 0.54], [0.08, 0.12, 0.54], [0.08, 0.12, 0.54], [0.08, 0.12, 0.54], [0.08, 0.12, 0.54], [0.08, 0.12, 0.54], zero]],
    ["LeftForeArm", beadsTimes, [zero, [0.16, -0.72, -0.06], [0.16, -0.72, -0.06], [0.16, -0.72, -0.06], [0.16, -0.72, -0.06], [0.16, -0.72, -0.06], [0.16, -0.72, -0.06], [0.16, -0.72, -0.06], zero]],
    ["RightForeArm", beadsTimes, [zero, [0.18, 0.78, 0.1], [0.18, 0.78, 0.16], [0.18, 0.78, 0.04], [0.18, 0.78, 0.16], [0.18, 0.78, 0.04], [0.18, 0.78, 0.16], [0.18, 0.78, 0.1], zero]],
    ["LeftHand", beadsTimes, [zero, [0, -0.08, -0.12], [0, -0.08, -0.12], [0, -0.08, -0.12], [0, -0.08, -0.12], [0, -0.08, -0.12], [0, -0.08, -0.12], [0, -0.08, -0.12], zero]],
    ["RightHand", beadsTimes, [zero, [0, 0.08, 0.08], [0.08, 0.08, 0.14], [-0.05, 0.08, 0.03], [0.08, 0.08, 0.14], [-0.05, 0.08, 0.03], [0.08, 0.08, 0.14], [0, 0.08, 0.08], zero]],
    ["RightHandThumb1", beadsTimes, [zero, [0, 0, -0.12], [0, 0, -0.2], [0, 0, -0.08], [0, 0, -0.2], [0, 0, -0.08], [0, 0, -0.2], [0, 0, -0.12], zero]],
    ["RightHandIndex1", beadsTimes, [zero, [0, 0, 0.1], [0, 0, 0.18], [0, 0, 0.06], [0, 0, 0.18], [0, 0, 0.06], [0, 0, 0.18], [0, 0, 0.1], zero]],
    ["Spine1", beadsTimes, [zero, [0.045, 0.03, 0], [0.045, 0.03, 0], [0.045, 0.03, 0], [0.045, 0.03, 0], [0.045, 0.03, 0], [0.045, 0.03, 0], [0.045, 0.03, 0], zero]],
    ["Neck", beadsTimes, [zero, [-0.08, 0.04, 0], [-0.08, 0.04, 0], [-0.08, 0.04, 0], [-0.08, 0.04, 0], [-0.08, 0.04, 0], [-0.08, 0.04, 0], [-0.08, 0.04, 0], zero]],
  ]);

  const moktakTimes = [0, 0.22, 0.46, 0.7, 0.94, 1.18, 1.6];
  const moktak = clip("Ritual_Wooden_Fish", 1.6, [
    ["RightArm", moktakTimes, [zero, [0.26, 0.02, 0.24], [0.32, 0.02, 0.18], [0.22, 0.02, 0.28], [0.34, 0.02, 0.16], [0.22, 0.02, 0.24], zero]],
    ["RightForeArm", moktakTimes, [zero, [0.08, 0.08, -0.5], [0.08, 0.08, 0.46], [0.08, 0.08, -0.42], [0.08, 0.08, 0.5], [0.08, 0.08, -0.28], zero]],
    ["RightHand", moktakTimes, [zero, [0, 0.08, -0.12], [0, 0.08, 0.2], [0, 0.08, -0.1], [0, 0.08, 0.22], [0, 0.08, -0.08], zero]],
    ["LeftArm", moktakTimes, [zero, [0, -0.04, -0.26], [0, -0.04, -0.26], [0, -0.04, -0.26], [0, -0.04, -0.26], [0, -0.04, -0.26], zero]],
    ["Spine1", moktakTimes, [zero, [0.03, -0.025, 0], [0.03, 0.03, 0], [0.03, -0.025, 0], [0.03, 0.03, 0], [0.03, -0.015, 0], zero]],
  ]);

  return { gassho, bow, beads, moktak };
}

function createAnimatedMonk({ template, clips, self = false } = {}) {
  const root = new THREE.Group();
  const model = cloneSkeleton(template);
  const visual = new THREE.Group();
  visual.add(model);
  root.add(visual);

  model.updateMatrixWorld(true);
  const rawBounds = new THREE.Box3().makeEmpty();
  model.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    child.geometry.computeBoundingBox();
    if (child.geometry.boundingBox) rawBounds.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld));
  });
  const rawSize = rawBounds.getSize(new THREE.Vector3());
  const rawCenter = rawBounds.getCenter(new THREE.Vector3());
  const scale = 1.5 / Math.max(rawSize.y, 0.001);
  visual.scale.setScalar(scale);
  model.position.set(-rawCenter.x, -rawBounds.min.y, -rawCenter.z);
  root.userData.baseY = 0;
  root.userData.action = null;
  root.userData.actionAt = 0;
  root.userData.seated = false;
  root.userData.animationState = null;
  root.userData.lastUpdateAt = 0;
  root.userData.isLux3dCharacter = true;

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((meshMaterial) => {
      meshMaterial.envMapIntensity = 0.72;
      if (meshMaterial.map) meshMaterial.map.colorSpace = THREE.SRGBColorSpace;
      meshMaterial.needsUpdate = true;
    });
  });

  if (self) {
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.014, 6, 48),
      new THREE.MeshBasicMaterial({ color: palette.gold, transparent: true, opacity: 0.7 }),
    );
    marker.position.y = 0.03;
    marker.rotation.x = Math.PI / 2;
    marker.name = "self-marker";
    root.add(marker);
    root.userData.selfMarker = marker;
  }

  const mixer = new THREE.AnimationMixer(model);
  const clipOrder = ["idle", "walk", "sitEnter", "sit", "sitExit"];
  const actions = {};
  clips.forEach((clip, index) => {
    const key = clipOrder[index];
    if (!key) return;
    actions[key] = mixer.clipAction(clip);
    if (key === "sitEnter" || key === "sitExit") {
      actions[key].setLoop(THREE.LoopOnce, 1);
      actions[key].clampWhenFinished = true;
    }
  });

  let skinnedMesh = null;
  const bones = {};
  model.traverse((child) => {
    if (!skinnedMesh && child.isSkinnedMesh) skinnedMesh = child;
    if (child.isBone) bones[child.name.replace(/^mixamorig:?/, "")] = child;
  });
  if (skinnedMesh && !skinnedMesh.name) skinnedMesh.name = "monk-skinned-mesh";
  const ritualClips = skinnedMesh ? createRigActionClips(skinnedMesh.name, bones) : {};
  const ritualActions = {};
  Object.entries(ritualClips).forEach(([name, ritualClip]) => {
    const ritualAction = mixer.clipAction(ritualClip);
    ritualAction.setLoop(THREE.LoopOnce, 1);
    ritualAction.clampWhenFinished = false;
    ritualAction.blendMode = THREE.AdditiveAnimationBlendMode;
    ritualActions[name] = ritualAction;
  });
  root.userData.rigActionNames = Object.keys(ritualActions);
  root.userData.rigTrackTargets = Object.values(ritualClips).flatMap((clip) => clip.tracks.map((track) => track.name));
  root.userData.activeRitualAction = null;
  root.userData.rigBoneCount = Object.keys(bones).length;

  const playState = (state, fade = 0.24) => {
    const next = actions[state] ?? actions.idle;
    if (!next || root.userData.animationState === state) return;
    const previous = actions[root.userData.animationState];
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(fade).play();
    previous?.fadeOut(fade);
    root.userData.animationState = state;
  };

  root.userData.setSeated = (seated) => {
    root.userData.seated = seated;
    playState(seated ? "sit" : root.userData.walking ? "walk" : "idle");
  };
  root.userData.perform = (action) => {
    const ritualAction = ritualActions[action];
    if (ritualAction) {
      root.userData.activeRitualAction?.stop();
      ritualAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.1).play();
      root.userData.activeRitualAction = ritualAction;
    }
    root.userData.action = action;
    root.userData.actionAt = performance.now() / 1000;
  };
  root.userData.update = (time) => {
    const delta = root.userData.lastUpdateAt ? Math.min(0.05, time - root.userData.lastUpdateAt) : 0;
    root.userData.lastUpdateAt = time;
    const { action, actionAt, seated, walking } = root.userData;
    const elapsed = Math.max(0, time - actionAt);
    const desiredState = action === "meditate" || seated ? "sit" : walking ? "walk" : "idle";
    playState(desiredState);
    mixer.update(delta);

    const duration = ACTION_LENGTH[action] ?? 2.2;

    root.position.y = root.userData.baseY + Math.sin(time * 1.35 + root.id) * 0.004;
    if (root.userData.selfMarker) root.userData.selfMarker.rotation.z = time * 0.12;
    if (action && elapsed > duration) {
      root.userData.action = null;
      root.userData.activeRitualAction = null;
    }
  };

  playState("idle", 0);
  return root;
}

export class TempleScene {
  constructor({ canvas, labels, onSeatSelected, onSeatUnavailable, onAssetProgress, onCourtyardStatus, onControlState, onViewChange }) {
    this.canvas = canvas;
    this.labelsRoot = labels;
    this.onSeatSelected = onSeatSelected;
    this.onSeatUnavailable = onSeatUnavailable;
    this.onAssetProgress = onAssetProgress;
    this.onCourtyardStatus = onCourtyardStatus;
    this.onControlState = onControlState;
    this.onViewChange = onViewChange;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101c1a);
    this.scene.fog = new THREE.FogExp2(0x263d37, 0.0155);
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 180);
    this.camera.position.set(0, 3.55, 43);
    this.cameraTarget = new THREE.Vector3(0, 2.75, 25.2);
    this.desiredCameraPosition = new THREE.Vector3();
    this.desiredCameraTarget = new THREE.Vector3();
    this.camera.lookAt(this.cameraTarget);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
    const lowPowerDevice = window.innerWidth < 720 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    this.pixelRatioCap = lowPowerDevice ? 1.25 : 1.75;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.pixelRatioCap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.36;
    this.renderer.localClippingEnabled = true;
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
    this.cameraPitch = 0.34;
    this.cameraPitchTarget = 0.34;
    this.cameraDistance = 5.2;
    this.cameraDistanceTarget = 5.2;
    this.orbitZoom = 1;
    this.orbitZoomTarget = 1;
    this.controlMode = "follow";
    this.walkableSurfaces = { gate: [], courtyard: [], hall: [] };
    this.lastFrameTime = 0;
    this.lastRenderAt = performance.now();
    this.frameTimes = [];
    this.frameCounter = 0;
    this.qualityAdjustments = 0;
    this.view = "gate";
    this.gateDoorCurrent = 0;
    this.gateDoorTarget = 0;
    this.gateCameraHold = null;
    this.entryJourney = null;
    this.entryCameraCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.55, 43),
      new THREE.Vector3(0, 3.2, 35),
      new THREE.Vector3(0, 2.75, 27.8),
      new THREE.Vector3(0.35, 2.55, 23.3),
      new THREE.Vector3(9.5, 4.65, 26.2),
    ], false, "catmullrom", 0.42);
    this.entryTargetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.8, 25.2),
      new THREE.Vector3(0, 2.75, 25.2),
      new THREE.Vector3(0, 2.45, 21.5),
      new THREE.Vector3(0, 2.15, 16.5),
      new THREE.Vector3(-1.2, 2.05, 13.6),
    ], false, "catmullrom", 0.42);
    this.hallJourney = null;
    this.hallCameraCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(9.5, 4.65, 26.2),
      new THREE.Vector3(7.3, 4.35, 22.6),
      new THREE.Vector3(4.7, 4.05, 19.2),
      new THREE.Vector3(2.45, 3.92, 17.5),
      new THREE.Vector3(0.94, 4.1, 15.97),
    ], false, "catmullrom", 0.42);
    this.hallTargetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 2.05, 13.6),
      new THREE.Vector3(-0.7, 2.15, 9.2),
      new THREE.Vector3(-0.35, 2.35, 4.8),
      new THREE.Vector3(-0.12, 2.58, 0.6),
      new THREE.Vector3(0, 2.75, -2.5),
    ], false, "catmullrom", 0.42);
    this.prayerBeadsTargetRotation = 0;
    this.woodenFishStrikeAt = -10;
    this.ambientMotions = [];
    this.seatVisuals = [];
    this.hallMaterials = [];
    this.hallClipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 4.6);
    this.hallDetails = new THREE.Group();
    this.hallDetails.name = "hall-only-details";
    this.scene.add(this.hallDetails);
    this.courtyardSlice = new THREE.Group();
    this.courtyardSlice.name = "lux3d-courtyard-slice";
    this.scene.add(this.courtyardSlice);

    this.#buildLights();
    this.#buildWorld();
    this.#buildWalkableSurfaces();
    const gateLanternReady = this.#loadGateLanterns();
    const templeReady = this.#buildTemple();
    this.#buildSeats();
    this.#seedBots();
    const characterReady = this.#loadMonkTemplate();
    this.ready = Promise.all([templeReady, characterReady, gateLanternReady]);
    this.#bindEvents();
    this.resize();
    this.animate();
  }

  setSelf(profile) {
    if (!this.self) {
      const monk = this.#createCharacter({ color: 0x9c724c, self: true });
      const spawn = {
        gate: [0, 0.16, 32.2],
        courtyard: [0, 0.16, 14.6],
        hall: [0, 0.68, 8.1],
      }[this.view];
      monk.position.set(...spawn);
      monk.userData.baseY = spawn[1];
      monk.rotation.y = Math.PI;
      this.scene.add(monk);
      this.self = monk;
      monk.visible = true;
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
        monk = this.#createCharacter({ color: peer.color ?? 0x6f8a6e });
        monk.position.set((Math.random() - 0.5) * 3, 0.04, 8.2 + Math.random());
        monk.rotation.y = Math.PI;
        this.scene.add(monk);
        monk.visible = this.view === "hall";
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
    if (monk === this.self && this.getControlState().cameraMode === "first") {
      this.cameraDistance = 1.4;
      this.cameraDistanceTarget = 5.2;
      this.cameraPitchTarget = 0.34;
      this.controlMode = "follow";
      this.#emitControlState();
    }
    if (monk?.userData.walking) {
      monk.userData.walking = false;
      monk.userData.walkTarget = null;
      monk.userData.walkQueue = [];
      if (monk === this.self && this.walkMarker) this.walkMarker.visible = false;
    }
    monk?.userData.perform(action);
    if (action === "moktak") this.strikeWoodenFish();
  }

  turnPrayerBeads() {
    this.prayerBeadsTargetRotation += TAU / 18;
  }

  strikeWoodenFish() {
    this.woodenFishStrikeAt = this.clock.getElapsedTime();
  }

  setGateOpen(open) {
    this.gateDoorTarget = open ? 1 : 0;
  }

  getControlState() {
    const distance = this.cameraDistanceTarget;
    const cameraMode = distance < 1.35 ? "first" : distance < 7.2 ? "third" : "overview";
    return { controlMode: this.controlMode, cameraMode, cameraDistance: Number(distance.toFixed(2)) };
  }

  toggleControlMode() {
    this.controlMode = this.controlMode === "follow" ? "orbit" : "follow";
    if (this.controlMode === "follow") this.cameraYaw = 0;
    this.#emitControlState();
    return this.getControlState();
  }

  cycleCameraMode() {
    const presets = { first: { distance: 0.72, pitch: 0.08 }, third: { distance: 5.2, pitch: 0.34 }, overview: { distance: 10.5, pitch: 0.62 } };
    const order = ["first", "third", "overview"];
    const current = this.getControlState().cameraMode;
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.cameraDistanceTarget = presets[next].distance;
    this.cameraPitchTarget = presets[next].pitch;
    this.controlMode = "follow";
    this.#emitControlState();
    return this.getControlState();
  }

  #emitControlState() {
    this.onControlState?.(this.getControlState());
  }

  setView(view, { continuous = false } = {}) {
    if (!["gate", "courtyard", "hall"].includes(view)) return;
    const previousView = this.view;
    this.view = view;
    this.setGateOpen(view !== "gate");
    this.entryJourney = !continuous && previousView === "gate" && view === "courtyard"
      ? { startedAt: this.clock.getElapsedTime(), duration: 6.4 }
      : null;
    this.hallJourney = !continuous && previousView === "courtyard" && view === "hall"
      ? { startedAt: this.clock.getElapsedTime(), duration: 5.4 }
      : null;
    this.gateCameraHold = !continuous && previousView !== "gate" && view === "gate"
      ? { startedAt: this.clock.getElapsedTime(), maxDuration: 12 }
      : null;
    if (!continuous) this.cameraYaw = 0;
    if (this.walkMarker) this.walkMarker.visible = false;
    this.renderer.shadowMap.enabled = true;
    const atmosphere = {
      gate: { background: 0x071018, fog: 0x183039, density: 0.0138, exposure: 1.24, moon: 3.35, warm: 0.5, hemi: 0.9, gateFill: 18, forecourtMoon: 4.8, incenseBounce: 0.8 },
      courtyard: { background: 0x060d16, fog: 0x18313a, density: 0.0118, exposure: 1.22, moon: 3.05, warm: 0.72, hemi: 0.86, gateFill: 6, forecourtMoon: 13.5, incenseBounce: 3.6 },
      hall: { background: 0x130e0a, fog: 0x32271e, density: 0.0085, exposure: 1.12, moon: 0.82, warm: 1.58, hemi: 0.48, gateFill: 0, forecourtMoon: 7.5, incenseBounce: 4.2 },
    }[view];
    this.atmosphereTarget = {
      ...atmosphere,
      backgroundColor: new THREE.Color(atmosphere.background),
      fogColor: new THREE.Color(atmosphere.fog),
    };
    if (!continuous) this.#updateAtmosphere(true);
    if (view === "gate" || view === "courtyard") this.#ensureCourtyardSlice();
    this.#applyViewVisibility();
    for (const monk of this.characters.values()) {
      monk.visible = monk === this.self || view === "hall";
      monk.traverse((child) => {
        if (child.isMesh) child.castShadow = view === "hall";
      });
    }
    if (!continuous && this.self && this.self.userData.targetSeat == null) {
      const destination = {
        gate: [0, 0.16, 30.4],
        courtyard: [0, 0.16, 14.6],
        hall: [0, 0.68, 8.1],
      }[view];
      this.self.userData.walkTarget = new THREE.Vector3(...destination);
      this.self.userData.walking = true;
      this.self.userData.setSeated(false);
    }
    if (continuous && previousView !== view) this.onViewChange?.(view, previousView);
  }

  #updateAtmosphere(immediate = false) {
    const target = this.atmosphereTarget;
    if (!target) return;
    const amount = immediate ? 1 : 0.035;
    this.scene.background.lerp(target.backgroundColor, amount);
    this.scene.fog.color.lerp(target.fogColor, amount);
    this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, target.density, amount);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, target.exposure, amount);
    if (!this.lighting) return;
    this.lighting.moon.intensity = THREE.MathUtils.lerp(this.lighting.moon.intensity, target.moon, amount);
    this.lighting.warmKey.intensity = THREE.MathUtils.lerp(this.lighting.warmKey.intensity, target.warm, amount);
    this.lighting.hemi.intensity = THREE.MathUtils.lerp(this.lighting.hemi.intensity, target.hemi, amount);
    this.lighting.gateFill.intensity = THREE.MathUtils.lerp(this.lighting.gateFill.intensity, target.gateFill, amount);
    this.lighting.forecourtMoon.intensity = THREE.MathUtils.lerp(this.lighting.forecourtMoon.intensity, target.forecourtMoon, amount);
    this.lighting.incenseBounce.intensity = THREE.MathUtils.lerp(this.lighting.incenseBounce.intensity, target.incenseBounce, amount);
  }

  #ensureCourtyardSlice() {
    if (this.courtyardLoadPromise) return this.courtyardLoadPromise;
    this.courtyardLoadPromise = loadCourtyardSlice({
      parent: this.courtyardSlice,
      renderer: this.renderer,
      onStatus: this.onCourtyardStatus,
    }).then((result) => {
      this.#applyViewVisibility();
      return result;
    });
    return this.courtyardLoadPromise;
  }

  #applyViewVisibility() {
    const inHall = this.view === "hall";
    const keepBuddhaSightlineClear = this.view === "courtyard" || inHall;
    this.hallDetails.visible = true;
    this.hallMaterials.forEach((hallMaterial) => {
      hallMaterial.clippingPlanes = inHall ? [this.hallClipPlane] : null;
      hallMaterial.userData.yunqiAltarCutoutEnabled = keepBuddhaSightlineClear ? 1 : 0;
      if (hallMaterial.userData.yunqiAltarCutoutUniform) {
        hallMaterial.userData.yunqiAltarCutoutUniform.value = keepBuddhaSightlineClear ? 1 : 0;
      }
      hallMaterial.needsUpdate = true;
    });
    for (const child of this.courtyardSlice.children) {
      if (child.name === "prop-006-instances") {
        child.visible = false;
        continue;
      }
      child.visible = true;
    }
    this.#refreshSeats();
  }

  leaveSeat() {
    if (!this.self) return;
    this.self.userData.targetSeat = null;
    this.self.userData.setSeated(false);
    this.self.position.set(0, 0.68, 8.1);
    this.self.userData.baseY = 0.68;
    this.self.rotation.y = Math.PI;
    if (this.walkMarker) this.walkMarker.visible = false;
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

  getDiagnostics() {
    const samples = [...this.frameTimes].sort((a, b) => a - b);
    const averageFrameMs = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
    const sampleCharacter = this.characters.values().next().value;
    const sampleBounds = sampleCharacter ? new THREE.Box3().setFromObject(sampleCharacter) : null;
    const sampleSize = sampleBounds?.getSize(new THREE.Vector3());
    const controlState = this.getControlState();
    return {
      view: this.view,
      controlMode: controlState.controlMode,
      cameraMode: controlState.cameraMode,
      cameraDistance: controlState.cameraDistance,
      playerPosition: this.self ? this.self.position.toArray().map((value) => Number(value.toFixed(2))) : null,
      samples: samples.length,
      averageFrameMs: Number(averageFrameMs.toFixed(2)),
      estimatedFps: averageFrameMs ? Number((1000 / averageFrameMs).toFixed(1)) : 0,
      p95FrameMs: samples.length ? Number(samples[Math.floor((samples.length - 1) * 0.95)].toFixed(2)) : 0,
      pixelRatio: Number(this.renderer.getPixelRatio().toFixed(2)),
      qualityAdjustments: this.qualityAdjustments,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      courtyardAssets: this.courtyardSlice.children.length,
      roofOverlay: Boolean(this.roofModel),
      gateDoors: Boolean(this.gateDoorLeaves?.length === 2),
      gateDoorOpen: Number(this.gateDoorCurrent.toFixed(2)),
      gateNodeNames: this.gateNodeNames ?? [],
      gateThresholdObstructionTriangles: this.gateThresholdObstructionTriangles ?? 0,
      prayerBeads: Boolean(this.prayerBeadsModel),
      woodenFish: Boolean(this.woodenFishModel),
      muralBackdrop: Boolean(this.hallMural),
      moonDisc: Boolean(this.scene.getObjectByName("night-moon-disc")),
      moonReflection: Boolean(this.scene.getObjectByName("pond-moon-reflection")),
      gateLanterns: this.scene.getObjectByName("gate-lantern-pair")?.children.length ?? 0,
      gateLanternSource: this.gateLanternSource ?? "procedural",
      gateLanternLighting: this.gateLanternPair?.children.map((hanger) => ({
        hanger: hanger.position.toArray().map((value) => Number(value.toFixed(2))),
        pointIntensity: hanger.userData.baseIntensity ?? 0,
        facadeIntensity: hanger.userData.baseFacadeIntensity ?? 0,
      })) ?? [],
      characters: this.characters.size,
      animatedCharacters: [...this.characters.values()].filter((character) => character.userData.isLux3dCharacter).length,
      seatVisuals: this.seatVisuals.length,
      sampleCharacter: sampleCharacter ? {
        visible: sampleCharacter.visible,
        position: sampleCharacter.position.toArray().map((value) => Number(value.toFixed(2))),
        size: sampleSize.toArray().map((value) => Number(value.toFixed(2))),
        rigBoneCount: sampleCharacter.userData.rigBoneCount ?? 0,
        rigActions: sampleCharacter.userData.rigActionNames ?? [],
        rigTrackTargets: sampleCharacter.userData.rigTrackTargets?.slice(0, 6) ?? [],
      } : null,
    };
  }

  #buildLights() {
    const hemi = new THREE.HemisphereLight(0x8daac9, 0x100d0a, 0.92);
    this.scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xb8d2f2, 2.95);
    moon.position.set(-18, 24, -14);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -24;
    moon.shadow.camera.right = 24;
    moon.shadow.camera.top = 28;
    moon.shadow.camera.bottom = -20;
    moon.shadow.bias = -0.00025;
    moon.shadow.normalBias = 0.025;
    this.scene.add(moon);

    const moonBounce = new THREE.DirectionalLight(0x6686aa, 0.34);
    moonBounce.position.set(16, 7, 16);
    this.scene.add(moonBounce);

    const altarGlow = new THREE.PointLight(0xffc46b, 6.5, 16, 2);
    altarGlow.position.set(0, 4, -7.2);
    this.hallDetails.add(altarGlow);

    const warmKey = new THREE.DirectionalLight(0xffd1a0, 0.45);
    warmKey.position.set(7, 11, 9);
    this.scene.add(warmKey);

    const gateFill = new THREE.SpotLight(0xffdfbd, 16, 27, Math.PI / 4.2, 0.78, 1.7);
    gateFill.position.set(5.5, 8.5, 37);
    gateFill.target.position.set(0, 2.7, 25.2);
    gateFill.castShadow = false;
    this.scene.add(gateFill, gateFill.target);

    // The main-hall eaves block the global moon key around the forecourt.
    // A broad, shadowless fill keeps the incense burner and steps readable
    // without flattening the surrounding night scene.
    const forecourtMoon = new THREE.SpotLight(0xaecbf2, 4.8, 24, Math.PI / 4.4, 0.88, 1.55);
    forecourtMoon.position.set(-6.8, 11.5, 14.8);
    forecourtMoon.target.position.set(0, 0.95, 6.6);
    forecourtMoon.castShadow = false;
    this.scene.add(forecourtMoon, forecourtMoon.target);

    const incenseBounce = new THREE.PointLight(0xd9ad72, 0.8, 8.5, 2);
    incenseBounce.position.set(0, 2.35, 7.15);
    this.scene.add(incenseBounce);

    const statueKey = new THREE.SpotLight(0xffd28a, 18, 15, Math.PI / 6, 0.68, 1.45);
    statueKey.position.set(-2.6, 5.7, -3.8);
    statueKey.target.position.set(0, 3.75, -7.3);
    statueKey.castShadow = false;
    this.hallDetails.add(statueKey, statueKey.target);

    const statueFill = new THREE.PointLight(0xffb95a, 8, 9, 1.8);
    statueFill.position.set(2.6, 4.8, -4.8);
    this.hallDetails.add(statueFill);

    [[-4.8, 3.3, -2.2], [4.8, 3.3, -2.2], [-4.8, 3.1, 4.3], [4.8, 3.1, 4.3]].forEach((position) => {
      const glow = new THREE.PointLight(0xffb86b, 2.4, 7.5, 2);
      glow.position.set(...position);
      this.hallDetails.add(glow);
    });
    const pondMoonGlow = new THREE.PointLight(0x9fc4e1, 4.2, 13, 2.25);
    pondMoonGlow.position.set(8.2, 1.15, 14.2);
    this.scene.add(pondMoonGlow);

    this.lighting = { hemi, moon, moonBounce, warmKey, gateFill, forecourtMoon, incenseBounce, altarGlow, statueKey, statueFill, pondMoonGlow };
  }

  #buildWorld() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(82, 96),
      material(0x111b17, { roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(createMountainRing());

    const mountainMist = createMistField({
      count: 92, width: 118, depth: 94, height: 14, center: [0, 1.5, -4], size: 10.5, opacity: 0.065, color: 0xb9cdc6,
    });
    this.scene.add(mountainMist);
    this.ambientMotions.push({ object: mountainMist, kind: "mist", phase: 0.8 });

    const forestMist = createMistField({
      count: 110, width: 50, depth: 44, height: 4.3, center: [0, 0.22, 17], size: 4.8, opacity: 0.1, color: 0xc6d5ce,
    });
    this.scene.add(forestMist);
    this.ambientMotions.push({ object: forestMist, kind: "mist", phase: 2.4 });

    const shafts = new THREE.Group();
    shafts.name = "mountain-light-shafts";
    shafts.add(createLightShaft({ color: 0xc9e9dd, opacity: 0.035, radius: 6.2, height: 33, position: [-12, 13, 19], rotation: [0.12, 0, -0.34] }));
    shafts.add(createLightShaft({ color: 0xffd89a, opacity: 0.028, radius: 4.8, height: 27, position: [10, 11, 9], rotation: [-0.1, 0, 0.3] }));
    this.scene.add(shafts);

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
      new THREE.PointsMaterial({
        color: 0xc8e2d8,
        map: createSoftParticleTexture(),
        size: 0.075,
        transparent: true,
        opacity: 0.36,
        alphaTest: 0.025,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.scene.add(stars);

    const moonTexture = createMoonTexture();
    const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moonTexture,
      color: 0xa9d4e3,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    }));
    moonGlow.name = "night-moon-glow";
    moonGlow.position.set(-22, 21, -18);
    moonGlow.scale.set(11.5, 11.5, 1);
    this.scene.add(moonGlow);
    const moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moonTexture,
      color: 0xe7efe8,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }));
    moonDisc.name = "night-moon-disc";
    moonDisc.position.copy(moonGlow.position);
    moonDisc.scale.set(4.2, 4.2, 1);
    this.scene.add(moonDisc);
    this.ambientMotions.push({ object: moonGlow, kind: "moonGlow", phase: 0.4 });

    const courtyard = new THREE.Group();
    courtyard.name = "cloud-courtyard";
    this.scene.add(courtyard);

    const courtyardGround = box(30.8, 0.14, 34.5, material(0x27312b, { roughness: 1, metalness: 0 }), [0, -0.035, 16.3]);
    courtyardGround.name = "courtyard-weathered-ground";
    courtyardGround.receiveShadow = true;
    courtyard.add(courtyardGround);

    const mossGeometry = new THREE.CircleGeometry(1, 18);
    const mossMaterial = new THREE.MeshStandardMaterial({
      color: 0x304a36,
      alphaMap: createMossPatchTexture(),
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    });
    const mossPatches = new THREE.InstancedMesh(mossGeometry, mossMaterial, 30);
    mossPatches.name = "courtyard-moss-patches";
    const mossTransform = new THREE.Object3D();
    for (let index = 0; index < 30; index += 1) {
      const side = index % 2 ? -1 : 1;
      mossTransform.position.set(side * (4.5 + (index % 6) * 1.6), 0.041, 3 + ((index * 3.7) % 27));
      mossTransform.rotation.set(-Math.PI / 2, 0, Math.sin(index * 1.7) * 0.9);
      mossTransform.scale.set(0.45 + (index % 4) * 0.22, 0.3 + (index % 5) * 0.13, 1);
      mossTransform.updateMatrix();
      mossPatches.setMatrixAt(index, mossTransform.matrix);
    }
    mossPatches.instanceMatrix.needsUpdate = true;
    courtyard.add(mossPatches);

    const pathMats = [material(0x3b433e), material(0x454b45), material(0x313a35), material(0x4b5049)];
    const crackMaterial = material(0x1d2521, { roughness: 1, metalness: 0 });
    for (let index = 0; index < 24; index += 1) {
      const z = 9.65 + index * 1.07 + Math.sin(index * 1.37) * 0.055;
      const width = 3.15 + (index % 5) * 0.16;
      const depth = 0.66 + (index % 4) * 0.055;
      const height = 0.09 + (index % 3) * 0.018;
      const x = Math.sin(index * 1.7) * 0.2;
      const slab = box(width, height, depth, pathMats[index % pathMats.length], [x, 0.055 + height / 2, z]);
      slab.rotation.y = Math.sin(index * 2.3) * 0.052;
      courtyard.add(slab);
      if (index % 3 === 1) {
        const crack = box(width * 0.38, 0.008, 0.018, crackMaterial, [x + Math.sin(index) * 0.25, 0.111 + height / 2, z]);
        crack.rotation.y = slab.rotation.y + 0.28 + (index % 2) * 0.45;
        crack.castShadow = false;
        courtyard.add(crack);
      }
    }

    const waterNormalTexture = createWaterNormalTexture();
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a2830,
      emissive: 0x03191e,
      emissiveIntensity: 0.2,
      roughness: 0.1,
      metalness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      transmission: 0.18,
      thickness: 0.48,
      ior: 1.333,
      normalMap: waterNormalTexture,
      normalScale: new THREE.Vector2(0.34, 0.24),
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });
    [1].forEach((side) => {
      const pond = new THREE.Mesh(new THREE.CircleGeometry(3.3, 48), waterMat.clone());
      pond.rotation.x = -Math.PI / 2;
      pond.scale.set(1.65, 1, 0.72);
      pond.position.set(side * 8.6, 0.055, 14.5);
      courtyard.add(pond);
      this.ambientMotions.push({ object: pond, kind: "water", phase: side });

      const moonReflection = new THREE.Mesh(
        new THREE.PlaneGeometry(2.45, 4.25, 1, 1),
        createMoonReflectionMaterial(),
      );
      moonReflection.name = "pond-moon-reflection";
      moonReflection.rotation.x = -Math.PI / 2;
      moonReflection.rotation.z = -0.18;
      moonReflection.position.set(side * 8.6 - 0.72, 0.086, 14.35);
      courtyard.add(moonReflection);
      this.ambientMotions.push({ object: moonReflection, kind: "moonReflection", phase: side * 0.7 });

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(3.3, 0.12, 6, 48),
        material(0x2f3c36, { roughness: 1 }),
      );
      rim.rotation.x = Math.PI / 2;
      rim.scale.set(1.65, 0.72, 1);
      rim.position.copy(pond.position);
      courtyard.add(rim);

      const shoreStoneGeometry = new THREE.DodecahedronGeometry(0.32, 0);
      const shoreStoneMaterial = material(0x4a5048, { roughness: 1, metalness: 0 });
      const shoreStones = new THREE.InstancedMesh(shoreStoneGeometry, shoreStoneMaterial, 34);
      const stoneTransform = new THREE.Object3D();
      for (let index = 0; index < 34; index += 1) {
        const angle = (index / 34) * TAU;
        stoneTransform.position.set(
          side * 8.6 + Math.cos(angle) * 5.55,
          0.13 + (index % 3) * 0.015,
          14.5 + Math.sin(angle) * 2.55,
        );
        stoneTransform.rotation.set(index * 0.31, angle, index * 0.17);
        stoneTransform.scale.set(0.7 + (index % 4) * 0.12, 0.42 + (index % 3) * 0.08, 0.65 + (index % 5) * 0.09);
        stoneTransform.updateMatrix();
        shoreStones.setMatrixAt(index, stoneTransform.matrix);
      }
      shoreStones.instanceMatrix.needsUpdate = true;
      shoreStones.castShadow = true;
      shoreStones.receiveShadow = true;
      courtyard.add(shoreStones);

      for (let rippleIndex = 0; rippleIndex < 3; rippleIndex += 1) {
        const ripple = new THREE.Mesh(
          new THREE.RingGeometry(0.72 + rippleIndex * 0.38, 0.735 + rippleIndex * 0.38, 48),
          new THREE.MeshBasicMaterial({ color: 0xb5d6cc, transparent: true, opacity: 0.12 - rippleIndex * 0.02, depthWrite: false, side: THREE.DoubleSide }),
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.scale.x = 1.65;
        ripple.position.set(side * 8.6 + 0.7, 0.075 + rippleIndex * 0.002, 14.3);
        courtyard.add(ripple);
        this.ambientMotions.push({ object: ripple, kind: "waterRipple", phase: rippleIndex * 1.7 });
      }
    });

    [[-7.6, 28, 0.95], [13, 26.8, 1.02]].forEach(([x, z, scale]) => {
      const bamboo = createBambooCluster(scale);
      bamboo.position.set(x, 0, z);
      bamboo.rotation.y = x * 0.17;
      courtyard.add(bamboo);
    });

    [15.8, 29].forEach((z, index) => {
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
      new THREE.PointsMaterial({
        color: 0xc8ffe9,
        map: createSoftParticleTexture(),
        size: 0.115,
        transparent: true,
        opacity: 0.58,
        alphaTest: 0.02,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
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

    const gateLanternPair = new THREE.Group();
    gateLanternPair.name = "gate-lantern-pair";
    this.gateLanternSource = "procedural";
    [-1, 1].forEach((side, index) => {
      const lantern = createGateHangingLantern(side);
      lantern.position.set(side * 3.1, 5.41, 27.78);
      lantern.rotation.y = side * -0.08;
      gateLanternPair.add(lantern);
      this.ambientMotions.push({ object: lantern, kind: "gateLantern", phase: index * 2.7 });
    });
    this.scene.add(gateLanternPair);
    this.gateLanternPair = gateLanternPair;
  }

  #loadGateLanterns() {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(
        GATE_LANTERN_MODEL_URL,
        (gltf) => {
          const template = gltf.scene;
          const rawBounds = new THREE.Box3().setFromObject(template);
          const rawSize = rawBounds.getSize(new THREE.Vector3());
          const rawCenter = rawBounds.getCenter(new THREE.Vector3());
          const targetHeight = 0.82;
          const scale = targetHeight / Math.max(rawSize.y, 0.001);

          this.gateLanternPair?.children.forEach((hanger, index) => {
            const model = template.clone(true);
            model.name = `lux3d-gate-lantern-${index === 0 ? "left" : "right"}`;
            model.scale.setScalar(scale);
            model.position.set(-rawCenter.x * scale, -1.16 - rawCenter.y * scale, -rawCenter.z * scale);
            model.traverse((child) => {
              if (!child.isMesh) return;
              child.castShadow = false;
              child.receiveShadow = true;
              child.material = child.material.clone();
              child.material.envMapIntensity = 0.88;
              child.material.roughness = Math.max(child.material.roughness ?? 0, 0.58);
              if (child.material.map) {
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                child.material.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
              }
              child.material.needsUpdate = true;
            });
            hanger.add(model);
            const fallback = hanger.getObjectByName("gate-lantern-procedural-fallback");
            if (fallback) fallback.visible = false;
          });
          this.gateLanternSource = "lux3d-prop-014";
          resolve({ source: "lux3d", dimensions: rawSize.multiplyScalar(scale) });
        },
        undefined,
        (error) => {
          console.warn("Lux3D gate lantern could not be loaded; keeping procedural lantern fallback.", error);
          resolve({ source: "fallback" });
        },
      );
    });
  }

  #buildWalkableSurfaces() {
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
      side: THREE.DoubleSide,
    });
    const addSurface = (view, width, depth, x, z, y = 0.045) => {
      const surface = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
      surface.name = `walkable-${view}-${this.walkableSurfaces[view].length + 1}`;
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(x, y, z);
      surface.userData.walkY = y;
      this.walkableSurfaces[view].push(surface);
      this.scene.add(surface);
    };

    addSurface("gate", 6.8, 16.5, 0, 35.7, 0.16);
    addSurface("courtyard", 7.2, 27, 0, 17.2, 0.16);
    addSurface("courtyard", 12.8, 7.2, -4.2, 22.3, 0.05);
    addSurface("courtyard", 6.4, 8.2, -7.2, 10.3, 0.05);
    addSurface("hall", 14.2, 14.4, 0, 1.1, 0.68);

    this.walkMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.31, 36),
      new THREE.MeshBasicMaterial({ color: 0x8cf2c8, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.walkMarker.name = "walk-destination-marker";
    this.walkMarker.rotation.x = -Math.PI / 2;
    this.walkMarker.visible = false;
    this.walkMarker.renderOrder = 5;
    this.scene.add(this.walkMarker);
  }

  #moveSelfTo(point) {
    if (!this.self || this.self.userData.targetSeat != null) return false;
    const finalTarget = point.clone();
    finalTarget.y = point.y;
    if (finalTarget.z < 29.2) this.setGateOpen(true);
    const entersHallOnCenterline = this.self.position.z > 9.2 && finalTarget.z < 6.4 && Math.abs(finalTarget.x) < 1.35;
    if (entersHallOnCenterline) {
      const aisleX = this.self.position.x <= 0 ? -1.72 : 1.72;
      this.self.userData.walkTarget = new THREE.Vector3(aisleX, 0.68, 8.45);
      this.self.userData.walkQueue = [
        new THREE.Vector3(aisleX, 0.68, 5.2),
        finalTarget,
      ];
    } else {
      this.self.userData.walkTarget = finalTarget;
      this.self.userData.walkQueue = [];
    }
    this.self.userData.walking = true;
    this.self.userData.setSeated(false);
    this.walkMarker.position.set(finalTarget.x, finalTarget.y + 0.035, finalTarget.z);
    this.walkMarker.scale.setScalar(0.78);
    this.walkMarker.material.opacity = 0.74;
    this.walkMarker.visible = true;
    return true;
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
    const altarPlatform = box(5.4, 0.65, 3.6, material(0x394039, { roughness: 0.96, metalness: 0 }), [0, 0.95, -7.3]);
    this.hallDetails.add(altarPlatform);

    const muralGroup = new THREE.Group();
    muralGroup.name = "hall-mythic-mural-backdrop";
    const muralWall = box(10.9, 6.7, 0.3, material(0x514e43, { roughness: 0.98, metalness: 0 }), [0, 3.7, -9.56]);
    muralWall.castShadow = false;
    const muralTexture = new THREE.TextureLoader().load(HALL_MURAL_URL);
    muralTexture.colorSpace = THREE.SRGBColorSpace;
    muralTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const mural = new THREE.Mesh(
      new THREE.PlaneGeometry(10.4, 5.4),
      new THREE.MeshStandardMaterial({
        map: muralTexture,
        bumpMap: createPlasterBumpTexture(),
        bumpScale: 0.055,
        color: 0xa69a82,
        roughness: 0.98,
        metalness: 0,
        emissive: 0x0e0a06,
        emissiveIntensity: 0.07,
      }),
    );
    mural.position.set(0, 4.05, -9.38);
    mural.receiveShadow = true;
    const frameMaterial = material(0x3b2c22, { roughness: 0.96, metalness: 0.01 });
    const frameTop = box(10.68, 0.24, 0.24, frameMaterial, [0, 6.89, -9.31]);
    const frameBottom = box(10.68, 0.24, 0.24, frameMaterial, [0, 1.22, -9.31]);
    const frameLeft = box(0.24, 5.9, 0.24, frameMaterial, [-5.32, 4.05, -9.31]);
    const frameRight = box(0.24, 5.9, 0.24, frameMaterial, [5.32, 4.05, -9.31]);
    muralGroup.add(muralWall, mural, frameTop, frameBottom, frameLeft, frameRight);
    this.hallDetails.add(muralGroup);
    this.hallMural = mural;

    const buddhaShadow = createContactShadow(5.05, 3.15, 0.3);
    buddhaShadow.position.set(0, 1.286, -7.3);
    buddhaShadow.name = "buddha-contact-shadow";
    this.hallDetails.add(buddhaShadow);

    const incenseShadow = createContactShadow(2.15, 1.5, 0.22);
    incenseShadow.position.set(0, 0.652, 6.6);
    incenseShadow.name = "incense-contact-shadow";
    this.hallDetails.add(incenseShadow);

    const incenseSmoke = createIncenseSmoke();
    incenseSmoke.position.set(0, 1.6, 6.6);
    incenseSmoke.name = "hall-incense-smoke";
    this.hallDetails.add(incenseSmoke);
    this.incenseSmoke = incenseSmoke;

    const smokeWisps = createSmokeWisps();
    smokeWisps.position.set(0, 1.72, 6.6);
    smokeWisps.name = "hall-incense-wisps";
    this.hallDetails.add(smokeWisps);
    this.smokeWisps = smokeWisps;

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
    core.position.set(0, 4.15, -8.98);
    core.userData.spin = true;
    this.hallDetails.add(core);
    this.core = core;
    this.coreFallback = orb;

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
              meshMaterial.clippingPlanes = this.view === "hall" ? [this.hallClipPlane] : null;
              installHallAltarCutout(meshMaterial, this.view === "hall");
              this.hallMaterials.push(meshMaterial);
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
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        GATE_MODEL_URL,
        (gltf) => {
          const model = gltf.scene;
          const rawBounds = new THREE.Box3().setFromObject(model);
          const rawSize = rawBounds.getSize(new THREE.Vector3());
          const rawCenter = rawBounds.getCenter(new THREE.Vector3());
          const normalizedNodeName = (node) => node.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          this.gateNodeNames = [];
          model.traverse((child) => {
            if (child.name) this.gateNodeNames.push(child.name);
          });
          const findGateDoor = (side) => {
            let match = null;
            const expected = `gatedoor${side}`;
            model.traverse((child) => {
              if (!match && normalizedNodeName(child) === expected) match = child;
            });
            return match;
          };
          const gateDoorLeaves = [findGateDoor("left"), findGateDoor("right")].filter(Boolean);
          const gateFixedBuilding = model.getObjectByName("gate-building-fixed");
          const gateFloorPlatform = model.getObjectByName("gate-floor-platform");
          this.gateThresholdObstructionTriangles = 0;
          if (gateFixedBuilding) {
            gateFixedBuilding.traverse((child) => {
              if (child.isMesh) this.gateThresholdObstructionTriangles += removeGateThresholdObstruction(child);
            });
          }
          if (gateFloorPlatform) gateFloorPlatform.scale.x = 0.69;
          const targetGateSize = new THREE.Vector3(9.25, 6.9, 4.4);
          const scale = new THREE.Vector3(
            targetGateSize.x / Math.max(rawSize.x, 0.001),
            targetGateSize.y / Math.max(rawSize.y, 0.001),
            targetGateSize.z / Math.max(rawSize.z, 0.001),
          );

          model.scale.copy(scale);
          model.position.set(
            -rawCenter.x * scale.x,
            0.035 - rawBounds.min.y * scale.y,
            25.2 - rawCenter.z * scale.z,
          );
          model.name = "lux3d-integrated-ancient-gate";
          const weatheredMaterials = new Set();
          model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((meshMaterial) => {
              if (weatheredMaterials.has(meshMaterial)) return;
              weatheredMaterials.add(meshMaterial);
              meshMaterial.color?.multiply(new THREE.Color(0xb2a995));
              meshMaterial.envMapIntensity = 0.46;
              meshMaterial.roughness = Math.max(meshMaterial.roughness ?? 0, 0.74);
              meshMaterial.metalness = Math.min(meshMaterial.metalness ?? 0, 0.08);
              if (meshMaterial.map) {
                meshMaterial.map.colorSpace = THREE.SRGBColorSpace;
                meshMaterial.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
              }
              meshMaterial.needsUpdate = true;
            });
          });

          this.scene.add(model);
          this.gateModel = model;
          this.gateDoorLeaves = gateDoorLeaves.length === 2 ? gateDoorLeaves : null;
          this.gateFallback.visible = false;
          this.onAssetProgress?.(1);
          resolve({ source: "lux3d-integrated", dimensions: targetGateSize, doors: gateDoorLeaves.length });
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

    const roofPromise = new Promise((resolve) => {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        HALL_ROOF_MODEL_URL,
        (gltf) => {
          const model = gltf.scene;
          const rawBounds = new THREE.Box3().setFromObject(model);
          const rawSize = rawBounds.getSize(new THREE.Vector3());
          const rawCenter = rawBounds.getCenter(new THREE.Vector3());
          const scale = new THREE.Vector3(
            16.8 / Math.max(rawSize.x, 0.001),
            3.0 / Math.max(rawSize.y, 0.001),
            18.4 / Math.max(rawSize.z, 0.001),
          );

          model.scale.copy(scale);
          model.position.set(-rawCenter.x * scale.x, 7.02 - rawBounds.min.y * scale.y, -0.8 - rawCenter.z * scale.z);
          model.name = "lux3d-closed-hall-roof";
          model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((meshMaterial) => {
              meshMaterial.envMapIntensity = 0.7;
              meshMaterial.clippingPlanes = this.view === "hall" ? [this.hallClipPlane] : null;
              installHallAltarCutout(meshMaterial, this.view === "hall");
              this.hallMaterials.push(meshMaterial);
              if (meshMaterial.color) meshMaterial.color.multiply(new THREE.Color(0x5f7d72));
              if (meshMaterial.map) {
                meshMaterial.map.colorSpace = THREE.SRGBColorSpace;
                meshMaterial.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
              }
              meshMaterial.needsUpdate = true;
            });
          });

          this.scene.add(model);
          this.roofModel = model;
          resolve({ source: "lux3d", dimensions: new THREE.Vector3(16.8, 3, 18.4) });
        },
        undefined,
        (error) => {
          console.warn("Lux3D closed hall roof could not be loaded; keeping the original hall roof.", error);
          resolve({ source: "fallback" });
        },
      );
    });

    const buddhaPromise = new Promise((resolve) => {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        BUDDHA_MODEL_URL,
        (gltf) => {
          const model = gltf.scene;
          const rawBounds = new THREE.Box3().setFromObject(model);
          const rawSize = rawBounds.getSize(new THREE.Vector3());
          const rawCenter = rawBounds.getCenter(new THREE.Vector3());
          const scale = 4.65 / Math.max(rawSize.y, 0.001);

          model.scale.setScalar(scale);
          model.position.set(-rawCenter.x * scale, 1.275 - rawBounds.min.y * scale, -7.3 - rawCenter.z * scale);
          model.name = "lux3d-hall-buddha";
          model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((meshMaterial) => {
              meshMaterial.map = null;
              meshMaterial.color?.setHex(0xc9933b);
              meshMaterial.metalness = 0.82;
              meshMaterial.roughness = 0.36;
              meshMaterial.envMapIntensity = 1.05;
              if (meshMaterial.emissive) {
                meshMaterial.emissive.setHex(0x211205);
                meshMaterial.emissiveIntensity = 0.055;
              }
              meshMaterial.needsUpdate = true;
            });
          });

          this.hallDetails.add(model);
          this.buddhaModel = model;
          this.core.visible = false;
          resolve({ source: "lux3d", dimensions: rawSize.multiplyScalar(scale) });
        },
        undefined,
        (error) => {
          console.warn("Lux3D hall Buddha could not be loaded; keeping abstract ritual core fallback.", error);
          resolve({ source: "fallback" });
        },
      );
    });

    const doorPromise = Promise.resolve({ source: "integrated-gate", leaves: 2 });

    const beadsPromise = Promise.resolve({ source: "preview-only" });
    const woodenFishPromise = Promise.resolve({ source: "preview-only" });

    return Promise.all([hallPromise, gatePromise, roofPromise, buddhaPromise, doorPromise, beadsPromise, woodenFishPromise]);
  }

  #buildSeats() {
    const seatMaterial = material(0x722d22, { emissive: 0x281008, emissiveIntensity: 0.16, roughness: 0.96, transparent: true, opacity: 0.05, depthWrite: true });
    for (let row = 0; row < SEAT_ROWS; row += 1) {
      for (let col = 0; col < SEAT_COLS; col += 1) {
        const index = row * SEAT_COLS + col;
        const geometry = new THREE.CylinderGeometry(0.48, 0.53, 0.13, 16);
        const seat = new THREE.Mesh(geometry, seatMaterial.clone());
        seat.position.set((col - (SEAT_COLS - 1) / 2) * 1.52, 0.83, 5.4 - row * 2.0);
        seat.scale.set(1.14, 1, 0.95);
        seat.castShadow = false;
        seat.receiveShadow = true;
        seat.layers.set(1);
        seat.userData.seatIndex = index;
        seat.userData.occupiedBy = null;
        this.seats.push(seat);
        this.scene.add(seat);
      }
    }
    this.#loadSeatVisuals();
  }

  #loadSeatVisuals() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.load(CUSHION_MODEL_URL, (gltf) => {
      this.seats.forEach((seat, index) => {
        const model = gltf.scene.clone(true);
        model.name = `lux3d-cushion-${index + 1}`;
        model.scale.set(1.5, 0.843, 1.503);
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = false;
          child.receiveShadow = true;
          child.material = child.material.clone();
          child.material.envMapIntensity = 0.68;
        });
        model.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.x += seat.position.x - center.x;
        model.position.y += (seat.position.y - 0.065) - bounds.min.y;
        model.position.z += seat.position.z - center.z;
        model.updateMatrixWorld(true);
        seat.userData.visual = model;
        model.visible = this.view === "hall";
        this.seatVisuals.push(model);
        this.scene.add(model);
      });
      this.#refreshSeats();
    }, undefined, (error) => {
      console.warn("Lux3D cushion model could not be loaded; keeping low-poly seat proxies.", error);
      this.seats.forEach((seat) => { seat.material.opacity = 1; });
    });
  }

  #createCharacter(options = {}) {
    if (this.monkTemplate) {
      return createAnimatedMonk({ template: this.monkTemplate, clips: this.monkClips, self: options.self });
    }
    return createFallbackMonk(options);
  }

  #loadMonkTemplate() {
    return new Promise((resolve) => {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        MONK_MODEL_URL,
        (gltf) => {
          this.monkTemplate = gltf.scene;
          this.monkClips = gltf.animations;
          for (const [id, current] of [...this.characters]) {
            const replacement = createAnimatedMonk({
              template: this.monkTemplate,
              clips: this.monkClips,
              self: current === this.self,
            });
            this.#replaceCharacter(id, current, replacement);
          }
          resolve({ source: "lux3d", animations: gltf.animations.length });
        },
        undefined,
        (error) => {
          console.warn("Lux3D animated monk could not be loaded; keeping procedural character fallback.", error);
          resolve({ source: "fallback", animations: 0 });
        },
      );
    });
  }

  #replaceCharacter(id, current, replacement) {
    replacement.position.copy(current.position);
    replacement.rotation.copy(current.rotation);
    replacement.scale.copy(current.scale);
    replacement.visible = current.visible;
    const preserved = {
      profile: current.userData.profile,
      baseY: current.userData.baseY,
      targetSeat: current.userData.targetSeat,
      walkTarget: current.userData.walkTarget,
      walking: current.userData.walking,
      seated: current.userData.seated,
      action: current.userData.action,
      actionAt: current.userData.actionAt,
      lastNetworkAction: current.userData.lastNetworkAction,
    };
    Object.assign(replacement.userData, preserved);
    replacement.userData.setSeated(Boolean(preserved.seated));
    if (preserved.action) replacement.userData.perform(preserved.action);
    current.removeFromParent();
    this.scene.add(replacement);
    this.characters.set(id, replacement);
    if (current === this.self) this.self = replacement;
  }

  #seedBots() {
    const names = ["松间缓存", "无相信号", "月下重启", "缓慢回声", "一盏微光", "空山来客", "云端旧梦", "安静像素", "未读的信", "第七码云", "不急", "小小山岚", "雨后程序", "等待黎明", "温柔故障", "星河暂停", "此刻在线", "松针与风", "白噪旅人", "零号心事"];
    const occupied = [0, 2, 4, 6, 7, 9, 11, 13, 15, 19, 21, 23, 25, 27, 33];
    occupied.forEach((seatIndex, index) => {
      const id = `bot-${index}`;
      const monk = this.#createCharacter({ color: index % 3 === 0 ? 0x6e7f63 : index % 3 === 1 ? 0x80634e : 0x5f786e });
      const seat = this.seats[seatIndex];
      monk.position.copy(seat.position).add(new THREE.Vector3(0, 0.12, 0));
      monk.rotation.y = Math.PI;
      monk.userData.baseY = monk.position.y;
      monk.userData.setSeated(true);
      monk.userData.profile = { id, name: names[index], seat: seatIndex };
      monk.visible = this.view === "hall";
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
    const inHall = this.view === "hall";
    this.seats.forEach((seat, index) => {
      const botOccupant = this.characters.get(seat.userData.occupiedBy);
      const dynamicOccupant = [...this.characters.values()].find((monk) => monk.userData.profile?.seat === index);
      const occupied = Boolean(botOccupant || dynamicOccupant);
      seat.visible = inHall;
      seat.material.opacity = occupied ? 0.96 : 0.05;
      seat.material.emissive.setHex(occupied ? 0x351509 : 0x123d31);
      seat.material.emissiveIntensity = occupied ? 0.24 : 0.34;
      if (seat.userData.visual) seat.userData.visual.visible = inHall && !occupied;
      seat.userData.visual?.traverse((child) => {
        if (!child.isMesh) return;
        child.material.emissive?.setHex(occupied ? 0x050806 : 0x102f26);
        child.material.emissiveIntensity = occupied ? 0.08 : 0.34;
      });
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
    if (this.walkMarker) this.walkMarker.visible = false;
    this.#refreshSeats();
    this.onSeatSelected?.(index);
  }

  #bindEvents() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointerDown = { x: event.clientX, y: event.clientY, yaw: this.cameraYaw, pitch: this.cameraPitchTarget };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointerDown) return;
      const deltaX = event.clientX - this.pointerDown.x;
      const deltaY = event.clientY - this.pointerDown.y;
      if (Math.abs(deltaX) <= 4 && Math.abs(deltaY) <= 4) return;
      if (this.controlMode === "follow") {
        this.cameraYaw = THREE.MathUtils.euclideanModulo(this.pointerDown.yaw + deltaX * 0.004 + Math.PI, TAU) - Math.PI;
        this.cameraPitchTarget = THREE.MathUtils.clamp(this.pointerDown.pitch - deltaY * 0.003, 0.06, 0.82);
      } else {
        if (this.view === "hall") this.cameraYaw = THREE.MathUtils.clamp(this.pointerDown.yaw + deltaX * 0.003, -0.5, 0.5);
        if (this.view === "courtyard") {
          this.cameraYaw = THREE.MathUtils.euclideanModulo(this.pointerDown.yaw + deltaX * 0.004 + Math.PI, TAU) - Math.PI;
        }
      }
    });
    this.canvas.addEventListener("pointerup", (event) => {
      if (!this.pointerDown) return;
      const distance = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
      this.pointerDown = null;
      if (distance > 7) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.view === "hall") {
        this.raycaster.layers.set(1);
        const seatHit = this.raycaster.intersectObjects(this.seats, false)[0];
        if (seatHit) {
          this.#selectSeat(seatHit.object.userData.seatIndex);
          return;
        }
      }
      if (this.controlMode !== "follow") return;
      this.raycaster.layers.set(0);
      const walkableSurfaces = Object.values(this.walkableSurfaces).flat();
      const walkHit = this.raycaster.intersectObjects(walkableSurfaces, false)[0];
      if (walkHit) this.#moveSelfTo(walkHit.point);
    });
    this.canvas.addEventListener("pointercancel", () => { this.pointerDown = null; });
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      if (this.controlMode === "follow") {
        this.cameraDistanceTarget = THREE.MathUtils.clamp(this.cameraDistanceTarget + event.deltaY * 0.008, 0.58, 12.5);
        if (this.cameraDistanceTarget < 1.35) this.cameraPitchTarget = 0.08;
        else if (this.cameraDistanceTarget > 7.2) this.cameraPitchTarget = Math.max(this.cameraPitchTarget, 0.52);
        else this.cameraPitchTarget = THREE.MathUtils.clamp(this.cameraPitchTarget, 0.18, 0.56);
      } else {
        const maximumZoom = this.view === "courtyard" ? 1.1 : 1.45;
        this.orbitZoomTarget = THREE.MathUtils.clamp(this.orbitZoomTarget + event.deltaY * 0.0008, 0.68, maximumZoom);
      }
      this.#emitControlState();
    }, { passive: false });
  }

  #updateCamera(time) {
    const mobile = window.innerWidth < 720;
    const desiredPosition = this.desiredCameraPosition;
    const desiredTarget = this.desiredCameraTarget;

    if (this.entryJourney) {
      const elapsed = time - this.entryJourney.startedAt;
      const rawProgress = THREE.MathUtils.clamp(elapsed / this.entryJourney.duration, 0, 1);
      const progress = THREE.MathUtils.smootherstep(rawProgress, 0, 1);
      this.entryCameraCurve.getPoint(progress, desiredPosition);
      this.entryTargetCurve.getPoint(progress, desiredTarget);
      this.camera.position.lerp(desiredPosition, 0.16);
      this.cameraTarget.lerp(desiredTarget, 0.16);
      this.camera.lookAt(this.cameraTarget);
      if (rawProgress >= 1) this.entryJourney = null;
      return;
    }

    if (this.hallJourney) {
      const elapsed = time - this.hallJourney.startedAt;
      const rawProgress = THREE.MathUtils.clamp(elapsed / this.hallJourney.duration, 0, 1);
      const progress = THREE.MathUtils.smootherstep(rawProgress, 0, 1);
      this.hallCameraCurve.getPoint(progress, desiredPosition);
      this.hallTargetCurve.getPoint(progress, desiredTarget);
      this.camera.position.lerp(desiredPosition, 0.16);
      this.cameraTarget.lerp(desiredTarget, 0.16);
      this.camera.lookAt(this.cameraTarget);
      if (rawProgress >= 1) this.hallJourney = null;
      return;
    }

    if (this.gateCameraHold) {
      const elapsed = time - this.gateCameraHold.startedAt;
      const reachedSafeSide = this.self && this.self.position.z >= 29.8;
      if (reachedSafeSide || elapsed >= this.gateCameraHold.maxDuration) {
        this.gateCameraHold = null;
      } else {
        if (this.self) this.self.visible = true;
        desiredPosition.set(0, mobile ? 3.75 : 3.65, mobile ? 43.5 : 42.5);
        desiredTarget.set(0, 2.72, 25.2);
        this.camera.position.lerp(desiredPosition, 0.14);
        this.cameraTarget.lerp(desiredTarget, 0.14);
        this.camera.lookAt(this.cameraTarget);
        return;
      }
    }

    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.cameraDistanceTarget, 0.11);
    this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, this.cameraPitchTarget, 0.1);
    this.orbitZoom = THREE.MathUtils.lerp(this.orbitZoom, this.orbitZoomTarget, 0.1);

    if (this.controlMode === "follow" && this.self) {
      const firstPerson = this.cameraDistance < 1.28;
      const focus = this.self.position.clone().add(new THREE.Vector3(0, firstPerson ? 1.48 : 1.12, 0));
      this.self.visible = !firstPerson;
      if (firstPerson) {
        const forward = new THREE.Vector3(
          -Math.sin(this.cameraYaw),
          Math.sin(this.cameraPitch - 0.08) * 0.55,
          -Math.cos(this.cameraYaw),
        ).normalize();
        desiredPosition.copy(focus);
        desiredTarget.copy(focus).addScaledVector(forward, 6);
      } else {
        const horizontalDistance = this.cameraDistance * Math.cos(this.cameraPitch);
        desiredPosition.set(
          focus.x + Math.sin(this.cameraYaw) * horizontalDistance,
          focus.y + 0.32 + Math.sin(this.cameraPitch) * this.cameraDistance,
          focus.z + Math.cos(this.cameraYaw) * horizontalDistance,
        );
        desiredTarget.copy(focus);
      }
      const nextNear = firstPerson ? 0.045 : 0.1;
      if (this.camera.near !== nextNear) {
        this.camera.near = nextNear;
        this.camera.updateProjectionMatrix();
      }
      this.camera.position.lerp(desiredPosition, firstPerson ? 0.18 : 0.12);
      this.cameraTarget.lerp(desiredTarget, firstPerson ? 0.2 : 0.13);
      this.camera.lookAt(this.cameraTarget);
      return;
    }

    if (this.self) this.self.visible = true;
    if (this.camera.near !== 0.1) {
      this.camera.near = 0.1;
      this.camera.updateProjectionMatrix();
    }

    if (this.view === "gate") {
      desiredPosition.set(0, mobile ? 3.65 : 3.55, (mobile ? 43 : 41.5) * this.orbitZoom);
      desiredTarget.set(0, 2.75, 25.2);
    } else if (this.view === "courtyard") {
      const courtyardRadiusX = (mobile ? 7.4 : 8.2) * this.orbitZoom;
      const courtyardRadiusZ = (mobile ? 4.3 : 4.8) * this.orbitZoom;
      const courtyardAngle = 0.58 + this.cameraYaw;
      desiredTarget.set(0.6, 2.15, 14.5);
      desiredPosition.set(
        desiredTarget.x + Math.sin(courtyardAngle) * courtyardRadiusX,
        mobile ? 5.2 : 5.8,
        desiredTarget.z + Math.cos(courtyardAngle) * courtyardRadiusZ,
      );
    } else {
      const baseDistance = (mobile ? 16.8 : 15.6) * this.orbitZoom;
      const angle = this.cameraYaw + 0.06;
      desiredPosition.set(Math.sin(angle) * baseDistance, mobile ? 3.85 : 4.1, Math.cos(angle) * baseDistance + 0.4);
      desiredTarget.set(0, mobile ? 2.85 : 2.75, -2.5);
    }

    this.camera.position.lerp(desiredPosition, 0.085);
    this.cameraTarget.lerp(desiredTarget, 0.085);
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

  #syncContinuousZone() {
    if (!this.self || !this.self.userData.walking) return;
    const z = this.self.position.z;
    let nextView = this.view;
    if (this.view === "gate" && z < 27.8) nextView = "courtyard";
    else if (this.view === "courtyard" && z > 29.6) nextView = "gate";
    else if (this.view === "courtyard" && z < 8.65) nextView = "hall";
    else if (this.view === "hall" && z > 9.35) nextView = "courtyard";
    if (nextView !== this.view) this.setView(nextView, { continuous: true });
  }

  #walkingGroundHeight(z, destinationY, currentY) {
    if (destinationY < 0.5 && currentY < 0.5) return destinationY;
    if (z <= 8.25) return 0.68;
    if (z >= 9.35) return 0.16;
    return THREE.MathUtils.lerp(0.68, 0.16, (z - 8.25) / 1.1);
  }

  #updateMovement(time) {
    const delta = Math.min(0.05, Math.max(0, time - this.lastFrameTime));
    this.lastFrameTime = time;
    const monk = this.self;
    const target = monk?.userData.walkTarget;
    if (!monk || !target || monk.userData.targetSeat != null) return;
    const offset = target.clone().sub(monk.position);
    offset.y = 0;
    const distance = offset.length();
    if (distance < 0.04) {
      monk.position.x = target.x;
      monk.position.z = target.z;
      monk.userData.baseY = target.y;
      const nextTarget = monk.userData.walkQueue?.shift();
      if (nextTarget) {
        monk.userData.walkTarget = nextTarget;
      } else {
        monk.userData.walkTarget = null;
        monk.userData.walking = false;
        if (this.walkMarker) this.walkMarker.visible = false;
      }
      return;
    }
    const direction = offset.normalize();
    const step = Math.min(distance, delta * 2.25);
    monk.position.addScaledVector(direction, step);
    monk.userData.baseY = this.#walkingGroundHeight(monk.position.z, target.y, monk.userData.baseY);
    monk.rotation.y = Math.atan2(direction.x, direction.z);
    this.#syncContinuousZone();
    if (this.walkMarker?.visible) {
      const pulse = 1 + Math.sin(time * 5.5) * 0.12;
      this.walkMarker.scale.setScalar(pulse);
      this.walkMarker.material.opacity = 0.48 + Math.sin(time * 5.5) * 0.16;
    }
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    this.frameCounter += 1;
    const renderedAt = performance.now();
    const frameMs = renderedAt - this.lastRenderAt;
    this.lastRenderAt = renderedAt;
    if (frameMs < 250) {
      this.frameTimes.push(frameMs);
      if (this.frameTimes.length > 180) this.frameTimes.shift();
    }
    const time = this.clock.getElapsedTime();
    this.#updateCamera(time);
    this.#updateMovement(time);
    this.#updateAtmosphere();
    if (this.core.visible) {
      this.core.rotation.y = time * 0.18;
      this.core.children.forEach((child, index) => { child.rotation.x = time * (0.07 + index * 0.025); });
    }

    if (this.incenseSmoke) {
      const positions = this.incenseSmoke.geometry.getAttribute("position");
      const { phases, offsets } = this.incenseSmoke.userData;
      for (let index = 0; index < positions.count; index += 1) {
        const rise = (phases[index] + time * 0.075) % 1;
        const spread = 0.06 + rise * 0.42;
        positions.setXYZ(
          index,
          Math.sin(time * 0.58 + index * 1.7) * spread + offsets[index],
          rise * 3.2,
          Math.cos(time * 0.43 + index * 1.13) * spread * 0.58,
        );
      }
      positions.needsUpdate = true;
      const smokePulse = 0.55 + 0.45 * Math.max(0, Math.sin(time * 0.42 + 0.7));
      this.incenseSmoke.material.opacity = (0.085 + Math.sin(time * 0.35) * 0.018) * smokePulse;
    }
    if (this.smokeWisps) {
      this.smokeWisps.rotation.y = Math.sin(time * 0.23) * 0.16;
      this.smokeWisps.children.forEach((wisp, index) => {
        wisp.position.x = Math.sin(time * 0.38 + wisp.userData.phase) * 0.045;
        const wispPulse = 0.5 + 0.5 * Math.max(0, Math.sin(time * 0.39 + index * 0.7));
        wisp.material.opacity = (0.055 + Math.sin(time * 0.31 + index) * 0.018) * wispPulse;
      });
    }

    this.gateDoorCurrent = THREE.MathUtils.lerp(this.gateDoorCurrent, this.gateDoorTarget, 0.075);
    if (this.gateDoorLeaves) {
      this.gateDoorLeaves[0].rotation.y = -1.38 * this.gateDoorCurrent;
      this.gateDoorLeaves[1].rotation.y = 1.38 * this.gateDoorCurrent;
    }
    if (this.prayerBeadsModel) {
      this.prayerBeadsModel.rotation.y = THREE.MathUtils.lerp(
        this.prayerBeadsModel.rotation.y,
        -0.22 + this.prayerBeadsTargetRotation,
        0.08,
      );
    }
    if (this.woodenFishMallet) {
      const elapsed = time - this.woodenFishStrikeAt;
      const strike = elapsed >= 0 && elapsed < 0.7 ? Math.sin((elapsed / 0.7) * Math.PI) : 0;
      this.woodenFishMallet.rotation.z = this.woodenFishMalletBaseRotation + strike * 0.72;
    }

    this.ambientMotions.forEach(({ object, kind, phase }) => {
      if (kind === "water") {
        object.material.emissiveIntensity = 0.18 + Math.sin(time * 0.55 + phase) * 0.025;
        if (object.material.normalMap) {
          object.material.normalMap.offset.x = (time * 0.018 + phase * 0.11) % 1;
          object.material.normalMap.offset.y = (time * 0.011 + Math.sin(time * 0.17) * 0.018) % 1;
        }
      } else if (kind === "waterRipple") {
        const pulse = (Math.sin(time * 0.54 + phase) + 1) * 0.5;
        object.scale.set(1.65 * (0.9 + pulse * 0.2), 0.9 + pulse * 0.2, 1);
        object.material.opacity = 0.025 + (1 - pulse) * 0.065;
      } else if (kind === "moonReflection") {
        object.material.uniforms.uTime.value = time + phase;
        object.material.uniforms.uOpacity.value = this.view === "courtyard" ? 0.56 : 0.34;
      } else if (kind === "moonGlow") {
        object.material.opacity = 0.17 + Math.sin(time * 0.16 + phase) * 0.025;
      } else if (kind === "gateLantern") {
        object.rotation.z = Math.sin(time * 0.42 + phase) * 0.012;
        const flicker = 0.93 + Math.sin(time * 2.7 + phase) * 0.045 + Math.sin(time * 6.1 + phase * 1.7) * 0.018;
        if (object.userData.light) object.userData.light.intensity = object.userData.baseIntensity * flicker;
        if (object.userData.facadeLight) object.userData.facadeLight.intensity = object.userData.baseFacadeIntensity * (0.97 + (flicker - 0.93) * 0.45);
        if (object.userData.halo) object.userData.halo.material.opacity = object.userData.baseHaloOpacity * (0.92 + flicker * 0.08);
      } else if (kind === "fireflies") {
        object.rotation.y = Math.sin(time * 0.07) * 0.08;
        object.material.opacity = 0.58 + Math.sin(time * 1.25) * 0.14;
      } else if (kind === "mist") {
        object.position.x = Math.sin(time * 0.055 + phase) * 1.25;
        object.rotation.y = Math.sin(time * 0.03 + phase) * 0.025;
        object.material.opacity = object.userData.baseOpacity * (0.86 + Math.sin(time * 0.16 + phase) * 0.14);
      }
    });

    const bambooGroup = this.courtyardSlice.getObjectByName("env-003-instances");
    bambooGroup?.children.forEach((bamboo, index) => {
      bamboo.rotation.z = Math.sin(time * 0.42 + index * 1.7) * 0.006;
    });
    const pineGroup = this.courtyardSlice.getObjectByName("env-006-instances");
    pineGroup?.children.forEach((pine, index) => {
      pine.rotation.z = Math.sin(time * 0.27 + index * 2.1) * 0.0025;
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

    if (this.frameTimes.length >= 30 && this.frameCounter % 30 === 0) {
      document.documentElement.dataset.yunqiDiagnostics = JSON.stringify(this.getDiagnostics());
      const average = this.frameTimes.reduce((sum, value) => sum + value, 0) / this.frameTimes.length;
      if (average > 28 && this.renderer.getPixelRatio() > 1) {
        this.pixelRatioCap = Math.max(1, this.renderer.getPixelRatio() - 0.2);
        this.qualityAdjustments += 1;
        this.resize();
      }
    }
  };
}
