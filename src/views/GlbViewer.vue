<template>
  <div ref="viewerRef" class="glb-viewer" @drop="handleDrop" @dragover.prevent>
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <n-space :size="6">
        <n-button size="tiny" @click="resetCamera">重置视角</n-button>
        <n-button size="tiny" @click="toggleAutoRotate">
          {{ autoRotate ? "停止旋转" : "自动旋转" }}
        </n-button>
        <n-button size="tiny" @click="toggleWireframe">
          {{ wireframe ? "实体模式" : "线框模式" }}
        </n-button>
        <n-button size="tiny" @click="switchToCrane">返回岸桥仿真</n-button>
      </n-space>
      <n-space :size="6">
        <n-tag size="small" :type="progressText ? 'warning' : 'info'">
          {{ modelName }} {{ progressText }}
        </n-tag>
      </n-space>
    </div>

    <!-- 左侧: 关键部件 + 控制面板 -->
    <div class="left-panel" v-if="showPanel">
      <!-- 5个关键部件状态 -->
      <n-card
        title="关键部件"
        size="small"
        :bordered="false"
        class="parts-card"
      >
        <n-list size="tiny" style="background: transparent">
          <n-list-item
            v-for="p in keyPartStatusList"
            :key="p.name"
            style="padding: 3px 0"
          >
            <n-space justify="space-between" style="width: 100%">
              <n-space :size="4">
                <n-text
                  :style="{
                    color: p.found ? '#4caf50' : '#f44336',
                    fontSize: '12px',
                  }"
                >
                  {{ p.found ? "●" : "○" }}
                </n-text>
                <n-text style="color: #ccc; font-size: 12px">{{
                  p.label
                }}</n-text>
              </n-space>
              <n-tag size="tiny" :type="p.found ? 'success' : 'error'">{{
                p.type
              }}</n-tag>
            </n-space>
          </n-list-item>
        </n-list>
      </n-card>

      <!-- 控制 -->
      <n-card title="控制" size="small" :bordered="false" class="parts-card">
        <n-space vertical :size="10">
          <div>
            <n-space justify="space-between">
              <n-text style="color: #ff6b6b; font-size: 11px"
                >横向位置 (沿大梁)</n-text
              >
              <n-tag size="tiny" style="font-family: monospace">{{
                ctrlHorizontal.toFixed(2)
              }}</n-tag>
            </n-space>
            <n-slider
              :value="ctrlHorizontal"
              :min="-100"
              :max="100"
              :step="0.1"
              style="margin: 4px 0"
              @update:value="updateHorizontal"
            />
          </div>
          <div>
            <n-space justify="space-between">
              <n-text style="color: #51cf66; font-size: 11px"
                >起升高度 (纵向)</n-text
              >
              <n-tag size="tiny" style="font-family: monospace">{{
                ctrlVertical.toFixed(2)
              }}</n-tag>
            </n-space>
            <n-slider
              :value="ctrlVertical"
              :min="-20"
              :max="100"
              :step="0.1"
              style="margin: 4px 0"
              @update:value="updateVertical"
            />
          </div>
          <div>
            <n-space justify="space-between">
              <n-text style="color: #ffaa00; font-size: 11px">大梁角度</n-text>
              <n-tag size="tiny" style="font-family: monospace"
                >{{ beamAngle }}°</n-tag
              >
            </n-space>
            <n-slider
              :value="beamAngle"
              :min="-180"
              :max="180"
              :step="1"
              style="margin: 4px 0"
              @update:value="onBeamAngleChange"
            />
          </div>
          <n-space :size="6">
            <n-button
              size="tiny"
              type="success"
              :disabled="simulating"
              @click="simulateLoading"
              >模拟装船</n-button
            >
            <n-button
              size="tiny"
              type="warning"
              :disabled="simulating"
              @click="simulateUnloading"
              >模拟卸船</n-button
            >
          </n-space>
          <n-button size="tiny" block quaternary @click="resetAll"
            >重置位置</n-button
          >
          <n-checkbox
            v-model:checked="showBox"
            size="small"
            @update:checked="toggleBoxVisible"
            >显示箱子</n-checkbox
          >
          <n-checkbox
            v-model:checked="showGroundBoxes"
            size="small"
            @update:checked="toggleGroundBoxes"
            >地面箱子</n-checkbox
          >
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
// --- Three.js 核心库 ---
import * as THREE from "three";
// OrbitControls: 轨道控制器，支持鼠标拖拽旋转/缩放/平移视角
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// GLTFLoader: 加载 GLB/GLTF 格式的 3D 模型
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// DRACOLoader: GLTF 的 Draco 压缩解压器，减小模型体积
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const router = useRouter();

