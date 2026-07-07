<template>
  <div ref="sceneContainer" class="scene-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useCraneSimulationStore } from '@/stores/simulation'
import { CraneScene } from '@/three/CraneScene'

const props = withDefaults(defineProps<{
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: '100%'
})

const emit = defineEmits<{
  (e: 'sceneReady', scene: CraneScene): void
}>()

const sceneContainer = ref<HTMLDivElement>()
const simulationStore = useCraneSimulationStore()
let craneScene: CraneScene | null = null

// #region 初始化 3D 场景
onMounted(() => {
  if (!sceneContainer.value) return

  craneScene = new CraneScene(sceneContainer.value)
  craneScene.start()
  emit('sceneReady', craneScene)
})

// #endregion

// #region 监听仿真状态变化 - 更新 3D 场景
watch(
  () => simulationStore.motion,
  (motion) => {
    if (craneScene) {
      craneScene.updateMotion(motion)
    }
  },
  { deep: true }
)
// #endregion

// #region 清理
onBeforeUnmount(() => {
  if (craneScene) {
    craneScene.dispose()
    craneScene = null
  }
})
// #endregion
</script>

<style scoped>
.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
