import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ==========================================================================
   DJI Air 3S · Structure Deconstruction Lab
   All geometry, decals and materials are generated at runtime.
   ========================================================================== */

const LABEL_SIDE_PREFERENCE = {
  airframe: -1,
  gimbal: 1,
  battery: 1,
  arms: -1,
  motors: 1,
  propellers: 1,
  sensing: -1,
};

const RETICLE_SCALE = {
  airframe: 2.35,
  gimbal: 1.15,
  battery: 1.2,
  arms: 1.85,
  motors: 1.02,
  propellers: 1.55,
  sensing: 0.86,
};

const PART_DATA = [
  {
    id: 'airframe',
    code: '01',
    name: '机身主体',
    en: 'AIRFRAME',
    callout: '724 g · 折叠 214 mm',
    summary: '高强度复合机身',
    description:
      'Air 3S 的一体化机身由高强度复合材料与轻量化骨架构成，将飞控、图传天线和散热风道压缩在紧凑壳体内。整机起飞重量仅 724 克，折叠后长度约 214 毫米，单手即可携带。',
    note: '机身顶部集成智能电池仓，前部为双摄云台与全向感知系统的安装基座。',
    specs: [
      ['起飞重量', '724 g'],
      ['折叠尺寸', '214.19 × 100.63 × 89.17 mm'],
      ['展开尺寸', '266.11 × 325.47 × 106.00 mm'],
      ['机载内存', '42 GB'],
    ],
  },
  {
    id: 'gimbal',
    code: '02',
    name: '双摄云台',
    en: 'DUAL CAMERA GIMBAL',
    callout: '1" CMOS + 1/1.3" CMOS · 三轴',
    summary: '双一英寸级影像系统',
    description:
      '双摄采用上下堆叠布局：上方是一英寸 5000 万像素广角相机，下方是 1/1.3 英寸 4800 万像素中长焦相机。三轴机械云台以毫秒级响应抵消机身抖动，让两种焦段共享同一套稳定系统。',
    note: '双摄均支持 4K/120fps 视频与 10-bit D-Log M 色彩模式，稳定角度抖动量约 ±0.0037°。',
    specs: [
      ['广角相机', '1 英寸 CMOS / 5000 万'],
      ['中长焦相机', '1/1.3 英寸 / 4800 万'],
      ['等效焦距', '24 mm / 70 mm'],
      ['稳定系统', '三轴机械云台'],
      ['光圈', 'f/1.8 / f/2.8'],
      ['视频规格', '4K / 120 fps'],
    ],
  },
  {
    id: 'battery',
    code: '03',
    name: '智能电池',
    en: 'INTELLIGENT BATTERY',
    callout: '4276 mAh · 62.5 Wh',
    summary: '4S 高能量锂离子电池',
    description:
      '四芯串联锂离子电池为 Air 3S 提供最长 45 分钟飞行时间。电池顶部集成了四颗电量指示灯与电源按键，电芯管理芯片持续监控温度、电压与循环状态。',
    note: '电池重量约 247 克，支持 65W 便携充电器约 80 分钟充满；机身电池仓采用导轨式锁扣结构。',
    specs: [
      ['容量', '4276 mAh'],
      ['能量', '62.5 Wh'],
      ['标称电压', '14.6 V'],
      ['电池类型', 'Li-ion 4S'],
      ['重量', '约 247 g'],
      ['最长飞行', '45 分钟'],
    ],
  },
  {
    id: 'arms',
    code: '04',
    name: '折叠机臂',
    en: 'FOLDING ARMS',
    callout: '4× 折叠机臂 · O4 天线',
    summary: '轻量化折叠结构',
    description:
      '四根机臂通过阻尼转轴与机身连接，可在收纳时向内折叠。臂体内埋入 O4 图传天线与走线通道，外露的铰链与加强筋共同承担飞行中的弯矩与振动。',
    note: '展开后最大轴距约 325.47 毫米，六天线二发四收，图传最远可达 20 公里（FCC 标准）。',
    specs: [
      ['结构', '4× 可折叠机臂'],
      ['展开轴距', '325.47 mm'],
      ['图传系统', 'O4 / 六天线'],
      ['天线配置', '二发四收'],
      ['机身材质', '高强度复合材料'],
      ['折叠方式', '阻尼内折'],
    ],
  },
  {
    id: 'motors',
    code: '05',
    name: '无刷电机',
    en: 'BRUSHLESS MOTORS',
    callout: '4× 无刷电机 · 低噪驱动',
    summary: '四轴无刷动力单元',
    description:
      '四颗无刷电机通过电子调速器独立控制转速，外转子结构在有限体积内输出高扭矩。电机底座加入减振结构，与低噪桨叶共同抑制高频振动向机身传递。',
    note: '电机上盖采用散热鳍片设计，可利用旋翼下洗气流持续带走定子热量。',
    specs: [
      ['数量', '4× 无刷电机'],
      ['结构', '外转子无刷'],
      ['驱动', '独立电子调速'],
      ['冷却', '旋翼下洗风冷'],
      ['控制', '四轴差速'],
      ['特性', '低噪动力输出'],
    ],
  },
  {
    id: 'propellers',
    code: '06',
    name: '折叠螺旋桨',
    en: 'FOLDING PROPELLERS',
    callout: '4× 双叶折叠桨 · 低噪',
    summary: '低噪快拆气动桨叶',
    description:
      '每一组双叶螺旋桨都以快拆结构固定在电机轴上，桨叶可沿轴向折叠收纳。翼型弦长与桨尖后掠角经过低噪优化，在提供充足推力的同时降低高频噪声。',
    note: '安装时请确认桨叶卡扣完全到位；桨叶表面纹理用于指示旋转方向。',
    specs: [
      ['数量', '4× 双叶桨'],
      ['安装', '快拆式'],
      ['收纳', '折叠桨叶'],
      ['叶片', '低噪气动翼型'],
      ['材质', '复合工程塑料'],
      ['适配', 'DJI Air 3S'],
    ],
  },
  {
    id: 'sensing',
    code: '07',
    name: '视觉感知系统',
    en: 'VISION SENSING',
    callout: '全向双目 + 前视 LiDAR',
    summary: '全向避障与激光测距',
    description:
      'Air 3S 采用全向双目视觉系统，并在机身前方加入激光雷达以增强夜间与低光环境下的障碍物探测。下视红外传感器负责低空测距，为降落与悬停提供稳定参考。',
    note: '前视激光雷达夜间测距范围约 0.5–25 米；下视红外测距范围约 0.3–8 米。',
    specs: [
      ['感知类型', '全向双目视觉'],
      ['前视激光雷达', '0.5–25 m / 夜间'],
      ['下视红外', '0.3–8 m'],
      ['前视 FOV', '水平 90° / 垂直 72°'],
      ['有效避障速度', '≤ 15 m/s'],
      ['辅助系统', '前视 LiDAR + 下视 IR'],
    ],
  },
];

const ROOT_Y = 0.74;
const HOME_POSITION = new THREE.Vector3(3.82, 2.62, 5.38);
const HOME_TARGET = new THREE.Vector3(0, 0.4, 0);
const HOME_DIRECTION = HOME_POSITION.clone().sub(HOME_TARGET).normalize();

const queryParams = new URLSearchParams(window.location.search);
const LOW_QUALITY = queryParams.get('quality') === 'low';

const state = {
  booted: false,
  hovered: null,
  selected: null,
  autoRotate: false,
  touring: false,
  tourTime: 0,
  tourIndex: 0,
  showIntroLabel: true,
  guideOpen: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  pointerDown: false,
  pointerMoved: false,
  pointerStartX: 0,
  pointerStartY: 0,
};

const runtime = new Map();
const pickables = [];
const propSpinners = [];
const labelElements = new Map();
const materialCache = new Map();
const tempVec = new THREE.Vector3();
const tempVecB = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const tempIdentity = new THREE.Quaternion();
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

let scene;
let camera;
let renderer;
let controls;
let composer;
let bloomPass;
let lastFrameTimestamp = 0;
let animationTime = 0;
let droneRoot;
let floorGlow;
let orbitRingGroup;
let particleField;
let selectionHalo;
let selectionReticle;
let selectionLight;
let introStarted = false;
let cameraTween = null;
let toastTimer = null;
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;

let fpsFrames = 0;
let fpsClock = 0;
let displayedFps = 60;

const dom = {
  canvas: document.getElementById('scene'),
  boot: document.getElementById('bootScreen'),
  bootBar: document.getElementById('bootBar'),
  bootPercent: document.getElementById('bootPercent'),
  bootStatus: document.getElementById('bootStatus'),
  app: document.getElementById('app'),
  partList: document.getElementById('partList'),
  explodedCount: document.getElementById('explodedCount'),
  assemblyProgress: document.getElementById('assemblyProgress'),
  assemblyPercent: document.getElementById('assemblyPercent'),
  assemblyState: document.getElementById('assemblyState'),
  sequenceCount: document.getElementById('sequenceCount'),
  sequenceBars: document.getElementById('sequenceBars'),
  profileView: document.getElementById('profileView'),
  detailView: document.getElementById('detailView'),
  infoPanel: document.getElementById('infoPanel'),
  partsPanel: document.getElementById('partsPanel'),
  partsToggle: document.getElementById('partsToggle'),
  partsCollapse: document.getElementById('partsCollapse'),
  explodeAllButton: document.getElementById('explodeAllButton'),
  explodeAllLabel: document.getElementById('explodeAllLabel'),
  tourButton: document.getElementById('tourButton'),
  rotateButton: document.getElementById('rotateButton'),
  resetButton: document.getElementById('resetButton'),
  helpButton: document.getElementById('helpButton'),
  guideModal: document.getElementById('guideModal'),
  closeGuideButton: document.getElementById('closeGuideButton'),
  profilePrompt: document.getElementById('profilePrompt'),
  hoverTip: document.getElementById('hoverTip'),
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toastText'),
  labelsLayer: document.getElementById('labelsLayer'),
  labelLines: document.getElementById('labelLines'),
  labelNodes: document.getElementById('labelNodes'),
  fpsValue: document.getElementById('fpsValue'),
  viewModeLabel: document.getElementById('viewModeLabel'),
  axisX: document.getElementById('axisX'),
  axisY: document.getElementById('axisY'),
  axisZ: document.getElementById('axisZ'),
  brand: document.querySelector('.brand'),
};

/* ==========================================================================
   Scene setup
   ========================================================================== */

function init() {
  try {
    setupRenderer();
    setupScene();
    setupCamera();
    setupEnvironment();
    setupLights();
    setupBackdrop();
    setupStage();
    setupParticles();
    setupSelectionMarker();
    buildDrone();
    setupPostProcessing();
    buildInterface();
    bindEvents();
    runBootSequence();
    lastFrameTimestamp = performance.now();
    requestAnimationFrame(animate);
  } catch (error) {
    console.error('[AIR 3S] Initialization failed:', error);
    if (dom.bootStatus) dom.bootStatus.textContent = 'WEBGL INITIALIZATION FAILED';
    if (dom.bootPercent) dom.bootPercent.textContent = 'ERR';
    if (dom.bootBar) {
      dom.bootBar.style.background = '#ff806e';
      dom.bootBar.style.width = '100%';
    }
  }
}

function getTargetPixelRatio() {
  if (LOW_QUALITY) return 0.72;
  const mobile = window.innerWidth <= 860;
  return Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75);
}

function setupRenderer() {
  const pixelRatio = getTargetPixelRatio();
  renderer = new THREE.WebGLRenderer({
    canvas: dom.canvas,
    antialias: !LOW_QUALITY,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x03070a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = !LOW_QUALITY;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.info.autoReset = true;
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03070a);
  scene.fog = new THREE.Fog(0x03080b, 13, 29);
}

function getCameraConfig() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const mobile = width <= 860;
  const portrait = height > width * 1.08;
  let homeDistance = 6.96;
  let explodedDistance = 8.7;
  if (width <= 1080) {
    homeDistance = 8.35;
    explodedDistance = 9.9;
  } else if (width <= 1320) {
    homeDistance = 7.6;
    explodedDistance = 9.15;
  }
  if (mobile) {
    homeDistance = portrait ? 10.9 : 9.7;
    explodedDistance = portrait ? 13.2 : 10.9;
  }
  return {
    fov: mobile ? (portrait ? 42 : 38) : 33,
    homeDistance,
    explodedDistance,
    maxDistance: mobile ? 18 : 13.5,
  };
}

function getHomePosition() {
  return HOME_TARGET.clone().addScaledVector(HOME_DIRECTION, getCameraConfig().homeDistance);
}

