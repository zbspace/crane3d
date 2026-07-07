import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type {
  ShipInfo,
  TruckLaneStatus,
  TaskInfo,
  QcFault,
  WorkSetting,
  QcConfig,
  WorkStatus,
  RosStatus,
  QcPlcData,
  CraneStatus,
  ServiceStatus
} from '@/types/api'

/**
 * 岸桥全局状态管理
 * 管理岸桥运行参数、作业状态、传感器数据
 */
export const useCraneStore = defineStore('crane', () => {
  // ==================== 设备信息 ====================
  const craneId = ref('QC01')
  const rcsNo = ref('')

  // ==================== 船信息 ====================
  const shipInfo = reactive<ShipInfo>({
    hasShip: 0,
    rowCount: 0,
    visitId: '',
    vspCode: '',
    shipDirection: 0,
    shipType: 0,
    location: 0,
    startPos: 0,
    endPos: 0,
    currentBayCabinState: 0
  })

  // ==================== 集卡道状态 ====================
  const truckLaneStatus = reactive<TruckLaneStatus>({
    lane_id: '',
    has_truck: 0,
    detect_truck_id: '',
    confirmed_truck_id: '',
    cps_state: 0,
    truck_cps_distance: 0,
    truck_cps_direction: 0,
    truckCarryState: 0,
    isOnPosition: false,
    confirmed_on_position: false,
    truckHeadDirection: 0,
    detect_truck_type: '',
    on_truck_container_id: '',
    on_truck_container_id2: ''
  })

  // ==================== 任务信息 ====================
  const currentTask = reactive<TaskInfo>({} as TaskInfo)
  const taskHistory = ref<TaskInfo[]>([])

  // ==================== 作业状态 ====================
  const workStatus = reactive<WorkStatus>({
    currentTaskId: '',
    currentVisitId: '',
    currentBayId: '',
    currentRowId: '',
    targetBayId: '',
    bayType: 0,
    readyToWork: 0,
    qcId: '',
    bayChangingState: 0,
    bayScanStart: 0,
    systemStop: false,
    hatchCoverWorkState: 0,
    fogLevel: 0,
    remSeaPos: false,
    remLandPos: false,
    workMode: 0
  })

  // ==================== 操作台状态 ====================
  const rosStatus = reactive<RosStatus>({} as RosStatus)

  // ==================== 设备配置 ====================
  const qcConfig = reactive<QcConfig>({
    qcId: '',
    landSideSafetyHeight: 0,
    waterSideSafetyHeight: 0,
    uiSafetyHeight: 0,
    shoreSidePoint: 0
  })

  // ==================== PLC 数据 ====================
  const plcData = reactive<QcPlcData>({} as QcPlcData)

  // ==================== 故障列表 ====================
  const faultList = ref<QcFault[]>([])

  // ==================== 设备连接状态 ====================
  const craneStatusList = ref<CraneStatus[]>([])

  // ==================== 服务状态 ====================
  const serviceStatus = reactive<ServiceStatus>({} as ServiceStatus)

  // ==================== 作业设置 ====================
  const workSetting = reactive<WorkSetting>({
    qcId: '',
    truckWorkModeSetting: 0,
    shipWorkSequenceMode: 0,
    cameraZoomState: 0,
    autoWorkPos_x: 0,
    autoWorkPos_y: 0
  })

  // ==================== 数据更新时间戳 ====================
  const lastUpdateTime = ref(0)

  // ==================== Actions ====================

  function setCraneId(id: string) {
    craneId.value = id
  }

  function setRcsNo(no: string) {
    rcsNo.value = no
  }

  function updateShipInfo(data: ShipInfo) {
    Object.assign(shipInfo, data)
    lastUpdateTime.value = Date.now()
  }

  function updateTruckLaneStatus(data: TruckLaneStatus) {
    Object.assign(truckLaneStatus, data)
    lastUpdateTime.value = Date.now()
  }

  function updateCurrentTask(data: TaskInfo) {
    Object.assign(currentTask, data)
    lastUpdateTime.value = Date.now()
  }

  function addTaskHistory(task: TaskInfo) {
    taskHistory.value.unshift(task)
    if (taskHistory.value.length > 100) {
      taskHistory.value = taskHistory.value.slice(0, 100)
    }
  }

  function updateWorkStatus(data: Partial<WorkStatus>) {
    Object.assign(workStatus, data)
    lastUpdateTime.value = Date.now()
  }

  function updateQcConfig(data: QcConfig) {
    Object.assign(qcConfig, data)
  }

  function updatePlcData(data: QcPlcData) {
    Object.assign(plcData, data)
    lastUpdateTime.value = Date.now()
  }

  function updateFaultList(list: QcFault[]) {
    faultList.value = list
  }

  function updateCraneStatusList(list: CraneStatus[]) {
    craneStatusList.value = list
  }

  function updateServiceStatus(data: ServiceStatus) {
    Object.assign(serviceStatus, data)
  }

  function updateWorkSetting(data: WorkSetting) {
    Object.assign(workSetting, data)
  }

  /** 重置所有状态 */
  function resetAll() {
    shipInfo.hasShip = 0
    shipInfo.rowCount = 0
    shipInfo.visitId = ''
    shipInfo.shipDirection = 0
    shipInfo.startPos = 0
    shipInfo.endPos = 0

    currentTask.taskId = ''
    currentTask.state = 'NONE'

    faultList.value = []
    taskHistory.value = []
    craneStatusList.value = []

    workStatus.readyToWork = 0
    workStatus.currentTaskId = ''
    workStatus.currentBayId = ''

    lastUpdateTime.value = Date.now()
  }

  return {
    // State
    craneId,
    rcsNo,
    shipInfo,
    truckLaneStatus,
    currentTask,
    taskHistory,
    workStatus,
    rosStatus,
    qcConfig,
    plcData,
    faultList,
    craneStatusList,
    serviceStatus,
    workSetting,
    lastUpdateTime,
    // Actions
    setCraneId,
    setRcsNo,
    updateShipInfo,
    updateTruckLaneStatus,
    updateCurrentTask,
    addTaskHistory,
    updateWorkStatus,
    updateQcConfig,
    updatePlcData,
    updateFaultList,
    updateCraneStatusList,
    updateServiceStatus,
    updateWorkSetting,
    resetAll
  }
})