// ========================================================================
// #region 响应式状态
// ========================================================================
const viewerRef = ref<HTMLDivElement>();
const modelName = ref("Untitled.glb");
const progressText = ref("");
const autoRotate = ref(false);
const wireframe = ref(false);
const scaleFactor = ref(1);

// 模拟装船/卸船
const simulating = ref(false);
const showPanel = ref(false);
const showBox = ref(true);
const showGroundBoxes = ref(true);
const beamAngle = ref(140); // 大梁与 X 轴夹角（度），用于校正横向移动方向

// #region 响应式状态
// --- Three.js 核心对象引用 ---
let scene: THREE.Scene; // Scene: 场景容器，所有物体/灯光/相机都添加到这里
let camera: THREE.PerspectiveCamera; // PerspectiveCamera: 透视相机，模拟人眼近大远小效果
let renderer: THREE.WebGLRenderer; // WebGLRenderer: WebGL 渲染器，负责将场景绘制到 canvas
let controls: OrbitControls; // OrbitControls: 轨道控制器，鼠标交互控制相机
let craneRoot: THREE.Group | null = null; // Group: 模型根节点，包含所有子部件
let animationId = 0; // requestAnimationFrame 的 ID，用于取消动画循环
const partCache = new Map<string, THREE.Object3D>(); // Object3D: 所有 3D 对象的基类，通过 name 查找部件

// 5个关键部件
const PART_NAMES = ["main_frame", "box", "trolley", "spreader", "hoistRope"];
const keyParts = ref<Record<string, THREE.Object3D | null>>({
  main_frame: null,
  box: null,
  trolley: null,
  spreader: null,
  hoistRope: null,
});
const ctrlHorizontal = ref(0); // 横向位置（沿大梁）
const ctrlVertical = ref(0); // 纵向位置（起升高度）
// 存储关键部件初始位置，用于计算偏移量
const initPos = new Map<string, { x: number; y: number; z: number }>();
// 联动偏移量
let spreaderOffX = 0; // spreader.x - trolley.x
let boxOffY = 0; // box.y - spreader.y
let ropeInitScaleY = 1; // hoistRope 初始 Y 缩放
let ropeLen = 0; // trolley.y - spreader.y 初始差值

// #endregion

// ========================================================================
// #region 计算属性
// ========================================================================
/** 5个关键部件的状态列表（用于模板展示） */
interface KeyPartStatus {
  name: string;
  label: string;
  found: boolean;
  type: string;
}
const keyPartStatusList = computed<KeyPartStatus[]>(() => {
  const labels: Record<string, string> = {
    main_frame: "岸桥主架",
    box: "箱子",
    trolley: "小车",
    spreader: "吊具",
    hoistRope: "钢丝绳",
  };
  return PART_NAMES.map((name) => {
    const obj = keyParts.value[name];
    return {
      name,
      label: labels[name] || name,
      found: !!obj,
      type: obj?.type ?? "-",
    };
  });
});

// #endregion

