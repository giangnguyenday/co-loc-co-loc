// Viewer settings (edit these first)
const SETTINGS = {
  defaultModel: "giang",
  autoRotate: true,
  // Speed of rotation when auto-rotate is on.
  rotationSpeed: 2.5,
  autoRotateDelayMs: 0,
  // Orbit controls (user interaction).
  orbitEnabled: true,
  // Zoom level (lower = closer).
  zoom: 1.65,
  // Base model size (higher = larger).
  modelSize: 260,
  // Background: set true for transparent canvas.
  backgroundTransparent: true,
  // Solid background color when not transparent.
  backgroundColor: 0x000000,
  useHDR: true,
  hdrPath: "assets/hdr.skysunrise.hdr",
  hdrAsBackground: false,
};

const CONFIG = {
  camera: { fov: 45, near: 0.1, far: 5000 },
  renderer: {
    antialias: true,
    pixelRatio: window.devicePixelRatio || 1,
    outputEncoding: THREE.sRGBEncoding,
    physicallyCorrectLights: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.5,
  },
  lights: {
    enabled: true,
    ambient: { color: 0xffffff, intensity: 0.3 },
    key: { color: 0xffffff, intensity: 1.47, position: [1.2, 1.5, 1.8] },
    rim: { color: 0x88b7ff, intensity: 0.9, position: [-1, 0.6, -1] },
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.08,
    minDistance: 30,
    maxDistance: 2500,
    enablePan: true,
    enableZoom: false,
    defaultRotation: { x: -0.18, y: 0.5, z: 0 },
  },
  model: {
    extrusionDepth: 50,
    bevelEnabled: true,
    bevelThickness: 25,
    bevelSize: 25,
    bevelSegments: 20,
    alphaThreshold: 20,
    maxContourPoints: 1400,
    targetSize: SETTINGS.modelSize ?? 260,
    alphaTest: 0.1,
    pngAdjust: {
      front: {
        saturation: 1,
        vibrance: 0,
        brightness: 0,
        contrast: 1,
      },
      back: {
        saturation: 1,
        vibrance: 0,
        brightness: 0,
        contrast: 1,
      },
    },
    testPlane: false,
    useTexture: true,
    useBasicMaterial: false,
    basicColor: 0x66aacc,
  },
  texture: {
    flipY: true,
    encoding: THREE.sRGBEncoding,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    anisotropyMax: 8,
  },
  materials: {
    useMatcap: false,
    useCrystal: true,
    crystal: {
      enabled: true,
      tint: 0xff6fb8,
      opacity: 0.57,
      transmission: 1.0,
      roughness: 1.0,
      thickness: 44.9,
      ior: 1.23,
      clearcoat: 1,
      clearcoatRoughness: 0,
      emissive: 0xff6fb8,
      emissiveIntensity: 37.7,
      metalness: 0,
      envMapIntensity: 1.84,
      attenuationColor: 0xff7fc8,
      attenuationDistance: 10,
      sideTintScale: 2,
      depthWrite: false,
    },
    matcap: {
      light: 0xf5f7ff,
      mid: 0x9aa8c3,
      dark: 0x2b3445,
    },
    cap: {
      side: THREE.DoubleSide,
      shininess: 35,
      specular: 0x3a3a3a,
    },
    side: {
      color: 0x101010,
      shininess: 220,
      specular: 0x2a2a2a,
    },
  },
  layers: {
    pngOffset: 0.55,
    pngGap: 0.05,
    backCrystalEnabled: true,
    backCrystalOffset: 1.25,
    backCrystalScale: 1.0,
    backCrystalTintScale: 0.9,
  },
  environment: {
    enabled: SETTINGS.useHDR,
    hdrPath: SETTINGS.hdrPath,
    background: SETTINGS.hdrAsBackground,
    backgroundColor: SETTINGS.backgroundColor,
  },
  framing: {
    distanceMultiplier: SETTINGS.zoom ?? 1.4,
    nearDivisor: 100,
    farMultiplier: 100,
  },
  shadows: {
    enabled: true,
    mapSize: 2048,
    bias: -0.00025,
    radius: 2,
  },
};

const MODEL_TEXTURES = {
  giang: "assets/loc.giang.png",
  jinny: "assets/loc.jinny.png",
  lam: "assets/loc.lam.png",
  banglam: "assets/loc.banglam.png",
  nha: "assets/loc.nha.png",
  nhan: "assets/loc.nhan.png",
  phong: "assets/loc.phong.png",
};

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  CONFIG.camera.near,
  CONFIG.camera.far,
);

