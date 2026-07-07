<template>
  <n-card title="作业数据看板" size="small" :bordered="false" class="dashboard-panel">
    <!-- 设备信息 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">设备信息</n-text>
      <n-descriptions :column="2" size="tiny" label-placement="left">
        <n-description-item label="设备号">{{ craneStore.craneId }}</n-description-item>
        <n-description-item label="状态">{{ workStatusLabel }}</n-description-item>
        <n-description-item label="当前贝">{{ craneStore.workStatus.currentBayId || '-' }}</n-description-item>
        <n-description-item label="目标贝">{{ craneStore.workStatus.targetBayId || '-' }}</n-description-item>
      </n-descriptions>
    </n-space>

    <n-divider />

    <!-- 船信息 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">船信息</n-text>
      <n-descriptions :column="2" size="tiny" label-placement="left">
        <n-description-item label="有作业船">{{ craneStore.shipInfo.hasShip ? '是' : '否' }}</n-description-item>
        <n-description-item label="船期号">{{ craneStore.shipInfo.visitId || '-' }}</n-description-item>
        <n-description-item label="停靠方向">{{ shipDirectionLabel }}</n-description-item>
        <n-description-item label="停靠挡位">{{ locationLabel }}</n-description-item>
      </n-descriptions>
    </n-space>

    <n-divider />

    <!-- 当前任务 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">当前任务</n-text>
      <n-descriptions :column="2" size="tiny" label-placement="left">
        <n-description-item label="任务号">{{ craneStore.currentTask.taskId || '-' }}</n-description-item>
        <n-description-item label="箱号">{{ craneStore.currentTask.containerId || '-' }}</n-description-item>
        <n-description-item label="状态">{{ taskStateLabel }}</n-description-item>
        <n-description-item label="类型">{{ taskTypeLabel }}</n-description-item>
      </n-descriptions>
    </n-space>

    <n-divider />

    <!-- 运动数据 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">运动数据</n-text>
      <n-descriptions :column="2" size="tiny" label-placement="left">
        <n-description-item label="大车位置">{{ motion.gantryPosition.toFixed(1) }} m</n-description-item>
        <n-description-item label="小车位置">{{ motion.trolleyPosition.toFixed(1) }} m</n-description-item>
        <n-description-item label="起升高度">{{ motion.hoistPosition.toFixed(1) }} m</n-description-item>
        <n-description-item label="俯仰角度">{{ motion.boomAngle.toFixed(0) }}°</n-description-item>
      </n-descriptions>
    </n-space>

    <n-divider />

    <!-- 故障信息 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">故障信息</n-text>
      <n-scrollbar style="max-height: 120px">
        <n-empty v-if="craneStore.faultList.length === 0" description="无故障" size="tiny" />
        <n-timeline v-else size="tiny">
          <n-timeline-item
            v-for="(fault, idx) in craneStore.faultList.slice(0, 5)"
            :key="idx"
            :type="fault.fault_level <= 1 ? 'warning' : 'error'"
            :content="fault.description"
            :time="fault.fault_code"
          />
        </n-timeline>
      </n-scrollbar>
    </n-space>

    <n-divider />

    <!-- 更新时间 -->
    <n-text depth="3" class="update-time">
      最后更新: {{ new Date(craneStore.lastUpdateTime).toLocaleTimeString() }}
    </n-text>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCraneStore } from '@/stores/crane'
import { useCraneSimulationStore } from '@/stores/simulation'
import { storeToRefs } from 'pinia'

const craneStore = useCraneStore()
const simulationStore = useCraneSimulationStore()
const { motion } = storeToRefs(simulationStore)

// #region 计算属性
const workStatusLabel = computed(() => {
  const ws = craneStore.workStatus
  if (ws.systemStop) return '系统停止'
  if (ws.readyToWork) return '作业就绪'
  return '未就绪'
})

const shipDirectionLabel = computed(() => {
  return craneStore.shipInfo.shipDirection === 0 ? '左舷 (船头向左)' : '右舷 (船头向右)'
})

const locationLabel = computed(() => {
  const loc = craneStore.shipInfo.location
  return loc === 0 ? '里档' : loc === 1 ? '中档' : '外档'
})

const taskStateLabel = computed(() => {
  const stateMap: Record<string, string> = {
    NONE: '无任务',
    READY: '任务就绪',
    START: '作业中',
    PICK_COMPLETE: '抓箱完成',
    COMPLETE: '完成',
    ABORT: '已终止',
    CANCEL: '已取消'
  }
  return stateMap[craneStore.currentTask.state] || craneStore.currentTask.state
})

const taskTypeLabel = computed(() => {
  const typeMap: Record<string, string> = {
    LOAD: '装船',
    DSCH: '卸船',
    SHUFFLE: '舱内翻倒',
    LOAD_COVER: '装舱盖板',
    DSCH_COVER: '卸舱盖板'
  }
  return typeMap[craneStore.currentTask.type] || craneStore.currentTask.type
})
// #endregion
</script>

<style scoped>
.dashboard-panel {
  height: 100%;
  overflow-y: auto;
}

.section-label {
  font-size: 12px;
  font-weight: bold;
}

.update-time {
  font-size: 11px;
  display: block;
  text-align: right;
}
</style>
