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

    <!-- 左侧: 部件控制面板 -->
    <div class="left-panel" v-if="craneParts.length > 0">
      <n-card
        title="部件控制"
        size="small"
        :bordered="false"
        class="parts-card"
      >
        <n-space vertical :size="8">
          <n-select
            v-model:value="selectedPartName"
            :options="partOptions"
            size="tiny"
            placeholder="选择部件"
          />

          <template v-if="selectedPart">
            <n-divider style="margin: 4px 0" />
            <n-text style="color: #ffaa00; font-size: 12px; font-weight: bold">
              {{ selectedPart.name }}
            </n-text>

            <n-text style="color: #aaa; font-size: 11px">位置</n-text>
            <div class="transform-row">
              <div class="axis-input">
                <n-text style="color: #ff6b6b; font-size: 10px">X</n-text
                ><n-input-number
                  size="tiny"
                  :step="0.1"
                  :value="selectedPart.position.x"
                  @update:value="
                    (v: number | null) => {
                      if (v !== null) setPartPos('x', v);
                    }
                  "
                />
              </div>
              <div class="axis-input">
                <n-text style="color: #51cf66; font-size: 10px">Y</n-text
                ><n-input-number
                  size="tiny"
                  :step="0.1"
                  :value="selectedPart.position.y"
                  @update:value="
                    (v: number | null) => {
                      if (v !== null) setPartPos('y', v);
                    }
                  "
                />
              </div>
              <div class="axis-input">
                <n-text style="color: #339af0; font-size: 10px">Z</n-text
                ><n-input-number
                  size="tiny"
                  :step="0.1"
                  :value="selectedPart.position.z"
                  @update:value="
                    (v: number | null) => {
                      if (v !== null) setPartPos('z', v);
                    }
                  "
                />
              </div>
            </div>

            <n-text style="color: #aaa; font-size: 11px">旋转 (度)</n-text>
            <div class="transform-row">
              <div class="axis-input">
                <n-text style="color: #ff6b6b; font-size: 10px">X</n-text
                ><n-input-number
                  size="tiny"
                  :step="1"
                  :value="rad2deg(selectedPart.rotation.x)"
                  @update:value="
                    (v: number | null) => {
                      if (v !== null) setPartRot('x', deg2rad(v));
                    }
                  "
                />
              </div>
              <div class="axis-input">
                <n-text style="color: #51cf66; font-size: 10px">Y</n-text
                ><n-input-number
                  size="tiny"
                  :step="1"
                  :value="rad2deg(selectedPart.rotation.y)"
                  @update:value="
                    (v: number | null) => {
                      if (v !== null) setPartRot('y', deg2rad(v));
                    }
                  "
                />
              </div>
              <div class="axis-input">
                <n-text style="color: #339af0; font-size: 10px">Z</n-text
                ><n-input-number
                  size="tiny"
                  :step="1"
                  :value="rad2deg(selectedPart.rotation.z)"
                  @update:value="
                    (v: number | null) => {
                      if (v !== null) setPartRot('z', deg2rad(v));
                    }
                  "
                />
              </div>
            </div>

            <n-button size="tiny" block quaternary @click="resetPart"
              >重置变换</n-button
            >
          </template>

          <template v-else>
            <n-empty description="选择一个部件" size="tiny" />
          </template>
        </n-space>
      </n-card>

      <!-- 已识别的部件列表 -->
      <n-card
        title="已识别部件"
        size="small"
        :bordered="false"
        class="parts-list-card"
      >
        <n-scrollbar style="max-height: 200px">
          <n-list size="tiny" hoverable>
            <n-list-item
              v-for="p in craneParts"
              :key="p.name"
              :class="{ active: selectedPartName === p.name }"
              @click="selectedPartName = p.name"
            >
              <n-space justify="space-between">
                <n-text style="color: #ccc; font-size: 11px">{{
                  p.name
                }}</n-text>
                <n-tag
                  size="tiny"
                  :type="p.children > 0 ? 'info' : 'default'"
                  >{{ p.type }}</n-tag
                >
              </n-space>
            </n-list-item>
          </n-list>
        </n-scrollbar>
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

// 部件控制
interface PartInfo {
  name: string;
  type: string;
  children: number;
}
const craneParts = ref<PartInfo[]>([]);
const selectedPartName = ref<string | null>(null);

// #region 响应式状态
// --- Three.js 核心对象引用 ---
let scene: THREE.Scene; // Scene: 场景容器，所有物体/灯光/相机都添加到这里
let camera: THREE.PerspectiveCamera; // PerspectiveCamera: 透视相机，模拟人眼近大远小效果
let renderer: THREE.WebGLRenderer; // WebGLRenderer: WebGL 渲染器，负责将场景绘制到 canvas
let controls: OrbitControls; // OrbitControls: 轨道控制器，鼠标交互控制相机
let craneRoot: THREE.Group | null = null; // Group: 模型根节点，包含所有子部件
let animationId = 0; // requestAnimationFrame 的 ID，用于取消动画循环
const partCache = new Map<string, THREE.Object3D>(); // Object3D: 所有 3D 对象的基类，通过 name 查找部件