const renderer = new THREE.WebGLRenderer({
  antialias: CONFIG.renderer.antialias,
  alpha: SETTINGS.backgroundTransparent,
});
const canvasMount = document.getElementById("horse3dMount");
const rendererParent = canvasMount || document.body;

function getRendererSize() {
  if (canvasMount) {
    const rect = canvasMount.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    return { width, height };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function resizeRendererToContainer() {
  const { width, height } = getRendererSize();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

resizeRendererToContainer();
renderer.setPixelRatio(CONFIG.renderer.pixelRatio);
renderer.outputEncoding = CONFIG.renderer.outputEncoding;
renderer.physicallyCorrectLights = CONFIG.renderer.physicallyCorrectLights;
renderer.toneMapping = CONFIG.renderer.toneMapping;
renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;
renderer.shadowMap.enabled = CONFIG.shadows.enabled && CONFIG.lights.enabled;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = "canvas";
rendererParent.appendChild(renderer.domElement);

let environmentMap = null;

function applyBackgroundSettings() {
  if (SETTINGS.backgroundTransparent) {
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    document.body.style.background = "transparent";
    return;
  }

  const resolvedBg = toHex(CONFIG.environment.backgroundColor);

  if (CONFIG.environment.background && environmentMap) {
    scene.background = environmentMap;
  } else {
    scene.background = new THREE.Color(resolvedBg);
  }

  renderer.setClearColor(resolvedBg, 1);
  document.body.style.background = `#${resolvedBg
    .toString(16)
    .padStart(6, "0")}`;
}

function loadEnvironment() {
  if (!CONFIG.environment.enabled || !THREE.RGBELoader) return;
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  new THREE.RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .load(
      CONFIG.environment.hdrPath,
      (hdr) => {
        const envMap = pmremGenerator.fromEquirectangular(hdr).texture;
        environmentMap = envMap;
        applyEnvironmentSettings();
        updateAllCrystalMaterials();
        hdr.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      (error) => {
        console.warn("HDR environment failed to load:", error);
        pmremGenerator.dispose();
      },
    );
}

function applyEnvironmentSettings() {
  const hasEnv = CONFIG.environment.enabled && environmentMap;
  scene.environment = hasEnv ? environmentMap : null;
  applyBackgroundSettings();
}

function applyRendererSettings() {
  renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;
  renderer.physicallyCorrectLights = CONFIG.renderer.physicallyCorrectLights;
  renderer.shadowMap.enabled = CONFIG.shadows.enabled && CONFIG.lights.enabled;
}

let ambientLight;
let keyLight;
let rimLight;

function applyLightingSettings() {
  const lightsOn = CONFIG.lights.enabled;
  if (!ambientLight || !keyLight || !rimLight) return;

  ambientLight.visible = lightsOn;
  keyLight.visible = lightsOn;
  rimLight.visible = lightsOn;

  ambientLight.color.set(CONFIG.lights.ambient.color);
  ambientLight.intensity = CONFIG.lights.ambient.intensity;

  keyLight.color.set(CONFIG.lights.key.color);
  keyLight.intensity = CONFIG.lights.key.intensity;
  keyLight.position.set(...CONFIG.lights.key.position);
  keyLight.castShadow = CONFIG.shadows.enabled && lightsOn;
  keyLight.shadow.mapSize.width = CONFIG.shadows.mapSize;
  keyLight.shadow.mapSize.height = CONFIG.shadows.mapSize;
  keyLight.shadow.bias = CONFIG.shadows.bias;
  keyLight.shadow.radius = CONFIG.shadows.radius;

  rimLight.color.set(CONFIG.lights.rim.color);
  rimLight.intensity = CONFIG.lights.rim.intensity;
  rimLight.position.set(...CONFIG.lights.rim.position);

  renderer.shadowMap.enabled = CONFIG.shadows.enabled && lightsOn;
}

function setupLights() {
  ambientLight = new THREE.AmbientLight(
    CONFIG.lights.ambient.color,
    CONFIG.lights.ambient.intensity,
  );
  scene.add(ambientLight);

  keyLight = new THREE.DirectionalLight(
    CONFIG.lights.key.color,
    CONFIG.lights.key.intensity,
  );
  keyLight.position.set(...CONFIG.lights.key.position);
  keyLight.shadow.mapSize.width = CONFIG.shadows.mapSize;
  keyLight.shadow.mapSize.height = CONFIG.shadows.mapSize;
  keyLight.shadow.bias = CONFIG.shadows.bias;
  keyLight.shadow.radius = CONFIG.shadows.radius;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 2000;
  keyLight.shadow.camera.left = -600;
  keyLight.shadow.camera.right = 600;
  keyLight.shadow.camera.top = 600;
  keyLight.shadow.camera.bottom = -600;
  scene.add(keyLight);

  rimLight = new THREE.DirectionalLight(
    CONFIG.lights.rim.color,
    CONFIG.lights.rim.intensity,
  );
  rimLight.position.set(...CONFIG.lights.rim.position);
  scene.add(rimLight);

  applyLightingSettings();
}

setupLights();
applyRendererSettings();
applyEnvironmentSettings();
if (CONFIG.environment.enabled) loadEnvironment();

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = CONFIG.controls.enableDamping;
controls.dampingFactor = CONFIG.controls.dampingFactor;
controls.minDistance = CONFIG.controls.minDistance;
controls.maxDistance = CONFIG.controls.maxDistance;
const orbitEnabled = SETTINGS.orbitEnabled;
controls.enableRotate = orbitEnabled || SETTINGS.autoRotate;
controls.enablePan = orbitEnabled && CONFIG.controls.enablePan;
controls.enableZoom = orbitEnabled && CONFIG.controls.enableZoom;
controls.autoRotate = SETTINGS.autoRotate;
controls.autoRotateSpeed = SETTINGS.rotationSpeed;
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.NONE,
};

let lastUserInteraction = performance.now();

const markInteracted = () => {
  lastUserInteraction = performance.now();
};

renderer.domElement.addEventListener("pointerdown", markInteracted);
renderer.domElement.addEventListener("wheel", markInteracted, {
  passive: true,
});

let currentModel = null;
let currentModelName = SETTINGS.defaultModel;
let currentLoadId = 0;

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = path;
  });
}

