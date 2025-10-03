// Type definitions for the File System Access API.
// This is to provide type information for browser APIs that are not yet part of the default TypeScript libraries.
declare global {
  interface Window {
    showDirectoryPicker?(options?: any): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
    queryPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    createWritable(options?: any): Promise<any>;
    getFile(): Promise<File>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    getFileHandle(name: string, options?: { create?: boolean; }): Promise<FileSystemFileHandle>;
    values(): AsyncIterable<FileSystemHandle>;
  }
}


export type Tool = 'select' | 'pan' | 'text' | 'draw' | 'rectangle' | 'conduit' | 'place-item';

export type DeviceType = 'access-door' | 'camera' | 'elevator' | 'intercom' | 'turnstile' | 'miscellaneous';
export type MarkerType = 'ac-headend' | 'video-gateway' | 'ubiquiti-wireless' | 'panic-button' | 'viewing-station' | 'existing-nvr' | 'existing-panel' | 'switch' | 'point-to-point' | 'speaker';
export type EquipmentType = DeviceType | MarkerType;

export type BorderStyle = 'solid' | 'dotted' | 'dashed' | 'cloud';

export interface BaseEdit {
  id: string; // Corresponds to localId in the schema
  pageIndex: number; // 0-based
  x: number; // position in PDF points
  y: number; // position in PDF points
  width: number;
  height: number;
  rotation: number;
}

export interface TextEdit extends BaseEdit {
  type: 'text';
  text: string;
  fontSize: number;
  color: [number, number, number]; // RGB, 0-1
  lineHeight: number;
  fontFamily: string;
  borderColor?: string; // hex color #RRGGBB
  borderWidth?: number;
  borderStyle?: BorderStyle;
  fillColor?: string; // hex color #RRGGBB
  fillOpacity?: number; // 0-1
  padding?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface DrawingEdit extends BaseEdit {
  type: 'draw';
  path: string; // SVG path data 'M x y L x y ...' in relative PDF points
  color: string; // hex color #RRGGBB
  strokeWidth: number;
  originalWidth: number;
  originalHeight: number;
}

export interface RectangleEdit extends BaseEdit {
  type: 'rectangle';
  color: string; // hex color for stroke #RRGGBB
  strokeWidth: number;
  fillColor: string; // hex color for fill #RRGGBB
  fillOpacity: number; // 0-1
}

export interface ConduitEdit extends BaseEdit {
    type: 'conduit';
    color: string;
    strokeWidth: number;
}

// Based on schema `EquipmentImage`
export interface EquipmentImage {
    id: number; // server ID
    localId: string; // client-side UUID
    image_url?: string; // DEPRECATED: Should not be populated. URL is generated from blob in IndexedDB. Kept for migration.
    createdAt: string; // ISO string date
    name?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

// Based on schema `AccessPoint`
// Component status for existing vs. future components
export interface ComponentStatus {
  hasComponent: boolean; // Whether the component exists/will exist
  isExisting: boolean;   // true = existing, false = future installation
}

export interface AccessDoorData {
  location: string;
  notes?: string;
  images?: EquipmentImage[];
  color?: string; // hex color #RRGGBB

  install_type: string;
  exst_panel_location?: string;
  exst_panel_type?: string;
  exst_reader_type?: string;
  new_panel_location?: string;
  new_panel_type?: string;
  reader_type: string;
  lock_type: string;
  monitoring_type: string;
  floor?: number;
  
  // Legacy boolean fields (maintained for backward compatibility)
  door_contact: boolean;
  rex: boolean;
  push_to_exit: boolean;
  intercom_buzzer: boolean;
  crash_bar: boolean;
  
  // New component status fields (optional for backward compatibility)
  door_contact_status?: ComponentStatus;
  rex_status?: ComponentStatus;
  push_to_exit_status?: ComponentStatus;
  intercom_buzzer_status?: ComponentStatus;
  crash_bar_status?: ComponentStatus;
  
  lock_provider?: string;
  interior_perimeter: string; // Custom field, not in schema, but used for icon
}

// Based on schema `Camera`
export interface CameraData {
  location: string;
  notes?: string;
  images?: EquipmentImage[];
  color?: string; // hex color #RRGGBB

