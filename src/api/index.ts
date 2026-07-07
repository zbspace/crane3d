import axios from 'axios'
import type {
  ApiResponse,
  ShipInfo,
  TruckLaneStatus,
  TaskInfo,
  QcFault,
  WorkSetting,
  QcConfig,
  ShipProfile,
  SafetyDetectionResult,
  WorkStatus,
  RosStatus,
  LoginReport,
  QcPlcData,
  CraneStatus,
  NotificationItem,
  ServiceStatus,
  MsgItem
} from '@/types/api'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器 - 添加 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('API Error:', err)
    return Promise.reject(err)
  }
)

/**
 * 通用数据查询接口
 */
export async function getData<T>(dataType: string, craneId?: string): Promise<ApiResponse<T>> {
  return request.post('/dataController/getData', { dataType, craneId })
}

// ==================== 查询接口封装 ====================

/** 查询船信息状态 */
export function getShipInfo(craneId?: string) {
  return getData<ShipInfo>('shipInfo', craneId)
}

/** 查询集卡道状态 */
export function getTruckLaneStatus(craneId?: string) {
  return getData<TruckLaneStatus>('truckLaneStatus', craneId)
}

/** 查询任务信息状态 */
export function getTaskInfo(craneId?: string) {
  return getData<TaskInfo>('taskInfo', craneId)
}

/** 查询故障列表 */
export function getFaultList(craneId?: string) {
  return getData<QcFault[]>('faultList', craneId)
}

/** 查询作业设置 */
export function getWorkSetting(craneId?: string) {
  return getData<WorkSetting>('workSetting', craneId)
}

/** 查询设备配置 */
export function getQcConfig(craneId?: string) {
  return getData<QcConfig>('qcConfig', craneId)
}

/** 贝扫轮廓 */
export function getShipProfile(craneId?: string) {
  return getData<ShipProfile>('shipProfile', craneId)
}

/** 安全检测 */
export function getSafetyDetection(craneId?: string) {
  return getData<SafetyDetectionResult[]>('safetyDetectionResult', craneId)
}

/** 查询作业状态 */
export function getWorkStatus(craneId?: string) {
  return getData<WorkStatus>('workStatus', craneId)
}

/** 查询操作台状态 */
export function getRosStatus(craneId?: string) {
  return getData<RosStatus>('rosStatus', craneId)
}

/** 查询用户登录信息 */
export function getUserLoginInfo() {
  return getData<LoginReport>('userLoginInfo')
}

/** 查询 PLC 单机设备状态 */
export function getQcPlcData(craneId?: string) {
  return getData<QcPlcData>('qcPlcData', craneId)
}

/** 查询设备连接状态 */
export function getCraneStatusList() {
  return getData<CraneStatus[]>('craneStatusList')
}

/** 查询弹窗消息 */
export function getNotificationList() {
  return getData<NotificationItem[]>('notificationList')
}

/** 查询服务状态 */
export function getServiceStatus() {
  return getData<ServiceStatus>('serviceStatus')
}

/** 查询大字提示 */
export function getMsgList() {
  return getData<MsgItem[]>('msgList')
}

// ==================== 命令接口封装 ====================

/** 终止任务 */
export function sendAbortTask(taskId: string, reason: string, flag: boolean, qcId: string) {
  return request.post('/qcCommand/sendAbortTask', { taskId, reason, flag, qcId })
}

/** 确认任务完成 */
export function confirmTaskComplete(params: {
  taskId: string
  completeAsPlan: boolean
  toPositionType: number
  workObjectType: number
  toBay: string
  toRow: string
  toTier: string
  toTruckLane: string
  toTruckId: string
  toTruckPos: string
  qcId: string
}) {
  return request.post('/qcCommand/confirmTaskComplete', params)
}

/** 确认集卡到达 */
export function confirmTruckArrive(isTruckArrive: boolean, truckId: string, laneId: string, qcId: string) {
  return request.post('/qcCommand/confirmTruckArrive', { isTruckArrive, truckId, laneId, qcId })
}

/** 确认箱号 */
export function confirmContainer(taskId: string, containerId: string, qcId: string) {
  return request.post('/qcCommand/confirmContainer', { taskId, containerId, qcId })
}

/** 开始/停止贝扫 */
export function sendBayScanCmd(params: {
  bayId: string
  start: string
  ship_direction: number
  ship_place: number
  ship_start_pos: number
  ship_stop_pos: number
  manual: number
  qcId: string
}) {
  return request.post('/qcCommand/sendBayScanCmd', params)
}

/** 发送任务 */
export function sendTask(params: {
  moveType: number
  containerId: string
  containerIso: string
  containerType: number
  containerHeightType: number
  containerSize: number
  bayId: string
  pickRowId: string
  dropRowId: string
  laneId: string
  truckId: string
  truckType: number
  truckPos: string
  qcId: string
}) {
  return request.post('/qcCommand/sendTask', params)
}

/** 设置岸桥就绪 */
export function setCraneReadyForWork(ready: boolean, bay_number: number, road_number: number, ship_direction: number, qcId: string) {
  return request.post('/qcCommand/setCraneReadyForWork', { ready, bay_number, road_number, ship_direction, qcId })
}

/** 设置当前贝位 */
export function setCurrentBay(params: {
  bayId: string
  moveBayId: string
  moveDir: number
  moveDis: number
  isChangingBay: boolean
  qcId: string
  ship: number
}) {
  return request.post('/qcCommand/setCurrentBay', params)
}

/** 设置安全高度 */
export function setSafetyHeight(height: number, seaSide: boolean, qcId: string) {
  return request.post('/qcCommand/setSafetyHeight', { height, seaSide, qcId })
}

/** 设置船信息 */
export function setShipInfo(shipDirection: number, location: number, qcId: string) {
  return request.post('/qcCommand/setShipInfo', { shipDirection, location, qcId })
}

/** 设置船位置 */
export function setShipPosition(startPos: number, endPos: number, qcId: string) {
  return request.post('/qcCommand/setShipPosition', { startPos, endPos, qcId })
}

/** PLC 控制 - 单击按钮 */
export function setPlcData(dataType: string, rcsNo: string) {
  return request.post('/plcController/setPlcData', { dataType, rcsNo })
}

/** PLC 控制 - 长按按钮 */
export function setPlcDataByIsEnabled(dataType: string, isEnabled: boolean, rcsNo: string) {
  return request.post('/plcController/setPlcDataByIsEnabled', { dataType, isEnabled, rcsNo })
}

/** 通用按钮接口 */
export function universalButton(cmd: string) {
  return request.post('/qcCommand/universalButton', { cmd })
}

export default request
