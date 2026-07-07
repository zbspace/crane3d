import * as THREE from 'three'

export type ContainerSize = '20ft' | '40ft' | '45ft'

export interface ContainerOptions {
  color?: number
  size?: ContainerSize
  position?: [number, number, number]
  rotation?: [number, number, number]
  hasLabel?: boolean
  label?: string
}

/** 标准集装箱尺寸 (单位: m) */
const CONTAINER_DIMENSIONS = {
  '20ft': { width: 2.438, height: 2.591, depth: 6.058 },
  '40ft': { width: 2.438, height: 2.591, depth: 12.192 },
  '45ft': { width: 2.438, height: 2.896, depth: 13.716 }
} as const

/**
 * 创建 3D 集装箱模型
 * 使用标准集装箱尺寸和颜色，包含角件和波纹细节
 */
export function createContainer(options: ContainerOptions): THREE.Group {
  const {
    color = 0xcc6633,
    size = '20ft',
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    hasLabel = false,
    label = ''
  } = options

  const dims = CONTAINER_DIMENSIONS[size]
  const group = new THREE.Group()

  // 主箱体
  const boxGeo = new THREE.BoxGeometry(dims.width, dims.height, dims.depth)
  const boxMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.3
  })
  const box = new THREE.Mesh(boxGeo, boxMat)
  box.castShadow = true
  box.receiveShadow = true
  group.add(box)

  // 顶部波纹细节 (简化为线条)
  const edgeGeo = new THREE.EdgesGeometry(boxGeo)
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x333333 })
  const edges = new THREE.LineSegments(edgeGeo, edgeMat)
  group.add(edges)

  // 角件 (8个角落的小方块)
  const cornerSize = 0.15
  const cornerGeo = new THREE.BoxGeometry(cornerSize, cornerSize, cornerSize)
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.3
  })

  const halfW = dims.width / 2
  const halfH = dims.height / 2
  const halfD = dims.depth / 2

  const cornerPositions = [
    [-halfW, -halfH, -halfD], [halfW, -halfH, -halfD],
    [-halfW, halfH, -halfD], [halfW, halfH, -halfD],
    [-halfW, -halfH, halfD], [halfW, -halfH, halfD],
    [-halfW, halfH, halfD], [halfW, halfH, halfD]
  ]

  cornerPositions.forEach((pos) => {
    const corner = new THREE.Mesh(cornerGeo, cornerMat)
    corner.position.set(pos[0], pos[1], pos[2])
    group.add(corner)
  })

  // 设置位置和旋转
  group.position.set(position[0], position[1], position[2])
  group.rotation.set(rotation[0], rotation[1], rotation[2])

  return group
}

/**
 * 创建彩色集装箱 - 用于区分不同箱子
 */
export function createColoredContainer(
  size: ContainerSize = '20ft',
  position: [number, number, number] = [0, 0, 0]
): THREE.Group {
  const colors = [0xcc6633, 0x3366cc, 0x33cc66, 0xcc3333, 0xcccc33, 0x9933cc]
  const color = colors[Math.floor(Math.random() * colors.length)]
  return createContainer({ color, size, position })
}

/**
 * 创建集装箱堆叠
 */
export function createContainerStack(
  count: number,
  size: ContainerSize = '20ft',
  basePosition: [number, number, number] = [0, 0, 0]
): THREE.Group {
  const group = new THREE.Group()
  const dims = CONTAINER_DIMENSIONS[size]

  for (let i = 0; i < count; i++) {
    const container = createColoredContainer(size, [
      basePosition[0],
      basePosition[1] + dims.height * i + dims.height / 2,
      basePosition[2]
    ])
    group.add(container)
  }

  return group
}
