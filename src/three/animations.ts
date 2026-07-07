import { Tween, Easing } from '@tweenjs/tween.js'
import type { Vector3 } from 'three'

export { Tween, Easing }

/** 缓动函数类型 */
export type EasingFunction = (t: number) => number

/** 动画参数 */
export interface AnimationParams {
  duration?: number
  easing?: EasingFunction
  delay?: number
  onStart?: () => void
  onUpdate?: (value: number) => void
  onComplete?: () => void
}

/** 默认动画参数 */
const DEFAULT_DURATION = 1000
const DEFAULT_EASING = Easing.Quadratic.Out

/**
 * 创建一个数值补间动画
 */
export function createTween(
  from: number,
  to: number,
  params: AnimationParams = {}
): Tween<{ value: number }> {
  const { duration = DEFAULT_DURATION, easing = DEFAULT_EASING, delay = 0, onUpdate, onComplete, onStart } = params

  const obj = { value: from }
  const tween = new Tween(obj)
    .to({ value: to }, duration * 1)
    .easing(easing)
    .delay(delay)

  if (onUpdate) {
    tween.onUpdate(() => onUpdate(obj.value))
  }
  if (onComplete) {
    tween.onComplete(onComplete)
  }
  if (onStart) {
    tween.onStart(onStart)
  }

  return tween
}

/**
 * 创建一个 3D 位置补间动画 (Vector3)
 */
export function createPositionTween(
  object: { position: Vector3 },
  target: { x: number; y: number; z: number },
  params: AnimationParams = {}
): Tween<{ x: number; y: number; z: number }> {
  const { duration = DEFAULT_DURATION, easing = DEFAULT_EASING, delay = 0, onUpdate, onComplete } = params

  const start = { x: object.position.x, y: object.position.y, z: object.position.z }

  const tween = new Tween(start)
    .to(target, duration)
    .easing(easing)
    .delay(delay)
    .onUpdate(() => {
      object.position.set(start.x, start.y, start.z)
      if (onUpdate) onUpdate(start.x)
    })

  if (onComplete) {
    tween.onComplete(onComplete)
  }

  return tween
}

/**
 * 创建一个角度旋转补间动画
 */
export function createRotationTween(
  object: { rotation: { z: number } },
  targetAngle: number,
  params: AnimationParams = {}
): Tween<{ angle: number }> {
  const { duration = DEFAULT_DURATION, easing = DEFAULT_EASING, delay = 0, onComplete } = params

  const tween = new Tween({ angle: object.rotation.z })
    .to({ angle: targetAngle }, duration)
    .easing(easing)
    .delay(delay)
    .onUpdate((data: { angle: number }) => {
      object.rotation.z = data.angle
    })

  if (onComplete) {
    tween.onComplete(onComplete)
  }

  return tween
}

/** 动画链 - 顺序执行一组动画 */
export function createAnimationChain(tweens: Tween[]): void {
  if (tweens.length === 0) return

  for (let i = 0; i < tweens.length - 1; i++) {
    tweens[i].chain(tweens[i + 1])
  }

  tweens[0].start()
}