// #region 场景初始化
function initScene() {
  if (!viewerRef.value) return;

  // --- Scene: 创建场景，设置背景色(深蓝色调) ---
  scene = new THREE.Scene(); // new THREE.Scene(): 创建一个空场景，所有 3D 对象都在场景中渲染
  scene.background = new THREE.Color(0x1a1a2e); // Color: 用十六进制颜色值设置场景背景色

  // --- PerspectiveCamera: 透视相机，参数(fov视场角, aspect宽高比, near近裁面, far远裁面) ---
  camera = new THREE.PerspectiveCamera(
    45, // fov: 视场角，45° 相当于人眼视野
    viewerRef.value.clientWidth / viewerRef.value.clientHeight, // aspect: 宽高比，保持与容器一致
    0.01, // near: 最近渲染距离，小于此距离的物体不显示
    2000, // far: 最远渲染距离，大于此距离的物体不显示
  );
  camera.position.set(8, 6, 12); // Vector3.set(x,y,z): 设置相机在世界坐标系中的位置

  // --- WebGLRenderer: WebGL 渲染器，将 3D 场景绘制到 2D 屏幕 ---
  renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias: 开启抗锯齿，边缘更平滑
  renderer.setSize(viewerRef.value.clientWidth, viewerRef.value.clientHeight); // 设置渲染尺寸
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比不超过 2，平衡性能与画质
  renderer.shadowMap.enabled = true; // 开启阴影映射
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFSoftShadowMap: 软阴影，效果更自然
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // ACES Filmic 色调映射：电影级色彩还原
  renderer.toneMappingExposure = 1.0; // 曝光度控制
  viewerRef.value.appendChild(renderer.domElement); // 将 canvas 元素挂载到 DOM

  // --- OrbitControls: 轨道控制器，绑定到相机和 canvas ---
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // 启用阻尼(惯性)效果，操作更平滑
  controls.dampingFactor = 0.08; // 阻尼系数，越小惯性越大
  controls.minDistance = 0.5; // 最小缩放距离
  controls.maxDistance = 200; // 最大缩放距离
  controls.target.set(0, 0, 0); // 控制器的目标点，相机围绕此点旋转
  controls.update(); // 首次更新，应用设置

  // --- 光照系统（提亮整体场景） ---
  // AmbientLight: 环境光，均匀照亮所有表面，提高整体亮度(颜色更暖、强度更高)
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  // HemisphereLight: 半球光，天空(浅蓝) → 地面(暖灰)，模拟自然天光
  scene.add(new THREE.HemisphereLight(0xadd8e6, 0x888888, 1.2));
  // DirectionalLight: 主平行光，从右上方向左下方照射，产生立体感和阴影
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(8, 15, 10); // 光源位置(抬高并拉远，照射更均匀)
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  scene.add(sun);
  // 补光：从背面补充暖色照明，消除死黑
  const fill = new THREE.DirectionalLight(0xffcc88, 1.0);
  fill.position.set(-5, 3, -5);
  scene.add(fill);
  // 底部反弹光：从下方补充冷色光，照亮底部细节
  const rim = new THREE.DirectionalLight(0x88ccff, 0.8);
  rim.position.set(0, -5, 0);
  scene.add(rim);
  // GridHelper: 网格辅助线
  scene.add(new THREE.GridHelper(20, 20, 0x888888, 0x555555));

  // --- 地面: PlaneGeometry + Canvas 生成的地面纹理 ---
  const groundSize = 100;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
  // CanvasTexture: 用 canvas 实时生成纹理，不用加载外部图片
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  // 底色 - 深灰混凝土
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, 0, 512, 512);
  // 细颗粒噪点
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const brightness = 40 + Math.random() * 50;
    ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
    ctx.fillRect(x, y, 2, 2);
  }
  // 淡色分割线 - 模拟场地标线
  ctx.strokeStyle = "rgba(200, 200, 200, 0.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 64);
    ctx.lineTo(512, i * 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i * 64, 0);
    ctx.lineTo(i * 64, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; // S 方向重复
  texture.wrapT = THREE.RepeatWrapping; // T 方向重复
  texture.repeat.set(4, 4); // 重复 4×4 次
  texture.anisotropy = 4; // 各向异性过滤，减少倾斜时的模糊

  const groundMat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0x888888,
    roughness: 0.9, // 高粗糙度，地面不反光
    metalness: 0.0, // 非金属
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2; // 平放 (绕 X 轴旋转 -90°)
  ground.position.y = -0.1; // 略低于网格，防止重叠闪烁
  ground.receiveShadow = true; // 接收阴影
  scene.add(ground);

  // --- 坐标轴指示器: ArrowHelper + Canvas 文字标签 ---
  initAxes();
}

