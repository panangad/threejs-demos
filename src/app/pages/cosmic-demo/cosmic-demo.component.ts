import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-cosmic-demo',
  templateUrl: './cosmic-demo.component.html',
  styleUrls: ['./cosmic-demo.component.scss']
})
export class CosmicDemoComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animId = 0;
  private clock = new THREE.Clock();

  private galaxyPoints!: THREE.Points;
  private nebulaPoints!: THREE.Points;
  private starField!: THREE.Points;
  private speedLines!: THREE.Points;

  private mouse = { x: 0, y: 0 };
  private targetCamRot = { x: 0, y: 0 };
  private currentCamRot = { x: 0, y: 0 };
  private warpSpeed = 1.0;
  private travelDist = 0;

  ngOnInit(): void {
    this.initScene();
    this.buildStarField();
    this.buildGalaxy();
    this.buildNebula();
    this.buildSpeedLines();
    this.attachListeners();
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('wheel', this.onWheel);
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#000005', 0.0015);

    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.01, 2000);
    this.camera.position.set(0, 0, 0);
  }

  private buildStarField(): void {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const rnd = Math.random();
      if (rnd < 0.1) {
        colors[i*3]=0.8; colors[i*3+1]=0.9; colors[i*3+2]=1.0; // blue-white
      } else if (rnd < 0.2) {
        colors[i*3]=1.0; colors[i*3+1]=0.9; colors[i*3+2]=0.7; // yellow-white
      } else {
        colors[i*3]=1.0; colors[i*3+1]=1.0; colors[i*3+2]=1.0;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9
    });

    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  private buildGalaxy(): void {
    const count = 60000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const arms = 4;
    const armSpread = 0.25;
    const galaxyRadius = 400;
    const thickness = 20;

    // Color palette: core is warm yellow, arms go cool purple/blue
    const coreColor = new THREE.Color('#ffd580');
    const armColor1 = new THREE.Color('#9b59b6');
    const armColor2 = new THREE.Color('#2e86de');

    for (let i = 0; i < count; i++) {
      const arm = Math.floor(Math.random() * arms);
      const t = Math.random();
      const r = Math.pow(t, 0.6) * galaxyRadius;
      const baseAngle = (arm / arms) * Math.PI * 2;
      const spiralAngle = baseAngle + t * Math.PI * 3.5;
      const spread = (Math.random() - 0.5) * armSpread * r;
      const ySpread = (Math.random() - 0.5) * thickness * (1 - t * 0.8);

      positions[i * 3]     = Math.cos(spiralAngle) * (r + spread);
      positions[i * 3 + 1] = ySpread;
      positions[i * 3 + 2] = Math.sin(spiralAngle) * (r + spread) - 300;

      // Color blend
      let c: THREE.Color;
      if (r < 40) {
        c = coreColor.clone().lerp(armColor1, Math.random() * 0.4);
      } else if (arm % 2 === 0) {
        c = armColor1.clone().lerp(armColor2, t);
      } else {
        c = armColor2.clone().lerp(new THREE.Color('#ff6eb4'), t * 0.5);
      }
      // Add slight brightness variation
      const bright = 0.6 + Math.random() * 0.4;
      colors[i*3]   = c.r * bright;
      colors[i*3+1] = c.g * bright;
      colors[i*3+2] = c.b * bright;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.galaxyPoints = new THREE.Points(geo, mat);
    this.scene.add(this.galaxyPoints);
  }

  private buildNebula(): void {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const nebulaColors = [
      new THREE.Color('#7c3aed'),
      new THREE.Color('#db2777'),
      new THREE.Color('#1d4ed8'),
      new THREE.Color('#059669'),
    ];

    for (let i = 0; i < count; i++) {
      const nc = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
      const cx = (Math.random() - 0.5) * 200;
      const cy = (Math.random() - 0.5) * 80;
      const cz = -100 - Math.random() * 300;

      positions[i * 3]     = cx + (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = cy + (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = cz + (Math.random() - 0.5) * 50;

      const bright = 0.3 + Math.random() * 0.5;
      colors[i*3]   = nc.r * bright;
      colors[i*3+1] = nc.g * bright;
      colors[i*3+2] = nc.b * bright;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 3.0,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.nebulaPoints = new THREE.Points(geo, mat);
    this.scene.add(this.nebulaPoints);
  }

  private buildSpeedLines(): void {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 1.5 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3]     = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = -Math.random() * 80;

      const intensity = 0.3 + Math.random() * 0.7;
      colors[i*3]   = 0.5 * intensity;
      colors[i*3+1] = 0.7 * intensity;
      colors[i*3+2] = 1.0 * intensity;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.speedLines = new THREE.Points(geo, mat);
    this.scene.add(this.speedLines);
  }

  private animate = (): void => {
    this.animId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    // Travel forward
    this.travelDist += delta * 8 * this.warpSpeed;
    this.camera.position.z = -this.travelDist;

    // Smooth mouse steering (POV)
    this.currentCamRot.x += (this.targetCamRot.x - this.currentCamRot.x) * 0.05;
    this.currentCamRot.y += (this.targetCamRot.y - this.currentCamRot.y) * 0.05;

    // Subtle ship wobble
    const wobbleX = Math.sin(t * 0.7) * 0.004;
    const wobbleY = Math.sin(t * 1.1) * 0.003;

    this.camera.rotation.x = this.currentCamRot.x + wobbleX;
    this.camera.rotation.y = this.currentCamRot.y + wobbleY;
    this.camera.rotation.z = -this.currentCamRot.y * 0.3 + Math.sin(t * 0.4) * 0.005;

    // Rotate galaxy slowly
    this.galaxyPoints.rotation.y = t * 0.015;
    this.nebulaPoints.rotation.y = t * 0.008;

    // Speed lines stretch with warp speed
    const slScale = 1 + (this.warpSpeed - 1) * 0.8;
    this.speedLines.scale.z = slScale;
    (this.speedLines.material as THREE.PointsMaterial).opacity = 0.4 + this.warpSpeed * 0.3;

    // Update HUD speed
    const speedEl = document.getElementById('speedVal');
    if (speedEl) speedEl.textContent = this.warpSpeed.toFixed(1) + 'x';

    this.renderer.render(this.scene, this.camera);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width * 2 - 1;
    const ny = (e.clientY - rect.top) / rect.height * 2 - 1;
    this.targetCamRot.y = nx * 0.15;
    this.targetCamRot.x = -ny * 0.1;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.warpSpeed = Math.max(0.5, Math.min(5.0, this.warpSpeed - e.deltaY * 0.002));
  };

  private attachListeners(): void {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    this.onResize = () => {
      const canvas = this.canvasRef.nativeElement;
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