function setupCamera() {
  const config = getCameraConfig();
  camera = new THREE.PerspectiveCamera(config.fov, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(getHomePosition());
  camera.lookAt(HOME_TARGET);

  controls = new OrbitControls(camera, dom.canvas);
  controls.target.copy(HOME_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.058;
  controls.rotateSpeed = 0.66;
  controls.zoomSpeed = 0.82;
  controls.panSpeed = 0.58;
  controls.screenSpacePanning = true;
  controls.minDistance = 3.35;
  controls.maxDistance = config.maxDistance;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI * 0.488;
  controls.autoRotateSpeed = 0.62;
  controls.update();
}

function setupEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const environmentMap = pmrem.fromScene(environment, 0.035).texture;
  scene.environment = environmentMap;
  scene.environmentIntensity = 0.52;
  environment.dispose();
  pmrem.dispose();
}

function setupLights() {
  scene.add(new THREE.HemisphereLight(0x9ecdd8, 0x06090b, 0.62));

  const key = new THREE.DirectionalLight(0xffedda, 1.75);
  key.position.set(5.3, 8.2, 5.4);
  key.castShadow = true;
  const shadowSize = window.innerWidth <= 860 ? 1024 : 1536;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 22;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 4;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x23d8f0, 2.1);
  rim.position.set(-5.4, 2.8, -5.2);
  scene.add(rim);

  const warmRim = new THREE.DirectionalLight(0xffa56d, 0.95);
  warmRim.position.set(4.5, 1.4, -4.4);
  scene.add(warmRim);

  const fill = new THREE.DirectionalLight(0x608ea0, 0.58);
  fill.position.set(-1.5, 1.1, 5.6);
  scene.add(fill);

  const warmAccent = new THREE.PointLight(0xff924f, 1.35, 5.2, 2);
  warmAccent.position.set(2.8, 1.8, -1.5);
  scene.add(warmAccent);
}

function setupBackdrop() {
  const geometry = new THREE.SphereGeometry(36, 32, 18);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {},
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 bottom = vec3(0.006, 0.011, 0.014);
        vec3 top = vec3(0.012, 0.031, 0.038);
        vec3 col = mix(bottom, top, smoothstep(0.12, 0.92, h));

        float centerGlow = exp(-pow(length(vDir.xy - vec2(0.0, 0.08)), 2.0) * 5.4);
        col += vec3(0.018, 0.085, 0.094) * centerGlow * 0.55;

        float warmGlow = exp(-pow(length(vDir.xy - vec2(0.62, -0.2)), 2.0) * 8.5);
        col += vec3(0.065, 0.034, 0.015) * warmGlow * 0.45;

        float coldGlow = exp(-pow(length(vDir.xy - vec2(-0.72, 0.25)), 2.0) * 7.0);
        col += vec3(0.01, 0.045, 0.056) * coldGlow * 0.4;

        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        col += (grain - 0.5) * 0.0022;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(geometry, material));

  // A faint distant horizon.
  const horizon = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 16),
    new THREE.MeshBasicMaterial({
      color: 0x0b333b,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  horizon.position.set(0, 1.2, -18);
  scene.add(horizon);
}

function makeRadialTexture(size, stops, colorSpace = THREE.SRGBColorSpace) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}

