<template>
  <n-config-provider :locale="zhCN" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-container">
          <!-- 顶部标题栏 -->
          <n-layout-header class="app-header">
            <n-space justify="space-between" align="center">
              <n-space align="center">
                <n-h2 style="margin: 0" prefix="bar">岸桥仿真系统</n-h2>
                <n-button
                  size="tiny"
                  :type="route.name === 'crane' ? 'primary' : 'default'"
                  @click="router.push('/')"
                >
                  岸桥仿真
                </n-button>
                <n-button
                  size="tiny"
                  :type="route.name === 'glbViewer' ? 'primary' : 'default'"
                  @click="router.push('/glb-viewer')"
                >
                  3D 模型查看
                </n-button>
              </n-space>
              <n-space>
                <n-tag
                  :type="simulationStore.isSimulationMode ? 'info' : 'success'"
                >
                  {{
                    simulationStore.isSimulationMode ? "仿真模式" : "在线模式"
                  }}
                </n-tag>
                <n-tag type="primary">设备: {{ craneStore.craneId }}</n-tag>
              </n-space>
            </n-space>
          </n-layout-header>

          <!-- 路由内容 -->
          <router-view class="app-content" />

          <!-- 底部状态栏 (仅岸桥页面显示) -->
          <n-layout-footer class="app-footer" v-if="route.name === 'crane'">
            <n-space justify="space-between" size="small">
              <n-text depth="3" style="font-size: 12px">
                大车: {{ simMotion.gantryPosition.toFixed(1) }}m | 小车:
                {{ simMotion.trolleyPosition.toFixed(1) }}m | 起升:
                {{ simMotion.hoistPosition.toFixed(1) }}m | 俯仰:
                {{ simMotion.boomAngle.toFixed(0) }}°
              </n-text>
              <n-text depth="3" style="font-size: 12px">FPS: {{ fps }}</n-text>
            </n-space>
          </n-layout-footer>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { zhCN } from "naive-ui";
import { useCraneStore } from "@/stores/crane";
import { useCraneSimulationStore } from "@/stores/simulation";
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const craneStore = useCraneStore();
const simulationStore = useCraneSimulationStore();
const { motion: simMotion } = storeToRefs(simulationStore);

const fps = ref(0);

// #region 主题
const themeOverrides = {
  common: {
    primaryColor: "#1890ff",
    primaryColorHover: "#40a9ff",
    primaryColorPressed: "#096dd9",
    borderRadius: "4px",
  },
};
// #endregion

// #region FPS 模拟 (仅岸桥页面)
function updateFPS() {
  if (route.name !== "crane") return;
  fps.value = Math.floor(Math.random() * 10 + 55);
  requestAnimationFrame(updateFPS);
}
// #endregion

onMounted(() => {
  // 初始化模拟数据
  craneStore.updateShipInfo({
    hasShip: 1,
    rowCount: 10,
    visitId: "V20260701",
    vspCode: "M",
    shipDirection: 0,
    shipType: 1,
    location: 0,
    startPos: 10,
    endPos: 60,
    currentBayCabinState: 1,
  });
  craneStore.updateWorkStatus({
    currentTaskId: "TASK001",
    currentVisitId: "V20260701",
    currentBayId: "15",
    currentRowId: "03",
    targetBayId: "16",
    bayType: 0,
    readyToWork: 1,
    qcId: "QC01",
    bayChangingState: 0,
    bayScanStart: 0,
    systemStop: false,
    hatchCoverWorkState: 0,
    fogLevel: 0,
    remSeaPos: false,
    remLandPos: false,
    workMode: 1,
  });
  craneStore.updateCurrentTask({
    taskId: "TASK001",
    qcId: "QC01",
    moveId: "001",
    jobId: "JOB001",
    containerId: "MSCU1234567",
    state: "START",
    containerCheckState: "DETECT_PASS",
    truckCheckState: "WAIT_ARRIVE",
    type: "DSCH",
    fromBay: "15",
    fromRow: "03",
    fromTier: "2",
    fromTruckLane: "",
    fromTruckId: "",
    fromTruckPos: "",
    toBay: "20",
    toRow: "05",
    toTier: "1",
    toTruckLane: "3",
    toTruckId: "SH1234",
    toTruckPos: "center",
    fromPositionType: 3,
    toPositionType: 2,
    workObjectType: 1,
    source: "1",
    generateTime: Date.now(),
    startTime: Date.now() + 1000,
    containerConfirmTime: 0,
    truckArriveTime: 0,
    pickTime: 0,
    liftSafetyAfterPickTime: 0,
    dropTime: 0,
    liftSafetyAfterDropTime: 0,
  }) as any;

  requestAnimationFrame(updateFPS);
});
</script>

<style>
/* #region 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}
/* #endregion */
</style>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  z-index: 10;
}

.app-content {
  flex: 1;
  overflow: hidden;
}

.app-footer {
  padding: 4px 16px;
  background: #f0f0f0;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}
</style>