/** 创建坐标轴指示器 (X红, Y绿, Z蓝) */
function initAxes() {
  const length = 5; // 箭头长度
  const headLength = 0.4; // 箭头头部长
  const headWidth = 0.2; // 箭头头部宽

  // ArrowHelper(dir, origin, length, color, headLength, headWidth): 创建一个3D箭头
  scene.add(
    new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      length,
      0xff4444,
      headLength,
      headWidth,
    ),
  );
  scene.add(
    new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      length,
      0x44ff44,
      headLength,
      headWidth,
    ),
  );
  scene.add(
    new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      length,
      0x4488ff,
      headLength,
      headWidth,
    ),
  );

  // 用 Sprite + Canvas 生成文字标签 "X", "Y", "Z"
  const makeLabel = (
    text: string,
    color: string,
    pos: [number, number, number],
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 64, 64);
    ctx.font = "Bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(pos[0], pos[1], pos[2]);
    sprite.scale.set(1.2, 1.2, 1);
    scene.add(sprite);
  };

  makeLabel("X", "#ff4444", [length + 0.8, 0, 0]);
  makeLabel("Y", "#44ff44", [0, length + 0.8, 0]);
  makeLabel("Z", "#4488ff", [0, 0, length + 0.8]);
}

// #endregion

// #region 模型加载
function loadModel(url: string) {
  // GLTFLoader: 用于加载 .glb/.gltf 格式的 3D 模型文件
  const loader = new GLTFLoader();
  // DRACOLoader(setDecoderPath): 可选，解码 Draco 压缩的几何体数据，减小模型体积
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath("/draco/"));

  // loader.load(url, onLoad, onProgress, onError): 异步加载模型
  loader.load(
    url,
    // --- onLoad 回调: 加载成功，gltf 包含 scene(模型树), animations(动画), cameras(相机) ---
    (gltf) => {
      // 卸载旧模型，释放 GPU 内存
      if (craneRoot) {
        scene.remove(craneRoot); // scene.remove(): 从场景移除
        disposeModel(craneRoot); // 递归释放几何体/材质
      }

      craneRoot = gltf.scene; // gltf.scene: THREE.Group，模型的根节点
      console.log("craneRoot--->", craneRoot);

      // traverse(callback): 递归遍历场景树的所有子节点
      craneRoot.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // instanceof: 判断是否是网格几何体
          child.castShadow = true; // castShadow: 该网格投射阴影
          child.receiveShadow = true; // receiveShadow: 该网格接收阴影
        }
      });

      // Box3.setFromObject(object): 计算对象的包围盒(最小立方体边界)
      const box = new THREE.Box3().setFromObject(craneRoot);
      const size = box.getSize(new THREE.Vector3()); // 包围盒尺寸 {width, height, depth}
      const maxDim = Math.max(size.x, size.y, size.z);
      const autoScale = maxDim > 0 ? 40 / maxDim : 1; // 统一缩放到 40 单位

      console.log(
        `模型尺寸: ${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)}, 缩放: ${autoScale.toFixed(3)}`,
      );

      // 缩放后再重新计算包围盒
      craneRoot.scale.set(autoScale, autoScale, autoScale);
      // scene.add 后再算 Box3 能得到世界坐标下的正确包围盒
      scene.add(craneRoot);
      const box2 = new THREE.Box3().setFromObject(craneRoot);
      const center2 = box2.getCenter(new THREE.Vector3());
      const size2 = box2.getSize(new THREE.Vector3());

      // 整体下移使底部对齐 y=0
      craneRoot.position.y -= center2.y - size2.y / 2;
      // XZ 居中
      craneRoot.position.x -= center2.x;
      craneRoot.position.z -= center2.z;

      scaleFactor.value = autoScale;

      // 相机固定距离 + 对准缩放后的模型中部
      const cameraY = size2.y * 0.6;
      camera.position.set(40, cameraY, 50);
      controls.target.set(0, size2.y / 2, 0);
      controls.update();

      // ======== 遍历模型，缓存所有有名字的节点供 getObjectByName 使用 ========
      partCache.clear();

      // traverse: 再次遍历，记录每个有 name 的节点
      craneRoot.traverse((child) => {
        if (child.name) {
          partCache.set(child.name, child); // Map<name, Object3D>: 名字 → 节点引用
          console.log(`[${child.type}] "${child.name}"`);
        }
      });

      // 递归打印完整层级树
      const printTree = (obj: THREE.Object3D, depth = 0) => {
        const indent = "  ".repeat(depth);
        const pos = `${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}`;
        console.log(
          `${indent}${obj.name || "(unnamed)"} [${obj.type}] pos=(${pos})`,
        );
        obj.children.forEach((c) => printTree(c, depth + 1));
      };
      console.log("===== 模型层级 =====");
      printTree(craneRoot);
      console.log("===== 结束 =====");

      // 识别并缓存5个关键部件
      buildKeyParts();

      showPanel.value = true;
      progressText.value = "";

      // 主模型加载完成后，加载地面箱子
      loadGroundBoxes();
    },
    // onProgress: 加载进度，xhr.loaded/xhr.total 计算百分比
    (xhr) => {
      progressText.value = `加载中 ${Math.round((xhr.loaded / xhr.total) * 100)}%`;
    },
    // onError: 加载失败
    (err) => {
      console.error("GLB 加载失败:", err);
      progressText.value = "加载失败";
    },
  );
}
// #endregion