function setupStage() {
  const stageMaterial = new THREE.MeshStandardMaterial({
    color: 0x020608,
    metalness: 0.2,
    roughness: 0.68,
    envMapIntensity: 0.15,
  });
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.82, 0.13, 72), stageMaterial);
  stage.position.y = -1.34;
  stage.receiveShadow = true;
  scene.add(stage);

  const outerGround = new THREE.Mesh(
    new THREE.CircleGeometry(32, 80),
    new THREE.MeshStandardMaterial({
      color: 0x03080a,
      metalness: 0.42,
      roughness: 0.72,
      envMapIntensity: 0.3,
    })
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -1.42;
  outerGround.receiveShadow = true;
  scene.add(outerGround);

  const glowTexture = makeRadialTexture(512, [
    [0, 'rgba(21, 92, 105, 0.1)'],
    [0.22, 'rgba(16, 68, 79, 0.055)'],
    [0.58, 'rgba(7, 30, 36, 0.02)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]);
  floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 7.8),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -1.268;
  scene.add(floorGlow);

  const shadowTexture = makeRadialTexture(256, [
    [0, 'rgba(0, 0, 0, 0.64)'],
    [0.34, 'rgba(0, 0, 0, 0.4)'],
    [0.72, 'rgba(0, 0, 0, 0.09)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.12, 2.42),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      toneMapped: false,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0.18, -1.255, 0.2);
  scene.add(contactShadow);

  orbitRingGroup = new THREE.Group();
  orbitRingGroup.position.y = -1.255;

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x54dfec,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(2.78, 2.788, 180), ringMaterial.clone());
  innerRing.material.opacity = 0.28;
  orbitRingGroup.add(innerRing);

  const outerRing = new THREE.Mesh(new THREE.RingGeometry(3.44, 3.446, 180), ringMaterial.clone());
  outerRing.material.opacity = 0.14;
  orbitRingGroup.add(outerRing);

  const brokenArc = new THREE.Mesh(
    new THREE.TorusGeometry(3.06, 0.006, 4, 90, Math.PI * 1.12),
    new THREE.MeshBasicMaterial({
      color: 0x8df8ff,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  brokenArc.rotation.x = Math.PI / 2;
  brokenArc.rotation.z = 0.38;
  brokenArc.position.y = 0.004;
  orbitRingGroup.add(brokenArc);

  const tickCount = 48;
  const tickPositions = new Float32Array(tickCount * 2 * 3);
  for (let i = 0; i < tickCount; i += 1) {
    const angle = (i / tickCount) * Math.PI * 2;
    const isMajor = i % 4 === 0;
    const r1 = 3.2;
    const r2 = r1 + (isMajor ? 0.11 : 0.048);
    const index = i * 6;
    tickPositions[index] = Math.cos(angle) * r1;
    tickPositions[index + 1] = 0;
    tickPositions[index + 2] = Math.sin(angle) * r1;
    tickPositions[index + 3] = Math.cos(angle) * r2;
    tickPositions[index + 4] = 0;
    tickPositions[index + 5] = Math.sin(angle) * r2;
  }
  const tickGeometry = new THREE.BufferGeometry();
  tickGeometry.setAttribute('position', new THREE.BufferAttribute(tickPositions, 3));
  const ticks = new THREE.LineSegments(
    tickGeometry,
    new THREE.LineBasicMaterial({
      color: 0x66d9e5,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  orbitRingGroup.add(ticks);
  scene.add(orbitRingGroup);

  const grid = new THREE.GridHelper(36, 72, 0x18414a, 0x0b2025);
  grid.position.y = -1.395;
  grid.material.transparent = true;
  grid.material.opacity = 0.21;
  grid.material.depthWrite = false;
  scene.add(grid);
}

function setupSelectionMarker() {
  const haloTexture = makeRadialTexture(256, [
    [0, 'rgba(112, 245, 255, 0.4)'],
    [0.22, 'rgba(55, 205, 222, 0.22)'],
    [0.58, 'rgba(24, 113, 128, 0.08)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]);
  const haloMaterial = new THREE.SpriteMaterial({
    map: haloTexture,
    color: 0x83f7ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  selectionHalo = new THREE.Sprite(haloMaterial);
  selectionHalo.scale.set(0.9, 0.9, 1);
  selectionHalo.renderOrder = 6;
  scene.add(selectionHalo);

  const reticleTexture = makeTexture(512, 512, (ctx, width, height) => {
    const cx = width / 2;
    const cy = height / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(112, 245, 255, 0.62)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, 174, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(112, 245, 255, 0.34)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, -224);
      ctx.lineTo(0, -190);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -176);
      ctx.lineTo(0, -168);
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(112, 245, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, 216, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(125, 249, 255, 0.7)';
    ctx.fillRect(-2, -236, 4, 9);
    ctx.fillRect(-2, 227, 4, 9);
  });
  const reticleMaterial = new THREE.SpriteMaterial({
    map: reticleTexture,
    color: 0xa4fbff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  selectionReticle = new THREE.Sprite(reticleMaterial);
  selectionReticle.scale.set(2.1, 2.1, 1);
  selectionReticle.renderOrder = 7;
  scene.add(selectionReticle);

  selectionLight = new THREE.PointLight(0x5fefff, 0, 2.2, 2);
  scene.add(selectionLight);
}

function setupParticles() {
  const count = 300;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorA = new THREE.Color(0x69dbe8);
  const colorB = new THREE.Color(0xb7edf2);
  for (let i = 0; i < count; i += 1) {
    const radius = 4.2 + Math.random() * 10.5;
    const angle = Math.random() * Math.PI * 2;
    const height = -0.9 + Math.random() * 7.2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    const color = Math.random() > 0.74 ? colorB : colorA;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.019,
    vertexColors: true,
    transparent: true,
    opacity: 0.52,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  particleField = new THREE.Points(geometry, material);
  particleField.position.y = 0;
  scene.add(particleField);
}

function setupPostProcessing() {
  if (LOW_QUALITY) {
    composer = null;
    return;
  }

  composer = new EffectComposer(renderer);
  composer.setPixelRatio(getTargetPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);

  composer.addPass(new RenderPass(scene, camera));

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.26,
    0.58,
    0.84
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}

/* ==========================================================================
   Materials & geometry helpers
   ========================================================================== */

const MATERIAL_PRESETS = {
  shell: {
    color: 0x353a3e,
    metalness: 0.76,
    roughness: 0.33,
    clearcoat: 0.42,
    clearcoatRoughness: 0.26,
    envMapIntensity: 1.05,
  },
  shellLight: {
    color: 0x41474b,
    metalness: 0.64,
    roughness: 0.36,
    clearcoat: 0.3,
    envMapIntensity: 1.1,
  },
  shellDark: {
    color: 0x20262a,
    metalness: 0.8,
    roughness: 0.33,
    clearcoat: 0.25,
    envMapIntensity: 1.0,
  },
  dark: {
    color: 0x0c1114,
    metalness: 0.58,
    roughness: 0.43,
    envMapIntensity: 0.82,
  },
  rubber: {
    color: 0x06090b,
    metalness: 0.12,
    roughness: 0.88,
    envMapIntensity: 0.25,
  },
  metal: {
    color: 0x9ba7aa,
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 1.35,
  },
  metalDark: {
    color: 0x596266,
    metalness: 0.95,
    roughness: 0.27,
    envMapIntensity: 1.2,
  },
  copper: {
    color: 0x9d6746,
    metalness: 0.94,
    roughness: 0.32,
    emissive: 0x281307,
    emissiveIntensity: 0.32,
    envMapIntensity: 1.1,
  },
  glass: {
    color: 0x050b10,
    metalness: 0.28,
    roughness: 0.055,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.85,
    transparent: true,
    opacity: 0.94,
  },
  prop: {
    color: 0x1e2427,
    metalness: 0.28,
    roughness: 0.52,
    clearcoat: 0.22,
    clearcoatRoughness: 0.38,
    envMapIntensity: 0.72,
    side: THREE.DoubleSide,
  },
};

function materialFor(partId, type, overrides = {}) {
  const cacheKey = `${partId}:${type}:${JSON.stringify(overrides)}`;
  if (materialCache.has(cacheKey)) return materialCache.get(cacheKey);

  const preset = MATERIAL_PRESETS[type] || MATERIAL_PRESETS.shell;
  const material = new THREE.MeshPhysicalMaterial({ ...preset, ...overrides });
  material.userData.baseEmissive = material.emissive.clone();
  material.userData.baseEmissiveIntensity = material.emissiveIntensity;
  materialCache.set(cacheKey, material);
  return material;
}

function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

const UNIT_Y = new THREE.Vector3(0, 1, 0);

function cylinderBetween(parent, start, end, radiusTop, radiusBottom, material, radialSegments = 12) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, radialSegments, 1, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function createLoftGeometry(rings, segments = 32) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const exponent = 2 / 2.85;

  rings.forEach((ring, ringIndex) => {
    for (let i = 0; i < segments; i += 1) {
      const theta = (i / segments) * Math.PI * 2;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const rx = Math.sign(c) * Math.pow(Math.abs(c), exponent) * ring.rx;
      const ryAmount = s >= 0 ? ring.ry : ring.ry * 0.78;
      const ry = Math.sign(s) * Math.pow(Math.abs(s), exponent) * ryAmount;
      positions.push(rx, ring.cy + ry, ring.z);
      uvs.push(i / segments, ringIndex / (rings.length - 1));
    }
  });

  for (let r = 0; r < rings.length - 1; r += 1) {
    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments;
      const a = r * segments + i;
      const b = r * segments + next;
      const c = (r + 1) * segments + next;
      const d = (r + 1) * segments + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const frontCenter = positions.length / 3;
  positions.push(0, rings[rings.length - 1].cy, rings[rings.length - 1].z);
  uvs.push(0.5, 1);
  const backCenter = positions.length / 3;
  positions.push(0, rings[0].cy, rings[0].z);
  uvs.push(0.5, 0);

  const lastStart = (rings.length - 1) * segments;
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    indices.push(frontCenter, lastStart + i, lastStart + next);
    indices.push(backCenter, next, i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
  return texture;
}

function drawSpacedText(ctx, text, x, y, spacing) {
  let cursor = x;
  for (const character of text) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + spacing;
  }
}

function makeLogos() {
  return makeTexture(512, 192, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(10, 0);
    ctx.transform(1, 0, -0.11, 1, 0, 0);
    ctx.fillStyle = 'rgba(222, 233, 236, 0.82)';
    ctx.font = '900 132px "Arial Narrow", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('dji', 38, height * 0.5);
    ctx.restore();

    ctx.fillStyle = 'rgba(205, 222, 226, 0.55)';
    ctx.font = '500 25px "Bahnschrift", "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    drawSpacedText(ctx, 'AIR 3S', 292, height * 0.45, 3);

    ctx.strokeStyle = 'rgba(160, 205, 212, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(292, 119);
    ctx.lineTo(475, 119);
    ctx.stroke();
  });
}

function makeBatteryDecal() {
  return makeTexture(512, 128, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(210, 224, 226, 0.5)';
    ctx.font = '500 20px "Bahnschrift", "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    drawSpacedText(ctx, 'INTELLIGENT FLIGHT BATTERY', 16, 34, 2.1);
    ctx.fillStyle = 'rgba(155, 190, 196, 0.32)';
    ctx.font = '400 16px "Consolas", monospace';
    drawSpacedText(ctx, '4276 mAh   |   62.5 Wh   |   14.6 V', 16, 77, 1.1);
    ctx.strokeStyle = 'rgba(120, 187, 196, 0.23)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 101);
    ctx.lineTo(320, 101);
    ctx.stroke();
    ctx.fillStyle = 'rgba(112, 245, 255, 0.28)';
    ctx.fillRect(338, 27, 5, 55);
  });
}

function makeCameraSideDecal() {
  return makeTexture(256, 128, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.transform(1, 0, -0.12, 1, 0, 0);
    ctx.fillStyle = 'rgba(214, 227, 230, 0.56)';
    ctx.font = '900 67px "Arial Narrow", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('dji', 13, 59);
    ctx.restore();
    ctx.fillStyle = 'rgba(160, 196, 202, 0.36)';
    ctx.font = '500 16px "Bahnschrift", sans-serif';
    drawSpacedText(ctx, 'DUAL CAMERA', 128, 59, 1.6);
    ctx.strokeStyle = 'rgba(150, 195, 200, 0.26)';
    ctx.beginPath();
    ctx.moveTo(13, 96);
    ctx.lineTo(220, 96);
    ctx.stroke();
  });
}

function makeLensTexture() {
  return makeTexture(512, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const radius = width * 0.5;
    const base = ctx.createRadialGradient(cx, cy, radius * 0.04, cx, cy, radius);
    base.addColorStop(0, '#0b1720');
    base.addColorStop(0.32, '#050c12');
    base.addColorStop(0.68, '#020507');
    base.addColorStop(1, '#060c0f');
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const aperture = ctx.createRadialGradient(cx - 30, cy - 36, 4, cx, cy, radius * 0.42);
    aperture.addColorStop(0, 'rgba(50, 143, 162, 0.35)');
    aperture.addColorStop(0.5, 'rgba(14, 51, 63, 0.18)');
    aperture.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aperture;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(112, 245, 255, 0.34)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.77, Math.PI * 1.08, Math.PI * 1.46);
    ctx.stroke();

    const highlight = ctx.createRadialGradient(cx - 90, cy - 100, 1, cx - 90, cy - 100, radius * 0.23);
    highlight.addColorStop(0, 'rgba(230, 250, 255, 0.8)');
    highlight.addColorStop(0.22, 'rgba(130, 208, 220, 0.22)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(cx - 90, cy - 100, radius * 0.23, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(90, 139, 148, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function addDecal(parent, texture, width, height, position, rotation = [0, 0, 0], opacity = 0.82) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.renderOrder = 3;
  mesh.userData.noShadow = true;
  mesh.userData.noGlow = true;
  parent.add(mesh);
  return mesh;
}

/* ==========================================================================
   Drone construction
   ========================================================================== */

function buildDrone() {
  droneRoot = new THREE.Group();
  droneRoot.name = 'DJI Air 3S';
  droneRoot.position.y = ROOT_Y;
  scene.add(droneRoot);

  const logoTexture = makeLogos();
  const batteryTexture = makeBatteryDecal();
  const cameraSideTexture = makeCameraSideDecal();
  const lensTexture = makeLensTexture();

  const airframeRoot = buildAirframe(logoTexture);
  const gimbalRoot = buildGimbal(cameraSideTexture, lensTexture);
  const batteryRoot = buildBattery(batteryTexture);
  const armRoots = buildArms();
  const motorRoots = buildMotors();
  const propellerRoots = buildPropellers();
  const sensingRoot = buildSensing(lensTexture);

  const groups = [airframeRoot, gimbalRoot, batteryRoot, ...armRoots, ...motorRoots, ...propellerRoots, sensingRoot];
  groups.forEach((group) => droneRoot.add(group));

  registerPart(PART_DATA[0], [partRoot(airframeRoot)], {
    anchorRoot: 0,
    anchorLocal: [0, 0.23, 0.17],
  });

  registerPart(PART_DATA[1], [partRoot(gimbalRoot, [0, -0.27, 0.78])], {
    anchorRoot: 0,
    anchorLocal: [0, -0.25, 0.94],
  });

  registerPart(PART_DATA[2], [partRoot(batteryRoot, [0, 0.78, -0.1], [0.14, 0, 0.055])], {
    anchorRoot: 0,
    anchorLocal: [0, 0.35, -0.28],
  });

  const armOffsets = [
    [-0.34, 0.09, 0.23],
    [0.34, 0.09, 0.23],
    [-0.38, 0.09, -0.24],
    [0.38, 0.09, -0.24],
  ];
  registerPart(
    PART_DATA[3],
    armRoots.map((root, index) =>
      partRoot(root, armOffsets[index], [0, index < 2 ? (index === 0 ? 0.06 : -0.06) : index === 2 ? 0.04 : -0.04, 0])
    ),
    { anchorRoot: 1, anchorLocal: [0.67, 0.055, 0.52] }
  );

  const motorOffsets = [
    [-0.28, 0.42, 0.24],
    [0.28, 0.42, 0.24],
    [-0.31, 0.42, -0.28],
    [0.31, 0.42, -0.28],
  ];
  registerPart(
    PART_DATA[4],
    motorRoots.map((root, index) => partRoot(root, motorOffsets[index])),
    { anchorRoot: 1, anchorLocal: [0.06, 0.12, 0.06] }
  );

  const propellerOffsets = [
    [-0.5, 0.93, 0.36],
    [0.5, 0.93, 0.36],
    [-0.55, 0.9, -0.4],
    [0.55, 0.9, -0.4],
  ];
  registerPart(
    PART_DATA[5],
    propellerRoots.map((root, index) => partRoot(root, propellerOffsets[index], [0, index % 2 === 0 ? 0.26 : -0.2, 0])),
    { anchorRoot: 1, anchorLocal: [0.2, 0.035, 0.06] }
  );

  registerPart(PART_DATA[6], [partRoot(sensingRoot, [0.72, 0.15, 0.7])], {
    anchorRoot: 0,
    anchorLocal: [0, 0.075, 0.79],
  });
}

function partRoot(object, offset = [0, 0, 0], rotation = [0, 0, 0]) {
  return {
    object,
    basePosition: object.position.clone(),
    baseQuaternion: object.quaternion.clone(),
    offset: new THREE.Vector3(...offset),
    offsetQuaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
  };
}

function registerPart(data, roots, anchor = {}) {
  const materials = new Set();
  const anchorIndex = anchor.anchorRoot || 0;
  const anchorLocal = new THREE.Vector3(...(anchor.anchorLocal || [0, 0, 0]));
  const anchorObject = new THREE.Object3D();
  anchorObject.position.copy(anchorLocal);
  if (roots[anchorIndex]) roots[anchorIndex].object.add(anchorObject);

  roots.forEach((cfg) => {
    cfg.object.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.partId = data.id;
      child.userData.noShadow = child.userData.noShadow || false;
      const materialsOfMesh = Array.isArray(child.material) ? child.material : [child.material];
      const transparent = materialsOfMesh.some((material) => material && material.transparent);
      if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
      const shadowRadius = child.geometry.boundingSphere ? child.geometry.boundingSphere.radius : 0;
      child.castShadow = !child.userData.noShadow && !transparent && shadowRadius > 0.045;
      child.receiveShadow = !child.userData.noShadow && !transparent;
      pickables.push(child);
      materialsOfMesh.forEach((material) => {
        if (material && material.emissive && !material.userData.noGlow) materials.add(material);
      });
    });
  });

  runtime.set(data.id, {
    ...data,
    roots,
    anchorObject,
    materials: [...materials],
    progress: 0,
    target: 0,
    delayUntil: 0,
    exploded: false,
  });
}

function buildAirframe(logoTexture) {
  const root = new THREE.Group();
  root.name = 'airframe';

  const shell = materialFor('airframe', 'shell');
  const shellLight = materialFor('airframe', 'shellLight');
  const shellDark = materialFor('airframe', 'shellDark');
  const dark = materialFor('airframe', 'dark');
  const metal = materialFor('airframe', 'metal');
  const metalDark = materialFor('airframe', 'metalDark');
  const glass = materialFor('airframe', 'glass');

  const hullGeometry = createLoftGeometry(
    [
      { z: -0.765, rx: 0.13, ry: 0.04, cy: 0.025 },
      { z: -0.72, rx: 0.25, ry: 0.075, cy: 0.032 },
      { z: -0.62, rx: 0.34, ry: 0.115, cy: 0.04 },
      { z: -0.44, rx: 0.415, ry: 0.148, cy: 0.048 },
      { z: -0.18, rx: 0.445, ry: 0.17, cy: 0.048 },
      { z: 0.08, rx: 0.44, ry: 0.168, cy: 0.05 },
      { z: 0.33, rx: 0.405, ry: 0.153, cy: 0.04 },
      { z: 0.52, rx: 0.34, ry: 0.13, cy: 0.025 },
      { z: 0.67, rx: 0.255, ry: 0.1, cy: 0.004 },
      { z: 0.78, rx: 0.16, ry: 0.065, cy: -0.015 },
      { z: 0.835, rx: 0.06, ry: 0.025, cy: -0.028 },
    ],
    36
  );
  addMesh(root, hullGeometry, shell);

  // Belly pan and structural keel.
  addMesh(root, new RoundedBoxGeometry(0.51, 0.064, 0.84, 4, 0.028), dark, [0, -0.105, -0.03]);
  addMesh(root, new RoundedBoxGeometry(0.11, 0.026, 0.52, 3, 0.01), shellDark, [0, -0.14, 0.02]);
  cylinderBetween(root, [0, -0.145, -0.4], [0, -0.145, 0.45], 0.016, 0.024, metal, 8);

  // Top shell shoulder / battery surround.
  addMesh(root, new RoundedBoxGeometry(0.67, 0.04, 0.78, 4, 0.056), shellLight, [0, 0.19, -0.04], [0, 0, 0], [1, 1, 1]);
  addMesh(root, new RoundedBoxGeometry(0.58, 0.018, 0.69, 4, 0.04), dark, [0, 0.209, -0.17]);
  addMesh(root, new RoundedBoxGeometry(0.56, 0.018, 0.025, 2, 0.01), metal, [0, 0.231, 0.17]);
  addMesh(root, new RoundedBoxGeometry(0.56, 0.018, 0.025, 2, 0.01), metal, [0, 0.231, -0.525]);

  // Battery contacts at the bay floor.
  for (let i = 0; i < 4; i += 1) {
    addMesh(
      root,
      new RoundedBoxGeometry(0.035, 0.008, 0.055, 2, 0.004),
      materialFor('airframe', 'metal', { color: 0xd0ac68, emissive: 0x2a1d08, emissiveIntensity: 0.3 }),
      [-0.12 + i * 0.08, 0.222, -0.5]
    );
  }

  // Narrow side vents, embedded into the rear flanks.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      addMesh(
        root,
        new RoundedBoxGeometry(0.026, 0.012, 0.105, 2, 0.005),
        dark,
        [side * 0.376, 0.032 + i * 0.025, -0.34],
        [0, side * 0.08, side * 0.07]
      );
    }
    addMesh(
      root,
      new RoundedBoxGeometry(0.02, 0.04, 0.135, 2, 0.009),
      shellDark,
      [side * 0.385, 0.095, 0.17],
      [0, 0, side * 0.23]
    );
    addMesh(
      root,
      new RoundedBoxGeometry(0.026, 0.018, 0.05, 2, 0.006),
      dark,
      [side * 0.43, 0.02, -0.59]
    );
  }

  // Rear cooling grille and USB-C service port.
  const rearVent = addMesh(
    root,
    new THREE.CylinderGeometry(0.093, 0.099, 0.03, 28),
    dark,
    [0, 0.04, -0.744],
    [Math.PI / 2, 0, 0]
  );
  rearVent.scale.z = 0.78;
  for (let i = 0; i < 5; i += 1) {
    addMesh(root, new RoundedBoxGeometry(0.11, 0.006, 0.012, 2, 0.003), metalDark, [0, 0.008 + i * 0.015, -0.758], [0, 0, 0]);
  }
  addMesh(root, new RoundedBoxGeometry(0.08, 0.024, 0.018, 3, 0.008), metal, [0.18, -0.035, -0.74]);
  addMesh(root, new RoundedBoxGeometry(0.042, 0.011, 0.006, 2, 0.003), dark, [0.18, -0.035, -0.752]);

  // Nose seam, status LED, and forward vents.
  addMesh(root, new RoundedBoxGeometry(0.37, 0.02, 0.045, 3, 0.01), shellDark, [0, 0.106, 0.635], [0.16, 0, 0]);
  addMesh(root, new RoundedBoxGeometry(0.11, 0.012, 0.024, 2, 0.005), dark, [0, 0.13, 0.675]);
  const statusLed = addMesh(
    root,
    new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10),
    new THREE.MeshBasicMaterial({ color: 0x8af2ba, toneMapped: false }),
    [0, 0.139, 0.676],
    [Math.PI / 2, 0, 0]
  );
  statusLed.userData.noGlow = true;
  addMesh(root, new RoundedBoxGeometry(0.18, 0.025, 0.05, 2, 0.008), dark, [0, -0.012, 0.805], [0.2, 0, 0]);

  // Downward vision and IR windows on the belly.
  for (const z of [-0.2, 0.2]) {
    addMesh(root, new THREE.CylinderGeometry(0.034, 0.034, 0.013, 18), glass, [0, -0.143, z], [0, 0, 0]);
    addMesh(root, new THREE.TorusGeometry(0.034, 0.006, 6, 22), dark, [0, -0.149, z], [Math.PI / 2, 0, 0]);
  }
  addMesh(
    root,
    new THREE.CircleGeometry(0.022, 16),
    new THREE.MeshBasicMaterial({ color: 0x16333d, toneMapped: false }),
    [0, -0.151, -0.36],
    [-Math.PI / 2, 0, 0]
  );

  // A few structural fasteners around the shell.
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.49, 0.29]) {
      addMesh(root, new THREE.CylinderGeometry(0.011, 0.011, 0.008, 10), metal, [x, z > 0 ? 0.203 : 0.2, z], [0, 0, 0]);
    }
  }

  // Tiny gold accent strips on each side of the battery surround.
  for (const side of [-1, 1]) {
    addMesh(
      root,
      new RoundedBoxGeometry(0.012, 0.004, 0.37, 2, 0.002),
      materialFor('airframe', 'copper'),
      [side * 0.245, 0.211, -0.17]
    );
  }

  addDecal(root, logoTexture, 0.31, 0.116, [0, 0.236, 0.37], [-Math.PI / 2, 0, Math.PI], 0.83);

  return root;
}

function buildBattery(batteryTexture) {
  const root = new THREE.Group();
  root.name = 'battery';

  const shell = materialFor('battery', 'shell', { color: 0x343a3d });
  const shellLight = materialFor('battery', 'shellLight', { color: 0x434a4d });
  const dark = materialFor('battery', 'dark');
  const metal = materialFor('battery', 'metal');
  const accent = materialFor('battery', 'copper');

  const geometry = new RoundedBoxGeometry(0.505, 0.14, 0.59, 6, 0.054);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    if (y > -0.01) {
      position.setX(i, position.getX(i) * 0.955);
      position.setZ(i, position.getZ(i) * 0.975);
    }
    if (y > 0.04) {
      position.setY(i, y - 0.008);
    }
  }
  geometry.computeVertexNormals();
  addMesh(root, geometry, shell, [0, 0.293, -0.285]);
  addMesh(root, new RoundedBoxGeometry(0.455, 0.025, 0.53, 5, 0.022), shellLight, [0, 0.36, -0.285]);

  // Panel seam.
  addMesh(root, new RoundedBoxGeometry(0.44, 0.007, 0.018, 2, 0.003), dark, [0, 0.372, -0.035]);
  addMesh(root, new RoundedBoxGeometry(0.44, 0.007, 0.018, 2, 0.003), dark, [0, 0.372, -0.535]);
  addMesh(root, new RoundedBoxGeometry(0.018, 0.007, 0.49, 2, 0.003), dark, [-0.22, 0.372, -0.285]);
  addMesh(root, new RoundedBoxGeometry(0.018, 0.007, 0.49, 2, 0.003), dark, [0.22, 0.372, -0.285]);

  // Four-cell indicator LEDs.
  const ledColors = [0x78f0b4, 0x78f0b4, 0x78f0b4, 0xffb567];
  for (let i = 0; i < 4; i += 1) {
    addMesh(root, new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16), dark, [-0.11 + i * 0.072, 0.375, -0.485]);
    const led = addMesh(
      root,
      new THREE.CylinderGeometry(0.007, 0.007, 0.004, 12),
      new THREE.MeshBasicMaterial({ color: ledColors[i], toneMapped: false }),
      [-0.11 + i * 0.072, 0.379, -0.485]
    );
    led.userData.noGlow = true;
  }

  // Power button.
  addMesh(root, new THREE.CylinderGeometry(0.04, 0.04, 0.011, 24), dark, [0, 0.377, -0.19]);
  addMesh(root, new THREE.TorusGeometry(0.029, 0.003, 6, 24), metal, [0, 0.384, -0.19], [Math.PI / 2, 0, 0]);
  addMesh(root, new RoundedBoxGeometry(0.015, 0.003, 0.004, 2, 0.001), metal, [0, 0.386, -0.19]);
  addMesh(root, new THREE.TorusGeometry(0.011, 0.0025, 5, 16, Math.PI * 1.35), metal, [0, 0.387, -0.19], [Math.PI / 2, 0, -0.75]);

  // Release clips and grip texture.
  for (const side of [-1, 1]) {
    addMesh(
      root,
      new RoundedBoxGeometry(0.028, 0.085, 0.16, 3, 0.013),
      shellLight,
      [side * 0.258, 0.28, -0.13],
      [0, 0, side * 0.09]
    );
    for (let i = 0; i < 3; i += 1) {
      addMesh(
        root,
        new RoundedBoxGeometry(0.008, 0.006, 0.11, 2, 0.002),
        dark,
        [side * 0.272, 0.259 + i * 0.022, -0.13]
      );
    }
  }

  // Copper contact pads on the underside.
  for (let i = 0; i < 4; i += 1) {
    addMesh(
      root,
      new RoundedBoxGeometry(0.033, 0.008, 0.045, 2, 0.003),
      accent,
      [-0.105 + i * 0.07, 0.221, -0.51]
    );
  }

  // Vent slits on the rear face.
  for (let i = 0; i < 4; i += 1) {
    addMesh(root, new RoundedBoxGeometry(0.25, 0.006, 0.012, 2, 0.002), dark, [0, 0.255 + i * 0.016, -0.58]);
  }

  addDecal(root, batteryTexture, 0.37, 0.092, [0, 0.378, -0.31], [-Math.PI / 2, 0, Math.PI], 0.75);

  return root;
}

function buildGimbal(cameraSideTexture, lensTexture) {
  const root = new THREE.Group();
  root.name = 'gimbal';

  const shell = materialFor('gimbal', 'shellDark', { color: 0x171c20 });
  const dark = materialFor('gimbal', 'dark');
  const metal = materialFor('gimbal', 'metal');
  const metalDark = materialFor('gimbal', 'metalDark');
  const copper = materialFor('gimbal', 'copper');
  const glass = materialFor('gimbal', 'glass');
  const black = materialFor('gimbal', 'shell', { color: 0x0a0d0f, metalness: 0.45, roughness: 0.22, clearcoat: 0.8 });

  // Mount and yaw motor under the nose.
  addMesh(root, new RoundedBoxGeometry(0.225, 0.058, 0.24, 4, 0.027), dark, [0, -0.06, 0.675]);
  addMesh(root, new THREE.CylinderGeometry(0.073, 0.081, 0.075, 24), metalDark, [0, -0.108, 0.675]);
  addMesh(root, new THREE.TorusGeometry(0.076, 0.007, 6, 28), copper, [0, -0.108, 0.675], [Math.PI / 2, 0, 0]);
  addMesh(root, new THREE.CylinderGeometry(0.038, 0.038, 0.018, 18), dark, [0, -0.15, 0.675]);

  // Gimbal yoke.
  for (const side of [-1, 1]) {
    addMesh(root, new RoundedBoxGeometry(0.027, 0.185, 0.052, 3, 0.012), metalDark, [side * 0.15, -0.235, 0.72], [0.12, 0, 0]);
    addMesh(root, new THREE.CylinderGeometry(0.047, 0.047, 0.029, 22), black, [side * 0.163, -0.32, 0.785], [0, 0, Math.PI / 2]);
    addMesh(root, new THREE.TorusGeometry(0.039, 0.005, 5, 24), copper, [side * 0.18, -0.32, 0.785], [0, Math.PI / 2, 0]);
  }
  addMesh(root, new RoundedBoxGeometry(0.3, 0.048, 0.065, 3, 0.018), shell, [0, -0.15, 0.71], [0.15, 0, 0]);

  // Camera assembly, slightly pitched down.
  const cameraGroup = new THREE.Group();
  cameraGroup.position.set(0, -0.315, 0.85);
  cameraGroup.rotation.x = 0.1;
  root.add(cameraGroup);

  const bodyGeometry = new RoundedBoxGeometry(0.345, 0.455, 0.245, 5, 0.064);
  addMesh(cameraGroup, bodyGeometry, black);
  addMesh(cameraGroup, new RoundedBoxGeometry(0.355, 0.08, 0.22, 4, 0.03), shell, [0, 0.22, 0.005]);
  addMesh(cameraGroup, new RoundedBoxGeometry(0.315, 0.405, 0.03, 4, 0.045), dark, [0, 0.016, 0.13]);
  addMesh(cameraGroup, new RoundedBoxGeometry(0.18, 0.052, 0.05, 3, 0.016), shell, [0, 0.247, 0.03], [0.1, 0, 0]);

  // Top wide-angle lens.
  buildLens(cameraGroup, {
    x: 0,
    y: 0.084,
    z: 0.151,
    radius: 0.112,
    bezel: 0.131,
    hood: true,
    texture: lensTexture,
    labels: ['1"', '24mm'],
  });

  // Lower medium-tele lens.
  buildLens(cameraGroup, {
    x: 0,
    y: -0.105,
    z: 0.151,
    radius: 0.073,
    bezel: 0.089,
    hood: false,
    texture: lensTexture,
    labels: ['1/1.3"', '70mm'],
  });

  // Camera body side details.
  for (const side of [-1, 1]) {
    addMesh(
      cameraGroup,
      new RoundedBoxGeometry(0.008, 0.32, 0.08, 3, 0.012),
      metalDark,
      [side * 0.174, -0.095, 0.01],
      [0, side * 0.02, side * 0.015]
    );
    addMesh(cameraGroup, new THREE.CylinderGeometry(0.011, 0.011, 0.01, 12), metal, [side * 0.175, 0.12, -0.03], [0, 0, Math.PI / 2]);
  }

  addMesh(cameraGroup, new THREE.CylinderGeometry(0.01, 0.01, 0.011, 12), copper, [-0.115, -0.19, 0.126], [Math.PI / 2, 0, 0]);
  addMesh(cameraGroup, new THREE.CylinderGeometry(0.005, 0.005, 0.014, 10), black, [0.115, -0.19, 0.126], [Math.PI / 2, 0, 0]);

  // Silkscreen on the camera side.
  addDecal(cameraGroup, cameraSideTexture, 0.19, 0.095, [0.178, -0.03, 0.005], [0, Math.PI / 2, 0], 0.72);

  // Damping balls near the mount.
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addMesh(
      root,
      new THREE.SphereGeometry(0.019, 12, 8),
      materialFor('gimbal', 'rubber'),
      [Math.cos(angle) * 0.102, -0.155, 0.675 + Math.sin(angle) * 0.1]
    );
  }

  function buildLens(parent, options) {
    const { x, y, z, radius, bezel, hood, texture, labels } = options;

    addMesh(parent, new THREE.CylinderGeometry(bezel + 0.013, bezel + 0.016, 0.05, 32), metal, [x, y, z - 0.015], [Math.PI / 2, 0, 0]);
    addMesh(parent, new THREE.TorusGeometry(bezel, 0.009, 8, 36), metal, [x, y, z + 0.016]);
    addMesh(parent, new THREE.TorusGeometry(bezel - 0.012, 0.004, 6, 32), copper, [x, y, z + 0.021]);
    addMesh(parent, new THREE.CylinderGeometry(radius + 0.007, radius + 0.012, 0.045, 32, 1, true), dark, [x, y, z + 0.01], [Math.PI / 2, 0, 0]);

    const lens = addMesh(parent, new THREE.SphereGeometry(radius, 28, 18), glass, [x, y, z + 0.024], [0, 0, 0], [1, 1, 0.4]);
    lens.renderOrder = 2;

    const face = addMesh(
      parent,
      new THREE.CircleGeometry(radius * 0.93, 36),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }),
      [x, y, z + 0.036],
      [0, 0, 0]
    );
    face.userData.noShadow = true;
    face.userData.noGlow = true;

    if (hood) {
      addMesh(parent, new RoundedBoxGeometry(0.31, 0.056, 0.045, 4, 0.016), shell, [x, y + 0.143, z + 0.022], [0.18, 0, 0]);
    }

    const labelTexture = makeTexture(256, 64, (ctx, width, height) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(180, 203, 207, 0.34)';
      ctx.font = '500 19px "Consolas", monospace';
      ctx.textBaseline = 'middle';
      drawSpacedText(ctx, `${labels[0]}   ${labels[1]}`, 8, 31, 1.5);
    });
    addDecal(parent, labelTexture, 0.105, 0.026, [x + 0.045, y - radius - 0.027, z + 0.038], [0, 0, 0], 0.82);
  }

  return root;
}

