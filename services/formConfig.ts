import { DeviceFormConfig, FormFieldConfig } from '../types';
import { sharedOptionSets } from './schemaOptions';

const floorFieldConfig: FormFieldConfig = { label: 'Floor', icon: '🔢', type: 'number', visible: true };

const accessDoorFields: Record<string, FormFieldConfig> = {
  install_type: { label: 'Install Type', icon: '✨', type: 'select', options: sharedOptionSets.installType.options, visible: true },
  location: { label: 'Location/Name', icon: '📍', type: 'text', visible: true },
  interior_perimeter: { label: 'Interior/Perimeter', icon: '🏢', type: 'select', options: sharedOptionSets.interiorPerimeter.options, visible: true },
  exst_panel_location: { label: 'Existing Panel Location', icon: '📍', type: 'text', visible: true, visibilityCondition: { field: 'install_type', value: 'Takeover' } },
  exst_panel_type: { label: 'Existing Panel Type', icon: '📦', type: 'text', visible: true, visibilityCondition: { field: 'install_type', value: 'Takeover' } },
  exst_reader_type: { label: 'Existing Reader Type', icon: '💳', type: 'text', visible: true, visibilityCondition: { field: 'install_type', value: 'Takeover' } },
  new_panel_location: { label: 'New Panel Location', icon: '📍', type: 'text', visible: true, visibilityCondition: { field: 'install_type', value: 'New Install' } },
  new_panel_type: { label: 'New Panel Type', icon: '📦', type: 'text', visible: true, visibilityCondition: { field: 'install_type', value: 'New Install' } },
  reader_type: { label: 'Reader Type', icon: '💳', type: 'select', options: sharedOptionSets.readerType.options, visible: true },
  lock_type: { label: 'Lock Type', icon: '🔒', type: 'select', options: sharedOptionSets.lockType.options, visible: true },
  monitoring_type: { label: 'Monitoring Type', icon: '👁️', type: 'select', options: sharedOptionSets.monitoringType.options, visible: true },
  floor: floorFieldConfig,
  door_contact: { label: 'Door Contact', icon: '🧲', type: 'component_status', visible: true },
  rex: { label: 'Request to Exit (REX)', icon: '🏃', type: 'component_status', visible: true },
  push_to_exit: { label: 'Push to Exit', icon: '🔘', type: 'component_status', visible: true },
  intercom_buzzer: { label: 'Intercom/Buzzer', icon: '🔊', type: 'component_status', visible: true },
  crash_bar: { label: 'Crash Bar', icon: '💥', type: 'component_status', visible: true },
  lock_provider: { label: 'Lock Provider', icon: '🤝', type: 'select', options: sharedOptionSets.lockProvider.options, visible: true },
  notes: { label: 'Notes', icon: '🗒️', type: 'textarea', visible: true },
};

const cameraFields: Record<string, FormFieldConfig> = {
  install_type: { label: 'Install Type', icon: '✨', type: 'select', options: sharedOptionSets.installType.options, visible: true },
  location: { label: 'Location/Name', icon: '📍', type: 'text', visible: true },
  floor: floorFieldConfig,
  camera_type_new: { label: 'Camera Type', icon: '📷', type: 'select', options: sharedOptionSets.cameraType.options, visible: true },
  mount_type_new: { label: 'Mount Type', icon: '🔩', type: 'select', options: sharedOptionSets.cameraMountType.options, visible: true, visibilityCondition: { field: 'camera_type_new', values: ["Dome", "Panoramic (180/360)"] } },
  environment: { label: 'Environment', icon: '🌳', type: 'select', options: sharedOptionSets.cameraEnvironment.options, visible: true },
  pull_wire: { label: 'Pull Wire?', icon: '🔌', type: 'boolean', visible: true, visibilityCondition: { field: 'install_type', value: 'New Install' } },
  manufacturer: { label: 'Manufacturer', icon: '🏭', type: 'select', options: sharedOptionSets.cameraManufacturer.options, visible: true },
  resolution: { label: 'Resolution', icon: '🔎', type: 'select', options: sharedOptionSets.cameraResolution.options, visible: true },
  frame_rate: { label: 'Frame Rate', icon: '🎞️', type: 'select', options: sharedOptionSets.cameraFrameRate.options, visible: true },
  ip_address: { label: 'IP Address', icon: '💻', type: 'text', visible: true },
  mounting_height: { label: 'Mounting Height', icon: '📏', type: 'text', visible: true },
  username: { label: 'Username', icon: '👤', type: 'text', visible: true },
  password: { label: 'Password', icon: '🔑', type: 'password', visible: true },
  import_to_gateway: { label: 'Import to Gateway', icon: '📥', type: 'boolean', visible: true },
  onvif_compliant: { label: 'ONVIF Compliant', icon: '🌐', type: 'boolean', visible: true, visibilityCondition: { field: 'install_type', value: 'Takeover' } },
  camera_working: { label: 'Camera Working?', icon: '✅', type: 'boolean', visible: true, visibilityCondition: { field: 'install_type', value: 'Takeover' } },
  h264_compliant: { label: 'H.264 Compliant?', icon: '📹', type: 'boolean', visible: true, visibilityCondition: { field: 'install_type', value: 'Takeover' } },
  camera_verified: { label: 'Camera Verified?', icon: '🕵️', type: 'boolean', visible: true },
  fieldOfViewAngle: { label: 'FOV Angle (°)', icon: '📐', type: 'number', visible: true },
  fieldOfViewDistance: { label: 'FOV Distance (ft)', icon: '📏', type: 'number', visible: true },
  notes: { label: 'Notes', icon: '🗒️', type: 'textarea', visible: true },
};