// #region 地面箱子
const groundBoxes: THREE.Object3D[] = [];

/** 加载 box.glb 并在场景中放置 10 个箱子到地面 */
function loadGroundBoxes() {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );
  loader.setDRACOLoader(draco);

  loader.load(
    "/models/box.glb",
    (gltf) => {
      const boxModel = gltf.scene;

      boxModel.scale.set(
        scaleFactor.value,
        scaleFactor.value,
        scaleFactor.value,
      );

      // 计算包围盒以确定底部 Y
      const bbox = new THREE.Box3().setFromObject(boxModel);

      const size = bbox.getSize(new THREE.Vector3());
      const center = bbox.getCenter(new THREE.Vector3());
      const bottomY = center.y - size.y / 2;

      boxModel.position.y = -bottomY;
      scene.add(boxModel);

      // // 以底部为基准，排列 10 个箱子
      // const cols = 5;
      // const rows = 2;
      // const spacing = Math.max(size.x, size.z) * 1.5;

      // for (let r = 0; r < rows; r++) {
      //   for (let c = 0; c < cols; c++) {
      //     const clone = boxModel.clone(true);
      //     // 将底部对齐 Y=0
      //     clone.position.y = -bottomY;
      //     // 网格排列
      //     clone.position.x = (c - (cols - 1) / 2) * spacing;
      //     clone.position.z = (r - (rows - 1) / 2) * spacing;
      //     // 略微旋转增加自然感
      //     clone.rotation.y = Math.random() * 0.2;

      //     scene.add(clone);
      //     groundBoxes.push(clone);
      //   }
      // }

      // console.log(`已放置 ${groundBoxes.length} 个地面箱子`);
    },
    undefined,
    (err) => {
      console.error("box.glb 加载失败:", err);
    },
  );
}
// #endregion

