import * as THREE from 'three'

/** 岸桥各部件分组标识 */
export interface CraneParts {
  gantry: THREE.Group        // 大车 (含支腿)
  platform: THREE.Group      // 平台/司机室
  boom: THREE.Group          // 前大梁 (俯仰梁)
  backBoom: THREE.Group      // 后大梁
  trolley: THREE.Group       // 小车
  hoist: THREE.Group         // 起升机构
  spreader: THREE.Group      // 吊具
  rope: THREE.Line           // 钢丝绳
  pillar: THREE.Group        // 门框/立柱
}

/** 岸桥模型参数 */
export interface CraneParams {
  height?: number          // 总高度
  span?: number            // 跨度 (大车轨距)
  boomLength?: number      // 前大梁长度
  backBoomLength?: number  // 后大梁长度
  gantryWidth?: number     // 大车宽度
  color?: number           // 主体颜色
}

/**
 * 岸桥 3D 模型类
 * 使用程序化几何体构建岸桥结构
 */
export class CraneModel {
  public group: THREE.Group
  public parts: CraneParts

  private params: Required<CraneParams>

  constructor(params: CraneParams = {}) {
    this.params = {
      height: params.height ?? 40,
      span: params.span ?? 30,
      boomLength: params.boomLength ?? 50,
      backBoomLength: params.backBoomLength ?? 25,
      gantryWidth: params.gantryWidth ?? 8,
      color: params.color ?? 0xf5a623
    }

    this.group = new THREE.Group()
    this.parts = this.build()
  }