function buildSensing(lensTexture) {
  const root = new THREE.Group();
  root.name = 'sensing';

  const dark = materialFor('sensing', 'dark');
  const shell = materialFor('sensing', 'shellDark');
  const metal = materialFor('sensing', 'metalDark');
  const glass = materialFor('sensing', 'glass');
  const black = materialFor('sensing', 'shell', { color: 0x070a0c, metalness: 0.64, roughness: 0.2, clearcoat: 0.9 });

  addMesh(root, new RoundedBoxGeometry(0.39, 0.105, 0.09, 5, 0.032), black, [0, 0.092, 0.776], [0.06, 0, 0]);
  addMesh(root, new RoundedBoxGeometry(0.34, 0.012, 0.026, 3, 0.006), metal, [0, 0.142, 0.792], [0.06, 0, 0]);

  for (const side of [-1, 1]) {
    const x = side * 0.138;
    addMesh(root, new THREE.CylinderGeometry(0.039, 0.042, 0.024, 24), metal, [x, 0.095, 0.818], [Math.PI / 2, 0, 0]);
    addMesh(root, new THREE.CylinderGeometry(0.028, 0.032, 0.018, 22), black, [x, 0.095, 0.828], [Math.PI / 2, 0, 0]);
    addMesh(root, new THREE.SphereGeometry(0.024, 20, 12), glass, [x, 0.095, 0.835], [0, 0, 0], [1, 1, 0.35]);
    addMesh(
      root,
      new THREE.CircleGeometry(0.017, 20),
      new THREE.MeshBasicMaterial({ map: lensTexture, transparent: true, toneMapped: false }),
      [x, 0.095, 0.844]
    );
  }

  // Central forward LiDAR window.
  addMesh(root, new THREE.CylinderGeometry(0.027, 0.03, 0.022, 20), metal, [0, 0.01, 0.819], [Math.PI / 2, 0, 0]);
  const lidarMaterial = new THREE.MeshBasicMaterial({ color: 0x2c6670, toneMapped: false });
  addMesh(root, new THREE.CircleGeometry(0.019, 20), lidarMaterial, [0, 0.008, 0.831]);
  addMesh(root, new THREE.TorusGeometry(0.023, 0.003, 5, 20), materialFor('sensing', 'copper'), [0, 0.008, 0.833]);
  addMesh(root, new THREE.RingGeometry(0.024, 0.031, 20, 1, Math.PI * 0.1, Math.PI * 0.8), shell, [0, 0.008, 0.834]);

  // Side sensor pips hint at the omnidirectional array.
  for (const side of [-1, 1]) {
    addMesh(root, new THREE.CylinderGeometry(0.012, 0.014, 0.017, 14), dark, [side * 0.225, 0.06, 0.752], [Math.PI / 2, 0, 0]);
    addMesh(root, new THREE.CircleGeometry(0.008, 14), glass, [side * 0.225, 0.06, 0.763]);
  }

  return root;
}

