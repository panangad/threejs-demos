import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-madbox-demo',
  templateUrl: './madbox-demo.component.html',
  styleUrls: ['./madbox-demo.component.scss']
})
export class MadboxDemoComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animId = 0;
  private clouds: { mesh: THREE.Group; speed: number; radius: number; angle: number; y: number }[] = [];
  private balloons: { mesh: THREE.Group; phase: number }[] = [];
  private clock = new THREE.Clock();

  // Orbit state
  private isDragging = false;
  private prevMouse = { x: 0, y: 0 };
  private spherical = { theta: Math.PI / 4, phi: Math.PI / 3.5, radius: 28 };

  ngOnInit(): void {
    this.initScene();
    this.buildIsland();
    this.buildClouds();
    this.buildBalloons();
    this.buildWater();
    this.attachListeners();
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize);
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#00d4f0');
    this.scene.fog = new THREE.Fog('#aeeeff', 40, 80);

    this.camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    this.updateCamera();

    // Ambient + directional light
    const ambient = new THREE.AmbientLight(0xfff4e0, 0.8);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff0cc, 1.6);
    sun.position.set(15, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    this.scene.add(sun);

    // Hemisphere sky/ground light
    const hemi = new THREE.HemisphereLight('#87ceeb', '#7ccc5e', 0.6);
    this.scene.add(hemi);
  }

  private buildIsland(): void {
    // Main island base - slightly elevated land mass
    const islandGeo = new THREE.CylinderGeometry(8, 9, 1.5, 8, 1);
    const islandMat = new THREE.MeshLambertMaterial({ color: '#8bc34a' });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -0.3;
    island.receiveShadow = true;
    island.castShadow = true;
    this.scene.add(island);

    // Sandy beach ring
    const beachGeo = new THREE.CylinderGeometry(9.2, 10.2, 0.3, 8);
    const beachMat = new THREE.MeshLambertMaterial({ color: '#f5deb3' });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.y = -0.8;
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Central hill / mountain
    const hillGeo = new THREE.ConeGeometry(3.5, 4.5, 8);
    const hillMat = new THREE.MeshLambertMaterial({ color: '#4caf50' });
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(0, 2.5, 0);
    hill.castShadow = true;
    hill.receiveShadow = true;
    this.scene.add(hill);

    // Snowy peak
    const peakGeo = new THREE.ConeGeometry(1.2, 1.8, 8);
    const peakMat = new THREE.MeshLambertMaterial({ color: '#e8f5e9' });
    const peak = new THREE.Mesh(peakGeo, peakMat);
    peak.position.set(0, 5.8, 0);
    peak.castShadow = true;
    this.scene.add(peak);

    // Colorful zones on island
    const zones: [number, number, number, number, number, string][] = [
      [-4, 0.5, -3, 2.5, 2.5, '#ff5722'],  // Red zone
      [4, 0.5, -3, 2.5, 2.5, '#9c27b0'],   // Purple zone
      [-4, 0.5, 3, 2.5, 2.5, '#2196f3'],   // Blue zone
      [4, 0.5, 3, 2.5, 2.5, '#ff9800'],    // Orange zone
    ];

    zones.forEach(([x, y, z, w, d, color]) => {
      const zGeo = new THREE.BoxGeometry(w, 0.4, d);
      const zMat = new THREE.MeshLambertMaterial({ color });
      const zone = new THREE.Mesh(zGeo, zMat);
      zone.position.set(x, y, z);
      zone.castShadow = true;
      zone.receiveShadow = true;
      this.scene.add(zone);

      // Tiny building on each zone
      const bGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
      const building = new THREE.Mesh(bGeo, new THREE.MeshLambertMaterial({ color: '#ffffff' }));
      building.position.set(x, y + 0.8, z);
      building.castShadow = true;
      this.scene.add(building);

      const roofGeo = new THREE.ConeGeometry(0.65, 0.7, 4);
      const roofMat = new THREE.MeshLambertMaterial({ color });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(x, y + 1.7, z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      this.scene.add(roof);
    });

    // Trees
    const treePositions: [number, number][] = [
      [-2, -5], [2, -5.5], [5.5, 0], [5.5, 2], [-5.5, -1], [-5.5, 1], [0, -5], [3, 4.5], [-3, 4.5]
    ];
    treePositions.forEach(([x, z]) => this.addTree(x, z));

    // Connecting paths
    const pathMat = new THREE.MeshLambertMaterial({ color: '#e8d5a3' });
    [[0, 0, -3.5], [0, 0, 3.5], [-3.5, 0, 0], [3.5, 0, 0]].forEach(([x, y, z]) => {
      const pathGeo = new THREE.BoxGeometry(0.6, 0.2, 3.5);
      const path = new THREE.Mesh(pathGeo, pathMat);
      if (Math.abs(x) > 0) { path.rotation.y = Math.PI / 2; }
      path.position.set(x, y + 0.5, z);
      path.receiveShadow = true;
      this.scene.add(path);
    });
  }

  private addTree(x: number, z: number): void {
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.8, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#795548' });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 0.9, z);
    trunk.castShadow = true;
    this.scene.add(trunk);

    const foliageColors = ['#2e7d32', '#388e3c', '#43a047', '#66bb6a'];
    const baseColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];
    const fGeo = new THREE.SphereGeometry(0.55, 7, 6);
    const fMat = new THREE.MeshLambertMaterial({ color: baseColor });
    const foliage = new THREE.Mesh(fGeo, fMat);
    foliage.position.set(x, 1.8, z);
    foliage.castShadow = true;
    this.scene.add(foliage);
  }

  private buildClouds(): void {
    const angles = [0, 1.1, 2.2, 3.3, 4.4, 5.5, 0.55, 1.65, 2.75, 3.85];
    const radii = [15, 18, 14, 19, 16, 17, 20, 13, 16, 18];
    const heights = [6, 8, 5, 7, 9, 6, 8, 5, 7, 6];

    angles.forEach((angle, i) => {
      const cloud = this.createCloud(radii[i] > 17 ? 'large' : radii[i] > 15 ? 'medium' : 'small');
      const r = radii[i];
      cloud.position.set(Math.cos(angle) * r, heights[i], Math.sin(angle) * r);
      this.scene.add(cloud);
      this.clouds.push({ mesh: cloud, speed: 0.003 + Math.random() * 0.003, radius: r, angle, y: heights[i] });
    });
  }

  private createCloud(size: 'small' | 'medium' | 'large'): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const scale = size === 'large' ? 1.4 : size === 'medium' ? 1.0 : 0.7;

    const spheres: [number, number, number, number][] = [
      [0, 0, 0, 1.0],
      [-0.9, 0.1, 0, 0.75],
      [0.9, 0.1, 0, 0.7],
      [-0.4, 0.55, 0, 0.65],
      [0.4, 0.55, 0, 0.6],
      [0, 0.6, 0, 0.7],
    ];

    spheres.forEach(([x, y, z, r]) => {
      const geo = new THREE.SphereGeometry(r * scale, 8, 6);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x * scale, y * scale, z * scale);
      mesh.castShadow = true;
      group.add(mesh);
    });

    return group;
  }

  private buildBalloons(): void {
    const configs: [number, number, number, string, number][] = [
      [12, 10, 5, '#ff9800', 0],
      [-10, 8, 8, '#e91e63', Math.PI],
      [8, 12, -8, '#4caf50', 1.2],
    ];

    configs.forEach(([x, y, z, color, phase]) => {
      const balloon = this.createBalloon(color);
      balloon.position.set(x, y, z);
      this.scene.add(balloon);
      this.balloons.push({ mesh: balloon, phase });
    });
  }

  private createBalloon(color: string): THREE.Group {
    const group = new THREE.Group();
    // Balloon envelope
    const envGeo = new THREE.SphereGeometry(1.2, 12, 10);
    const stripes: THREE.BufferGeometry[] = [];
    const envMat = new THREE.MeshLambertMaterial({ color });
    const envelope = new THREE.Mesh(envGeo, envMat);
    envelope.scale.y = 1.3;
    envelope.castShadow = true;
    group.add(envelope);

    // Stripe overlay
    const stripeMat = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 });
    for (let i = 0; i < 4; i++) {
      const stripeGeo = new THREE.BoxGeometry(0.25, 2.6, 0.01);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.y = (i / 4) * Math.PI;
      group.add(stripe);
    }

    // Basket
    const basketGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    const basketMat = new THREE.MeshLambertMaterial({ color: '#795548' });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = -1.8;
    basket.castShadow = true;
    group.add(basket);

    // Ropes (4 thin cylinders)
    const ropeMat = new THREE.MeshLambertMaterial({ color: '#a0724a' });
    [-0.25, 0.25].forEach(rx => {
      [-0.25, 0.25].forEach(rz => {
        const ropeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 4);
        const rope = new THREE.Mesh(ropeGeo, ropeMat);
        rope.position.set(rx, -1.25, rz);
        rope.rotation.z = rx * 0.4;
        rope.rotation.x = rz * 0.4;
        group.add(rope);
      });
    });

    return group;
  }

  private buildWater(): void {
    const waterGeo = new THREE.CircleGeometry(35, 64);
    const waterMat = new THREE.MeshLambertMaterial({ color: '#0096c7', transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.2;
    water.receiveShadow = true;
    this.scene.add(water);
  }

  private animate = (): void => {
    this.animId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // Orbit clouds
    this.clouds.forEach(c => {
      c.angle += c.speed;
      c.mesh.position.x = Math.cos(c.angle) * c.radius;
      c.mesh.position.z = Math.sin(c.angle) * c.radius;
      c.mesh.position.y = c.y + Math.sin(t * 0.5 + c.angle) * 0.3;
    });

    // Float balloons
    this.balloons.forEach(b => {
      b.mesh.position.y += Math.sin(t * 0.8 + b.phase) * 0.01;
      b.mesh.rotation.y = Math.sin(t * 0.3 + b.phase) * 0.1;
    });

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

  private attachListeners(): void {
    const canvas = this.canvasRef.nativeElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.spherical.theta -= dx * 0.005;
      this.spherical.phi = Math.max(0.3, Math.min(1.4, this.spherical.phi + dy * 0.005));
      this.prevMouse = { x: e.clientX, y: e.clientY };
      this.updateCamera();
    });

    window.addEventListener('mouseup', () => this.isDragging = false);

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(10, Math.min(50, this.spherical.radius + e.deltaY * 0.04));
      this.updateCamera();
    }, { passive: false });

    // Touch support
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
    canvas.addEventListener('touchend', () => this.isDragging = false);

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