// #region 关键部件控制
/** 从 partCache 中查找并缓存5个关键部件 */
function buildKeyParts() {
  const parts: Record<string, THREE.Object3D | null> = {
    main_frame: null,
    box: null,
    trolley: null,
    spreader: null,
    hoistRope: null,
  };

  for (const name of PART_NAMES) {
    // 大小写不敏感查找
    const obj =
      partCache.get(name) ??
      partCache.get(name.toLowerCase()) ??
      partCache.get(name.toUpperCase()) ??
      null;
    parts[name] = obj;
    if (!obj) {
      for (const [key, val] of partCache) {
        if (key.toLowerCase() === name.toLowerCase()) {
          parts[name] = val;
          break;
        }
      }
    }
  }

  keyParts.value = parts;

  // 存储初始位置
  initPos.clear();
  for (const name of PART_NAMES) {
    const obj = parts[name];
    if (obj) {
      initPos.set(name, {
        x: obj.position.x,
        y: obj.position.y,
        z: obj.position.z,
      });
    }
  }

  const trolley = parts.trolley;
  const spreader = parts.spreader;
  const box = parts.box;
  const rope = parts.hoistRope;

  if (trolley && spreader) {
    // 计算吊具相对于小车的偏移距离（XZ 平面）
    const dx = spreader.position.x - trolley.position.x;
    const dz = spreader.position.z - trolley.position.z;
    spreaderOffX = Math.sqrt(dx * dx + dz * dz);
  }
  if (box && spreader) {
    boxOffY = box.position.y - spreader.position.y;
  }
  if (rope && trolley && spreader) {
    ropeInitScaleY = rope.scale.y;
    ropeLen = Math.abs(trolley.position.y - spreader.position.y);
  }

  // 初始化控制值
  ctrlHorizontal.value = 0;
  ctrlVertical.value = 0;
}

/** 切换箱子可见性 */
function toggleBoxVisible(val: boolean) {
  showBox.value = val;
  const box = keyParts.value.box;
  if (box) {
    box.visible = val;
  }
}

/** 切换地面箱子可见性 */
function toggleGroundBoxes(val: boolean) {
  showGroundBoxes.value = val;
  for (const gb of groundBoxes) {
    gb.visible = val;
  }
}

/** 横向移动：沿 beamAngle 方向移动 trolley → spreader/box/hoistRope 跟随 */
function updateHorizontal(v: number) {
  ctrlHorizontal.value = v;
  const angle = (beamAngle.value * Math.PI) / 180;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const trolley = keyParts.value.trolley;
  const spreader = keyParts.value.spreader;
  const box = keyParts.value.box;
  const rope = keyParts.value.hoistRope;
  if (!trolley) return;

  const baseX = initPos.get("trolley")?.x ?? 0;
  const baseZ = initPos.get("trolley")?.z ?? 0;

  // trolley 沿角度方向移动
  trolley.position.x = baseX + v * cosA;
  trolley.position.z = baseZ + v * sinA;

  // spreader 跟随并保持偏移
  if (spreader) {
    spreader.position.x = trolley.position.x + spreaderOffX * cosA;
    spreader.position.z = trolley.position.z + spreaderOffX * sinA;
  }
  // box 与 spreader 横向对齐
  if (box) {
    box.position.x = spreader ? spreader.position.x : trolley.position.x;
    box.position.z = spreader ? spreader.position.z : trolley.position.z;
  }
  // hoistRope 居中于 trolley 和 spreader 之间
  if (rope && spreader) {
    rope.position.x = (trolley.position.x + spreader.position.x) / 2;
    rope.position.z = (trolley.position.z + spreader.position.z) / 2;
  }
}