function buildMaskFromImage(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  let data;
  try {
    ({ data } = ctx.getImageData(0, 0, canvas.width, canvas.height));
  } catch (error) {
    return { mask: null, width: canvas.width, height: canvas.height, error };
  }

  const width = canvas.width;
  const height = canvas.height;
  const total = width * height;
  const mask = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    const alpha = data[i * 4 + 3];
    mask[i] = alpha > CONFIG.model.alphaThreshold ? 1 : 0;
  }

  return { mask, width, height, error: null };
}

function applyPngAdjustments(image, adjust) {
  const { saturation, vibrance, brightness, contrast } = adjust;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  if (
    saturation === 1 &&
    vibrance === 0 &&
    brightness === 0 &&
    contrast === 1
  ) {
    return canvas;
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    r = (r - 0.5) * contrast + 0.5 + brightness;
    g = (g - 0.5) * contrast + 0.5 + brightness;
    b = (b - 0.5) * contrast + 0.5 + brightness;

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    r = luma + (r - luma) * saturation;
    g = luma + (g - luma) * saturation;
    b = luma + (b - luma) * saturation;

    const max = Math.max(r, g, b);
    const vibFactor =
      vibrance >= 0 ? 1 + vibrance * (1 - max) : 1 + vibrance;
    r = luma + (r - luma) * vibFactor;
    g = luma + (g - luma) * vibFactor;
    b = luma + (b - luma) * vibFactor;

    data[i] = Math.max(0, Math.min(255, Math.round(r * 255)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function traceContour(mask, width, height) {
  const isSolid = (x, y) =>
    x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x];
  const isBoundary = (x, y) => {
    if (!isSolid(x, y)) return false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (!isSolid(x + dx, y + dy)) return true;
      }
    }
    return false;
  };

  let startX = -1;
  let startY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] && isBoundary(x, y)) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }

  if (startX === -1) return [];

  const directions = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  const contour = [];
  let x = startX;
  let y = startY;
  let prevDir = 6;
  let guard = 0;
  const maxSteps = width * height * 4;

  do {
    contour.push([x, y]);
    let found = false;

    for (let i = 0; i < 8; i++) {
      const dir = (prevDir + 1 + i) % 8;
      const nx = x + directions[dir][0];
      const ny = y + directions[dir][1];

      if (isSolid(nx, ny)) {
        x = nx;
        y = ny;
        prevDir = (dir + 4) % 8;
        found = true;
        break;
      }
    }

    if (!found) break;
    guard++;
    if (guard > maxSteps) break;
  } while (!(x === startX && y === startY));

  return contour;
}

