/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@tweenjs/tween.js' {
  export function update(time?: number, preserve?: boolean): void
  export class Tween<T = any> {
    constructor(obj: T, group?: Group)
    to(props: Partial<T>, duration?: number): this
    start(time?: number): this
    stop(): this
    delay(amount: number): this
    easing(easing: (t: number) => number): this
    duration(d: number): this
    onStart(callback: (obj: T) => void): this
    onUpdate(callback: (obj: T, elapsed: number) => void): this
    onComplete(callback: (obj: T) => void): this
    onStop(callback: (obj: T) => void): this
    chain(...tweens: Tween[]): this
    repeat(times: number): this
    yoyo(yoyo: boolean): this
  }
  export class Group {
    constructor()
    add(tween: Tween): void
    remove(tween: Tween): void
    update(time?: number, preserve?: boolean): void
    getAll(): Tween[]
  }
  export const Easing: {
    Linear: { None: (t: number) => number; In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Quadratic: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Cubic: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Quart: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Quint: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Sinusoidal: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Exponential: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Circular: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Elastic: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Back: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
    Bounce: { In: (t: number) => number; Out: (t: number) => number; InOut: (t: number) => number }
  }
}

declare module '@tweenjs/tween.js' {
  const TWEEN: { update: typeof update; Tween: typeof Tween; Group: typeof Group; Easing: typeof Easing }
  export default TWEEN
}