/** 纵向移动：spreader → box 跟随，hoistRope 伸缩 */
function updateVertical(v: number) {
  ctrlVertical.value = v;
  const spreader = keyParts.value.spreader;
  const box = keyParts.value.box;
  const rope = keyParts.value.hoistRope;
  const trolley = keyParts.value.trolley;

  if (!spreader) return;
  const baseY = initPos.get("spreader")?.y ?? 0;

  spreader.position.y = baseY + v;
  if (box) box.position.y = spreader.position.y + boxOffY;
  if (rope && trolley) {
    // 钢丝绳在 trolley 和 spreader 之间拉伸
    const midY = (trolley.position.y + spreader.position.y) / 2;
    rope.position.y = midY;
    if (ropeLen > 0) {
      rope.scale.y =
        (Math.abs(trolley.position.y - spreader.position.y) / ropeLen) *
        ropeInitScaleY;
    }
  }
}

/** 重置所有部件到初始位置 */
function resetAll() {
  for (const [name, pos] of initPos) {
    const obj = keyParts.value[name];
    if (obj) {
      obj.position.set(pos.x, pos.y, pos.z);
      if (name === "hoistRope") {
        obj.scale.y = ropeInitScaleY;
      }
    }
  }
  ctrlHorizontal.value = 0;
  ctrlVertical.value = 0;
}

/** 大梁角度变更时，保持当前位置不变但重新沿新角度定位 */
function onBeamAngleChange(deg: number) {
  beamAngle.value = deg;
  // 用当前横向位置值重新定位，使移动方向即时跟随新角度
  updateHorizontal(ctrlHorizontal.value);
  updateVertical(ctrlVertical.value);
}

/** 模拟装船: 小车向船方向 → 箱子上升 → 小车返回 → 箱子下降 */
function simulateLoading() {
  const trolley = keyParts.value.trolley;
  const spreader = keyParts.value.spreader;
  if (!trolley || !spreader) return;

  simulating.value = true;

  const beamStep = 4;
  const liftHeight = 3;

  // Step 1 (0ms): 小车向船方向移动
  updateHorizontal(ctrlHorizontal.value + beamStep);

  // Step 2 (600ms): 箱子/吊具上升
  setTimeout(() => {
    updateVertical(ctrlVertical.value + liftHeight);
  }, 600);

  // Step 3 (1200ms): 小车返回
  setTimeout(() => {
    updateHorizontal(ctrlHorizontal.value - beamStep);
  }, 1200);

  // Step 4 (1800ms): 箱子/吊具下降
  setTimeout(() => {
    updateVertical(ctrlVertical.value - liftHeight);
    simulating.value = false;
  }, 1800);
}

/** 模拟卸船: 箱子上升 → 小车向船方向 → 箱降 → 箱升(空吊) → 小车回 → 箱降(落地) */
function simulateUnloading() {
  const trolley = keyParts.value.trolley;
  const spreader = keyParts.value.spreader;
  if (!trolley || !spreader) return;

  simulating.value = true;

  const beamStep = 4;
  const liftHeight = 3;

  // Step 1 (0ms): 箱子/吊具上升
  updateVertical(ctrlVertical.value + liftHeight);

  // Step 2 (600ms): 小车向船方向移动（带箱）
  setTimeout(() => {
    updateHorizontal(ctrlHorizontal.value + beamStep);
  }, 600);

  // Step 3 (1200ms): 箱子下降（放箱）
  setTimeout(() => {
    updateVertical(ctrlVertical.value - liftHeight);
  }, 1200);

  // Step 4 (1800ms): 箱升（空吊具起升）
  setTimeout(() => {
    updateVertical(ctrlVertical.value + liftHeight);
  }, 1800);

  // Step 5 (2400ms): 小车返回
  setTimeout(() => {
    updateHorizontal(ctrlHorizontal.value - beamStep);
  }, 2400);

  // Step 6 (3000ms): 箱子下降（落地）
  setTimeout(() => {
    updateVertical(ctrlVertical.value - liftHeight);
    simulating.value = false;
  }, 3000);
}