function decimateContour(points) {
  if (points.length <= CONFIG.model.maxContourPoints) return points;
  const stride = Math.ceil(points.length / CONFIG.model.maxContourPoints);
  const reduced = [];
  for (let i = 0; i < points.length; i += stride) {
    reduced.push(points[i]);
  }
  return reduced;
}

function createTextureFromImage(image, adjustConfig) {
  const adjustedCanvas = applyPngAdjustments(image, adjustConfig);
  const texture = new THREE.CanvasTexture(adjustedCanvas);
  texture.needsUpdate = true;
  texture.flipY = CONFIG.texture.flipY;
  texture.encoding = CONFIG.texture.encoding;
  texture.minFilter = CONFIG.texture.minFilter;
  texture.magFilter = CONFIG.texture.magFilter;
  texture.anisotropy = Math.min(
    CONFIG.texture.anisotropyMax,
    renderer.capabilities.getMaxAnisotropy(),
  );
  return texture;
}

let cachedMatcap = null;

function hexToRgb(hex) {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255,
  };
}

function rgbToCss({ r, g, b }) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function getMatcapTexture() {
  if (cachedMatcap) return cachedMatcap;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const light = hexToRgb(CONFIG.materials.matcap.light);
  const mid = hexToRgb(CONFIG.materials.matcap.mid);
  const dark = hexToRgb(CONFIG.materials.matcap.dark);

  const gradient = ctx.createRadialGradient(
    size * 0.35,
    size * 0.35,
    size * 0.05,
    size * 0.55,
    size * 0.6,
    size * 0.75,
  );
  gradient.addColorStop(0, rgbToCss(light));
  gradient.addColorStop(0.45, rgbToCss(mid));
  gradient.addColorStop(1, rgbToCss(dark));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  cachedMatcap = texture;
  return cachedMatcap;
}

function toHex(colorValue) {
  if (typeof colorValue === "number") return colorValue;
  return new THREE.Color(colorValue).getHex();
}

function scaleColor(hex, factor) {
  const resolved = toHex(hex);
  const r = Math.min(
    255,
    Math.max(0, Math.round(((resolved >> 16) & 255) * factor)),
  );
  const g = Math.min(
    255,
    Math.max(0, Math.round(((resolved >> 8) & 255) * factor)),
  );
  const b = Math.min(
    255,
    Math.max(0, Math.round((resolved & 255) * factor)),
  );
  return (r << 16) | (g << 8) | b;
}

function getCrystalConfig() {
  return CONFIG.materials.crystal;
}

function createCrystalMaterial(tintScale, side, role) {
  const matConfig = getCrystalConfig();
  const resolvedTint = scaleColor(matConfig.tint, tintScale ?? 1);
  const materialOptions = {
    color: resolvedTint,
    transparent: true,
    opacity: matConfig.opacity,
    transmission: matConfig.transmission,
    roughness: matConfig.roughness,
    metalness: matConfig.metalness || 0,
    thickness: matConfig.thickness,
    ior: matConfig.ior,
    emissive: matConfig.emissive || 0x000000,
    emissiveIntensity: matConfig.emissiveIntensity || 0,
    clearcoat: matConfig.clearcoat,
    clearcoatRoughness: matConfig.clearcoatRoughness,
    envMapIntensity: matConfig.envMapIntensity || 1,
    depthWrite: matConfig.depthWrite ?? false,
    side,
  };

  if (matConfig.attenuationColor !== undefined) {
    materialOptions.attenuationColor = matConfig.attenuationColor;
  }
  if (matConfig.attenuationDistance !== undefined) {
    materialOptions.attenuationDistance = matConfig.attenuationDistance;
  }

  const material = new THREE.MeshPhysicalMaterial(materialOptions);
  material.userData.tintScale = tintScale ?? 1;
  material.userData.role = role || "cap";
  return material;
}

