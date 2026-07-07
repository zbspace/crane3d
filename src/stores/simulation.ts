import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CraneMotionState } from '@/types/crane'

/**
 * 岸桥 3D 仿真运动状态管理
 * 跟踪大车、小车、起升、吊具、俯仰梁的实时运动数据
 */
export const useCraneSimulationStore = defineStore('craneSimulation', () => {
  // ==================== 运动状态 ====================
  const motion = ref<CraneMotionState>({
    gantryPosition: 0,      // 大车位置 (m)
    trolleyPosition: 0,     // 小车位置 (m)
    hoistPosition: 0,       // 起升高度 (m)
    boomAngle: 0,           // 俯仰角度 (deg)
    gantrySpeed: 0,
    trolleySpeed: 0,
    hoistSpeed: 0,
    spreader: {
      position: { x: 0, y: 0, z: 0 },
      targetPosition: { x: 0, y: 0, z: 0 },
      lockState: false,
      twistLockState: 'unlocked',
      flipperState: 'up'
    }
  })

  // ==================== 仿真状态标志 ====================
  const isAnimating = ref(false)
  const isConnected = ref(false)
  const isSimulationMode = ref(true)     // true=仿真模式, false=真实数据模式
  const simulationSpeed = ref(1)          // 仿真速度倍率

  // ==================== Actions ====================

  /** 设置大车位置 */
  function setGantryPosition(pos: number) {
    motion.value.gantryPosition = pos
  }

  /** 设置小车位置 */
  function setTrolleyPosition(pos: number) {
    motion.value.trolleyPosition = pos
  }

  /** 设置起升高度 */
  function setHoistPosition(pos: number) {
    motion.value.hoistPosition = pos
  }

  /** 设置俯仰角度 */
  function setBoomAngle(angle: number) {
    motion.value.boomAngle = angle
  }

  /** 设置吊具位置 */
  function setSpreaderPosition(x: number, y: number, z: number) {
    motion.value.spreader.position = { x, y, z }
  }

  /** 设置吊具目标位置 */
  function setSpreaderTarget(x: number, y: number, z: number) {
    motion.value.spreader.targetPosition = { x, y, z }
  }

  /** 设置吊具闭锁/开锁 */
  function setSpreaderLock(locked: boolean) {
    motion.value.spreader.lockState = locked
    motion.value.spreader.twistLockState = locked ? 'locked' : 'unlocked'
  }

  /** 设置导板 */
  function setFlipperState(state: 'up' | 'down') {
    motion.value.spreader.flipperState = state
  }

  /** 切换仿真/真实数据模式 */
  function toggleSimulationMode() {
    isSimulationMode.value = !isSimulationMode.value
  }

  /** 设置仿真速度 */
  function setSimulationSpeed(speed: number) {
    simulationSpeed.value = Math.max(0.1, Math.min(10, speed))
  }

  /** 大车移动到目标位置 */
  function moveGantryTo(target: number) {
    motion.value.spreader.targetPosition.z = target
  }

  /** 小车移动到目标位置 */
  function moveTrolleyTo(target: number) {
    motion.value.spreader.targetPosition.x = target
  }

  /** 起升到目标高度 */
  function moveHoistTo(target: number) {
    motion.value.spreader.targetPosition.y = target
  }

  /** 重置仿真状态 */
  function reset() {
    motion.value = {
      gantryPosition: 0,
      trolleyPosition: 0,
      hoistPosition: 0,
      boomAngle: 0,
      gantrySpeed: 0,
      trolleySpeed: 0,
      hoistSpeed: 0,
      spreader: {
        position: { x: 0, y: 0, z: 0 },
        targetPosition: { x: 0, y: 0, z: 0 },
        lockState: false,
        twistLockState: 'unlocked',
        flipperState: 'up'
      }
    }
    isAnimating.value = false
  }

  return {
    motion,
    isAnimating,
    isConnected,
    isSimulationMode,
    simulationSpeed,
    setGantryPosition,
    setTrolleyPosition,
    setHoistPosition,
    setBoomAngle,
    setSpreaderPosition,
    setSpreaderTarget,
    setSpreaderLock,
    setFlipperState,
    toggleSimulationMode,
    setSimulationSpeed,
    moveGantryTo,
    moveTrolleyTo,
    moveHoistTo,
    reset
  }
})
