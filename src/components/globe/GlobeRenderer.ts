// src/components/globe/GlobeRenderer.ts
import * as THREE from 'three';
import { generateOrbit, SATELLITES, type Vec3 } from './OrbitalData';

const GLOBE_RADIUS = 1;
const DOT_COUNT = 12000;
const DOT_SIZE = 0.006;
const ORBIT_STEPS = 128;

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
  private dots: THREE.InstancedMesh;
  private orbitLines: THREE.Group;
  private satDots: THREE.Group;
  private animId = 0;
  private fpsMonitor: FpsMonitor = { frameCount: 0, lastTime: 0, fps: 60, level: 0 };

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0, 3);

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

    this.onResize();
    window.addEventListener('resize', this.onResize);
  }

  private createGlobeSphere(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0a0e14, transparent: true, opacity: 0.95 });
    return new THREE.Mesh(geo, mat);
  }

  private createDotPlaceholder(): THREE.InstancedMesh {
    // Placeholder while world map loads — evenly distributed dots
    const geo = new THREE.CircleGeometry(DOT_SIZE, 5);
    const mat = new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, DOT_COUNT);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < DOT_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      dummy.position.set(
        GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
        GLOBE_RADIUS * Math.cos(phi),
        GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta),
      );
      dummy.lookAt(0, 0, 0);
      dummy.translateZ(0.001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  async loadWorldMap(url: string): Promise<void> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const isLand = (lat: number, lon: number): boolean => {
      const x = Math.floor(((lon + 180) / 360) * canvas.width) % canvas.width;
      const y = Math.floor(((90 - lat) / 180) * canvas.height);
      const idx = (y * canvas.width + x) * 4;
      return data.data[idx]! > 128; // white = land
    };

    const positions: Vec3[] = [];
    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;
    const maxAttempts = DOT_COUNT * 8;

    while (placed < DOT_COUNT && attempts < maxAttempts) {
      attempts++;
      const lat = Math.asin(2 * Math.random() - 1) * (180 / Math.PI);
      const lon = Math.random() * 360 - 180;
      if (!isLand(lat, lon)) continue;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const pos: Vec3 = [
        -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
         GLOBE_RADIUS * Math.cos(phi),
         GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta),
      ];
      positions.push(pos);
      placed++;
    }

    const geo = new THREE.CircleGeometry(DOT_SIZE, 5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, opacity: 0.7, transparent: true });
    const newMesh = new THREE.InstancedMesh(geo, mat, positions.length);

    for (let i = 0; i < positions.length; i++) {
      const [x, y, z] = positions[i]!;
      dummy.position.set(x, y, z);
      dummy.lookAt(0, 0, 0);
      dummy.translateZ(0.001);
      dummy.updateMatrix();
      newMesh.setMatrixAt(i, dummy.matrix);
    }
    newMesh.instanceMatrix.needsUpdate = true;

    this.scene.remove(this.dots);
    this.dots.geometry.dispose();
    (this.dots.material as THREE.Material).dispose();
    this.dots = newMesh;
    this.scene.add(this.dots);
  }

  buildOrbits(): void {
    this.orbitLines.clear();
    this.satDots.clear();

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    const satGeo = new THREE.SphereGeometry(0.012, 8, 8);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const sat of SATELLITES) {
      const points = generateOrbit({ ...sat, steps: ORBIT_STEPS });
      const loopVerts = new Float32Array([...points, points[0]!].flatMap(p => p));
      const loopGeo = new THREE.BufferGeometry();
      loopGeo.setAttribute('position', new THREE.BufferAttribute(loopVerts, 3));

      this.orbitLines.add(new THREE.Line(loopGeo, lineMat));

      // Satellite dot at current position
      const [sx, sy, sz] = points[0]!;
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.set(sx, sy, sz);
      satMesh.userData['orbitPoints'] = points;
      satMesh.userData['orbitIndex'] = Math.floor(Math.random() * ORBIT_STEPS);
      this.satDots.add(satMesh);
    }
  }

  private addAtmosphere(): void {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 32, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.4, 0.6, 1.0, 1.0) * intensity * 0.4;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  private onResize = (): void => {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private monitorFps(now: number): void {
    this.fpsMonitor.frameCount++;
    if (now - this.fpsMonitor.lastTime >= 1000) {
      this.fpsMonitor.fps = this.fpsMonitor.frameCount;
      this.fpsMonitor.frameCount = 0;
      this.fpsMonitor.lastTime = now;

      if (this.fpsMonitor.fps < 55 && this.fpsMonitor.level < 3) {
        this.fpsMonitor.level++;
        const reduction = 1 - this.fpsMonitor.level * 0.2;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * reduction);
      }
    }
  }

  start(): void {
    let rotY = 0;

    const tick = (now: number) => {
      this.animId = requestAnimationFrame(tick);
      this.monitorFps(now);

      rotY += 0.0008;
      this.globe.rotation.y = rotY;
      this.dots.rotation.y = rotY;

      // Animate satellite positions along orbits
      for (const child of this.satDots.children) {
        const mesh = child as THREE.Mesh;
        const pts = mesh.userData['orbitPoints'] as Vec3[];
        const idx = (mesh.userData['orbitIndex'] as number + 1) % pts.length;
        mesh.userData['orbitIndex'] = idx;
        const [x, y, z] = pts[idx]!;
        mesh.position.set(x, y, z);
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
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