function updateCrystalMaterial(material) {
  const config = getCrystalConfig();
  const tintScale = material.userData?.tintScale ?? 1;
  material.color.setHex(scaleColor(config.tint, tintScale));
  material.opacity = config.opacity;
  material.transmission = config.transmission;
  material.roughness = config.roughness;
  material.metalness = config.metalness;
  material.thickness = config.thickness;
  material.ior = config.ior;
  material.clearcoat = config.clearcoat;
  material.clearcoatRoughness = config.clearcoatRoughness;
  material.envMapIntensity = config.envMapIntensity;
  material.depthWrite = config.depthWrite ?? false;

  if (material.emissive) {
    material.emissive.set(config.emissive ?? 0x000000);
  }
  if (config.emissiveIntensity !== undefined) {
    material.emissiveIntensity = config.emissiveIntensity;
  }
  if (config.attenuationColor !== undefined) {
    material.attenuationColor = new THREE.Color(config.attenuationColor);
  }
  if (config.attenuationDistance !== undefined) {
    material.attenuationDistance = config.attenuationDistance;
  }

  material.needsUpdate = true;
}

function updateAllCrystalMaterials() {
  if (!currentModel) return;
  const crystalConfig = getCrystalConfig();
  const backScale = CONFIG.layers.backCrystalTintScale;
  currentModel.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((mat) => {
      if (mat && mat.isMeshPhysicalMaterial) {
        if (mat.userData?.role === "side") {
          mat.userData.tintScale = crystalConfig.sideTintScale ?? 0.85;
        } else if (mat.userData?.role === "backCap") {
          mat.userData.tintScale = backScale;
        } else if (mat.userData?.role === "backSide") {
          mat.userData.tintScale = backScale * 0.9;
        }
        updateCrystalMaterial(mat);
      }
    });
  });
}

function updatePngMaterials() {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((mat) => {
      if (mat && mat.isMeshBasicMaterial && mat.map) {
        mat.alphaTest = CONFIG.model.alphaTest;
        mat.needsUpdate = true;
      }
    });
  });
}

function buildFlatImageMesh(image) {
  const width = image.width || 1;
  const height = image.height || 1;
  const useTexture = CONFIG.model.useTexture;
  const texture = useTexture
    ? createTextureFromImage(image, CONFIG.model.pngAdjust.front)
    : null;
  const color = useTexture ? 0xffffff : CONFIG.model.basicColor;
  const useMatcap = CONFIG.materials.useMatcap;
  const crystalConfig = getCrystalConfig();
  const useCrystalMaterial =
    CONFIG.materials.useCrystal && crystalConfig.enabled && !useTexture && !useMatcap;
  const useBasic = CONFIG.model.useBasicMaterial && !useMatcap && !useCrystalMaterial;

  const geometry = new THREE.PlaneGeometry(width, height);
  geometry.center();

  const material = useTexture
    ? new THREE.MeshBasicMaterial({
        color,
        map: texture,
        transparent: true,
        alphaTest: CONFIG.model.alphaTest,
        side: THREE.DoubleSide,
      })
    : useCrystalMaterial
      ? createCrystalMaterial(1, THREE.DoubleSide, "cap")
      : useMatcap
        ? new THREE.MeshMatcapMaterial({
            color,
            matcap: getMatcapTexture(),
            side: THREE.DoubleSide,
          })
        : useBasic
          ? new THREE.MeshBasicMaterial({
              color,
              side: THREE.DoubleSide,
            })
          : new THREE.MeshPhongMaterial({
              color,
              side: THREE.DoubleSide,
              shininess: CONFIG.materials.cap.shininess,
              specular: CONFIG.materials.cap.specular,
            });

  const mesh = new THREE.Mesh(geometry, material);
  const scale = CONFIG.model.targetSize / Math.max(width, height);
  mesh.scale.set(scale, scale, scale);

  return mesh;
}

