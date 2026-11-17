import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const PREVIEW_MODELS = {
  beads: new URL("../assets/scene-pack/runtime/lod2/PROP-012/PROP-012.glb", import.meta.url).href,
  moktak: new URL("../assets/scene-pack/runtime/lod2/PROP-013/PROP-013.glb", import.meta.url).href,
};

export class RitualObjectPreview {
  constructor({ canvas, kind }) {
    this.canvas = canvas;
    this.kind = kind;
    this.stage = canvas.closest(".ritual-object-stage");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(kind === "beads" ? 32 : 35, 1, 0.01, 50);
    this.camera.position.set(0, kind === "beads" ? 0.08 : 0.18, kind === "beads" ? 3.5 : 3.65);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.rotationTarget = kind === "beads" ? -0.12 : -0.38;
    this.strikeAt = -10;
    this.pointer = null;
    this.lastFrame = performance.now();
    this.#buildLighting();
    this.#bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.stage);
    requestAnimationFrame(this.animate);
  }

  #buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0xffe2b2, 0x08140f, 2.1));
    const warm = new THREE.DirectionalLight(0xffc37f, 4.8);
    warm.position.set(-2.5, 3.4, 4.8);
    this.scene.add(warm);
    const cool = new THREE.DirectionalLight(0x7de8cf, 2.7);
    cool.position.set(3.6, 1.5, 2.1);
    this.scene.add(cool);
    const rim = new THREE.PointLight(0xd7a35f, 5.2, 8, 2);
    rim.position.set(0, -1.4, 2.4);
    this.scene.add(rim);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 64),
      new THREE.MeshStandardMaterial({ color: 0x111c17, roughness: 0.92, transparent: true, opacity: 0.7 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.14;
    this.scene.add(ground);
  }

  #bindEvents() {
    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointer = { x: event.clientX, rotation: this.rotationTarget, moved: false };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer) return;
      const delta = event.clientX - this.pointer.x;
      this.pointer.moved ||= Math.abs(delta) > 5;
      this.rotationTarget = this.pointer.rotation + delta * 0.012;
    });
    this.canvas.addEventListener("pointerup", () => {
      if (this.pointer && !this.pointer.moved) this.canvas.dispatchEvent(new CustomEvent("preview-activate"));
      this.pointer = null;
    });
    this.canvas.addEventListener("pointercancel", () => { this.pointer = null; });
  }

  load() {
    if (this.loadPromise) return this.loadPromise;
    this.stage.dataset.previewState = "loading";
    this.loadPromise = new Promise((resolve) => {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        PREVIEW_MODELS[this.kind],
        (gltf) => {
          const model = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const targetSize = this.kind === "beads" ? 2.12 : 2.02;
          const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001);
          model.scale.setScalar(scale);
          model.position.set(-center.x * scale, -center.y * scale - (this.kind === "moktak" ? 0.28 : 0), -center.z * scale);
          model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = false;
            child.receiveShadow = true;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((meshMaterial) => {
              meshMaterial.envMapIntensity = 0.86;
              if (meshMaterial.map) meshMaterial.map.colorSpace = THREE.SRGBColorSpace;
              meshMaterial.needsUpdate = true;
            });
          });
          this.root.add(model);
          this.model = model;
          this.mallet = model.getObjectByName("wooden-fish-mallet");
          this.malletBaseRotation = this.mallet?.rotation.z ?? 0;
          this.stage.dataset.previewState = "ready";
          resolve(model);
        },
        undefined,
        (error) => {
          console.warn(`Ritual ${this.kind} preview could not be loaded.`, error);
          this.stage.dataset.previewState = "error";
          resolve(null);
        },
      );
    });
    return this.loadPromise;
  }

  show() {
    this.resize();
    this.load();
  }

  turn() {
    this.rotationTarget += Math.PI / 8;
  }

  strike() {
    this.strikeAt = performance.now() / 1000;
  }

  resize() {
    const width = Math.max(1, this.stage.clientWidth);
    const height = Math.max(1, this.stage.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  animate = (timestamp) => {
    requestAnimationFrame(this.animate);
    const dialog = this.canvas.closest("dialog");
    if (!dialog?.open) {
      this.lastFrame = timestamp;
      return;
    }
    const delta = Math.min(0.05, Math.max(0, (timestamp - this.lastFrame) / 1000));
    this.lastFrame = timestamp;
    if (!this.pointer) this.rotationTarget += delta * (this.kind === "beads" ? 0.12 : 0.08);
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.rotationTarget, 0.08);
    if (this.mallet) {
      const elapsed = timestamp / 1000 - this.strikeAt;
      const strike = elapsed >= 0 && elapsed < 0.72 ? Math.sin((elapsed / 0.72) * Math.PI) : 0;
      this.mallet.rotation.z = this.malletBaseRotation + strike * 0.82;
    }
    this.renderer.render(this.scene, this.camera);
  };
}