const elevatorFields: Record<string, FormFieldConfig> = {
    location: { label: 'Location', icon: '📍', type: 'text', visible: true },
    floor: floorFieldConfig,
    elevator_type: { label: 'Elevator Type', icon: '↕️', type: 'select', options: sharedOptionSets.elevatorType.options, visible: true },
    floor_count: { label: 'Floor Count', icon: '🔢', type: 'number', visible: true },
    bank_name: { label: 'Bank Name', icon: '🏦', type: 'text', visible: true },
    management_company: { label: 'Management Company', icon: '🏢', type: 'text', visible: true },
    management_contact_person: { label: 'Management Contact', icon: '🧑‍💼', type: 'text', visible: true },
    management_phone_number: { label: 'Management Phone', icon: '📞', type: 'text', visible: true },
    elevator_company: { label: 'Elevator Company', icon: '🤝', type: 'text', visible: true },
    elevator_contact_person: { label: 'Elevator Contact', icon: '👷', type: 'text', visible: true },
    elevator_phone_number: { label: 'Elevator Contact Phone', icon: '📞', type: 'text', visible: true },
    elevator_system_type: { label: 'System Type', icon: '⚙️', type: 'select', options: sharedOptionSets.elevatorSystemType.options, visible: true },
    elevator_phone_type: { label: 'Cab Phone Type', icon: '☎️', type: 'select', options: sharedOptionSets.elevatorPhoneType.options, visible: true },
    reader_type: { label: 'Reader Type', icon: '💳', type: 'select', options: sharedOptionSets.elevatorReaderType.options, visible: true },
    secured_floors: { label: 'Secured Floors', icon: '🔐', type: 'text', visible: true },
    visitor_processing: { label: 'Visitor Processing', icon: '🚶', type: 'textarea', visible: true },
    rear_hall_calls: { label: 'Rear Hall Calls?', icon: '🔔', type: 'boolean', visible: true },
    rear_hall_control: { label: 'Rear Hall Control?', icon: '🎛️', type: 'boolean', visible: true },
    reader_mounting_surface_ferrous: { label: 'Reader Mounting Surface Ferrous?', icon: '🧲', type: 'boolean', visible: true },
    flush_mount_required: { label: 'Flush Mount Required?', icon: '🧱', type: 'boolean', visible: true },
    elevator_phones_for_visitors: { label: 'Cab Phones for Visitors?', icon: '🗣️', type: 'boolean', visible: true },
    engineer_override_key_switch: { label: 'Engineer Override Key Switch?', icon: '🔑', type: 'boolean', visible: true },
    notes: { label: 'Notes', icon: '🗒️', type: 'textarea', visible: true },
};

const intercomFields: Record<string, FormFieldConfig> = {
  location: { label: 'Location/Name', icon: '📍', type: 'text', visible: true },
  floor: floorFieldConfig,
  intercom_type: { label: 'Intercom Type', icon: '🎙️', type: 'select', options: sharedOptionSets.intercomType.options, visible: true },
  connection_type: { label: 'Connection Type', icon: '🔌', type: 'select', options: sharedOptionSets.intercomConnectionType.options, visible: true },
  mounting_type: { label: 'Mounting Type', icon: '🔩', type: 'select', options: sharedOptionSets.intercomMountingType.options, visible: true },
  notes: { label: 'Notes', icon: '🗒️', type: 'textarea', visible: true },
};

