// src/components/globe/GlobeRenderer.ts
import * as THREE from "three";
import { generateOrbit, SATELLITES, type Vec3 } from "./OrbitalData";

const GLOBE_RADIUS = 1;
const ORBIT_STEPS = 128;
const DOT_SIZE = 0.018; // world-unit size for THREE.Points (sizeAttenuation=true)
const GLOBE_TILT_X = 0.35; // ~20° tilt — north pole toward camera

interface FpsMonitor {
  frameCount: number;
  lastTime: number;
  fps: number;
  level: number; // 0=full, 1-3=degraded
}

export class GlobeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private globe: THREE.Mesh;
  private dots: THREE.Points;
  private orbitLines: THREE.Group;
  private satDots: THREE.Group;
  private animId = 0;
  private pendingSize: { w: number; h: number } | null = null;
  private fpsMonitor: FpsMonitor = {
    frameCount: 0,
    lastTime: 0,
    fps: 60,
    level: 0,
  };
  private resizeObserver!: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3); // overwritten by applySize on first resize

    this.globe = this.createGlobeSphere();
    this.scene.add(this.globe);

    this.dots = this.createDotPlaceholder();
    this.scene.add(this.dots);

    this.orbitLines = new THREE.Group();
    this.scene.add(this.orbitLines);

    this.satDots = new THREE.Group();
    this.scene.add(this.satDots);

    this.addAtmosphere();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    const parent = this.canvas.parentElement ?? this.canvas;
    this.resizeObserver = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0]!.contentRect;
      if (w === 0 || h === 0) return;
      this.applySize(w, h);
    });
    this.resizeObserver.observe(parent);
    const { width: w, height: h } = parent.getBoundingClientRect();
    if (w > 0 && h > 0) this.flushSize(w, h);
  }

  private applySize(w: number, h: number): void {
    // Defer actual resize to the next render tick to avoid a blank frame
    this.pendingSize = { w, h };
  }

  private flushSize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Move camera so globe (radius 1) always fits with 15% margin,
    // regardless of whether the container is portrait or landscape.
    const halfFovRad = (this.camera.fov / 2) * (Math.PI / 180);
    const fitDist = GLOBE_RADIUS / (Math.tan(halfFovRad) * Math.min(aspect, 1));
    this.camera.position.z = fitDist * 1.15;
    this.camera.updateProjectionMatrix();
  }

  private createGlobeSphere(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0a0e14 });
    return new THREE.Mesh(geo, mat);
  }

  private createCircleTexture(): THREE.Texture {
    const size = 64;
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    return tex;
  }

  private createDotPlaceholder(): THREE.Points {
    // Evenly distributed placeholder dots using staggered hex grid
    const positions: number[] = [];
    const LAT_STEP = 1.5;
    let rowIndex = 0;
    for (let lat = -90 + LAT_STEP / 2; lat < 90; lat += LAT_STEP, rowIndex++) {
      const cosLat = Math.cos(lat * (Math.PI / 180));
      if (cosLat < 1e-4) continue;
      const lonStep = LAT_STEP / cosLat;
      const offset = rowIndex % 2 === 0 ? 0 : lonStep / 2;
      for (let lon = -180 + offset; lon < 180; lon += lonStep) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        positions.push(
          -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
          GLOBE_RADIUS * Math.cos(phi),
          GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta),
        );
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    const mat = new THREE.PointsMaterial({
      color: 0x334155,
      size: DOT_SIZE,
      sizeAttenuation: true,
      map: this.createCircleTexture(),
      alphaTest: 0.5,
      transparent: true,
    });

    return new THREE.Points(geo, mat);
  }

  async loadWorldMap(url: string): Promise<void> {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = url;
    });

    const cv = document.createElement("canvas");
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
    const { data, width, height } = imgData;

    const isLand = (lat: number, lon: number): boolean => {
      const px = Math.floor(((lon + 180) / 360) * width);
      const py = Math.floor(((90 - lat) / 180) * height);
      const idx =
        (Math.min(py, height - 1) * width + Math.min(px, width - 1)) * 4;
      return data[idx]! > 128; // R channel: white=land
    };

    const positions: number[] = [];
    const LAT_STEP = 1.0;
    let rowIndex = 0;
    for (let lat = -90 + LAT_STEP / 2; lat < 90; lat += LAT_STEP, rowIndex++) {
      const cosLat = Math.cos(lat * (Math.PI / 180));
      if (cosLat < 1e-4) continue;
      const lonStep = LAT_STEP / cosLat;
      const offset = rowIndex % 2 === 0 ? 0 : lonStep / 2;
      for (let lon = -180 + offset; lon < 180; lon += lonStep) {
        if (!isLand(lat, lon)) continue;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        positions.push(
          -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
          GLOBE_RADIUS * Math.cos(phi),
          GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta),
        );
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: DOT_SIZE,
      sizeAttenuation: true,
      map: this.createCircleTexture(),
      alphaTest: 0.5,
      transparent: true,
      opacity: 0.85,
    });

    this.scene.remove(this.dots);
    this.dots.geometry.dispose();
    (this.dots.material as THREE.Material).dispose();
    this.dots = new THREE.Points(geo, mat);
    this.scene.add(this.dots);
  }

  buildOrbits(): void {
    this.orbitLines.clear();
    this.satDots.clear();

    // Tilt groups to match globe
    this.orbitLines.rotation.x = GLOBE_TILT_X;
    this.satDots.rotation.x = GLOBE_TILT_X;

    // Shared tube material — single mesh per orbit, no cap overlap
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });

    const satGeo = new THREE.SphereGeometry(0.012, 8, 8);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const sat of SATELLITES) {
      const points = generateOrbit({ ...sat, steps: ORBIT_STEPS });

      // TubeGeometry from CatmullRomCurve3 — continuous mesh, uniform colour
      const curve = new THREE.CatmullRomCurve3(
        points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        true, // closed
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.004, 4, true);
      this.orbitLines.add(new THREE.Mesh(tubeGeo, tubeMat));

      // Satellite — float progress for lerp-based smooth motion
      const startProg = Math.random() * ORBIT_STEPS;
      const startIdx = Math.floor(startProg) % ORBIT_STEPS;
      const [sx, sy, sz] = points[startIdx]!;
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.set(sx, sy, sz);
      satMesh.userData["orbitPoints"] = points;
      satMesh.userData["orbitProgress"] = startProg;
      this.satDots.add(satMesh);
    }
  }

  private addAtmosphere(): void {
    // Flat plane facing the camera — no sphere geometry boundary.
    // Glow computed as radial gradient from globe center; depth test hides
    // the portion behind the globe. Plane is large enough that its edges
    // are never reached by the visible glow.
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          float r = length(vWorldPos.xy);
          float glow = exp(-max(r - 0.95, 0.0) * 18.0);
          float alpha = glow * 0.85;
          if (alpha < 0.002) discard;
          gl_FragColor = vec4(0.35, 0.58, 1.0, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat));
  }

  private monitorFps(now: number): void {
    this.fpsMonitor.frameCount++;
    if (now - this.fpsMonitor.lastTime >= 1000) {
      this.fpsMonitor.fps = this.fpsMonitor.frameCount;
      this.fpsMonitor.frameCount = 0;
      this.fpsMonitor.lastTime = now;

      if (this.fpsMonitor.fps < 45 && this.fpsMonitor.level < 2) {
        this.fpsMonitor.level++;
        const reduction = 1 - this.fpsMonitor.level * 0.1;
        this.renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, 2) * reduction,
        );
      }
    }
  }

  start(): void {
    this.fpsMonitor.lastTime = performance.now();
    let rotY = 0;

    const tick = (now: number) => {
      this.animId = requestAnimationFrame(tick);

      if (this.pendingSize) {
        this.flushSize(this.pendingSize.w, this.pendingSize.h);
        this.pendingSize = null;
      }

      this.monitorFps(now);

      rotY += 0.0008;
      this.globe.rotation.x = GLOBE_TILT_X;
      this.globe.rotation.y = rotY;
      this.dots.rotation.x = GLOBE_TILT_X;
      this.dots.rotation.y = rotY;

      // Smooth satellite animation — lerp between orbit steps
      for (const child of this.satDots.children) {
        const mesh = child as THREE.Mesh;
        const pts = mesh.userData["orbitPoints"] as Vec3[];
        const prog = (mesh.userData["orbitProgress"] as number) + 1 / 10;
        mesh.userData["orbitProgress"] = prog;
        const i0 = Math.floor(prog) % pts.length;
        const i1 = (i0 + 1) % pts.length;
        const frac = prog - Math.floor(prog);
        const p0 = pts[i0]!;
        const p1 = pts[i1]!;
        mesh.position.set(
          p0[0] + (p1[0] - p0[0]) * frac,
          p0[1] + (p1[1] - p0[1]) * frac,
          p0[2] + (p1[2] - p0[2]) * frac,
        );
      }

      this.renderer.render(this.scene, this.camera);
    };

    this.animId = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.animId);
  }

  destroy(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.renderer.dispose();
  }
}
