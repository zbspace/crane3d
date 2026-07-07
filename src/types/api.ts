// ==================== 通用响应格式 ====================
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ==================== 001 船信息状态 ====================
export interface ShipInfo {
  hasShip: number
  rowCount: number
  visitId: string
  vspCode: string
  shipDirection: number
  shipType: number
  location: number
  startPos: number
  endPos: number
  currentBayCabinState: number
}

// ==================== 002 集卡道状态 ====================
export interface TruckLaneStatus {
  lane_id: string
  has_truck: number
  detect_truck_id: string
  confirmed_truck_id: string
  cps_state: number
  truck_cps_distance: number
  truck_cps_direction: number
  truckCarryState: number
  isOnPosition: boolean
  confirmed_on_position: boolean
  truckHeadDirection: number
  detect_truck_type: string
  on_truck_container_id: string
  on_truck_container_id2: string
}

// ==================== 003 任务信息状态 ====================
export type TaskState = 'NONE' | 'READY' | 'START' | 'PICK_COMPLETE' | 'COMPLETE' | 'ABORT' | 'CANCEL'
export type ContainerCheckState = 'NONE' | 'BYPASS' | 'WAIT_DETECT' | 'DETECT_PASS' | 'DETECT_FAIL' | 'CONFIRM_PASS' | 'CONFIRM_FAIL'
export type TruckCheckState = 'NONE' | 'WAIT_ARRIVE' | 'DETECT_PASS' | 'CONFIRM_PASS' | 'BYPASS'
export type TaskType = 'LOAD' | 'DSCH' | 'SHUFFLE' | 'LOAD_COVER' | 'DSCH_COVER'

export interface TaskInfo {
  taskId: string
  qcId: string
  moveId: string
  jobId: string
  containerId: string
  state: TaskState
  containerCheckState: ContainerCheckState
  truckCheckState: TruckCheckState
  type: TaskType
  fromBay: string
  fromRow: string
  fromTier: string
  fromTruckLane: string
  fromTruckId: string
  fromTruckPos: string
  toBay: string
  toRow: string
  toTier: string
  toTruckLane: string
  toTruckId: string
  toTruckPos: string
  fromPositionType: number
  toPositionType: number
  workObjectType: number
  source: string
  generateTime: number
  startTime: number
  containerConfirmTime: number
  truckArriveTime: number
  pickTime: number
  liftSafetyAfterPickTime: number
  dropTime: number
  liftSafetyAfterDropTime: number
}

// ==================== 004 故障列表 ====================
export type FaultType = 'EVENT' | 'WARN' | 'FAULT1' | 'FAULT2' | 'EX_SYS' | 'EX_TASK'

export interface QcFault {
  fault_code: string
  port_fault_code: string
  fault_type: FaultType
  fault_level: number
  description: string
  module: string
  sub_module: string
  plc_address: string
}

// ==================== 005 作业设置 ====================
export interface WorkSetting {
  qcId: string
  truckWorkModeSetting: number
  shipWorkSequenceMode: number
  cameraZoomState: number
  autoWorkPos_x: number
  autoWorkPos_y: number
}

// ==================== 006 设备配置 ====================
export interface QcConfig {
  qcId: string
  landSideSafetyHeight: number
  waterSideSafetyHeight: number
  uiSafetyHeight: number
  shoreSidePoint: number
}

// ==================== 007 贝扫轮廓 ====================
export interface ShipProfile {
  visitId: string
  bayId: string
  profile: number[]
  topObjectHeight: number
}

// ==================== 008 安全检测 ====================
export interface SafetyDetectionResult {
  area_code: number
  object_distance: number
  object_type: string
  position_x: number
  position_y: number
  state: number
}

// ==================== 009 作业状态 ====================
export interface WorkStatus {
  currentTaskId: string
  currentVisitId: string
  currentBayId: string
  currentRowId: string
  targetBayId: string
  bayType: number
  readyToWork: number
  qcId: string
  bayChangingState: number
  bayScanStart: number
  systemStop: boolean
  hatchCoverWorkState: number
  fogLevel: number
  remSeaPos: boolean
  remLandPos: boolean
  workMode: number
}

// ==================== 010 操作台状态 ====================
export interface RosStatus {
  rcs_no: string
  attendance_status: string
  user_id: string
  ros_status: string
  ros_mode: string
  ros_type: string
  crane_id: string
  manufacturer: string
  crane_type: string
  goal_crane_id: string
  task_id: string
  exception_code: string
  exception_msg: string
  exception_des: string
  exception_level: string
  assignModel: number
  crane_connect: boolean
}

// ==================== 011 用户登录信息 ====================
export interface UserInfo {
  userName: string
  machNo: string
  machType: string
  userRole: string
  userId: number
}

export interface LoginReport {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  scope: string
  jti: string
  userInfo: UserInfo
}

// ==================== 012 PLC 单机设备状态 ====================
export interface QcPlcData {
  Crane_Name: string
  Sea_Left_Enable: boolean
  Sea_Right_Enable: boolean
  Land_Left_Enable: boolean
  Land_Right_Enable: boolean
  PitchFld_Fb: boolean
  Sea_Action_Pos: boolean
  Land_Action_Pos: boolean
  Move_Sea_Action_Pos: boolean
  Move_Land_Action_Pos: boolean
  Boom_Trolley_Indicator: boolean
  Boom_Level_Indicator: boolean
  Boom_Normal_Indicator: boolean
  Boom_Stop_Indicator: boolean
  Slack_Rope_Indicator: boolean
  Boom_Rising_Indicator: boolean
  Boom_Lowering_Indicator: boolean
  Camara_Control_State: boolean
  Rem_Rotation: boolean
  Pitch_control_closing_indicator: boolean
  Pitch_high_low_speed_state: boolean
  // ... 扩展其他 PLC 字段
  [key: string]: any
}

// ==================== 013 设备连接状态 ====================
export interface CraneStatus {
  crane_id: string
  crane_status: string
  rcs_no: string
  mode: string
  user_id: string
  login_time: number
  work_num: number
  crane_type: string
  manufacturer: string
}

// ==================== 014 弹窗信息 ====================
export interface NotificationItem {
  id: number
  message: string
  type: number
  remarks_yes: string
  remarks_no: string
  operation_yes: string
  operation_no: string
}

// ==================== 015 服务状态 ====================
export interface ServiceStatus {
  iecs_status: number
  guide_status: number
  control_status: number
  byascan_status: number
  tally_status: number
  secure_status: number
  server_status: number
  guide_service: number
  guide_process: number
}

// ==================== 016 大字提示 ====================
export interface MsgItem {
  message: string
}