const ARM_DEFINITIONS = [
  { start: [-0.28, 0.018, 0.28], end: [-1.045, 0.018, 0.755], side: -1, front: true },
  { start: [0.28, 0.018, 0.28], end: [1.045, 0.018, 0.755], side: 1, front: true },
  { start: [-0.28, 0.018, -0.36], end: [-1.005, 0.018, -0.972], side: -1, front: false },
  { start: [0.28, 0.018, -0.36], end: [1.005, 0.018, -0.972], side: 1, front: false },
];

function buildArms() {
  return ARM_DEFINITIONS.map((definition, index) => buildArm(definition, index));
}

function buildArm(definition, index) {
  const root = new THREE.Group();
  root.name = `arm-${index + 1}`;

  const shell = materialFor('arms', 'shell');
  const shellLight = materialFor('arms', 'shellLight');
  const shellDark = materialFor('arms', 'shellDark');
  const dark = materialFor('arms', 'dark');
  const metal = materialFor('arms', 'metalDark');
  const accent = materialFor('arms', 'copper');

  const start = new THREE.Vector3(...definition.start);
  const end = new THREE.Vector3(...definition.end);
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);

  // The main folded-arm blade.
  const armGeometry = new RoundedBoxGeometry(0.118, 0.076, length - 0.06, 4, 0.034);
  const armPosition = armGeometry.attributes.position;
  for (let i = 0; i < armPosition.count; i += 1) {
    const localZ = armPosition.getZ(i);
    const t = localZ / (length - 0.06) + 0.5;
    const taper = 1 - 0.3 * t;
    armPosition.setX(i, armPosition.getX(i) * taper);
    armPosition.setY(i, armPosition.getY(i) * (1 - 0.08 * t));
  }
  armGeometry.computeVertexNormals();

  const arm = addMesh(
    root,
    armGeometry,
    shell,
    [(start.x + end.x) / 2, 0.02, (start.z + end.z) / 2],
    [0, angle, 0]
  );
  arm.rotation.y = angle;

  // A lighter inlay runs down the top of the arm.
  addMesh(
    root,
    new RoundedBoxGeometry(0.052, 0.012, length - 0.15, 3, 0.012),
    shellLight,
    [(start.x + end.x) / 2, 0.061, (start.z + end.z) / 2],
    [0, angle, 0]
  );

  // Dark underside stripe.
  addMesh(
    root,
    new RoundedBoxGeometry(0.07, 0.014, length - 0.12, 3, 0.007),
    dark,
    [(start.x + end.x) / 2, -0.019, (start.z + end.z) / 2],
    [0, angle, 0]
  );

  // Hinge barrel.
  const hingeX = start.x + Math.cos(angle) * 0.015;
  const hingeZ = start.z + Math.sin(angle) * 0.015;
  addMesh(root, new THREE.CylinderGeometry(0.078, 0.082, 0.115, 22), metal, [hingeX, 0.019, hingeZ]);
  addMesh(root, new THREE.TorusGeometry(0.071, 0.008, 6, 24), accent, [hingeX, 0.064, hingeZ], [Math.PI / 2, 0, 0]);
  addMesh(root, new THREE.CylinderGeometry(0.065, 0.071, 0.018, 22), shellDark, [hingeX, 0.087, hingeZ]);
  addMesh(root, new THREE.CylinderGeometry(0.027, 0.031, 0.018, 16), dark, [hingeX, 0.099, hingeZ]);

  // Antenna ridge and a folded-arm stop.
  addMesh(
    root,
    new RoundedBoxGeometry(0.035, 0.023, 0.2, 3, 0.009),
    dark,
    [start.x + dx * 0.74, 0.066, start.z + dz * 0.74],
    [0, angle, 0]
  );
  addMesh(
    root,
    new RoundedBoxGeometry(0.082, 0.035, 0.12, 3, 0.01),
    shellDark,
    [start.x + dx * 0.22, 0.046, start.z + dz * 0.22],
    [0, angle, 0]
  );

  // Motor mounting deck at the arm tip.
  addMesh(root, new THREE.CylinderGeometry(0.145, 0.155, 0.03, 30), materialFor('arms', 'metalDark'), [end.x, 0.02, end.z]);
  addMesh(root, new THREE.TorusGeometry(0.115, 0.008, 6, 30), accent, [end.x, 0.039, end.z], [Math.PI / 2, 0, 0]);

  // Landing leg, gently splayed outboard.
  const legTop = [end.x + definition.side * 0.03, -0.005, end.z + (definition.front ? -0.03 : 0.03)];
  const legBottom = [end.x + definition.side * 0.13, -0.235, end.z + (definition.front ? -0.06 : 0.06)];
  cylinderBetween(root, legTop, legBottom, 0.018, 0.027, dark, 8);
  addMesh(root, new THREE.SphereGeometry(0.03, 10, 8), materialFor('arms', 'rubber'), legBottom, [0, 0, 0], [1.6, 0.75, 1]);
  addMesh(root, new THREE.TorusGeometry(0.025, 0.006, 5, 12), metal, [legTop[0], legTop[1] + 0.01, legTop[2]], [0, 0, Math.PI / 2]);

  // Navigation light under each arm.
  const lightColor = definition.front ? 0x7af0b5 : 0xff8b7a;
  const navLight = addMesh(
    root,
    new THREE.SphereGeometry(0.014, 10, 8),
    new THREE.MeshBasicMaterial({ color: lightColor, toneMapped: false }),
    [end.x - definition.side * 0.14, -0.018, end.z + (definition.front ? -0.03 : 0.03)]
  );
  navLight.userData.noGlow = true;

  // A tiny cable guide under the hinge.
  cylinderBetween(root, [hingeX, -0.02, hingeZ], [start.x + dx * 0.3, -0.04, start.z + dz * 0.3], 0.009, 0.012, materialFor('arms', 'rubber'), 7);
  addMesh(root, new THREE.CylinderGeometry(0.018, 0.018, 0.009, 10), dark, [start.x, 0.075, start.z]);

  return root;
}

function buildMotors() {
  return ARM_DEFINITIONS.map((definition, index) => buildMotor(definition, index));
}

function buildMotor(definition, index) {
  const root = new THREE.Group();
  root.name = `motor-${index + 1}`;
  root.position.set(definition.end[0], 0.018, definition.end[2]);

  const shell = materialFor('motors', 'shellDark', { color: 0x161b1f });
  const dark = materialFor('motors', 'dark');
  const metal = materialFor('motors', 'metal');
  const metalDark = materialFor('motors', 'metalDark');
  const copper = materialFor('motors', 'copper');
  const rubber = materialFor('motors', 'rubber');

  addMesh(root, new THREE.CylinderGeometry(0.13, 0.145, 0.026, 30), metalDark, [0, -0.002, 0]);
  addMesh(root, new THREE.TorusGeometry(0.105, 0.013, 7, 30), copper, [0, 0.035, 0], [Math.PI / 2, 0, 0]);
  addMesh(root, new THREE.CylinderGeometry(0.103, 0.115, 0.1, 28), shell, [0, 0.086, 0]);
  addMesh(root, new THREE.CylinderGeometry(0.092, 0.104, 0.019, 28), metal, [0, 0.142, 0]);

  // Cooling fins / stator ribs.
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    addMesh(
      root,
      new RoundedBoxGeometry(0.012, 0.058, 0.035, 2, 0.004),
      metalDark,
      [Math.cos(angle) * 0.108, 0.093, Math.sin(angle) * 0.108],
      [0, -angle, 0]
    );
  }

  // Rubber dampers.
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addMesh(root, new THREE.SphereGeometry(0.018, 10, 8), rubber, [Math.cos(angle) * 0.098, 0.012, Math.sin(angle) * 0.098]);
  }

  // Bell cap and the three-spoke propeller mount.
  addMesh(root, new THREE.CylinderGeometry(0.1, 0.11, 0.065, 28), shell, [0, 0.16, 0]);
  addMesh(root, new THREE.TorusGeometry(0.086, 0.006, 6, 28), metal, [0, 0.194, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2;
    addMesh(
      root,
      new RoundedBoxGeometry(0.1, 0.008, 0.019, 2, 0.003),
      metal,
      [Math.cos(angle) * 0.043, 0.205, Math.sin(angle) * 0.043],
      [0, -angle, 0]
    );
  }
  addMesh(root, new THREE.CylinderGeometry(0.036, 0.045, 0.035, 18), metalDark, [0, 0.215, 0]);
  addMesh(root, new THREE.CylinderGeometry(0.013, 0.018, 0.052, 12), metal, [0, 0.248, 0]);
  addMesh(root, new THREE.CylinderGeometry(0.024, 0.024, 0.012, 18), dark, [0, 0.083, 0]);
  addMesh(root, new THREE.TorusGeometry(0.015, 0.003, 5, 16), copper, [0, 0.09, 0]);

  // Tiny phase marks around the bell.
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2 + 0.4;
    addMesh(
      root,
      new THREE.CircleGeometry(0.006, 10),
      materialFor('motors', 'copper'),
      [Math.cos(angle) * 0.101, 0.17, Math.sin(angle) * 0.101],
      [0, -angle + Math.PI / 2, 0]
    );
  }

  return root;
}

function makeBladeGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.052, 0.032);
  shape.bezierCurveTo(0.15, 0.095, 0.34, 0.11, 0.49, 0.078);
  shape.bezierCurveTo(0.59, 0.057, 0.645, 0.029, 0.66, 0.01);
  shape.quadraticCurveTo(0.655, -0.004, 0.62, -0.012);
  shape.bezierCurveTo(0.45, -0.04, 0.26, -0.071, 0.13, -0.078);
  shape.quadraticCurveTo(0.068, -0.056, 0.052, -0.038);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.011,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.0025,
    bevelSegments: 1,
    curveSegments: 26,
  });

  // Apply a gentle aerodynamic twist along the span.
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const t = THREE.MathUtils.clamp((x - 0.06) / 0.6, 0, 1);
    const twist = t * 0.33;
    const y = position.getY(i);
    const z = position.getZ(i);
    position.setY(i, y * Math.cos(twist) - z * Math.sin(twist));
    position.setZ(i, y * Math.sin(twist) + z * Math.cos(twist));
  }
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0.006, 0);
  return geometry;
}

function buildPropellers() {
  const bladeGeometry = makeBladeGeometry();
  return ARM_DEFINITIONS.map((definition, index) => {
    const root = new THREE.Group();
    root.name = `propeller-${index + 1}`;
    root.position.set(definition.end[0], 0.267, definition.end[2]);

    const spinner = new THREE.Group();
    spinner.rotation.y = [0.4, 2.2, 1.25, 3.4][index];
    root.add(spinner);

    const propMaterial = materialFor('propellers', 'prop');
    const metal = materialFor('propellers', 'metalDark');
    const dark = materialFor('propellers', 'dark');

    const bladeA = new THREE.Mesh(bladeGeometry, propMaterial);
    const bladeB = new THREE.Mesh(bladeGeometry, propMaterial);
    bladeB.rotation.y = Math.PI;
    spinner.add(bladeA, bladeB);

    addMesh(spinner, new THREE.CylinderGeometry(0.061, 0.071, 0.035, 24), dark, [0, 0.002, 0]);
    addMesh(spinner, new THREE.CylinderGeometry(0.045, 0.055, 0.014, 22), metal, [0, 0.024, 0]);
    addMesh(spinner, new THREE.CylinderGeometry(0.013, 0.013, 0.008, 14), materialFor('propellers', 'copper'), [0, 0.034, 0]);

    // A small metal leading-edge inlay near the hub adds a readable pivot.
    addMesh(spinner, new THREE.TorusGeometry(0.059, 0.0035, 5, 22), metal, [0, 0.017, 0], [Math.PI / 2, 0, 0]);

    propSpinners.push({
      spinner,
      baseRotation: spinner.rotation.y,
      index,
    });
    return root;
  });
}

/* ==========================================================================
   Part animation, selection and UI
   ========================================================================== */

function animatePartProgress(delta) {
  const now = performance.now();
  for (const part of runtime.values()) {
    if (now < part.delayUntil) continue;
    const speed = part.target > part.progress ? 4.8 : 6.2;
    const k = 1 - Math.exp(-speed * delta);
    part.progress += (part.target - part.progress) * k;
    if (Math.abs(part.target - part.progress) < 0.0005) part.progress = part.target;

    const eased = easeInOutCubic(THREE.MathUtils.clamp(part.progress, 0, 1));
    part.roots.forEach((root) => {
      root.object.position.copy(root.basePosition).addScaledVector(root.offset, eased);
      tempQuat.copy(tempIdentity).slerp(root.offsetQuaternion, eased);
      root.object.quaternion.copy(root.baseQuaternion).multiply(tempQuat);
    });
  }
}

function setPartExploded(partId, exploded, options = {}) {
  const part = runtime.get(partId);
  if (!part) return;
  part.exploded = Boolean(exploded);
  part.target = exploded ? 1 : 0;
  part.delayUntil = performance.now() + (options.delay || 0);
  updateInterface();
}

function togglePart(partId) {
  const part = runtime.get(partId);
  if (!part) return;
  setPartExploded(partId, !part.exploded);
}

function openPart(partId, options = {}) {
  const part = runtime.get(partId);
  if (!part) return;

  if (options.user) {
    state.showIntroLabel = false;
        if (state.touring) stopTour();
    if (state.autoRotate) setAutoRotate(false);
  }

  const wasSelected = state.selected === partId;
  state.selected = partId;

  if (options.toggle) {
    if (wasSelected) {
      setPartExploded(partId, !part.exploded);
    } else {
      setPartExploded(partId, true);
    }
  } else if (options.explode && !part.exploded) {
    setPartExploded(partId, true);
  }

  if (window.innerWidth <= 860) {
    document.body.classList.remove('parts-open');
    dom.partsToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.add('detail-open');
  }

  dom.infoPanel.classList.add('has-selection');
  dom.profileView.hidden = true;
  dom.detailView.hidden = false;
  renderDetail(part);
  updateInterface();
  updateHighlightState();
  hideHoverTip();
}

function closeDetail(options = {}) {
  state.selected = null;
  dom.detailView.hidden = true;
  dom.profileView.hidden = false;
  dom.infoPanel.classList.remove('has-selection');
  document.body.classList.remove('detail-open');
  if (options.restoreLabels !== false) {
    updateInterface();
  }
  updateHighlightState();
}

function renderDetail(part) {
  const isExploded = runtime.get(part.id).exploded;
  const statusText = isExploded ? '已拆解 / EXPLODED' : '已装配 / ASSEMBLED';
  const actionText = isExploded ? '归位组件' : '拆解组件';
  const actionIcon = isExploded
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12M8 12l4 4 4-4"></path><path d="M4 20h16"></path></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V8M8 12l4-4 4 4"></path><path d="M4 4h16"></path></svg>';

  dom.detailView.innerHTML = `
    <div class="detail-head">
      <div class="detail-head__left"><b>${part.code}</b><span>COMPONENT / ${part.en}</span></div>
      <button class="detail-close" type="button" data-action="close" aria-label="关闭部件详情">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
      </button>
    </div>
    <div class="detail-title">
      <div>
        <h2>${part.name}</h2>
        <p>${part.en}</p>
      </div>
      <div class="detail-index">${part.code}</div>
    </div>
    <div class="detail-status ${isExploded ? 'is-exploded' : ''}">
      <i></i><b>${statusText}</b><span>${part.summary}</span>
    </div>
    <div class="detail-scroll">
      <p class="detail-description">${part.description}</p>
      <div class="spec-grid">
        ${part.specs
          .map(
            ([label, value]) => `
            <div class="spec-cell"><span>${label}</span><b>${value}</b></div>`
          )
          .join('')}
      </div>
      <div class="detail-note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 10.5v6"></path><circle cx="12" cy="7.5" r=".7" class="fill"></circle></svg>
        <span>${part.note}</span>
      </div>
      <div class="detail-foot"><span>SEQUENCE / ${part.code} OF 07</span><span>SPEC / DJI OFFICIAL</span></div>
    </div>
    <div class="detail-actions">
      <button class="detail-button" type="button" data-action="toggle">
        ${actionIcon}<span>${actionText}</span>
      </button>
      <button class="detail-button detail-button--ghost" type="button" data-action="focus" aria-label="定位视角">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path></svg>
        <span>定位视角</span>
      </button>
    </div>
  `;
}

