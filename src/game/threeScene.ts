import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CAR_COLORS } from '../data/questions';
import { CarColor, MathQuestion } from '../types/game';

// Scratch objects to avoid GC in animation loop
const _vec3 = new THREE.Vector3();

// Lane X positions (3 lanes for A, B, C)
export const LANE_X = [-4.5, 0, 4.5]; // Lane 0 = A, 1 = B, 2 = C

export interface SceneCallbacks {
  onCollectCoin: (count: number) => void;
  onHitObstacle: () => void;
  onPassGate: (chosenLane: number) => void;
}

export class RacingScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;

  // Car references
  private carGroup!: THREE.Group;
  private carBodyMesh!: THREE.Mesh;
  private carWheels: THREE.Group[] = [];
  private carUnderglow!: THREE.Mesh;
  private exhaustParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vy: number; vz: number }[] = [];

  // Track & Environment
  private roadSegments: THREE.Group[] = [];
  private roadSegmentLength = 100;
  private roadTexture!: THREE.CanvasTexture;
  private curbTexture!: THREE.CanvasTexture;

  // Dynamic game entities
  private coins: { group: THREE.Group; lane: number; z: number; collected: boolean }[] = [];
  private obstacles: { group: THREE.Group; lane: number; z: number; hit: boolean; type: 'barrier' | 'cone' }[] = [];
  private activeGate: {
    group: THREE.Group;
    z: number;
    passed: boolean;
    question: MathQuestion;
    canvases: HTMLCanvasElement[];
    textures: THREE.CanvasTexture[];
  } | null = null;

  // Car Physics & Movement
  public targetLane: number = 1; // 0, 1, 2
  public currentX: number = 0;
  public carZ: number = 0;
  public speed: number = 0;
  public targetSpeed: number = 60; // km/h
  public isBoosting: boolean = false;
  public isBraking: boolean = false;

  // Camera feel
  private cameraShake: number = 0;
  public isTitleScreen: boolean = true;
  private titleOrbitAngle: number = 0;

  // Callbacks
  private callbacks: SceneCallbacks;

  // Cached materials & geometries
  private coinGeometry!: THREE.CylinderGeometry;
  private coinMaterial!: THREE.MeshStandardMaterial;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initRenderer();
    this.initScene();
    this.initCar('cyan');
    this.initTrackAndCity();
    this.initCoinsAndObstaclesGeom();

    window.addEventListener('resize', this.onResize);
    this.startLoop();
  }

  private initRenderer() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !this.isSoftwareGl,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    const bgSky = 0x050a16;
    this.scene.background = new THREE.Color(bgSky);
    this.scene.fog = new THREE.FogExp2(bgSky, 0.007);

    const aspect = this.container.clientWidth / Math.max(this.container.clientHeight, 1);
    const initialFov = aspect < 0.9 ? 76 : aspect < 1.2 ? 68 : 60;
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 400);
    this.camera.position.set(0, aspect < 1.0 ? 4.4 : 3.8, aspect < 1.0 ? 9.5 : 8.5);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 120;
      dirLight.shadow.camera.left = -25;
      dirLight.shadow.camera.right = 25;
      dirLight.shadow.camera.top = 25;
      dirLight.shadow.camera.bottom = -25;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(dirLight);

    const cyanRim = new THREE.DirectionalLight(0x06b6d4, 0.8);
    cyanRim.position.set(-20, 15, -30);
    this.scene.add(cyanRim);
  }

  /**
   * Procedural composite sports car (10 distinct parts)
   */
  public initCar(colorKey: CarColor) {
    if (this.carGroup) {
      this.scene.remove(this.carGroup);
      this.carWheels = [];
    }

    const colorConfig = CAR_COLORS.find((c) => c.id === colorKey) || CAR_COLORS[0];
    const carColorHex = colorConfig.threeColor;

    this.carGroup = new THREE.Group();

    // 1. Lower Main Chassis
    const bodyGeom = new THREE.BoxGeometry(2.1, 0.55, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: carColorHex,
      metalness: 0.85,
      roughness: 0.2,
    });
    this.carBodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    this.carBodyMesh.position.y = 0.5;
    this.carBodyMesh.castShadow = !this.isSoftwareGl;
    this.carGroup.add(this.carBodyMesh);

    // 2. Cockpit / Cabin Roof & Glass
    const cabinGeom = new THREE.BoxGeometry(1.65, 0.48, 2.2);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cabinMesh = new THREE.Mesh(cabinGeom, glassMat);
    cabinMesh.position.set(0, 0.95, -0.2);
    cabinMesh.castShadow = !this.isSoftwareGl;
    this.carGroup.add(cabinMesh);

    // Front Windshield Slope accent
    const shieldGeom = new THREE.BufferGeometry();
    const shieldVertices = new Float32Array([
      -0.8, 0.75, -1.2,
      0.8, 0.75, -1.2,
      0.75, 1.15, -0.85,
      -0.8, 0.75, -1.2,
      0.75, 1.15, -0.85,
      -0.75, 1.15, -0.85,
    ]);
    shieldGeom.setAttribute('position', new THREE.BufferAttribute(shieldVertices, 3));
    shieldGeom.computeVertexNormals();
    const shieldMesh = new THREE.Mesh(shieldGeom, glassMat);
    this.carGroup.add(shieldMesh);

    // 3. Aerodynamic Front Splitter
    const splitterGeom = new THREE.BoxGeometry(2.15, 0.08, 0.8);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const splitter = new THREE.Mesh(splitterGeom, trimMat);
    splitter.position.set(0, 0.28, -2.15);
    this.carGroup.add(splitter);

    // 4. Rear GT Wing / Spoiler
    const wingBladeGeom = new THREE.BoxGeometry(2.3, 0.08, 0.55);
    const wingBlade = new THREE.Mesh(wingBladeGeom, bodyMat);
    wingBlade.position.set(0, 1.25, 2.0);
    this.carGroup.add(wingBlade);

    const strutGeom = new THREE.BoxGeometry(0.08, 0.35, 0.3);
    const leftStrut = new THREE.Mesh(strutGeom, trimMat);
    leftStrut.position.set(-0.7, 1.0, 2.0);
    const rightStrut = new THREE.Mesh(strutGeom, trimMat);
    rightStrut.position.set(0.7, 1.0, 2.0);
    this.carGroup.add(leftStrut);
    this.carGroup.add(rightStrut);

    // 5. 4 Wheels (Rubber Tires + Chrome Rims)
    const tireGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 20);
    tireGeom.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });

    const rimGeom = new THREE.CylinderGeometry(0.26, 0.26, 0.34, 12);
    rimGeom.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });

    const wheelOffsets = [
      [-1.05, 0.42, -1.35], // Front Left
      [1.05, 0.42, -1.35],  // Front Right
      [-1.05, 0.42, 1.35],  // Rear Left
      [1.05, 0.42, 1.35],   // Rear Right
    ];

    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wx, wy, wz);

      const tire = new THREE.Mesh(tireGeom, tireMat);
      tire.castShadow = !this.isSoftwareGl;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(rimGeom, rimMat);
      wheelGroup.add(rim);

      this.carGroup.add(wheelGroup);
      this.carWheels.push(wheelGroup);
    });

    // 6. Dual LED Headlights
    const lightGeom = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xecfeff,
      emissive: 0x22d3ee,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const leftHead = new THREE.Mesh(lightGeom, headMat);
    leftHead.position.set(-0.7, 0.58, -2.2);
    const rightHead = new THREE.Mesh(lightGeom, headMat);
    rightHead.position.set(0.7, 0.58, -2.2);
    this.carGroup.add(leftHead);
    this.carGroup.add(rightHead);

    // 7. Full-width Rear Taillight Lightbar
    const tailGeom = new THREE.BoxGeometry(1.9, 0.12, 0.08);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff2222,
      emissiveIntensity: 2.5,
      roughness: 0.2,
    });
    const tailLight = new THREE.Mesh(tailGeom, tailMat);
    tailLight.position.set(0, 0.65, 2.21);
    this.carGroup.add(tailLight);

    // 8. Dual Chrome Exhaust Tips
    const exhGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.25, 12);
    exhGeom.rotateX(Math.PI / 2);
    const exhMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const leftExh = new THREE.Mesh(exhGeom, exhMat);
    leftExh.position.set(-0.5, 0.32, 2.22);
    const rightExh = new THREE.Mesh(exhGeom, exhMat);
    rightExh.position.set(0.5, 0.32, 2.22);
    this.carGroup.add(leftExh);
    this.carGroup.add(rightExh);

    // 9. Neon Underglow Plane
    const glowGeom = new THREE.PlaneGeometry(2.3, 4.2);
    glowGeom.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: carColorHex,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    this.carUnderglow = new THREE.Mesh(glowGeom, glowMat);
    this.carUnderglow.position.set(0, 0.06, 0);
    this.carGroup.add(this.carUnderglow);

    // 10. Soft Contact Shadow Plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5.0).rotateX(-Math.PI / 2), shadowMat);
    shadowPlane.position.y = 0.03;
    this.carGroup.add(shadowPlane);

    this.carGroup.position.set(0, 0, 0);
    this.scene.add(this.carGroup);
  }

  public setCarColor(colorKey: CarColor) {
    this.initCar(colorKey);
  }


  /**
   * Procedural road textures & modern city skyline chunks
   */
  private initTrackAndCity() {
    // Procedural Road Asphalt Texture
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 512;
    roadCanvas.height = 1024;
    const ctx = roadCanvas.getContext('2d')!;

    // Dark asphalt
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 1024);

    // Subtle asphalt noise
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 1024;
      ctx.fillStyle = Math.random() > 0.5 ? '#1f2937' : '#0f172a';
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Outer solid white lane markings
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(18, 0, 10, 1024);
    ctx.fillRect(484, 0, 10, 1024);

    // Inner dashed dividers (3 lanes: 2 dividers at 170px and 342px)
    ctx.fillStyle = '#38bdf8'; // Glowing cyan dashed dividers
    for (let y = 0; y < 1024; y += 80) {
      ctx.fillRect(170, y + 15, 7, 48);
      ctx.fillRect(342, y + 15, 7, 48);
    }

    this.roadTexture = new THREE.CanvasTexture(roadCanvas);
    this.roadTexture.wrapS = THREE.RepeatWrapping;
    this.roadTexture.wrapT = THREE.RepeatWrapping;
    this.roadTexture.repeat.set(1, 10);
    this.roadTexture.colorSpace = THREE.SRGBColorSpace;
    this.roadTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const roadMat = new THREE.MeshStandardMaterial({
      map: this.roadTexture,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Checkered rumble curb texture
    const curbCanvas = document.createElement('canvas');
    curbCanvas.width = 64;
    curbCanvas.height = 128;
    const cCtx = curbCanvas.getContext('2d')!;
    cCtx.fillStyle = '#ef4444';
    cCtx.fillRect(0, 0, 64, 64);
    cCtx.fillStyle = '#f8fafc';
    cCtx.fillRect(0, 64, 64, 64);

    this.curbTexture = new THREE.CanvasTexture(curbCanvas);
    this.curbTexture.wrapS = THREE.RepeatWrapping;
    this.curbTexture.wrapT = THREE.RepeatWrapping;
    this.curbTexture.repeat.set(1, 25);
    this.curbTexture.colorSpace = THREE.SRGBColorSpace;

    const curbMat = new THREE.MeshStandardMaterial({
      map: this.curbTexture,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });

    // Guardrail material
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    // Ground terrain beyond road
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // Procedural building texture with glowing windows
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 512;
    const bCtx = bCanvas.getContext('2d')!;
    bCtx.fillStyle = '#0f172a';
    bCtx.fillRect(0, 0, 256, 512);

    for (let r = 10; r < 500; r += 24) {
      for (let c = 8; c < 250; c += 18) {
        const rand = Math.random();
        if (rand > 0.4) {
          bCtx.fillStyle = rand > 0.85 ? '#38bdf8' : rand > 0.7 ? '#fbbf24' : '#e2e8f0';
          bCtx.fillRect(c, r, 10, 14);
        }
      }
    }

    const buildingTex = new THREE.CanvasTexture(bCanvas);
    buildingTex.wrapS = THREE.RepeatWrapping;
    buildingTex.wrapT = THREE.RepeatWrapping;
    buildingTex.repeat.set(1, 3);
    buildingTex.colorSpace = THREE.SRGBColorSpace;

    const buildingMat = new THREE.MeshStandardMaterial({
      map: buildingTex,
      roughness: 0.3,
      metalness: 0.7,
    });

    // Create 6 continuous road segments (600m total track length)
    for (let i = 0; i < 6; i++) {
      const segGroup = new THREE.Group();
      // Initially: i=0 at +100, i=1 at 0 (under car), i=2 at -100, etc.
      segGroup.position.z = (1 - i) * this.roadSegmentLength;

      // Road plane (15m wide for 3 lanes)
      const roadMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(15, this.roadSegmentLength).rotateX(-Math.PI / 2),
        roadMat
      );
      roadMesh.receiveShadow = !this.isSoftwareGl;
      roadMesh.frustumCulled = false;
      segGroup.add(roadMesh);

      // Curbs on left and right
      const leftCurb = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.25, this.roadSegmentLength),
        curbMat
      );
      leftCurb.position.set(-7.9, 0.12, 0);
      leftCurb.frustumCulled = false;
      segGroup.add(leftCurb);

      const rightCurb = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.25, this.roadSegmentLength),
        curbMat
      );
      rightCurb.position.set(7.9, 0.12, 0);
      rightCurb.frustumCulled = false;
      segGroup.add(rightCurb);

      // Guardrails
      const leftRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.8, this.roadSegmentLength),
        railMat
      );
      leftRail.position.set(-8.6, 0.5, 0);
      leftRail.frustumCulled = false;
      segGroup.add(leftRail);

      const rightRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.8, this.roadSegmentLength),
        railMat
      );
      rightRail.position.set(8.6, 0.5, 0);
      rightRail.frustumCulled = false;
      segGroup.add(rightRail);

      // Flanking terrain
      const terrainLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(80, this.roadSegmentLength).rotateX(-Math.PI / 2),
        terrainMat
      );
      terrainLeft.position.set(-48, -0.05, 0);
      terrainLeft.frustumCulled = false;
      segGroup.add(terrainLeft);

      const terrainRight = new THREE.Mesh(
        new THREE.PlaneGeometry(80, this.roadSegmentLength).rotateX(-Math.PI / 2),
        terrainMat
      );
      terrainRight.position.set(48, -0.05, 0);
      terrainRight.frustumCulled = false;
      segGroup.add(terrainRight);

      // Streetlights along segment
      for (let zOffset = -this.roadSegmentLength / 2 + 15; zOffset < this.roadSegmentLength / 2; zOffset += 35) {
        // Left Pole
        const poleGeom = new THREE.CylinderGeometry(0.12, 0.14, 8, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
        const leftPole = new THREE.Mesh(poleGeom, poleMat);
        leftPole.position.set(-9.3, 4, zOffset);
        leftPole.frustumCulled = false;
        segGroup.add(leftPole);

        const headGeom = new THREE.BoxGeometry(1.6, 0.2, 0.4);
        const headMesh = new THREE.Mesh(headGeom, poleMat);
        headMesh.position.set(-8.5, 7.9, zOffset);
        headMesh.frustumCulled = false;
        segGroup.add(headMesh);

        const bulbGeom = new THREE.BoxGeometry(0.8, 0.1, 0.3);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const bulbMesh = new THREE.Mesh(bulbGeom, bulbMat);
        bulbMesh.position.set(-8.2, 7.78, zOffset);
        bulbMesh.frustumCulled = false;
        segGroup.add(bulbMesh);

        // Right Pole
        const rightPole = new THREE.Mesh(poleGeom, poleMat);
        rightPole.position.set(9.3, 4, zOffset);
        rightPole.frustumCulled = false;
        segGroup.add(rightPole);

        const rightHead = new THREE.Mesh(headGeom, poleMat);
        rightHead.position.set(8.5, 7.9, zOffset);
        rightHead.frustumCulled = false;
        segGroup.add(rightHead);

        const rightBulb = new THREE.Mesh(bulbGeom, bulbMat);
        rightBulb.position.set(8.2, 7.78, zOffset);
        rightBulb.frustumCulled = false;
        segGroup.add(rightBulb);
      }

      // City Buildings attached to each segment
      const buildingsPerSeg = 6;
      for (let b = 0; b < buildingsPerSeg; b++) {
        const width = 14 + ((i * 7 + b * 11) % 12);
        const depth = 16 + ((i * 5 + b * 13) % 14);
        const height = 40 + ((i * 17 + b * 19) % 55);

        const side = b % 2 === 0 ? -1 : 1;
        const xDist = side * (26 + ((b * 9) % 25));
        const zOffset = -this.roadSegmentLength / 2 + 15 + b * 14;

        const bGeom = new THREE.BoxGeometry(width, height, depth);
        const bMesh = new THREE.Mesh(bGeom, buildingMat);
        bMesh.position.set(xDist, height / 2, zOffset);
        bMesh.frustumCulled = false;
        segGroup.add(bMesh);

        if (height > 65) {
          const spireGeom = new THREE.CylinderGeometry(0.1, 0.4, 14, 8);
          const spireMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const spireMesh = new THREE.Mesh(spireGeom, spireMat);
          spireMesh.position.set(xDist, height + 7, zOffset);
          spireMesh.frustumCulled = false;
          segGroup.add(spireMesh);
        }
      }

      this.scene.add(segGroup);
      this.roadSegments.push(segGroup);
    }
  }

  public resetRoadSegments() {
    for (let i = 0; i < this.roadSegments.length; i++) {
      this.roadSegments[i].position.z = (1 - i) * this.roadSegmentLength;
    }
  }

  private initCoinsAndObstaclesGeom() {
    // 3D Spinning Gold Coin Geometry
    this.coinGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 24);
    this.coinGeometry.rotateX(Math.PI / 2);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });
  }

  /**
   * Spawn a collectible 3D gold coin
   */
  public spawnCoin(laneIndex: number, zDistance: number) {
    if (this.activeGate) return;

    const coinGroup = new THREE.Group();
    const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    coinGroup.add(mesh);

    // Subtle inner star/circle ring
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.04, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.9, roughness: 0.1 })
    );
    coinGroup.add(innerRing);

    coinGroup.position.set(LANE_X[laneIndex], 0.8, zDistance);
    this.scene.add(coinGroup);
    this.coins.push({ group: coinGroup, lane: laneIndex, z: zDistance, collected: false });
  }

  /**
   * Spawn a road barrier obstacle
   */
  public spawnObstacle(laneIndex: number, zDistance: number, type: 'barrier' | 'cone' = 'barrier') {
    if (this.activeGate) return;

    const obstacleGroup = new THREE.Group();

    if (type === 'barrier') {
      // Construction barricade with yellow/black stripes
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 128;
      bCanvas.height = 64;
      const ctx = bCanvas.getContext('2d')!;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = '#111827';
      for (let x = -64; x < 192; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 20, 0);
        ctx.lineTo(x + 20 - 30, 64);
        ctx.lineTo(x - 30, 64);
        ctx.fill();
      }

      const barrierTex = new THREE.CanvasTexture(bCanvas);
      const barrierMat = new THREE.MeshStandardMaterial({ map: barrierTex, roughness: 0.5 });
      const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.15), barrierMat);
      board.position.y = 0.75;
      obstacleGroup.add(board);

      // Barrier legs
      const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const leftLeg = new THREE.Mesh(legGeom, legMat);
      leftLeg.position.set(-0.9, 0.6, 0);
      const rightLeg = new THREE.Mesh(legGeom, legMat);
      rightLeg.position.set(0.9, 0.6, 0);
      obstacleGroup.add(leftLeg);
      obstacleGroup.add(rightLeg);
    } else {
      // Traffic Cone
      const coneGeom = new THREE.ConeGeometry(0.4, 1.1, 16);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.y = 0.55;
      obstacleGroup.add(cone);

      const baseGeom = new THREE.BoxGeometry(0.7, 0.08, 0.7);
      const baseMesh = new THREE.Mesh(baseGeom, coneMat);
      baseMesh.position.y = 0.04;
      obstacleGroup.add(baseMesh);
    }

    obstacleGroup.position.set(LANE_X[laneIndex], 0, zDistance);
    this.scene.add(obstacleGroup);
    this.obstacles.push({ group: obstacleGroup, lane: laneIndex, z: zDistance, hit: false, type });
  }

  public removeActiveGate() {
    if (this.activeGate) {
      this.scene.remove(this.activeGate.group);
      this.activeGate.textures.forEach((t) => t.dispose());
      this.activeGate.group.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
      });
      this.activeGate = null;
    }
  }

  /**
   * Spawn dynamic 3-lane Question Portal Arch
   */
  public spawnQuestionGate(zDistance: number, question: MathQuestion) {
    this.removeActiveGate();

    // Clear any obstacles or coins ahead of the car so the highway to the question gate is completely clean
    this.coins.forEach((c) => {
      if (c.z < this.carZ) {
        this.scene.remove(c.group);
      }
    });
    this.coins = this.coins.filter((c) => c.z >= this.carZ && !c.collected);

    this.obstacles.forEach((o) => {
      if (o.z < this.carZ) {
        this.scene.remove(o.group);
      }
    });
    this.obstacles = this.obstacles.filter((o) => o.z >= this.carZ);

    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, zDistance);

    // Overhead truss / arch structure across all 3 lanes
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
    const beamGeom = new THREE.BoxGeometry(15.5, 0.5, 0.8);
    const mainBeam = new THREE.Mesh(beamGeom, trussMat);
    mainBeam.position.set(0, 5.2, 0);
    gateGroup.add(mainBeam);

    // Left and right support pillars
    const pillarGeom = new THREE.CylinderGeometry(0.3, 0.35, 5.5, 12);
    const leftPillar = new THREE.Mesh(pillarGeom, trussMat);
    leftPillar.position.set(-7.6, 2.7, 0);
    const rightPillar = new THREE.Mesh(pillarGeom, trussMat);
    rightPillar.position.set(7.6, 2.7, 0);
    gateGroup.add(leftPillar);
    gateGroup.add(rightPillar);

    const canvases: HTMLCanvasElement[] = [];
    const textures: THREE.CanvasTexture[] = [];

    // 3 Lane arch portals: Lane 0 (A), Lane 1 (B), Lane 2 (C)
    const laneLabels = ['A', 'B', 'C'];
    const laneColors = ['#06b6d4', '#f59e0b', '#10b981']; // Cyan, Amber, Emerald

    LANE_X.forEach((lx, idx) => {
      // Glowing portal frame around lane
      const frameGeom = new THREE.BoxGeometry(4.0, 0.15, 0.2);
      const frameMat = new THREE.MeshBasicMaterial({ color: laneColors[idx] });
      const topFrame = new THREE.Mesh(frameGeom, frameMat);
      topFrame.position.set(lx, 4.4, 0);
      gateGroup.add(topFrame);

      // Overhead Billboard canvas with option text
      const optCanvas = document.createElement('canvas');
      optCanvas.width = 512;
      optCanvas.height = 256;
      const oCtx = optCanvas.getContext('2d')!;

      // Background panel
      oCtx.fillStyle = '#0b1329';
      oCtx.fillRect(0, 0, 512, 256);

      // Border glow
      oCtx.strokeStyle = laneColors[idx];
      oCtx.lineWidth = 14;
      oCtx.strokeRect(7, 7, 498, 242);

      // Pill badge for [ A ], [ B ], [ C ]
      oCtx.fillStyle = laneColors[idx];
      oCtx.fillRect(20, 20, 80, 50);
      oCtx.fillStyle = '#000000';
      oCtx.font = 'bold 36px sans-serif';
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';
      oCtx.fillText(laneLabels[idx], 60, 45);

      // Lane tag
      oCtx.fillStyle = '#94a3b8';
      oCtx.font = 'bold 24px sans-serif';
      oCtx.textAlign = 'left';
      oCtx.fillText(`LANE ${idx + 1}`, 115, 45);

      // Option text
      oCtx.fillStyle = '#ffffff';
      oCtx.font = 'bold 42px sans-serif';
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';

      const optText = question.options[idx] || '';
      if (optText.length > 12) {
        oCtx.font = 'bold 32px sans-serif';
      }
      oCtx.fillText(optText, 256, 160);

      const optTex = new THREE.CanvasTexture(optCanvas);
      optTex.colorSpace = THREE.SRGBColorSpace;
      canvases.push(optCanvas);
      textures.push(optTex);

      const boardMat = new THREE.MeshBasicMaterial({ map: optTex });
      const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.8), boardMat);
      boardMesh.position.set(lx, 3.2, 0);
      gateGroup.add(boardMesh);

      // Holographic glowing laser gate threshold on the track
      const laserGeom = new THREE.PlaneGeometry(4.0, 0.4).rotateX(-Math.PI / 2);
      const laserMat = new THREE.MeshBasicMaterial({
        color: laneColors[idx],
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const laser = new THREE.Mesh(laserGeom, laserMat);
      laser.position.set(lx, 0.05, 0);
      gateGroup.add(laser);
    });

    this.scene.add(gateGroup);
    this.activeGate = {
      group: gateGroup,
      z: zDistance,
      passed: false,
      question,
      canvases,
      textures,
    };
  }

  public steerLeft() {
    if (this.targetLane > 0) {
      this.targetLane--;
    }
  }

  public steerRight() {
    if (this.targetLane < 2) {
      this.targetLane++;
    }
  }

  public steerToLane(lane: number) {
    if (lane >= 0 && lane <= 2) {
      this.targetLane = lane;
    }
  }

  public setBoosting(boosting: boolean) {
    this.isBoosting = boosting;
  }

  public setBraking(braking: boolean) {
    this.isBraking = braking;
  }

  public triggerCollisionShake() {
    this.cameraShake = 0.4;
  }

  public resetCar() {
    this.targetLane = 1;
    this.currentX = LANE_X[1];
    this.carZ = 0;
    this.speed = 0;
    this.targetSpeed = 70;
    this.carGroup.position.set(this.currentX, 0, 0);
    this.carGroup.rotation.set(0, 0, 0);

    // Immediately snap camera behind car to prevent looking backwards or into void
    const isPortrait = (this.camera.aspect || 1) < 1.0;
    this.camera.position.set(0, isPortrait ? 4.4 : 3.6, isPortrait ? 9.5 : 8.2);
    _vec3.set(0, isPortrait ? 1.4 : 1.2, -12);
    this.camera.lookAt(_vec3);

    // Reset road segments so road is ALWAYS directly under and ahead of car
    this.resetRoadSegments();
    if (this.roadTexture) this.roadTexture.offset.y = 0;
    if (this.curbTexture) this.curbTexture.offset.y = 0;

    // Clean up dynamic entities
    this.coins.forEach((c) => this.scene.remove(c.group));
    this.coins = [];
    this.obstacles.forEach((o) => this.scene.remove(o.group));
    this.obstacles = [];
    this.removeActiveGate();
  }

  private startLoop() {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        // Safe paced callback for software WebGL
        const gl = this.renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            this.frameId = window.setTimeout(poll, 4);
          } else {
            gl.deleteSync(sync);
            this.frameId = window.setTimeout(() => tick(performance.now()), 20);
          }
        };
        this.frameId = window.setTimeout(poll, 4);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      tick(performance.now());
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private update(dt: number) {
    if (this.isTitleScreen) {
      // Cinematic orbit around sports car
      this.titleOrbitAngle += dt * 0.4;
      const radius = 9.0;
      this.camera.position.x = Math.sin(this.titleOrbitAngle) * radius;
      this.camera.position.z = Math.cos(this.titleOrbitAngle) * radius;
      this.camera.position.y = 3.2 + Math.sin(this.titleOrbitAngle * 1.5) * 0.5;
      this.camera.lookAt(0, 0.8, 0);

      // Animate road texture offset smoothly WITHOUT displacing 3D meshes!
      if (this.roadTexture) {
        this.roadTexture.offset.y -= dt * 1.5;
      }
      if (this.curbTexture) {
        this.curbTexture.offset.y -= dt * 1.5;
      }
      return;
    }

    // --- GAMEPLAY UPDATE ---

    // 1. Speed dynamics
    let desiredSpeed = 75; // base 75 km/h
    if (this.isBoosting) desiredSpeed = 135;
    if (this.isBraking) desiredSpeed = 40;

    this.speed = THREE.MathUtils.damp(this.speed, desiredSpeed, 4, dt);
    const speedMs = (this.speed * 1000) / 3600;

    // Advance forward (Z goes negative)
    this.carZ -= speedMs * dt;

    // 2. Smooth steering interpolation across lanes
    const targetX = LANE_X[this.targetLane];
    const prevX = this.currentX;
    this.currentX = THREE.MathUtils.damp(this.currentX, targetX, 10, dt);
    const lateralSpeed = (this.currentX - prevX) / dt;

    this.carGroup.position.x = this.currentX;
    this.carGroup.position.z = this.carZ;

    // Tilting car into turns
    const rollAngle = -lateralSpeed * 0.04;
    const yawAngle = -lateralSpeed * 0.02;
    this.carGroup.rotation.z = THREE.MathUtils.damp(this.carGroup.rotation.z, rollAngle, 12, dt);
    this.carGroup.rotation.y = THREE.MathUtils.damp(this.carGroup.rotation.y, yawAngle, 12, dt);

    // 3. Wheel rotation
    const wheelRotSpeed = (speedMs / 0.42) * dt;
    this.carWheels.forEach((wheel) => {
      wheel.children[0].rotation.x += wheelRotSpeed;
      wheel.children[1].rotation.x += wheelRotSpeed;
    });

    // 4. Seamless gap-free road looping (recycles segments that fall 110m behind)
    for (const seg of this.roadSegments) {
      if (seg.position.z - this.carZ > 110) {
        let minZ = this.carZ;
        for (const s of this.roadSegments) {
          if (s.position.z < minZ) minZ = s.position.z;
        }
        seg.position.z = minZ - this.roadSegmentLength;
      }
    }

    // 6. Coins update & collision
    this.coins.forEach((c) => {
      // Spin
      c.group.rotation.y += dt * 3.5;
      c.group.position.y = 0.8 + Math.sin(performance.now() * 0.005 + c.z) * 0.15;

      // Check collision
      if (!c.collected && Math.abs(c.z - this.carZ) < 1.8) {
        if (Math.abs(c.group.position.x - this.currentX) < 1.4) {
          c.collected = true;
          this.scene.remove(c.group);
          this.callbacks.onCollectCoin(1);
        }
      }
    });

    // Remove old passed coins
    this.coins = this.coins.filter((c) => {
      if (c.z > this.carZ + 15) {
        this.scene.remove(c.group);
        return false;
      }
      return !c.collected;
    });

    // 7. Obstacle collision
    this.obstacles.forEach((o) => {
      if (!o.hit && Math.abs(o.z - this.carZ) < 1.8) {
        if (Math.abs(o.group.position.x - this.currentX) < 1.3) {
          o.hit = true;
          this.triggerCollisionShake();
          this.callbacks.onHitObstacle();

          // Obstacle smash animation
          o.group.position.y += 1.5;
          o.group.rotation.x += 1.0;
        }
      }
    });

    this.obstacles = this.obstacles.filter((o) => {
      if (o.z > this.carZ + 15) {
        this.scene.remove(o.group);
        return false;
      }
      return true;
    });

    // 8. Question Gate Passing Detection
    if (this.activeGate && !this.activeGate.passed) {
      if (this.carZ <= this.activeGate.z) {
        this.activeGate.passed = true;
        // Determine player's closest lane
        let chosenLane = 1;
        let minDiff = 999;
        LANE_X.forEach((lx, idx) => {
          const diff = Math.abs(this.currentX - lx);
          if (diff < minDiff) {
            minDiff = diff;
            chosenLane = idx;
          }
        });
        this.callbacks.onPassGate(chosenLane);
      }
    }

    // 9. Camera Follow
    const isPortrait = (this.camera.aspect || 1) < 1.0;
    const cameraTargetZ = this.carZ + (isPortrait ? 9.5 : 8.2);
    const cameraTargetX = this.currentX * (isPortrait ? 0.5 : 0.65);
    const cameraTargetY = (isPortrait ? 4.4 : 3.6) + (this.isBoosting ? -0.2 : 0);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, cameraTargetX, 9, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, cameraTargetY, 8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, cameraTargetZ, 12, dt);

    // Apply camera shake if any
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.5);
    }

    _vec3.set(this.currentX * 0.25, isPortrait ? 1.4 : 1.2, this.carZ - 12);
    this.camera.lookAt(_vec3);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    if (this.camera.aspect < 0.9) {
      this.camera.fov = 76;
    } else if (this.camera.aspect < 1.2) {
      this.camera.fov = 68;
    } else {
      this.camera.fov = 60;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }
    this.renderer.dispose();
  }
}