function createUVGenerator(width, height) {
  const minX = -width / 2;
  const minY = -height / 2;
  const rangeX = width || 1;
  const rangeY = height || 1;
  const depth = CONFIG.model.extrusionDepth || 1;

  const generateSide = (geometry, vertices, indexA, indexB, indexC, indexD) => {
    const az = vertices[indexA].z / depth;
    const bz = vertices[indexB].z / depth;
    const cz = vertices[indexC].z / depth;
    const dz = vertices[indexD].z / depth;

    return [
      new THREE.Vector2(0, az),
      new THREE.Vector2(1, bz),
      new THREE.Vector2(1, cz),
      new THREE.Vector2(0, dz),
    ];
  };

  return {
    generateTopUV: (geometry, vertices, indexA, indexB, indexC) => {
      const ax = (vertices[indexA].x - minX) / rangeX;
      const ay = (vertices[indexA].y - minY) / rangeY;
      const bx = (vertices[indexB].x - minX) / rangeX;
      const by = (vertices[indexB].y - minY) / rangeY;
      const cx = (vertices[indexC].x - minX) / rangeX;
      const cy = (vertices[indexC].y - minY) / rangeY;

      return [
        new THREE.Vector2(ax, ay),
        new THREE.Vector2(bx, by),
        new THREE.Vector2(cx, cy),
      ];
    },
    generateSideUV: generateSide,
    generateSideWallUV: generateSide,
  };
}

function buildExtrudedMeshFromImage(image) {
  if (CONFIG.model.testPlane) return buildFlatImageMesh(image);
  const maskData = buildMaskFromImage(image);
  if (!maskData.mask) {
    console.warn(
      "Mask read failed; showing flat PNG. Try a local server instead of file://",
    );
    return buildFlatImageMesh(image);
  }

  const { mask, width, height } = maskData;
  const contour = traceContour(mask, width, height);
  if (contour.length < 8) return buildFlatImageMesh(image);

  const reduced = decimateContour(contour);
  const centerX = width / 2;
  const centerY = height / 2;
  const points = reduced.map(
    ([x, y]) => new THREE.Vector2(x - centerX, height - y - centerY),
  );

  if (!THREE.ShapeUtils.isClockWise(points)) points.reverse();

  const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {
    depth: CONFIG.model.extrusionDepth,
    bevelEnabled: CONFIG.model.bevelEnabled,
    bevelThickness: CONFIG.model.bevelThickness,
    bevelSize: CONFIG.model.bevelSize,
    bevelSegments: CONFIG.model.bevelSegments,
    UVGenerator: createUVGenerator(width, height),
  });

  geometry.computeVertexNormals();
  geometry.center();

  const useTexture = CONFIG.model.useTexture;
  const useMatcap = CONFIG.materials.useMatcap;
  const crystalConfig = getCrystalConfig();
  const useCrystalMaterial =
    CONFIG.materials.useCrystal && crystalConfig.enabled && !useMatcap;
  const useOverlay = useTexture && useMatcap;
  const useBasic = CONFIG.model.useBasicMaterial && !useMatcap && !useCrystalMaterial;
  const texture = useTexture
    ? createTextureFromImage(image, CONFIG.model.pngAdjust.front)
    : null;
  const capColor = useTexture ? 0xffffff : CONFIG.model.basicColor;

  const capMaterial = useCrystalMaterial
    ? createCrystalMaterial(1, CONFIG.materials.cap.side, "cap")
    : useOverlay
      ? new THREE.MeshMatcapMaterial({
          color: CONFIG.model.basicColor,
          matcap: getMatcapTexture(),
          side: CONFIG.materials.cap.side,
        })
      : useTexture
        ? new THREE.MeshBasicMaterial({
            color: capColor,
            map: texture,
            transparent: true,
            alphaTest: CONFIG.model.alphaTest,
            side: CONFIG.materials.cap.side,
          })
        : useMatcap
          ? new THREE.MeshMatcapMaterial({
              color: capColor,
              matcap: getMatcapTexture(),
              side: CONFIG.materials.cap.side,
            })
          : useBasic
            ? new THREE.MeshBasicMaterial({
                color: capColor,
                side: CONFIG.materials.cap.side,
              })
            : new THREE.MeshPhongMaterial({
                color: capColor,
                side: CONFIG.materials.cap.side,
                shininess: CONFIG.materials.cap.shininess,
                specular: CONFIG.materials.cap.specular,
              });

  const sideMaterial = useCrystalMaterial
    ? createCrystalMaterial(
        crystalConfig.sideTintScale ?? 0.85,
        THREE.FrontSide,
        "side",
      )
    : useMatcap
      ? new THREE.MeshMatcapMaterial({
          color: CONFIG.model.basicColor,
          matcap: getMatcapTexture(),
        })
      : useBasic
        ? new THREE.MeshBasicMaterial({
            color: CONFIG.model.basicColor,
          })
        : new THREE.MeshPhongMaterial({
            color: CONFIG.materials.side.color,
            shininess: CONFIG.materials.side.shininess,
            specular: CONFIG.materials.side.specular,
          });

  const mesh = new THREE.Mesh(geometry, [capMaterial, sideMaterial]);
  mesh.castShadow = CONFIG.shadows.enabled && CONFIG.lights.enabled;
  mesh.receiveShadow = CONFIG.shadows.enabled && CONFIG.lights.enabled;

  if (useCrystalMaterial && useTexture) {
    const backingGeo = new THREE.PlaneGeometry(width, height);
    backingGeo.center();
    const backGeo = backingGeo.clone();
    const backUv = backGeo.attributes.uv;
    for (let i = 0; i < backUv.count; i++) {
      backUv.setX(i, 1 - backUv.getX(i));
    }
    backUv.needsUpdate = true;
    const frontTexture = createTextureFromImage(
      image,
      CONFIG.model.pngAdjust.front,
    );
    const backTexture = createTextureFromImage(
      image,
      CONFIG.model.pngAdjust.back,
    );
    const backingFrontMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: frontTexture,
      transparent: false,
      alphaTest: CONFIG.model.alphaTest,
      side: THREE.FrontSide,
      depthWrite: true,
    });
    const backingBackMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: backTexture,
      transparent: false,
      alphaTest: CONFIG.model.alphaTest,
      side: THREE.FrontSide,
      depthWrite: true,
    });
    backingFrontMat.alphaToCoverage = renderer.capabilities.isWebGL2;
    backingBackMat.alphaToCoverage = renderer.capabilities.isWebGL2;
    const backingFront = new THREE.Mesh(backingGeo, backingFrontMat);
    const backingBack = new THREE.Mesh(backGeo, backingBackMat);
    const backingZ = -CONFIG.model.extrusionDepth / 2 - CONFIG.layers.pngOffset;
    backingFront.position.z = backingZ;
    backingBack.position.z = backingZ - CONFIG.layers.pngGap;
    backingBack.rotation.y = Math.PI;
    backingFront.castShadow = false;
    backingFront.receiveShadow = false;
    backingBack.castShadow = false;
    backingBack.receiveShadow = false;
    backingFront.renderOrder = 0;
    backingBack.renderOrder = 0;
    mesh.renderOrder = 2;

    const group = new THREE.Group();
    if (CONFIG.layers.backCrystalEnabled) {
      const backGeometry = geometry.clone();
      const backCapMat = createCrystalMaterial(
        CONFIG.layers.backCrystalTintScale,
        CONFIG.materials.cap.side,
        "backCap",
      );
      const backSideMat = createCrystalMaterial(
        CONFIG.layers.backCrystalTintScale * 0.9,
        THREE.FrontSide,
        "backSide",
      );
      const crystalBack = new THREE.Mesh(backGeometry, [
        backCapMat,
        backSideMat,
      ]);
      crystalBack.position.z = -CONFIG.layers.backCrystalOffset;
      crystalBack.scale.set(
        CONFIG.layers.backCrystalScale,
        CONFIG.layers.backCrystalScale,
        1,
      );
      crystalBack.castShadow = false;
      crystalBack.receiveShadow = false;
      crystalBack.renderOrder = 0;
      group.add(crystalBack);
    }
    group.add(backingFront);
    group.add(backingBack);
    group.add(mesh);

    const scale = CONFIG.model.targetSize / Math.max(width, height);
    group.scale.set(scale, scale, scale);
    return group;
  }

  const scale = CONFIG.model.targetSize / Math.max(width, height);
  mesh.scale.set(scale, scale, scale);

  return mesh;
}