function updateInterface() {
  const explodedParts = PART_DATA.filter((part) => runtime.get(part.id).exploded);
  const explodedCount = explodedParts.length;
  const total = PART_DATA.length;
  dom.explodedCount.textContent = String(explodedCount).padStart(2, '0');
  dom.sequenceCount.textContent = `${String(explodedCount).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
  dom.assemblyPercent.textContent = `${Math.round((explodedCount / total) * 100)}%`;
  dom.assemblyProgress.style.width = `${(explodedCount / total) * 100}%`;
  dom.assemblyState.textContent = explodedCount === 0 ? 'ASSEMBLED' : explodedCount === total ? 'DECONSTRUCTED' : 'DECONSTRUCTING';

  if (dom.viewModeLabel) {
    dom.viewModeLabel.textContent =
      explodedCount === 0
        ? 'ASSEMBLED VIEW · REAL-TIME 3D'
        : explodedCount === total
          ? 'EXPLODED VIEW · 7 MODULES'
          : 'STRUCTURE VIEW · REAL-TIME 3D';
  }

  dom.sequenceBars.querySelectorAll('i').forEach((bar, index) => {
    bar.classList.toggle('is-active', index < explodedCount);
  });

  document.querySelectorAll('.part-item').forEach((button) => {
    const id = button.dataset.partId;
    const part = runtime.get(id);
    button.classList.toggle('is-exploded', Boolean(part && part.exploded));
    button.classList.toggle('is-active', state.selected === id);
    button.setAttribute('aria-pressed', state.selected === id ? 'true' : 'false');
  });

  dom.explodeAllButton.setAttribute('aria-pressed', explodedCount === total ? 'true' : 'false');
  dom.explodeAllLabel.textContent = explodedCount === total ? '全部归位' : '全部拆解';

  if (state.selected && !dom.detailView.hidden) {
    const selectedPart = PART_DATA.find((part) => part.id === state.selected);
    const runtimePart = runtime.get(state.selected);
    if (selectedPart && runtimePart) {
      const status = dom.detailView.querySelector('.detail-status');
      if (status) {
        status.classList.toggle('is-exploded', runtimePart.exploded);
        const statusLabel = status.querySelector('b');
        if (statusLabel) statusLabel.textContent = runtimePart.exploded ? '已拆解 / EXPLODED' : '已装配 / ASSEMBLED';
      }
      const actionLabel = dom.detailView.querySelector('[data-action="toggle"] span');
      if (actionLabel) actionLabel.textContent = runtimePart.exploded ? '归位组件' : '拆解组件';
    }
  }

  updateCalloutClasses();
}

function updateCalloutClasses() {
  for (const part of PART_DATA) {
    const callout = labelElements.get(part.id);
    if (!callout) continue;
    callout.node.classList.toggle('is-selected', state.selected === part.id);
    callout.node.classList.toggle(
      'is-visible',
      state.selected === part.id ||
        runtime.get(part.id).exploded ||
        (state.showIntroLabel && part.id === 'airframe' && !state.selected)
    );
  }
}

function buildInterface() {
  dom.partList.innerHTML = PART_DATA.map(
    (part) => `
      <button class="part-item" type="button" data-part-id="${part.id}" aria-label="查看${part.name}">
        <span class="part-item__index">${part.code}</span>
        <span class="part-item__copy"><b>${part.name}</b><small>${part.en}</small></span>
        <span class="part-item__state" aria-hidden="true"></span>
      </button>
    `
  ).join('');

  dom.sequenceBars.innerHTML = PART_DATA.map(() => '<i></i>').join('');

  dom.labelLines.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  PART_DATA.forEach((part) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'part-callout';
    node.dataset.partId = part.id;
    node.tabIndex = -1;
    node.setAttribute('aria-label', `${part.name}：${part.callout}`);
    node.innerHTML = `
      <span class="part-callout__top">
        <span class="part-callout__index">${part.code}</span>
        <b>${part.name}</b>
        <em>${part.en}</em>
      </span>
      <span class="part-callout__bottom"><i></i>${part.callout}</span>
    `;
    node.addEventListener('click', () => openPart(part.id, { user: true, toggle: true }));
    dom.labelNodes.appendChild(node);

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    circle.setAttribute('r', '2.2');
    rect.setAttribute('width', '4');
    rect.setAttribute('height', '4');
    group.append(path, circle, rect);
    dom.labelLines.appendChild(group);
    labelElements.set(part.id, { node, group, path, circle, rect });
  });

  document.querySelectorAll('.part-item').forEach((button) => {
    button.addEventListener('click', () => {
      openPart(button.dataset.partId, { user: true, toggle: true });
    });
  });

  updateInterface();
}

function updateLabels() {
  if (!state.booted) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width <= 860;
  const compact = !isMobile && width < 1240;
  const widthOfLabel = width <= 540 ? 158 : width <= 860 ? 170 : width <= 1280 ? 188 : 206;
  const heightOfLabel = isMobile ? 45 : 53;
  const partsRect = dom.partsPanel.getBoundingClientRect();
  const infoRect = dom.infoPanel.getBoundingClientRect();
  const safeLeft = isMobile ? 12 : Math.min(width - widthOfLabel - 12, partsRect.right + 12);
  const safeRight = isMobile ? width - 12 : Math.max(safeLeft + widthOfLabel, infoRect.left - 12);
  const topEdge = isMobile ? 86 : 108;
  const bottomEdge = height - (isMobile ? 142 : 134);
  const labels = [];

  for (const part of PART_DATA) {
    const elements = labelElements.get(part.id);
    const partRuntime = runtime.get(part.id);
    if (!elements || !partRuntime) continue;

    const introVisible = state.showIntroLabel && part.id === 'airframe' && !state.selected;
    const baseVisible = state.selected === part.id || partRuntime.exploded || introVisible;
    const compactHidden = compact && state.selected !== part.id && !(introVisible && state.selected === null);
    const visible =
      baseVisible &&
      !compactHidden &&
      (!isMobile || state.selected === part.id);

    elements.node.classList.toggle('is-visible', visible);
    elements.node.tabIndex = visible ? 0 : -1;
    elements.node.setAttribute('aria-hidden', visible ? 'false' : 'true');

    if (!visible) {
      elements.group.style.display = 'none';
      continue;
    }

    const anchorWorld = partRuntime.anchorObject.getWorldPosition(tempVecB).clone();
    const toAnchor = anchorWorld.clone().sub(camera.position);
    const forward = camera.getWorldDirection(tempVec);
    if (toAnchor.dot(forward) <= 0.1) {
      elements.node.classList.remove('is-visible');
      elements.group.style.display = 'none';
      continue;
    }

    const projected = anchorWorld.clone().project(camera);
    if (projected.x < -1.2 || projected.x > 1.2 || projected.y < -1.2 || projected.y > 1.2) {
      elements.node.classList.remove('is-visible');
      elements.group.style.display = 'none';
      continue;
    }

    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;
    const preferredSide = LABEL_SIDE_PREFERENCE[part.id];
    labels.push({
      part,
      elements,
      x,
      y,
      side: preferredSide || (x < width / 2 ? -1 : 1),
      width: widthOfLabel,
      height: heightOfLabel,
    });
  }

  [...new Set(labels.map((label) => label.side))].forEach((side) => {
    const column = labels.filter((label) => label.side === side).sort((a, b) => a.y - b.y);
    let previousBottom = topEdge - 7;
    column.forEach((label) => {
      let top = Math.max(label.y - label.height / 2, previousBottom + 7);
      top = Math.min(top, bottomEdge - label.height);
      label.top = top;
      previousBottom = top + label.height;
    });

    const overflow = previousBottom - bottomEdge;
    if (overflow > 0) {
      column.forEach((label) => {
        label.top -= overflow;
      });
      let previous = topEdge;
      column.forEach((label) => {
        label.top = Math.max(label.top, previous);
        previous = label.top + label.height;
      });
    }

    column.forEach((label) => {
      const { elements, x, y } = label;
      let left;
      if (!isMobile) {
        const cappedRight = Math.min(safeRight - label.width, width * 0.5 + 500);
        const cappedLeft = Math.max(safeLeft, width * 0.5 - 500 - label.width);
        left = side === 1 ? cappedRight : cappedLeft;
      } else if (side === 1) {
        left = Math.min(x + 58, safeRight - label.width);
        left = Math.max(left, safeLeft);
      } else {
        left = Math.max(x - 58 - label.width, safeLeft);
        left = Math.min(left, safeRight - label.width);
      }
      const top = Math.max(topEdge, Math.min(label.top, bottomEdge - label.height));
      const attachX = side === 1 ? left : left + label.width;
      const attachY = top + label.height / 2;
      const elbowX = x + side * 22;
      const lineEndX = attachX - side * 8;
      const isSelected = state.selected === label.part.id;

      elements.node.style.left = `${left}px`;
      elements.node.style.top = `${top}px`;
      elements.node.style.width = `${label.width}px`;
      elements.node.style.zIndex = isSelected ? '3' : '1';
      elements.group.style.display = '';
      elements.path.setAttribute('d', `M ${x.toFixed(1)} ${y.toFixed(1)} L ${elbowX.toFixed(1)} ${y.toFixed(1)} L ${lineEndX.toFixed(1)} ${attachY.toFixed(1)} L ${attachX.toFixed(1)} ${attachY.toFixed(1)}`);
      elements.path.classList.toggle('is-selected', isSelected);
      elements.circle.setAttribute('cx', x.toFixed(1));
      elements.circle.setAttribute('cy', y.toFixed(1));
      elements.circle.classList.toggle('is-selected', isSelected);
      elements.rect.setAttribute('x', (attachX - 2).toFixed(1));
      elements.rect.setAttribute('y', (attachY - 2).toFixed(1));
      elements.group.style.opacity = isSelected ? '1' : '0.75';
    });
  });
}

/* ==========================================================================
   Highlighting, interactions
   ========================================================================== */

function updateHighlightState(time = 0) {
  for (const [partId, part] of runtime.entries()) {
    const isSelected = state.selected === partId;
    const isHovered = state.hovered === partId;
    const isMoving = part.progress > 0.003 && part.progress < 0.997;
    const motionGlow = isMoving ? Math.sin(part.progress * Math.PI) * 0.085 : 0;
    const pulse = isSelected
      ? 0.145 + Math.sin(time * 3.2) * 0.03
      : isHovered
        ? 0.06
        : motionGlow;
    part.materials.forEach((material) => {
      if (isSelected || isHovered || motionGlow > 0.001) {
        material.emissive.setHex(0x27d5e7);
        material.emissiveIntensity = pulse;
      } else {
        material.emissive.copy(material.userData.baseEmissive || new THREE.Color(0x000000));
        material.emissiveIntensity = material.userData.baseEmissiveIntensity || 0;
      }
    });
  }
}

function updateSelectionMarker(delta, elapsed) {
  if (!selectionHalo || !selectionLight || !selectionReticle) return;
  const selectedPart = state.selected ? runtime.get(state.selected) : null;
  const targetOpacity = selectedPart ? 0.5 + Math.sin(elapsed * 2.6) * 0.1 : 0;
  const targetReticleOpacity = selectedPart ? 0.52 + Math.sin(elapsed * 1.9) * 0.08 : 0;
  const targetIntensity = selectedPart ? 1.45 + Math.sin(elapsed * 2.6) * 0.25 : 0;

  selectionHalo.material.opacity = THREE.MathUtils.damp(
    selectionHalo.material.opacity,
    targetOpacity,
    7,
    delta
  );
  selectionReticle.material.opacity = THREE.MathUtils.damp(
    selectionReticle.material.opacity,
    targetReticleOpacity,
    6,
    delta
  );
  selectionLight.intensity = THREE.MathUtils.damp(selectionLight.intensity, targetIntensity, 7, delta);

  if (selectedPart) {
    const anchor = selectedPart.anchorObject.getWorldPosition(tempVec);
    selectionHalo.position.copy(anchor);
    selectionHalo.position.y += 0.035;
    selectionReticle.position.copy(anchor);
    const partScale = RETICLE_SCALE[selectedPart.id] || 1.4;
    const scale = partScale * 0.56 + Math.sin(elapsed * 2.1) * 0.035;
    selectionHalo.scale.set(scale, scale, 1);
    selectionReticle.material.rotation = -elapsed * 0.16;
    const reticleScale = partScale + Math.sin(elapsed * 1.6) * 0.045;
    selectionReticle.scale.set(reticleScale, reticleScale, 1);
    selectionLight.position.copy(anchor);
    selectionLight.position.y += 0.14;
    selectionHalo.visible = true;
    selectionReticle.visible = true;
    selectionLight.visible = true;
  } else if (selectionHalo.material.opacity < 0.005) {
    selectionHalo.visible = false;
    selectionReticle.visible = false;
    selectionLight.visible = false;
  }
}

function setHoveredPart(partId) {
  if (state.hovered === partId) return;
  state.hovered = partId;
  dom.canvas.classList.toggle('is-hovering', Boolean(partId));
  document.querySelectorAll('.part-item').forEach((button) => {
    button.classList.toggle('is-hovered', button.dataset.partId === partId);
  });
  if (partId) {
    const part = PART_DATA.find((item) => item.id === partId);
    if (part) {
      dom.hoverTip.innerHTML = `
        <span class="hover-tip__index">${part.code}</span>
        <span class="hover-tip__copy"><b>${part.name}</b><small>${part.en}</small></span>
        <span class="hover-tip__hint">点击拆解</span>
      `;
      dom.hoverTip.classList.add('is-visible');
    }
  } else {
    hideHoverTip();
  }
  updateHighlightState(performance.now() / 1000);
}

function hideHoverTip() {
  dom.hoverTip.classList.remove('is-visible');
}

function pickPartAt(clientX, clientY) {
  const rect = dom.canvas.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const intersections = raycaster.intersectObjects(pickables, false);
  return intersections.length ? intersections[0].object.userData.partId || null : null;
}

function bindEvents() {
  controls.addEventListener('start', () => {
    if (state.autoRotate) setAutoRotate(false);
    if (state.touring) stopTour();
    hideHoverTip();
    cameraTween = null;
  });

  controls.addEventListener('end', () => {
    dom.canvas.classList.remove('is-dragging');
  });

  dom.canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    state.pointerDown = true;
    state.pointerMoved = false;
    state.pointerStartX = event.clientX;
    state.pointerStartY = event.clientY;
    dom.canvas.classList.add('is-dragging');
    if (state.autoRotate) setAutoRotate(false);
    if (state.touring) stopTour();
    state.showIntroLabel = false;
      });

  dom.canvas.addEventListener('pointermove', (event) => {
    if (state.pointerDown) {
      const dx = event.clientX - state.pointerStartX;
      const dy = event.clientY - state.pointerStartY;
      if (Math.hypot(dx, dy) > 6) state.pointerMoved = true;
      if (state.pointerMoved) {
        hideHoverTip();
        setHoveredPart(null);
        return;
      }
    }

    if (state.booted) {
      const hitPart = pickPartAt(event.clientX, event.clientY);
      setHoveredPart(hitPart);
      if (hitPart) {
        dom.hoverTip.style.left = `${event.clientX}px`;
        dom.hoverTip.style.top = `${event.clientY}px`;
      }
    }
  });

  dom.canvas.addEventListener('pointerup', (event) => {
    if (!state.pointerDown) return;
    const wasDrag = state.pointerMoved;
    state.pointerDown = false;
    dom.canvas.classList.remove('is-dragging');

    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (wasDrag) return;

    const hitPart = pickPartAt(event.clientX, event.clientY);
    if (hitPart) {
      openPart(hitPart, { user: true, toggle: true });
    } else if (state.selected) {
      closeDetail();
    }
    state.showIntroLabel = false;
        updateCalloutClasses();
  });

  dom.canvas.addEventListener('pointercancel', () => {
    state.pointerDown = false;
    dom.canvas.classList.remove('is-dragging');
  });

  dom.canvas.addEventListener('pointerleave', () => {
    if (!state.pointerDown) {
      setHoveredPart(null);
      hideHoverTip();
    }
  });

  dom.explodeAllButton.addEventListener('click', () => {
    if (state.touring) stopTour();
    if (state.autoRotate) setAutoRotate(false);
    const allExploded = PART_DATA.every((part) => runtime.get(part.id).exploded);
    if (allExploded) {
      PART_DATA.slice()
        .reverse()
        .forEach((part, index) => setPartExploded(part.id, false, { delay: index * 35 }));
      showToast('所有部件正在归位 · ASSEMBLING');
    } else {
      const order = PART_DATA.slice().sort((a, b) => {
        const weights = { airframe: 6, gimbal: 0, battery: 1, sensing: 2, arms: 3, motors: 4, propellers: 5 };
        return weights[a.id] - weights[b.id];
      });
      order.forEach((part, index) => {
        if (!runtime.get(part.id).exploded) setPartExploded(part.id, true, { delay: index * 70 });
      });
      window.setTimeout(() => frameExplodedView(1.1), 280);
      showToast('结构分解已展开 · 7 MODULES ONLINE');
    }
    state.showIntroLabel = false;
        updateInterface();
  });

  dom.rotateButton.addEventListener('click', () => {
    setAutoRotate(!state.autoRotate);
    if (state.autoRotate) showToast('自动环绕已开启 · AUTO ORBIT');
  });

  dom.tourButton.addEventListener('click', () => {
    if (state.touring) {
      stopTour();
      showToast('自动巡览已停止');
    } else {
      startTour();
    }
  });

  dom.resetButton.addEventListener('click', () => {
    resetView();
  });

  dom.helpButton.addEventListener('click', openGuide);
  dom.closeGuideButton.addEventListener('click', closeGuide);
  dom.guideModal.querySelector('[data-close-guide]').addEventListener('click', closeGuide);

  dom.detailView.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const partId = state.selected;
    if (!partId) return;
    if (action.dataset.action === 'close') {
      closeDetail();
    } else if (action.dataset.action === 'toggle') {
      togglePart(partId);
      renderDetail(runtime.get(partId));
      updateInterface();
    } else if (action.dataset.action === 'focus') {
      focusOnPart(partId);
    }
  });

  dom.profilePrompt.addEventListener('click', () => {
    openPart('gimbal', { user: true, explode: true });
    showToast('双摄云台已分离 · 三轴增稳结构');
  });

  dom.partsToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('parts-open');
    dom.partsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      document.body.classList.remove('detail-open');
      dom.infoPanel.classList.remove('has-selection');
    }
  });

  dom.partsCollapse.addEventListener('click', () => {
    document.body.classList.remove('parts-open');
    dom.partsToggle.setAttribute('aria-expanded', 'false');
  });

  dom.brand.addEventListener('click', (event) => {
    event.preventDefault();
    resetView();
  });

  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select')) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (state.guideOpen) {
      if (key === 'escape') closeGuide();
      return;
    }
    if (key === 'escape') {
      if (state.selected) closeDetail();
      else if (document.body.classList.contains('parts-open')) {
        document.body.classList.remove('parts-open');
        dom.partsToggle.setAttribute('aria-expanded', 'false');
      }
      return;
    }
    if (key === 'e') {
      dom.explodeAllButton.click();
    } else if (key === 'r') {
      resetView();
    } else if (key === 't') {
      dom.tourButton.click();
    } else if (key === 'a') {
      setAutoRotate(!state.autoRotate);
    } else if (key === 'h') {
      openGuide();
    }
  });

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;

  camera.aspect = viewportWidth / viewportHeight;
  const config = getCameraConfig();
  camera.fov = config.fov;
  camera.updateProjectionMatrix();
  controls.maxDistance = config.maxDistance;

  const dpr = getTargetPixelRatio();
  renderer.setPixelRatio(dpr);
  renderer.setSize(viewportWidth, viewportHeight);
  if (composer) {
    composer.setPixelRatio(dpr);
    composer.setSize(viewportWidth, viewportHeight);
    if (bloomPass) bloomPass.setSize(viewportWidth, viewportHeight);
  }

  if (viewportWidth > 860) {
    document.body.classList.remove('parts-open', 'detail-open');
    dom.partsToggle.setAttribute('aria-expanded', 'false');
  }

  if (!cameraTween && !state.selected && !state.touring) {
    const anyExploded = PART_DATA.some((part) => runtime.get(part.id).exploded);
    if (!anyExploded) {
      camera.position.copy(getHomePosition());
      controls.target.copy(HOME_TARGET);
      controls.update();
    }
  }
}

function setAutoRotate(enabled) {
  state.autoRotate = Boolean(enabled);
  if (controls) controls.autoRotate = state.autoRotate;
  if (dom.rotateButton) {
    dom.rotateButton.setAttribute('aria-pressed', state.autoRotate ? 'true' : 'false');
  }
}

function showToast(message, duration = 3000) {
  dom.toastText.textContent = message;
  dom.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove('is-visible');
  }, duration);
}

function startCameraTween(toPosition, toTarget, duration = 1, onComplete = null) {
  cameraTween = {
    fromPosition: camera.position.clone(),
    toPosition: toPosition.clone(),
    fromTarget: controls.target.clone(),
    toTarget: toTarget.clone(),
    duration,
    elapsed: 0,
    onComplete,
  };
  setAutoRotate(false);
  controls.enabled = false;
}

function updateCameraTween(delta) {
  if (!cameraTween) return;
  cameraTween.elapsed += delta;
  const k = easeInOutCubic(THREE.MathUtils.clamp(cameraTween.elapsed / cameraTween.duration, 0, 1));
  camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, k);
  controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, k);
  camera.lookAt(controls.target);

  if (k >= 1) {
    const onComplete = cameraTween.onComplete;
    cameraTween = null;
    controls.enabled = true;
    controls.update();
    if (onComplete) onComplete();
  }
}

function focusOnPart(partId) {
  const part = runtime.get(partId);
  if (!part) return;
  const anchor = part.anchorObject.getWorldPosition(new THREE.Vector3());
  const direction = camera.position.clone().sub(controls.target).normalize();
  const distance = Math.min(Math.max(camera.position.distanceTo(controls.target), 4.5), 7.2);
  const desiredPosition = anchor.clone().addScaledVector(direction, distance);
  desiredPosition.y = Math.max(desiredPosition.y, 0.45);
  startCameraTween(desiredPosition, anchor, 0.9);
  showToast(`正在定位 · ${part.name}`);
}

function resetView() {
  if (state.touring) stopTour();
  state.selected = null;
  state.showIntroLabel = false;
    PART_DATA.forEach((part) => setPartExploded(part.id, false));
  closeDetail();
  setAutoRotate(false);
  startCameraTween(getHomePosition(), HOME_TARGET, 1.15, () => {
    showToast('视角已重置 · ASSEMBLED');
  });
  hideHoverTip();
  setHoveredPart(null);
  document.body.classList.remove('parts-open', 'detail-open');
  dom.partsToggle.setAttribute('aria-expanded', 'false');
}

function startTour() {
  state.touring = true;
  state.tourTime = 0;
  state.tourIndex = 0;
  state.showIntroLabel = false;
    dom.tourButton.setAttribute('aria-pressed', 'true');
  frameExplodedView(1.1);
  window.setTimeout(() => {
    if (state.touring) setAutoRotate(true);
  }, 1150);
  PART_DATA.forEach((part, index) => {
    if (!runtime.get(part.id).exploded) setPartExploded(part.id, true, { delay: index * 55 });
  });
  const first = PART_DATA[state.tourIndex];
  state.selected = first.id;
  dom.infoPanel.classList.add('has-selection');
  dom.profileView.hidden = true;
  dom.detailView.hidden = false;
  renderDetail(first);
  updateInterface();
  updateHighlightState();
  showToast('自动巡览启动 · AUTO TOUR');
}

function stopTour() {
  if (!state.touring) return;
  state.touring = false;
  dom.tourButton.setAttribute('aria-pressed', 'false');
  state.tourTime = 0;
}

function updateTour(delta) {
  if (!state.touring) return;
  state.tourTime += delta;
  if (state.tourTime < 3.4) return;
  state.tourTime = 0;
  state.tourIndex = (state.tourIndex + 1) % PART_DATA.length;
  const part = PART_DATA[state.tourIndex];
  state.selected = part.id;
  renderDetail(part);
  updateInterface();
  updateHighlightState();
}

function openGuide() {
  if (state.guideOpen) return;
  state.guideOpen = true;
  dom.guideModal.hidden = false;
  if (state.autoRotate) setAutoRotate(false);
  if (state.touring) stopTour();
  dom.closeGuideButton.focus();
}

function closeGuide() {
  if (!state.guideOpen) return;
  state.guideOpen = false;
  dom.guideModal.hidden = true;
  dom.helpButton.focus();
}

/* ==========================================================================
   Animation loop
   ========================================================================== */

function animate(timestamp) {
  requestAnimationFrame(animate);
  if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
  const delta = Math.min(Math.max((timestamp - lastFrameTimestamp) / 1000, 0), 0.05);
  lastFrameTimestamp = timestamp;
  animationTime += delta;
  const elapsed = animationTime;

  updateCameraTween(delta);
  updateTour(delta);
  animatePartProgress(delta);

  if (droneRoot) {
    droneRoot.position.y = ROOT_Y + Math.sin(elapsed * 0.82) * 0.019;
  }

  propSpinners.forEach(({ spinner, baseRotation, index }) => {
    const activeBoost =
      state.selected === 'propellers' || state.hovered === 'propellers' || state.touring ? 3.4 : 0.55;
    spinner.rotation.y = baseRotation + elapsed * (0.34 + activeBoost * 0.22) + index * 0.001;
  });

  if (orbitRingGroup) {
    orbitRingGroup.rotation.y = elapsed * 0.035;
    orbitRingGroup.children.forEach((child, index) => {
      if (child.material && child.material.opacity !== undefined && index < 3) {
        const base = index === 0 ? 0.28 : index === 1 ? 0.14 : 0.38;
        child.material.opacity = base + Math.sin(elapsed * 0.8 + index) * 0.045;
      }
    });
  }

  if (floorGlow) {
    floorGlow.material.opacity = 0.4 + Math.sin(elapsed * 0.75) * 0.045;
  }

  if (particleField) {
    particleField.rotation.y = elapsed * 0.007;
  }

  updateHighlightState(elapsed);
  controls.update();
  scene.updateMatrixWorld();
  camera.updateMatrixWorld();
  updateSelectionMarker(delta, elapsed);
  updateLabels();
  if (composer) composer.render();
  else renderer.render(scene, camera);

  fpsFrames += 1;
  fpsClock += delta;
  if (fpsClock >= 0.65) {
    displayedFps = Math.round(fpsFrames / fpsClock);
    if (dom.fpsValue) dom.fpsValue.textContent = String(displayedFps);
    fpsFrames = 0;
    fpsClock = 0;
  }

  if (dom.axisX) {
    dom.axisX.textContent = formatAxis(camera.position.x);
    dom.axisY.textContent = formatAxis(camera.position.y);
    dom.axisZ.textContent = formatAxis(camera.position.z);
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function formatAxis(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

/* ==========================================================================
   Boot sequence
   ========================================================================== */

function runBootSequence() {
  const start = performance.now();
  const duration = state.reducedMotion ? 220 : 920;
  const messages = [
    [0.12, 'ALLOCATING COMPOSITE SHELL'],
    [0.36, 'BUILDING DUAL-CAMERA GIMBAL'],
    [0.58, 'CALIBRATING SENSOR ARRAY'],
    [0.78, 'MAPPING OMNIDIRECTIONAL VISION'],
    [0.94, 'FINALIZING STRUCTURE GRAPH'],
  ];

  function tick(now) {
    const raw = Math.min((now - start) / duration, 1);
    const progress = Math.round((1 - Math.pow(1 - raw, 3)) * 100);
    dom.bootBar.style.width = `${progress}%`;
    dom.bootPercent.textContent = String(progress).padStart(3, '0');
    const message = messages.find(([threshold]) => raw >= threshold && raw < threshold + 0.2);
    if (message) dom.bootStatus.textContent = message[1];
    if (raw < 1) {
      requestAnimationFrame(tick);
    } else {
      dom.bootStatus.textContent = 'SYSTEM READY';
      window.setTimeout(finishBoot, state.reducedMotion ? 50 : 240);
    }
  }

  requestAnimationFrame(tick);
}

function finishBoot() {
  state.booted = true;
  dom.boot.classList.add('is-hidden');
  document.body.classList.add('is-ready');
  controls.enabled = true;
  controls.update();

  if (!state.reducedMotion) {
    window.setTimeout(() => {
      if (state.booted && !state.selected && !state.guideOpen) setAutoRotate(true);
    }, 1300);
  } else {
    state.showIntroLabel = false;
    updateCalloutClasses();
  }

  window.setTimeout(() => {
    if (state.booted) showToast('点击任意部件，开始结构拆解', 4200);
  }, state.reducedMotion ? 250 : 1700);

  updateInterface();
  applyDeepLink();
}

function applyDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const requestedPart = params.get('part');
  const requestedState = params.get('view');

  if (requestedState === 'exploded' || params.get('explode') === '1') {
    state.showIntroLabel = false;
    PART_DATA.forEach((part, index) => setPartExploded(part.id, true, { delay: index * 70 }));
    setAutoRotate(false);
  }

  if (requestedPart && runtime.has(requestedPart)) {
    window.setTimeout(() => {
      openPart(requestedPart, { explode: true });
      setAutoRotate(false);
    }, state.reducedMotion ? 0 : 500);
  }

  if (requestedState === 'exploded' || requestedPart) {
    frameExplodedView(0.5);
  }

  if (params.get('snap') === '1') {
    window.setTimeout(() => {
      runtime.forEach((part) => {
        part.progress = part.target;
        part.delayUntil = 0;
      });
      if (cameraTween) {
        cameraTween.elapsed = cameraTween.duration;
        updateCameraTween(0);
      }
      scene.updateMatrixWorld();
      updateLabels();
    }, 650);
  }
}

function frameExplodedView(duration = 1) {
  const direction = camera.position.clone().sub(controls.target).normalize();
  const target = new THREE.Vector3(0, 0.58, 0);
  const config = getCameraConfig();
  const distance = Math.max(config.explodedDistance, camera.position.distanceTo(controls.target));
  const position = target.clone().addScaledVector(direction, Math.min(distance, config.maxDistance));
  startCameraTween(position, target, duration);
}

init();
