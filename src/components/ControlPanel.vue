<template>
  <n-card title="运动控制" size="small" :bordered="false" class="control-panel">
    <!-- 大车控制 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">大车 (Gantry)</n-text>
      <n-space>
        <n-button size="tiny" @click="moveGantry(-5)">← 后退</n-button>
        <n-button size="tiny" @click="stopGantry">停止</n-button>
        <n-button size="tiny" @click="moveGantry(5)">前进 →</n-button>
      </n-space>
      <n-slider
        :value="motion.gantryPosition"
        :min="-50"
        :max="50"
        :step="0.5"
        @update:value="simulationStore.setGantryPosition"
        />
      <n-text depth="3" class="pos-value">{{ motion.gantryPosition.toFixed(1) }} m</n-text>
    </n-space>

    <n-divider />

    <!-- 小车控制 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">小车 (Trolley)</n-text>
      <n-space>
        <n-button size="tiny" @click="moveTrolley(-5)">← 向海</n-button>
        <n-button size="tiny" @click="stopTrolley">停止</n-button>
        <n-button size="tiny" @click="moveTrolley(5)">向陆 →</n-button>
      </n-space>
      <n-slider
        :value="motion.trolleyPosition"
        :min="0"
        :max="50"
        :step="0.5"
        @update:value="simulationStore.setTrolleyPosition"
      />
      <n-text depth="3" class="pos-value">{{ motion.trolleyPosition.toFixed(1) }} m</n-text>
    </n-space>

    <n-divider />

    <!-- 起升控制 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">起升 (Hoist)</n-text>
      <n-space>
        <n-button size="tiny" @click="moveHoist(2)">↑ 上升</n-button>
        <n-button size="tiny" @click="stopHoist">停止</n-button>
        <n-button size="tiny" @click="moveHoist(-2)">下降 ↓</n-button>
      </n-space>
      <n-slider
        :value="motion.hoistPosition"
        :min="0"
        :max="35"
        :step="0.5"
        @update:value="simulationStore.setHoistPosition"
      />
      <n-text depth="3" class="pos-value">{{ motion.hoistPosition.toFixed(1) }} m</n-text>
    </n-space>

    <n-divider />

    <!-- 吊具控制 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">吊具 (Spreader)</n-text>
      <n-space>
        <n-button
          size="tiny"
          :type="motion.spreader.twistLockState === 'locked' ? 'warning' : 'default'"
          @click="toggleLock"
        >
          {{ motion.spreader.twistLockState === 'locked' ? '闭锁' : '开锁' }}
        </n-button>
        <n-button
          size="tiny"
          :type="motion.spreader.flipperState === 'down' ? 'warning' : 'default'"
          @click="toggleFlipper"
        >
          {{ motion.spreader.flipperState === 'up' ? '放导板' : '升导板' }}
        </n-button>
      </n-space>
    </n-space>

    <n-divider />

    <!-- 俯仰控制 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">俯仰梁 (Boom)</n-text>
      <n-space>
        <n-button size="tiny" @click="pitchUp">俯仰 ↑</n-button>
        <n-button size="tiny" @click="pitchDown">俯仰 ↓</n-button>
      </n-space>
      <n-slider
        :value="motion.boomAngle"
        :min="0"
        :max="80"
        :step="1"
        @update:value="simulationStore.setBoomAngle"
      />
      <n-text depth="3" class="pos-value">{{ motion.boomAngle.toFixed(0) }}°</n-text>
    </n-space>

    <n-divider />

    <!-- 仿真设置 -->
    <n-space vertical size="small">
      <n-text depth="3" class="section-label">仿真设置</n-text>
      <n-space>
        <n-button
          size="tiny"
          :type="simulationStore.isSimulationMode ? 'primary' : 'default'"
          @click="simulationStore.toggleSimulationMode"
        >
          {{ simulationStore.isSimulationMode ? '仿真模式' : '真实数据' }}
        </n-button>
        <n-button size="tiny" @click="resetAll">重置</n-button>
      </n-space>
      <n-space>
        <n-text depth="3">速度:</n-text>
        <n-slider
          :value="simulationStore.simulationSpeed"
          :min="0.1"
          :max="5"
          :step="0.1"
          style="width: 100px"
          @update:value="simulationStore.setSimulationSpeed"
        />
        <n-text depth="3">{{ simulationStore.simulationSpeed.toFixed(1) }}x</n-text>
      </n-space>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { useCraneSimulationStore } from '@/stores/simulation'
import { storeToRefs } from 'pinia'

const simulationStore = useCraneSimulationStore()
const { motion } = storeToRefs(simulationStore)

// #region 大车控制
function moveGantry(delta: number) {
  const current = motion.value.gantryPosition
  simulationStore.setGantryPosition(current + delta)
}

function stopGantry() {
  // 停止 - 保持当前位置
}
// #endregion

// #region 小车控制
function moveTrolley(delta: number) {
  const current = motion.value.trolleyPosition
  simulationStore.setTrolleyPosition(Math.max(0, Math.min(50, current + delta)))
}

function stopTrolley() {
  // 停止
}
// #endregion

// #region 起升控制
function moveHoist(delta: number) {
  const current = motion.value.hoistPosition
  simulationStore.setHoistPosition(Math.max(0, Math.min(35, current + delta)))
}

function stopHoist() {
  // 停止
}
// #endregion

// #region 吊具控制
function toggleLock() {
  const locked = motion.value.spreader.twistLockState !== 'locked'
  simulationStore.setSpreaderLock(locked)
}

function toggleFlipper() {
  const state = motion.value.spreader.flipperState === 'up' ? 'down' : 'up'
  simulationStore.setFlipperState(state)
}
// #endregion

// #region 俯仰控制
function pitchUp() {
  const current = motion.value.boomAngle
  simulationStore.setBoomAngle(Math.min(80, current + 10))
}

function pitchDown() {
  const current = motion.value.boomAngle
  simulationStore.setBoomAngle(Math.max(0, current - 10))
}
// #endregion

function resetAll() {
  simulationStore.reset()
}
</script>

<style scoped>
.control-panel {
  height: 100%;
  overflow-y: auto;
}

.section-label {
  font-size: 12px;
  font-weight: bold;
}

.pos-value {
  font-size: 11px;
  text-align: right;
}
</style>
