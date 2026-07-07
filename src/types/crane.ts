// ==================== 岸桥仿真 3D 相关类型 ====================

/** 岸桥大车运动方向 */
export type GantryDirection = 'forward' | 'backward' | 'stop'

/** 小车运动方向 */
export type TrolleyDirection = 'left' | 'right' | 'stop'

/** 起升运动方向 */
export type HoistDirection = 'up' | 'down' | 'stop'

/** 俯仰梁状态 */
export type BoomState = 'level' | 'tilting_up' | 'tilting_down' | 'parked'

/** 吊具状态 */
export interface SpreaderState {
  position: {
    x: number   // 小车方向位置 (m)
    y: number   // 起升高度 (m)
    z: number   // 大车方向位置 (m)
  }
  targetPosition: {
    x: number
    y: number
    z: number
  }
  lockState: boolean
  twistLockState: 'locked' | 'unlocked'
  flipperState: 'up' | 'down'
}

/** 岸桥运动状态 */
export interface CraneMotionState {
  gantryPosition: number    // 大车位置 (m)
  trolleyPosition: number   // 小车位置 (m)
  hoistPosition: number     // 起升高度 (m)
  boomAngle: number         // 俯仰角度 (deg)
  gantrySpeed: number
  trolleySpeed: number
  hoistSpeed: number
  spreader: SpreaderState
}

/** 3D 场景相机配置 */
export interface CameraConfig {
  fov: number
  near: number
  far: number
  position: [number, number, number]
  target: [number, number, number]
}

/** 仿真配置 */
export interface SimulationConfig {
  craneColor: number
  containerColors: number[]
  groundSize: [number, number]
  gridHelper: boolean
  axisHelper: boolean
  shadows: boolean
  antiAlias: boolean
}

/** 动画插值参数 */
export interface TweenParams {
  duration: number
  easing: (t: number) => number
  delay?: number
  onComplete?: () => void
}
