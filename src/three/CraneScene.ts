import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { CraneModel } from './CraneModel'
import { createContainer, createContainerStack } from './Container'
import type { CraneMotionState } from '@/types/crane'
import TWEEN from '@tweenjs/tween.js'
import { createTween } from './animations'

export class CraneScene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls
  public stats: Stats

  public crane: CraneModel
  public containers: THREE.Group

  private animationId: number = 0
  private clock: THREE.Clock

  private ground: THREE.Mesh
  private seaPlane: THREE.Mesh
  private laneMarkings: THREE.Group

  constructor(container: HTMLElement) {
    // 场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // 天空蓝
    this.scene.fog = new THREE.Fog(0x87ceeb, 200, 400)

    // 相机
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    )
    this.camera.position.set(60, 40, 80)
    this.camera.lookAt(0, 15, 0)

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    // 轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 15, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 10
    this.controls.maxDistance = 200
    this.controls.maxPolarAngle = Math.PI / 2.1
    this.controls.update()

    // 性能统计
    this.stats = new Stats()
    this.stats.dom.style.position = 'absolute'
    this.stats.dom.style.top = '0'
    this.stats.dom.style.left = '0'
    container.appendChild(this.stats.dom)

    // 时钟
    this.clock = new THREE.Clock()

    // 构建场景
    this.setupLights()
    this.ground = this.createGround()
    this.seaPlane = this.createSea()
    this.laneMarkings = this.createLaneMarkings()

    // 创建岸桥
    this.crane = new CraneModel({
      height: 40,
      span: 30,
      boomLength: 50,
      backBoomLength: 25
    })
    this.crane.group.position.set(0, 0, 0)

    // 创建集装箱
    this.containers = new THREE.Group()
    this.createInitialContainers()

    // 加入场景
    this.scene.add(this.crane.group)
    this.scene.add(this.containers)
    this.scene.add(this.laneMarkings)

    // 自适应
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)
  }

  /** 设置光照 */
  private setupLights(): void {
    // 环境光
    const ambient = new THREE.AmbientLight(0x404060, 0.5)
    this.scene.add(ambient)

    // 半球光
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x444422, 0.6)
    this.scene.add(hemi)

    // 主光源 (太阳)
    const sun = new THREE.DirectionalLight(0xffeedd, 1.5)
    sun.position.set(50, 80, 30)
    sun.castShadow = true
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 200
    sun.shadow.camera.left = -60
    sun.shadow.camera.right = 60
    sun.shadow.camera.top = 60
    sun.shadow.camera.bottom = -60
    this.scene.add(sun)

    // 补光
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3)
    fill.position.set(-30, 20, -30)
    this.scene.add(fill)

    // 环境光辅助
    const env = new THREE.AmbientLight(0x404060, 0.3)
    this.scene.add(env)
  }

  /** 创建地面 */
  private createGround(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(300, 200)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, 0, 0)
    ground.receiveShadow = true
    this.scene.add(ground)

    // 网格辅助线
    const grid = new THREE.GridHelper(200, 40, 0x888888, 0x555555)
    grid.position.y = 0.1
    this.scene.add(grid)

    return ground
  }

  /** 创建海面 */
  private createSea(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(200, 80)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a6ba0,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    })
    const sea = new THREE.Mesh(geo, mat)
    sea.rotation.x = -Math.PI / 2
    sea.position.set(0, 0.2, -50)
    sea.receiveShadow = true
    this.scene.add(sea)
    return sea
  }

  /** 创建集卡车道标记 */
  private createLaneMarkings(): THREE.Group {
    const group = new THREE.Group()
    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc })

    // 在陆侧画6条车道标记
    for (let i = 0; i < 6; i++) {
      const z = 30 + i * 5
      for (let j = 0; j < 10; j++) {
        const line = new THREE.Mesh(
          new THREE.PlaneGeometry(0.3, 2),
          mat
        )
        line.rotation.x = -Math.PI / 2
        line.position.set(-10 + j * 4, 0.3, z)
        group.add(line)
      }
    }

    return group
  }

  /** 创建初始集装箱场景 */
  private createInitialContainers(): void {
    // 船上集装箱堆叠
    const shipContainerPositions = [
      // 船上的集装箱 (z负方向为海侧)
      { x: -8, z: -50 }, { x: -4, z: -50 }, { x: 0, z: -50 }, { x: 4, z: -50 }, { x: 8, z: -50 },
      { x: -8, z: -45 }, { x: -4, z: -45 }, { x: 0, z: -45 }, { x: 4, z: -45 }, { x: 8, z: -45 },
      { x: -8, z: -55 }, { x: -4, z: -55 }, { x: 0, z: -55 }, { x: 4, z: -55 }, { x: 8, z: -55 },
    ]

    shipContainerPositions.forEach((pos) => {
      const stack = createContainerStack(
        Math.floor(Math.random() * 3) + 1,
        '20ft',
        [pos.x, 0, pos.z]
      )
      this.containers.add(stack)
    })

    // 陆侧集卡等待区的集装箱
    for (let i = 0; i < 3; i++) {
      const container = createContainer({
        color: 0x3366cc,
        size: '20ft',
        position: [-15 + i * 5, 1.3, 35 + Math.random() * 10]
      })
      this.containers.add(container)
    }
  }

  /** 更新岸桥运动 */
  updateMotion(state: CraneMotionState): void {
    const { gantryPosition, trolleyPosition, hoistPosition, boomAngle } = state

    // 大车移动 (z轴)
    this.crane.group.position.z = gantryPosition

    // 小车移动 (z轴相对大梁)
    this.crane.parts.trolley.position.z = -trolleyPosition

    // 起升 (吊具y轴)
    this.crane.parts.spreader.position.y = -hoistPosition

    // 俯仰角度
    this.crane.parts.boom.rotation.x = boomAngle * (Math.PI / 180)
    this.crane.parts.backBoom.rotation.x = 0

    // 更新钢丝绳
    this.crane.updateRopeLength(hoistPosition)
  }

  /** 播放大车移动动画 */
  animateGantryTo(targetZ: number, duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      const current = this.crane.group.position.z
      createTween(current, targetZ, {
        duration,
        onUpdate: (value) => {
          this.crane.group.position.z = value
        },
        onComplete: resolve
      }).start()
    })
  }

  /** 播放小车移动动画 */
  animateTrolleyTo(targetZ: number, duration: number = 1500): Promise<void> {
    return new Promise((resolve) => {
      const current = this.crane.parts.trolley.position.z
      createTween(current, -targetZ, {
        duration,
        onUpdate: (value) => {
          this.crane.parts.trolley.position.z = value
        },
        onComplete: resolve
      }).start()
    })
  }

  /** 播放起升动画 */
  animateHoistTo(targetHeight: number, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const current = Math.abs(this.crane.parts.spreader.position.y)
      createTween(current, targetHeight, {
        duration,
        onUpdate: (value) => {
          this.crane.parts.spreader.position.y = -value
          this.crane.updateRopeLength(value)
        },
        onComplete: resolve
      }).start()
    })
  }

  /** 播放俯仰动画 */
  animateBoomTo(angleDeg: number, duration: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      const current = this.crane.parts.boom.rotation.x * (180 / Math.PI)
      createTween(current, angleDeg, {
        duration,
        onUpdate: (value) => {
          this.crane.parts.boom.rotation.x = value * (Math.PI / 180)
        },
        onComplete: resolve
      }).start()
    })
  }

  /** 窗口自适应 */
  private handleResize(): void {
    if (!this.renderer.domElement.parentElement) return
    const parent = this.renderer.domElement.parentElement
    const width = parent.clientWidth
    const height = parent.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  /** 渲染循环 */
  start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)

      const delta = this.clock.getDelta()

      // 更新TWEEN
      TWEEN.update()

      // 更新轨道控制器
      this.controls.update()

      // 更新统计
      this.stats.update()

      // 渲染
      this.renderer.render(this.scene, this.camera)
    }

    animate()
  }

  /** 停止渲染循环并销毁 */
  dispose(): void {
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.handleResize)
    this.renderer.dispose()

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }
    if (this.stats.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom)
    }
  }

  /** 加载 GLTF 模型 (预留接口) */
  async loadGLTFModel(url: string): Promise<void> {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
    const loader = new GLTFLoader()
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        // 替换当前岸桥模型
        this.scene.remove(this.crane.group)
        const model = gltf.scene
        model.scale.set(0.01, 0.01, 0.01) // 调整比例
        model.position.set(0, 0, 0)
        this.scene.add(model)
        resolve()
      }, undefined, reject)
    })
  }
}