  install_type: string;
  camera_type_new: string;
  mount_type_new?: string;
  environment: string;
  floor?: number;
  pull_wire?: boolean;
  manufacturer?: string;
  resolution?: string;
  frame_rate?: string;
  ip_address?: string;
  mounting_height?: string;
  username?: string;
  password?: string;
  import_to_gateway: boolean;
  onvif_compliant: boolean;
  camera_working: boolean;
  h264_compliant?: boolean;
  camera_verified?: boolean;
  fieldOfViewAngle?: number;
  fieldOfViewDistance?: number;
  fieldOfViewRotation?: number;
}

// Based on schema `Elevator`
export interface ElevatorData {
  location: string;
  notes?: string;
  images?: EquipmentImage[];
  color?: string; // hex color #RRGGBB

  elevator_type: string;
  floor?: number;
  floor_count?: number;
  bank_name?: string;
  management_company?: string;
  management_contact_person?: string;
  management_phone_number?: string;
  elevator_company?: string;
  elevator_contact_person?: string;
  elevator_phone_number?: string;
  elevator_system_type?: string;
  elevator_phone_type?: string;
  reader_type?: string;
  secured_floors?: string;
  visitor_processing?: string;
  rear_hall_calls: boolean;
  rear_hall_control: boolean;
  reader_mounting_surface_ferrous: boolean;
  flush_mount_required: boolean;
  elevator_phones_for_visitors: boolean;
  engineer_override_key_switch: boolean;
}

// Based on schema `Intercom`
export interface IntercomData {
  location: string;
  notes?: string;
  images?: EquipmentImage[];
  color?: string; // hex color #RRGGBB
  
  intercom_type: string;
  connection_type: string;
  mounting_type?: string;
  floor?: number;
}

// Based on schema `Turnstile`
export interface TurnstileData {
  location: string;
  notes?: string;
  images?: EquipmentImage[];
  color?: string; // hex color #RRGGBB