// #endregion

// ========================================================================
// #region 计算属性
// ========================================================================
const partOptions = computed(() =>
  craneParts.value.map((p) => ({
    label: `${p.name} [${p.type}]`,
    value: p.name,
  })),
);

const selectedPart = computed<THREE.Object3D | null>(() => {
  if (!selectedPartName.value) return null;
  return partCache.get(selectedPartName.value) ?? null;
});

// #endregion

// ========================================================================
// #region 场景初始化
// ========================================================================
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

  // --- 光照系统 ---
  // AmbientLight: 环境光，均匀照亮所有表面，无方向，用于提亮阴影区域
  scene.add(new THREE.AmbientLight(0x404060, 0.9));
  // HemisphereLight: 半球光，从天空(上)和地面(下)两个方向照射，模拟自然天光
  scene.add(new THREE.HemisphereLight(0x87ceeb, 0x444422, 0.6));
  // DirectionalLight: 平行光，模拟太阳，有方向、产生阴影
  const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
  sun.position.set(5, 10, 5); // 光源位置
  sun.castShadow = true; // 开启阴影投射
  sun.shadow.mapSize.width = 1024; // 阴影贴图分辨率
  sun.shadow.mapSize.height = 1024;
  scene.add(sun);
  // 补光：从背面补充照明，减少死黑区域
  const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
  fill.position.set(-3, 2, -3);
  scene.add(fill);
  // GridHelper: 网格辅助线，帮助观察空间位置和尺度
  scene.add(new THREE.GridHelper(20, 20, 0x888888, 0x444444));
}

// #endregion

// ========================================================================
// #region 模型加载
// ========================================================================
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
      const center = box.getCenter(new THREE.Vector3()); // 包围盒中心点
      const size = box.getSize(new THREE.Vector3()); // 包围盒尺寸 {width, height, depth}
      const maxDim = Math.max(size.x, size.y, size.z);
      const autoScale = maxDim > 0 ? 10 / maxDim : 1; // 自动缩放使最大维度 ≈ 10
      scaleFactor.value = autoScale;

      // Vector3.sub(v): 位置偏移，将模型中心移到世界原点
      craneRoot.position.sub(center);
      // Vector3.set(x, y, z): 统一缩放模型
      craneRoot.scale.set(autoScale, autoScale, autoScale);
      scene.add(craneRoot); // scene.add(): 将模型加入场景

      // 适配相机距离
      camera.position.set(
        8 * (1 / autoScale) * 0.3,
        6 * (1 / autoScale) * 0.3,
        12 * (1 / autoScale) * 0.3,
      );
      controls.target.set(0, 0, 0);
      controls.update();

      // ======== 遍历模型，缓存所有有名字的节点供 getObjectByName 使用 ========
      partCache.clear();
      craneParts.value = [];

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

      // 构建部件列表供 UI 选择
      craneParts.value = [];
      partCache.forEach((obj, name) => {
        craneParts.value.push({
          name,
          type: obj.type,
          children: obj.children.length,
        });
      });
      craneParts.value.sort((a, b) => a.name.localeCompare(b.name)); // 按字母排序

      progressText.value = "";
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

// ========================================================================
// #region 部件控制
// ========================================================================
// 修改选中部件的位置: Object3D.position[axis] 直接赋值
function setPartPos(axis: "x" | "y" | "z", value: number) {
  const obj = selectedPart.value;
  if (!obj) return;
  // Object3D.position: Vector3，直接修改 x/y/z 分量
  obj.position[axis] = value;
}

// 修改选中部件的旋转: Object3D.rotation[axis] 直接赋值(弧度制)
function setPartRot(axis: "x" | "y" | "z", value: number) {
  const obj = selectedPart.value;
  if (!obj) return;
  // Object3D.rotation: Euler(欧拉角)，直接修改 x/y/z 分量(单位: 弧度)
  obj.rotation[axis] = value;
}

// 重置部件的 position 和 rotation 到零
function resetPart() {
  const obj = selectedPart.value;
  if (!obj) return;
  obj.position.set(0, 0, 0); // Vector3.set(): 批量设置 x,y,z
  obj.rotation.set(0, 0, 0); // Euler.set(): 批量设置 x,y,z
}

// MathUtils.radToDeg / degToRad: Three.js 提供的角度弧度和互转工具函数
function rad2deg(r: number) {
  return THREE.MathUtils.radToDeg(r);
}
function deg2rad(d: number) {
  return THREE.MathUtils.degToRad(d);
}

// #endregion

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