const turnstileFields: Record<string, FormFieldConfig> = {
    location: { label: 'Location/Name', icon: '📍', type: 'text', visible: true },
    floor: floorFieldConfig,
    turnstile_type: { label: 'Turnstile Type', icon: '🔄', type: 'select', options: sharedOptionSets.turnstileType.options, visible: true },
    lane_count: { label: 'Number of Lanes', icon: '🔢', type: 'number', visible: true },
    direction_control: { label: 'Direction Control', icon: '↔️', type: 'select', options: sharedOptionSets.turnstileDirectionControl.options, visible: true },
    is_ada_lane: { label: 'ADA Compliant Lane?', icon: '♿', type: 'boolean', visible: true },
    passage_width_inches: { label: 'Passage Width (Inches)', icon: '📏', type: 'number', visible: true, visibilityCondition: { field: 'is_ada_lane', value: true } },
    reader_integration: { label: 'Reader Integration', icon: '🧩', type: 'select', options: sharedOptionSets.turnstileReaderIntegration.options, visible: true },
    reader_type: { label: 'Reader Type', icon: '💳', type: 'select', options: sharedOptionSets.readerType.options, visible: true, visibilityCondition: { field: 'reader_integration', operator: 'not_equals', value: 'None' } },
    fire_safety_release: { label: 'Fire Safety Release', icon: '🔥', type: 'boolean', visible: true },
    finish_material: { label: 'Finish / Material', icon: '🎨', type: 'text', visible: true },
    throughput_per_minute: { label: 'Throughput (People/Min)', icon: '🏃‍♂️', type: 'number', visible: true },
    power_requirements: { label: 'Power Requirements', icon: '⚡', type: 'text', visible: true },
    notes: { label: 'Notes', icon: '🗒️', type: 'textarea', visible: true },
};

const miscellaneousFields: Record<string, FormFieldConfig> = {
    location: { label: 'Equipment Name/Location', icon: '📍', type: 'text', visible: true },
    floor: floorFieldConfig,
    notes: { label: 'Notes', icon: '🗒️', type: 'textarea', visible: true },
    // custom_fields are handled dynamically in the component
};

export const defaultFormConfig: DeviceFormConfig = {
  'access-door': {
    fields: accessDoorFields,
    fieldOrder: [
      "location",
      "floor",
      "install_type",
      "interior_perimeter",
      "lock_provider",
      "monitoring_type",
      "exst_panel_location",
      "exst_panel_type",
      "exst_reader_type",
      "lock_type",
      "reader_type",
      "door_contact",
      "rex",
      "push_to_exit",
      "intercom_buzzer",
      "crash_bar",
      "new_panel_location",
      "new_panel_type",
      "notes"
    ],
  },
  'camera': {
    fields: cameraFields,
    fieldOrder: [
      "location",
      "floor",
      "install_type",
      "camera_type_new",
      "mount_type_new",
      "environment",
      "pull_wire",
      "manufacturer",
      "resolution",
      "frame_rate",
      "ip_address",
      "mounting_height",
      "username",
      "password",
      "camera_working",
      "import_to_gateway",
      "onvif_compliant",
      "h264_compliant",
      "camera_verified",
      "fieldOfViewAngle",
      "fieldOfViewDistance",
      "notes"
    ],
  },
  'elevator': {
    fields: elevatorFields,
    fieldOrder: [
        "location",
        "floor",
        "elevator_type",
        "floor_count",
        "bank_name",
        "management_company",
        "management_contact_person",
        "management_phone_number",
        "elevator_company",
        "elevator_contact_person",
        "elevator_phone_number",
        "elevator_system_type",
        "elevator_phone_type",
        "reader_type",
        "secured_floors",
        "visitor_processing",
        "rear_hall_calls",
        "rear_hall_control",
        "reader_mounting_surface_ferrous",
        "flush_mount_required",
        "elevator_phones_for_visitors",
        "engineer_override_key_switch",
        "notes"
    ]
  },
  'intercom': {
    fields: intercomFields,
    fieldOrder: [
      "location",
      "floor",
      "intercom_type",
      "connection_type",
      "mounting_type",
      "notes"
    ],
  },
  'turnstile': {
    fields: turnstileFields,
    fieldOrder: [
        "location",
        "floor",
        "turnstile_type",
        "lane_count",
        "direction_control",
        "is_ada_lane",
        "passage_width_inches",
        "reader_integration",
        "reader_type",
        "fire_safety_release",
        "finish_material",
        "throughput_per_minute",
        "power_requirements",
        "notes"
    ]
  },
  'miscellaneous': {
    fields: miscellaneousFields,
    fieldOrder: [
      "location",
      "floor",
      "notes",
    ],
  }
};