  turnstile_type: string;
  lane_count: number;
  direction_control: string;
  is_ada_lane: boolean;
  passage_width_inches?: number;
  reader_integration: string;
  reader_type?: string;
  fire_safety_release: boolean;
  finish_material?: string;
  throughput_per_minute?: number;
  power_requirements?: string;
  floor?: number;
}

export interface CustomField {
    id: string;
    label: string;
    value: string;
}

export interface MiscellaneousData {
  location: string;
  notes?: string;
  images?: EquipmentImage[];
  custom_fields: CustomField[];
  color?: string; // hex color #RRGGBB
  floor?: number;
}

// This is a union of all possible device data structures
export type DeviceData = AccessDoorData | CameraData | ElevatorData | IntercomData | TurnstileData | MiscellaneousData;
export type PartialDeviceData = Partial<AccessDoorData> | Partial<CameraData> | Partial<ElevatorData> | Partial<IntercomData> | Partial<TurnstileData> | Partial<MiscellaneousData>;


export interface DeviceEdit extends BaseEdit {
  type: 'device';
  deviceType: DeviceType;
  data: DeviceData;
}

export interface MarkerData {
  label: string;
  notes?: string;
  images?: EquipmentImage[];
  color?: string; // hex color #RRGGBB
  floor?: number;
}

export interface MarkerEdit extends BaseEdit {
  type: 'marker';
  markerType: MarkerType;
  data: MarkerData;
}


export type AnyEdit = TextEdit | DrawingEdit | RectangleEdit | DeviceEdit | ConduitEdit | MarkerEdit;

// FIX: Add missing type definitions
// Command pattern for undo/redo
export type Command =
    | { type: 'UPDATE_EDITS'; payload: { previous: AnyEdit[], current: AnyEdit[], floorplanId: string } }
    | { type: 'REORDER_EDITS'; payload: { previousInventory: AnyEdit[], currentInventory: AnyEdit[], floorplanId: string } };

// AI Assistant chat message
export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// Device form configuration
export interface FormFieldConfig {
    label: string;
    icon: string;
    type: 'text' | 'select' | 'boolean' | 'textarea' | 'number' | 'password' | 'component_status';
    // FIX: Changed from `readonly string[]` to `string[]` to allow modification in admin mode.
    options?: string[];
    visible: boolean;
    visibilityCondition?: {
        field: string;
        value?: any;
        values?: any[];
        operator?: 'not_equals';
    };
}

export interface DeviceTypeFormConfig {
    fields: Record<string, FormFieldConfig>;
    fieldOrder: string[];
}

export type DeviceFormConfig = Record<DeviceType, DeviceTypeFormConfig>;


// Gateway Calculator types
export interface StreamCamera {
    id: string;
    name: string;
    lensCount: number;
    streamingResolution: number;
    recordingResolution: number;
    isRecordingResSameAsStreaming: boolean;
    frameRate: number;
    storageDays: number;
    camera_type?: string;
    mounting_type?: string;
    notes?: string;
}

export interface Stream {
    id: string;
    cameraId: string;
    name: string;
    throughput: number;
    storage: number;
}

export interface Gateway {
    id: number;
    type: '8ch' | '16ch';
    assignedStreams: Stream[];
}

// FIX: Define GatewayConfiguration for use in calculator state and reducer.
export interface GatewayConfiguration {
    cameras: StreamCamera[];
    selectedGatewayType: '8ch' | '16ch';
    gatewayCount: number;
    gateways: Gateway[];
    unassignedStreams: Stream[];
}

// FIX: Update GatewayCalculation to extend GatewayConfiguration for consistency.
export interface GatewayCalculation extends GatewayConfiguration {
    id: string;
    name: string;
}

export interface PartnerBudgetCalculation {
    kastleLaborHours: number;
    partnerLaborHours: number;
    kastleLaborCost: number;
    partnerBudget: number;
    partnerGets: number;
    lodgingNights: number;
    mealsNights: number;
    lodgingCost: number;
    mealsCost: number;
    totalTEE: number;
    deviceBreakdown: Record<string, number>;
    calculatedAt: string;
}

export interface TEECalculation {
    totalLaborHours: number;
    lodgingPerDiem: number;
    mealsPerDiem: number;
    totalWeeks: number;
    totalNightsTEE: number;
    lodgingNights: number;
    mealsNights: number;
    lodgingCost: number;
    mealsCost: number;
    totalTEE: number;
    calculatedAt: string;
}

// Conduit Calculator types
export interface ConduitCalculation {
    id: string;
    name: string;
    length: number;
    bends: number;
    conduitType: string;
    conduitSize: string;
    environment: string;
    laborRate: number;
}

// Labor Calculator types
export interface LaborCalculation {
    id: string;
    name: string;
    quantities: { [key: string]: number };
    laborRates: { [key: string]: number };
}


// Elevator Letter Drafter types
export interface CarEntry {
    id: number;
    name: string;
    hasReader: 'Yes' | 'No';
    floorsServed: string;
    securedFloors: string;
}

export interface ElevatorLetterFormData {
    date: string;
    bldgNumber: string;
    projectAddress: string;
    projManager: string;
    bankNames: string;
    thisBankName: string;
    mgmtCo: string;
    mgmtContact: string;
    mgmtPhone: string;
    elevCo: string;
    elevContact: string;
    elevPhone: string;
    systemType: 'A' | 'C' | 'D' | 'CI' | '';
    takeover: boolean;
    securedFloorsA: string;
    rearHallCalls: 'Yes' | 'No';
    phonesNextToReaders: 'Yes' | 'No';
    readerType: 'Prox' | 'Swipe' | 'IK' | 'IC';
    flushMount: 'Surface' | 'Recessed';
    ferrousSurface: 'Yes' | 'No';
    visitorProcessing: 'None' | 'KFO' | 'KOC';
    eorLocation: string;
    freightOperatesInGroup: 'Yes' | 'No';
    freightCarNumber: string;
    freightHomeFloor: string;
    freightSecure: 'None' | 'KeyOnly' | 'ReaderKey' | 'Shutdown';
    cars: CarEntry[];
}

export interface Floorplan {
  id: string;
  name: string;
  pdfFileName?: string;
  imageFileName?: string;
  pdfFile?: File; // Transient, not stored in localStorage
  imageFile?: File; // Transient, not stored in localStorage
  inventory: AnyEdit[];
  placedEditIds: string[];
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    description: string;
    details?: Record<string, any>;
}

export interface Project {
  id: string;
  server_id?: number;
  name: string;
  client?: string;
  site_address?: string;
  se_name?: string;
  bdm_name?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  floorplans: Floorplan[];
  projectLevelInventory: AnyEdit[];
  checklistAnswers: Record<string, any>;
  analysis_result?: string;
  gatewayCalculations: GatewayCalculation[];
  conduitCalculations: ConduitCalculation[];
  laborCalculations: LaborCalculation[];
  partnerBudget?: PartnerBudgetCalculation;
  teeCalculations?: TEECalculation;
  elevator_letter_content?: string;
  elevatorLetterFormData?: ElevatorLetterFormData;
  auditLog: AuditLogEntry[];
}

export interface ChecklistQuestion {
    id: string;
    text: string;
    categoryKey: string;
    // FIX: Changed from `readonly string[]` to `string[]`.
    options?: string[];
    assignedTo: string;
    branchingCondition?: {
        questionId: string;
        value: any;
    };
    derivation?: (project: Project) => any;
}

export interface ChecklistCategory {
    key: string;
    title: string;
    icon: string;
}