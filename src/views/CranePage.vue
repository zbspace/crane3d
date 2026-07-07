<template>
  <n-layout class="crane-page" has-sider>
    <!-- 左侧: 控制面板 -->
    <n-layout-sider
      :width="300"
      bordered
      show-trigger="bar"
      collapse-mode="width"
      :collapsed-width="0"
      :default-collapsed="false"
      class="left-sider"
    >
      <ControlPanel />
    </n-layout-sider>

    <!-- 中间: 3D 场景 -->
    <n-layout class="scene-layout">
      <CraneView ref="craneViewRef" />
    </n-layout>

    <!-- 右侧: 数据看板 + 任务 -->
    <n-layout-sider
      :width="320"
      bordered
      show-trigger="bar"
      collapse-mode="width"
      :collapsed-width="0"
      position="right"
      class="right-sider"
    >
      <n-tabs
        type="line"
        default-value="dashboard"
        size="small"
        style="height: 100%"
      >
        <n-tab-pane name="dashboard" tab="数据看板">
          <DataDashboard />
        </n-tab-pane>
        <n-tab-pane name="task" tab="任务管理">
          <TaskPanel />
        </n-tab-pane>
      </n-tabs>
    </n-layout-sider>
  </n-layout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CraneView from "@/components/CraneView.vue";
import ControlPanel from "@/components/ControlPanel.vue";
import DataDashboard from "@/components/DataDashboard.vue";
import TaskPanel from "@/components/TaskPanel.vue";

const craneViewRef = ref();
</script>

<style scoped>
.crane-page {
  height: 100%;
}

.left-sider,
.right-sider {
  background: #fff;
  overflow-y: auto;
}

.scene-layout {
  background: #1a1a2e;
}
</style>