function replaceModel(mesh) {
  if (currentModel) {
    scene.remove(currentModel);
    disposeObject(currentModel);
  }
  currentModel = mesh;
  currentModel.traverse?.((child) => {
    if (child.isMesh) {
      child.castShadow = CONFIG.shadows.enabled && CONFIG.lights.enabled;
      child.receiveShadow = CONFIG.shadows.enabled && CONFIG.lights.enabled;
    }
  });
  scene.add(currentModel);
  frameObject(currentModel);
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          if (mat.map) mat.map.dispose();
          if (mat.matcap && mat.matcap !== cachedMatcap) mat.matcap.dispose();
          mat.dispose();
        });
      } else if (child.material) {
        if (child.material.map) child.material.map.dispose();
        if (child.material.matcap && child.material.matcap !== cachedMatcap) {
          child.material.matcap.dispose();
        }
        child.material.dispose();
      }
    }
  });
}

function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * CONFIG.framing.distanceMultiplier;

  camera.position.set(center.x, center.y, center.z + distance);
  camera.near = Math.max(0.1, distance / CONFIG.framing.nearDivisor);
  camera.far = distance * CONFIG.framing.farMultiplier;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();

  object.rotation.set(
    CONFIG.controls.defaultRotation.x,
    CONFIG.controls.defaultRotation.y,
    CONFIG.controls.defaultRotation.z,
  );
}

