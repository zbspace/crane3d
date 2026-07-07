<template>
  <n-card title="任务管理" size="small" :bordered="false" class="task-panel">
    <n-space vertical size="small">
      <!-- 当前任务 -->
      <n-text depth="3" class="section-label">当前任务</n-text>
      <n-descriptions v-if="craneStore.currentTask.taskId" :column="2" size="tiny" label-placement="left">
        <n-description-item label="任务号">{{ craneStore.currentTask.taskId }}</n-description-item>
        <n-description-item label="箱号">{{ craneStore.currentTask.containerId }}</n-description-item>
        <n-description-item label="类型">{{ taskTypeLabel }}</n-description-item>
        <n-description-item label="状态">{{ taskStateLabel }}</n-description-item>
        <n-description-item label="抓箱位置">{{ pickPosLabel }}</n-description-item>
        <n-description-item label="放箱位置">{{ dropPosLabel }}</n-description-item>
      </n-descriptions>
      <n-empty v-else description="无当前任务" size="tiny" />

      <n-divider />

      <!-- 操作按钮 -->
      <n-text depth="3" class="section-label">任务操作</n-text>
      <n-space>
        <n-button size="tiny" type="primary" @click="handleSendTask">
          发送任务
        </n-button>
        <n-button size="tiny" type="warning" @click="handleAbortTask">
          终止任务
        </n-button>
        <n-button size="tiny" type="success" @click="handleConfirmComplete">
          确认完成
        </n-button>
      </n-space>

      <n-divider />

      <!-- 任务历史 -->
      <n-text depth="3" class="section-label">任务历史</n-text>
      <n-scrollbar style="max-height: 200px">
        <n-empty v-if="craneStore.taskHistory.length === 0" description="暂无历史" size="tiny" />
        <n-list v-else size="small" hoverable clickable>
          <n-list-item v-for="(task, idx) in craneStore.taskHistory.slice(0, 20)" :key="idx">
            <template #prefix>
              <n-tag size="tiny" :type="task.state === 'COMPLETE' ? 'success' : 'default'">
                {{ task.taskId }}
              </n-tag>
            </template>
            <n-ellipsis :line-clamp="1">
              {{ task.containerId }} - {{ taskTypeMap[task.type] || task.type }}
            </n-ellipsis>
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCraneStore } from '@/stores/crane'
import { useMessage } from 'naive-ui'

const craneStore = useCraneStore()
const message = useMessage()

const taskTypeMap: Record<string, string> = {
  LOAD: '装船',
  DSCH: '卸船',
  SHUFFLE: '舱内翻倒',
  LOAD_COVER: '装舱盖板',
  DSCH_COVER: '卸舱盖板'
}

// #region 计算属性
const taskStateLabel = computed(() => {
  const stateMap: Record<string, string> = {
    NONE: '无任务',
    READY: '就绪',
    START: '作业中',
    PICK_COMPLETE: '抓箱完成',
    COMPLETE: '完成',
    ABORT: '终止',
    CANCEL: '取消'
  }
  return stateMap[craneStore.currentTask.state] || craneStore.currentTask.state
})

const taskTypeLabel = computed(() => {
  return taskTypeMap[craneStore.currentTask.type] || craneStore.currentTask.type
})

const pickPosLabel = computed(() => {
  const t = craneStore.currentTask
  const typeMap: Record<number, string> = { 1: '堆场', 2: '集卡道', 3: '船', 4: '地面', 5: '小车等待位' }
  const posType = typeMap[t.fromPositionType] || ''
  return `${posType} ${t.fromBay || ''}排${t.fromRow || ''}层${t.fromTier || ''}`
})

const dropPosLabel = computed(() => {
  const t = craneStore.currentTask
  const typeMap: Record<number, string> = { 1: '堆场', 2: '集卡道', 3: '船', 4: '地面', 5: '小车等待位' }
  const posType = typeMap[t.toPositionType] || ''
  return `${posType} ${t.toBay || ''}排${t.toRow || ''}层${t.toTier || ''}`
})
// #endregion

// #region 任务操作
function handleSendTask() {
  message.info('发送任务 - 待接入后端')
}

function handleAbortTask() {
  if (!craneStore.currentTask.taskId) {
    message.warning('无任务可终止')
    return
  }
  message.info('终止任务 - 待接入后端')
}

function handleConfirmComplete() {
  if (!craneStore.currentTask.taskId) {
    message.warning('无任务可确认')
    return
  }
  message.info('确认完成 - 待接入后端')
}
// #endregion
</script>

<style scoped>
.task-panel {
  height: 100%;
  overflow-y: auto;
}

.section-label {
  font-size: 12px;
  font-weight: bold;
}
</style>