// #endregion 关键部件控制
// ========================================================================
// #region 操作
// ========================================================================
function resetCamera() {
  // Vector3.set(x,y,z): 重置相机到默认位置
  camera.position.set(8, 6, 12);
  controls.target.set(0, 0, 0); // 重置控制器目标到原点
  controls.update(); // 立即应用变更
}

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value;
  // OrbitControls.autoRotate: 开启后相机自动绕 target 旋转
  controls.autoRotate = autoRotate.value;
  controls.autoRotateSpeed = 2.0; // 旋转速度
}

function toggleWireframe() {
  wireframe.value = !wireframe.value;
  if (craneRoot) {
    // traverse: 遍历所有节点，切换 Mesh 材质的线框模式
    craneRoot.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // MeshStandardMaterial.wireframe: 布尔值，true=只显示三角形边线
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.wireframe = wireframe.value;
      }
    });
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;
  const file = files[0];
  if (
    !file.name.toLowerCase().endsWith(".glb") &&
    !file.name.toLowerCase().endsWith(".gltf")
  ) {
    progressText.value = "请拖入 .glb 或 .gltf 文件";
    return;
  }
  modelName.value = file.name;
  // URL.createObjectURL(file): 创建 Blob URL 供 GLTFLoader 加载
  loadModel((window.URL || window.webkitURL).createObjectURL(file));
}

function switchToCrane() {
  router.push("/");
}

// #endregion

// ========================================================================
// #region 生命周期
// ========================================================================
// handleResize: 窗口大小变化时，更新相机宽高比和渲染器尺寸
function handleResize() {
  if (!viewerRef.value || !renderer) return;
  const w = viewerRef.value.clientWidth;
  const h = viewerRef.value.clientHeight;
  camera.aspect = w / h; // 更新相机宽高比
  camera.updateProjectionMatrix(); // 必须调用以应用变化
  renderer.setSize(w, h); // 重置渲染尺寸
}

// animate: requestAnimationFrame 驱动的主循环，每帧调用
function animate() {
  animationId = requestAnimationFrame(animate); // 注册下一帧
  controls.update(); // 更新轨道控制器(含阻尼效果)
  renderer.render(scene, camera); // render(): 将场景渲染到屏幕
}

// disposeModel: 递归释放模型的 GPU 资源，防止内存泄漏
function disposeModel(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose(); // geometry.dispose(): 释放顶点数据
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose()); // 多材质
      } else {
        child.material.dispose(); // material.dispose(): 释放材质着色器
      }
    }
  });
}

onMounted(() => {
  initScene();
  loadModel("/models/Untitled.glb");
  animate(); // 启动渲染循环
  window.addEventListener("resize", handleResize); // 注册窗口 resize 监听
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId); // 停止渲染循环
  window.removeEventListener("resize", handleResize);
  if (craneRoot) {
    disposeModel(craneRoot);
    scene.remove(craneRoot);
  }
  renderer?.dispose(); // renderer.dispose(): 释放 WebGL 上下文
  if (renderer?.domElement?.parentElement) {
    renderer.domElement.parentElement.removeChild(renderer.domElement);
  }
});
</script>

<style scoped>
.glb-viewer {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
}

.toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  z-index: 10;
}

/* 左侧面板 */
.left-panel {
  position: absolute;
  top: 52px;
  left: 12px;
  z-index: 10;
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parts-card,
.parts-list-card {
  background: rgba(0, 0, 0, 0.7) !important;
  color: #ccc;
}

.parts-list-card :deep(.n-list-item) {
  cursor: pointer;
  border-radius: 3px;
}
.parts-list-card :deep(.n-list-item.active),
.parts-list-card :deep(.n-list-item:hover) {
  background: rgba(24, 144, 255, 0.15) !important;
}

.transform-row {
  display: flex;
  gap: 4px;
}

.axis-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.axis-input .n-input-number {
  width: 68px;
}
</style>