  private build(): CraneParts {
    const { height, span, boomLength, backBoomLength, gantryWidth, color } = this.params
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.6
    })
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.3
    })

    // ==================== 大车 + 支腿 ====================
    const gantry = new THREE.Group()

    // 大车横梁 (海陆方向)
    const beamGeo = new THREE.BoxGeometry(span, 2, 3)
    const beam = new THREE.Mesh(beamGeo, material)
    beam.position.set(0, height - 1, 0)
    beam.castShadow = true
    gantry.add(beam)

    // 大车端梁 (海侧和陆侧)
    const endBeamGeo = new THREE.BoxGeometry(3, 2, gantryWidth)
    const seaEnd = new THREE.Mesh(endBeamGeo, darkMaterial)
    seaEnd.position.set(-span / 2, 1, 0)
    seaEnd.castShadow = true
    gantry.add(seaEnd)

    const landEnd = new THREE.Mesh(endBeamGeo, darkMaterial)
    landEnd.position.set(span / 2, 1, 0)
    landEnd.castShadow = true
    gantry.add(landEnd)

    // 大车轮 (4个)
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    const wheelPositions = [
      [-span / 2 - 1, 0.6, -gantryWidth / 2],
      [-span / 2 - 1, 0.6, gantryWidth / 2],
      [span / 2 + 1, 0.6, -gantryWidth / 2],
      [span / 2 + 1, 0.6, gantryWidth / 2]
    ]
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(pos[0], pos[1], pos[2])
      wheel.rotation.x = Math.PI / 2
      gantry.add(wheel)
    })

    // 支腿 (4根立柱)
    const legGeo = new THREE.BoxGeometry(1.5, height - 2, 1.5)
    const legPositions = [
      [-span / 2, 0, -gantryWidth / 2],
      [-span / 2, 0, gantryWidth / 2],
      [span / 2, 0, -gantryWidth / 2],
      [span / 2, 0, gantryWidth / 2]
    ]
    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, darkMaterial)
      leg.position.set(pos[0], (height - 2) / 2, pos[2])
      leg.castShadow = true
      gantry.add(leg)
    })

    // 门框连接梁 (X型支撑)
    const supportMat = new THREE.MeshStandardMaterial({ color: 0x555555 })
    for (const x of [-span / 2, span / 2]) {
      const cross1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, height * 0.6, 0.3),
        supportMat
      )
      cross1.position.set(x, height * 0.4, 0)
      cross1.rotation.x = 0.4
      gantry.add(cross1)

      const cross2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, height * 0.6, 0.3),
        supportMat
      )
      cross2.position.set(x, height * 0.4, 0)
      cross2.rotation.x = -0.4
      gantry.add(cross2)
    }

    // ==================== 前大梁 (俯仰梁) ====================
    const boom = new THREE.Group()
    const boomGeo = new THREE.BoxGeometry(2, 2, boomLength)
    const boomMesh = new THREE.Mesh(boomGeo, material)
    boomMesh.position.set(0, 0, -boomLength / 2)
    boomMesh.castShadow = true
    boom.add(boomMesh)

    // 大梁桁架结构
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x666666 })
    for (let i = 0; i < 10; i++) {
      const z = -(i / 10) * boomLength
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.5, 0.2),
        trussMat
      )
      truss.position.set(0.8, 0, z)
      boom.add(truss)

      const truss2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.5, 0.2),
        trussMat
      )
      truss2.position.set(-0.8, 0, z)
      boom.add(truss2)
    }

    // 大梁与门框连接铰点
    boom.position.set(0, height - 1, 0)

    // ==================== 后大梁 ====================
    const backBoom = new THREE.Group()
    const backGeo = new THREE.BoxGeometry(2, 2, backBoomLength)
    const backMesh = new THREE.Mesh(backGeo, material)
    backMesh.position.set(0, 0, backBoomLength / 2)
    backMesh.castShadow = true
    backBoom.add(backMesh)

    // 后大梁配重
    const weightMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 })
    const weight = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 4),
      weightMat
    )
    weight.position.set(0, -1, backBoomLength - 2)
    backBoom.add(weight)

    backBoom.position.set(0, height - 1, 0)

    // ==================== 小车 ====================
    const trolley = new THREE.Group()
    const trolleyGeo = new THREE.BoxGeometry(3, 1.5, 4)
    const trolleyMesh = new THREE.Mesh(trolleyGeo, new THREE.MeshStandardMaterial({
      color: 0xdc3545,
      roughness: 0.5,
      metalness: 0.4
    }))
    trolleyMesh.castShadow = true
    trolley.add(trolleyMesh)

    // 小车滑轮
    const pulleyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12)
    const pulleyMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 })
    for (const x of [-1.5, 1.5]) {
      const pulley = new THREE.Mesh(pulleyGeo, pulleyMat)
      pulley.position.set(x, -0.75, 1.5)
      pulley.rotation.x = Math.PI / 2
      trolley.add(pulley)
    }

    trolley.position.set(0, height - 1, 0)

    // ==================== 起升机构 ====================
    const hoist = new THREE.Group()
    const hoistGeo = new THREE.BoxGeometry(1.5, 1, 1.5)
    const hoistMesh = new THREE.Mesh(hoistGeo, darkMaterial)
    hoist.add(hoistMesh)
    hoist.position.set(0, height - 3.5, 0)

    // ==================== 吊具 ====================
    const spreader = new THREE.Group()
    const sprdMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3, metalness: 0.7 })

    // 吊具主体
    const sprdBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.4, 6),
      sprdMat
    )
    sprdBody.castShadow = true
    spreader.add(sprdBody)

    // 吊具旋锁 (4个)
    const lockGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8)
    const lockMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
    const lockPositions = [
      [-1, -0.2, -2.8], [1, -0.2, -2.8],
      [-1, -0.2, 2.8], [1, -0.2, 2.8]
    ]
    lockPositions.forEach((pos) => {
      const lock = new THREE.Mesh(lockGeo, lockMat)
      lock.position.set(pos[0], pos[1], pos[2])
      spreader.add(lock)
    })

    // 导板 (4个可动部分)
    const flipperMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 })
    const flipperGeo = new THREE.BoxGeometry(0.1, 0.6, 0.2)
    const flipperPositions = [
      [-1.25, -0.5, 0], [1.25, -0.5, 0],
      [0, -0.5, -3], [0, -0.5, 3]
    ]
    flipperPositions.forEach((pos) => {
      const flipper = new THREE.Mesh(flipperGeo, flipperMat)
      flipper.position.set(pos[0], pos[1], pos[2])
      spreader.add(flipper)
    })

    // ==================== 钢丝绳 (简化为4根线) ====================
    const ropePoints: THREE.Vector3[] = []
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 })

    for (const x of [-0.5, 0.5]) {
      for (const z of [-0.5, 0.5]) {
        ropePoints.push(new THREE.Vector3(x, -0.5, z))
        ropePoints.push(new THREE.Vector3(x, -10, z))
      }
    }

    const ropeGeo2 = new THREE.BufferGeometry().setFromPoints(ropePoints)
    const rope = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      ropeMat
    )

    // 用 LineSegments 替代单个 Line
    const ropePositions: number[] = []
    for (const x of [-0.5, 0.5]) {
      for (const z of [-0.5, 0.5]) {
        ropePositions.push(x, -0.5, z)
        ropePositions.push(x, -10, z)
      }
    }
    const ropeBufGeo = new THREE.BufferGeometry()
    ropeBufGeo.setAttribute('position', new THREE.Float32BufferAttribute(ropePositions, 3))
    const ropeLine = new THREE.LineSegments(ropeBufGeo, ropeMat)

    // ==================== 平台/司机室 ====================
    const platform = new THREE.Group()
    const cabGeo = new THREE.BoxGeometry(2.5, 2, 2.5)
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.3 })
    const cab = new THREE.Mesh(cabGeo, cabMat)
    cab.position.set(2, 10, 0)
    cab.castShadow = true
    platform.add(cab)

    // 司机室窗户
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.6,
      metalness: 0.1,
      roughness: 0.1
    })
    const windowGeo = new THREE.PlaneGeometry(1.5, 1)
    const win = new THREE.Mesh(windowGeo, windowMat)
    win.position.set(2, 10.5, 1.26)
    platform.add(win)

    // ==================== 组装 ====================
    this.group.add(gantry)
    this.group.add(boom)
    this.group.add(backBoom)
    this.group.add(trolley)
    this.group.add(hoist)
    this.group.add(spreader)
    this.group.add(ropeLine)
    this.group.add(platform)

    // 平台附着在门框上
    const pillarGroup = new THREE.Group()
    this.group.add(pillarGroup)

    return {
      gantry,
      platform,
      boom,
      backBoom,
      trolley,
      hoist,
      spreader,
      rope: ropeLine,
      pillar: pillarGroup
    }
  }

  /** 更新钢丝绳长度 */
  updateRopeLength(height: number): void {
    const positions = this.parts.rope.geometry.attributes.position
    if (!positions) return

    const array = positions.array as Float32Array
    for (let i = 0; i < array.length; i += 6) {
      array[i + 1] = -0.5           // top y
      array[i + 4] = -(height + 0.5) // bottom y (negative = below trolley)
    }
    positions.needsUpdate = true
  }

  /** 获取大车位置 (z轴) */
  getGantryPosition(): number {
    return this.group.position.z
  }

  /** 获取小车 (沿大梁前后即z轴前后移动, 这里用-z代表海方向) */
  getTrolleyPosition(): number {
    return this.parts.trolley.position.z
  }

  /** 获取起升高度 */
  getHoistPosition(): number {
    return Math.abs(this.parts.spreader.position.y)
  }

  /** 获取俯仰角度 */
  getBoomAngle(): number {
    return this.parts.boom.rotation.x
  }
}