async function loadModel(modelName) {
  currentModelName = modelName;
  const loadId = ++currentLoadId;
  const texturePath =
    MODEL_TEXTURES[modelName] || `assets/loc.${modelName}.png`;

  try {
    const image = await loadImage(texturePath);
    if (loadId !== currentLoadId) return;
    const mesh = buildExtrudedMeshFromImage(image);
    if (loadId !== currentLoadId) return;
    replaceModel(mesh);
  } catch (error) {
    console.error(`Failed to load model: ${modelName}`, error);
  }
}

const SETTINGS_TEMPLATE = {
  renderer: {
    toneMappingExposure: true,
    physicallyCorrectLights: true,
  },
  environment: {
    enabled: true,
    background: true,
    backgroundColor: true,
    hdrPath: true,
  },
  lights: {
    enabled: true,
    ambient: { color: true, intensity: true },
    key: { color: true, intensity: true, position: [] },
    rim: { color: true, intensity: true, position: [] },
  },
  shadows: {
    enabled: true,
    mapSize: true,
    bias: true,
    radius: true,
  },
  materials: {
    useCrystal: true,
    crystal: {
      enabled: true,
      tint: true,
      opacity: true,
      transmission: true,
      roughness: true,
      thickness: true,
      ior: true,
      clearcoat: true,
      clearcoatRoughness: true,
      emissive: true,
      emissiveIntensity: true,
      metalness: true,
      envMapIntensity: true,
      attenuationColor: true,
      attenuationDistance: true,
      sideTintScale: true,
      depthWrite: true,
    },
  },
  layers: {
    pngOffset: true,
    pngGap: true,
    backCrystalEnabled: true,
    backCrystalOffset: true,
    backCrystalScale: true,
    backCrystalTintScale: true,
  },
  model: {
    extrusionDepth: true,
    bevelEnabled: true,
    bevelThickness: true,
    bevelSize: true,
    bevelSegments: true,
    alphaThreshold: true,
    maxContourPoints: true,
    targetSize: true,
    alphaTest: true,
    pngAdjust: {
      front: {
        saturation: true,
        vibrance: true,
        brightness: true,
        contrast: true,
      },
      back: {
        saturation: true,
        vibrance: true,
        brightness: true,
        contrast: true,
      },
    },
  },
};

function mergeSettings(target, source, template) {
  if (!source) return;
  Object.keys(template).forEach((key) => {
    const tmpl = template[key];
    const value = source[key];
    if (value === undefined) return;

    if (Array.isArray(tmpl)) {
      if (!Array.isArray(value)) return;
      target[key] = value.slice(0, 3).map((item) => Number(item));
    } else if (tmpl && typeof tmpl === "object") {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      mergeSettings(target[key], value, tmpl);
    } else {
      target[key] = value;
    }
  });
}

function applySettings(settings) {
  mergeSettings(CONFIG, settings, SETTINGS_TEMPLATE);

  applyRendererSettings();
  applyLightingSettings();

  if (CONFIG.environment.enabled) {
    loadEnvironment();
  } else {
    environmentMap = null;
    scene.environment = null;
  }

  applyEnvironmentSettings();
  applyBackgroundSettings();
  updateAllCrystalMaterials();
  updatePngMaterials();
}

window.addEventListener("resize", () => {
  resizeRendererToContainer();
});

window.addEventListener("pageshow", () => {
  resizeRendererToContainer();
});

function animate() {
  requestAnimationFrame(animate);
  if (SETTINGS.autoRotate) {
    const now = performance.now();
    const idleTime = now - lastUserInteraction;
    controls.autoRotate = idleTime >= SETTINGS.autoRotateDelayMs;
  } else {
    controls.autoRotate = false;
  }
  controls.update();
  renderer.render(scene, camera);
}

animate();
