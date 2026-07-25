import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils';

@Component({
  selector: 'app-madbox-demo',
  templateUrl: './madbox-demo.component.html',
  styleUrls: ['./madbox-demo.component.scss']
})
export class MadboxDemoComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  isLoading = true;
  loadError = false;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animId = 0;
  private mixers: THREE.AnimationMixer[] = [];
  private clock = new THREE.Clock();

  // Orbit state
  private isDragging = false;
  private prevMouse = { x: 0, y: 0 };
  private spherical = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 35 };

  ngOnInit(): void {
    this.initScene();
    this.loadAssets();
    this.attachListeners();
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#87ceeb');
    this.scene.fog = new THREE.FogExp2('#9ae4ff', 0.008);

    this.camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 300);
    this.updateCamera();

    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff3d0, 1.8);
    sun.position.set(20, 40, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    this.scene.add(sun);

    const rimLight = new THREE.DirectionalLight(0x88c8ff, 0.5);
    rimLight.position.set(-20, 10, -20);
    this.scene.add(rimLight);

    const hemi = new THREE.HemisphereLight('#c5e8ff', '#7ccc5e', 0.4);
    this.scene.add(hemi);
  }

  private loadModel(loader: GLTFLoader, path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => loader.load(path, resolve, undefined, reject));
  }

  private addMixer(animations: THREE.AnimationClip[], root: THREE.Object3D): void {
    if (!animations.length) return;
    const mixer = new THREE.AnimationMixer(root);
    animations.forEach(clip => mixer.clipAction(clip).play());
    this.mixers.push(mixer);
  }

  private async loadAssets(): Promise<void> {
    THREE.Cache.enabled = true;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('assets/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const base = 'assets/3d/';

    try {
      const [seaGltf, island1, island2, island3, island4, cloudGltf, balloonGltf] = await Promise.all([
        this.loadModel(loader, base + 'sea.glb'),
        this.loadModel(loader, base + 'bakedIsland1.glb'),
        this.loadModel(loader, base + 'bakedIsland2.glb'),
        this.loadModel(loader, base + 'bakedIsland3.glb'),
        this.loadModel(loader, base + 'bakedIsland4.glb'),
        this.loadModel(loader, base + 'animatedCloud.glb'),
        this.loadModel(loader, base + 'animatedHotAirBalloon.glb'),
      ]);

      const boxOf = (obj: THREE.Object3D) => new THREE.Box3().setFromObject(obj);
      const centerOf = (obj: THREE.Object3D) => boxOf(obj).getCenter(new THREE.Vector3());

      const tintIsland = (gltf: GLTF, hex: number) => {
        gltf.scene.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach(m => { (m as THREE.MeshStandardMaterial).color.setHex(hex); });
          }
        });
      };

      /** Center an object's x/z and place its bottom at targetY */
      const placeIsland = (gltf: GLTF, tx: number, tz: number, scale: number, ry = 0) => {
        gltf.scene.scale.setScalar(scale);
        const box = boxOf(gltf.scene);
        const c = box.getCenter(new THREE.Vector3());
        gltf.scene.rotation.y = ry;
        gltf.scene.position.set(tx - c.x, -box.min.y - 0.5, tz - c.z);
        this.scene.add(gltf.scene);
        this.addMixer(gltf.animations, gltf.scene);
      };

      // Sea: center x/z, tinted ocean blue
      {
        const c = centerOf(seaGltf.scene);
        seaGltf.scene.position.set(-c.x, -1.5, -c.z);
        seaGltf.scene.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            m.color.setHex(0x0577b5);
            m.roughness = 0.6;
            m.metalness = 0.0;
          }
        });
        this.scene.add(seaGltf.scene);
        this.addMixer(seaGltf.animations, seaGltf.scene);
      }

      // Island cluster — each island gets a distinct tint
      tintIsland(island1, 0x6ab04c); // lush green
      tintIsland(island2, 0xe8a838); // sandy amber
      tintIsland(island3, 0x5a9fd4); // cool blue
      tintIsland(island4, 0xd45a87); // pink/coral
      placeIsland(island1,  0,    0,   2.0, 0);
      placeIsland(island2,  18,  -6,   1.6, Math.PI * 0.6);
      placeIsland(island3, -16,   8,   1.4, Math.PI * 1.3);
      placeIsland(island4,  5,   15,   1.5, Math.PI * 0.9);

      // Hot air balloon: float to the right side
      {
        balloonGltf.scene.scale.setScalar(2.0);
        const c = centerOf(balloonGltf.scene);
        balloonGltf.scene.position.set(16 - c.x, 13 - c.y, -8 - c.z);
        this.scene.add(balloonGltf.scene);
        this.addMixer(balloonGltf.animations, balloonGltf.scene);
      }

      // Clouds: positioned high in the sky, well above islands
      const cloudSlots: [number, number, number, number][] = [
        [20,  15,   8,  1.5],
        [-18, 16,  12,  1.2],
        [8,   14, -20,  1.8],
        [-14, 18,  -9,  1.0],
        [12,  17,  18,  1.4],
      ];
      cloudSlots.forEach(([tx, ty, tz, s]) => {
        const clone = skeletonClone(cloudGltf.scene);
        clone.scale.setScalar(s);
        const c = centerOf(clone);
        clone.position.set(tx - c.x, ty - c.y, tz - c.z);
        // Tint clouds white
        clone.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
          }
        });
        this.scene.add(clone);
        this.addMixer(cloudGltf.animations, clone);
      });

      this.isLoading = false;
    } catch (err) {
      console.error('Failed to load assets:', err);
      this.isLoading = false;
      this.loadError = true;
    }
  }

  private animate = (): void => {
    this.animId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.mixers.forEach(m => m.update(delta));
    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(): void {
    const { theta, phi, radius } = this.spherical;
    this.camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
    this.camera.lookAt(0, 1, 0);
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.prevMouse.x;
    const dy = e.clientY - this.prevMouse.y;
    this.spherical.theta -= dx * 0.005;
    this.spherical.phi = Math.max(0.3, Math.min(1.4, this.spherical.phi + dy * 0.005));
    this.prevMouse = { x: e.clientX, y: e.clientY };
    this.updateCamera();
  };

  private onMouseUp = () => { this.isDragging = false; };

  private attachListeners(): void {
    const canvas = this.canvasRef.nativeElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(8, Math.min(50, this.spherical.radius + e.deltaY * 0.04));
      this.updateCamera();
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    canvas.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      const dx = e.touches[0].clientX - this.prevMouse.x;
      const dy = e.touches[0].clientY - this.prevMouse.y;
      this.spherical.theta -= dx * 0.005;
      this.spherical.phi = Math.max(0.3, Math.min(1.4, this.spherical.phi + dy * 0.005));
      this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.updateCamera();
    });
    canvas.addEventListener('touchend', () => { this.isDragging = false; });

    this.onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {};
}
