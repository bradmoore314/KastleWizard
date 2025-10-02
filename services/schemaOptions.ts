export const sharedOptionSets = {
  installType: {
    description: "The nature of the equipment installation.",
    options: ["New Install", "Takeover"]
  },
  lockProvider: {
    description: "Who is providing the lock hardware.",
    options: ["Kastle", "3rd Party", "Installed/Existing", "-"]
  },
  monitoringType: {
    description: "The level of monitoring for an access point.",
    options: ["Prop Monitoring", "Alarm Monitoring", "No Monitoring"]
  },
  lockType: {
    description: "The type of lock hardware being used.",
    options: ["-", "Single Standard", "Single Mag", "Double Mag", "Single Delayed Egress", "Double Delayed Egress"]
  },
  readerType: {
    description: "The technology used by the access card reader.",
    options: [
        "EverPresence -Wall Mount",
        "EverPresence -Mullion Mount",
        "EverPresence-Architectural",
        "EverPresence Universal Mullion",
        "EverPresence Universal Wall",
        "EverPresence Universal Architectural",
        "HID Signo",
        "HID Signo w/Keypad",
        "AIO ThinLine (Wave)",
        "AIO Mullion (Wave)",
        "HID PIVClass (Government)",
        "Universal Reader - Mullion",
        "Universal Reader - Wall Mount"
    ]
  },
  interiorPerimeter: {
    description: "Whether the access point is on the interior or perimeter of the building.",
    options: ["Interior", "Perimeter"]
  },
  cameraType: {
    description: "The physical form factor of the camera.",
    options: ["Dome", "Bullet", "Panoramic (180/360)", "PTZ", "Dual-Lens", "Quad-Lens"]
  },
  cameraMountType: {
    description: "How the camera is mounted.",
    options: ["Ceiling", "Wall Pendant/Wall"]
  },
  cameraEnvironment: {
    description: "The operational environment for the camera.",
    options: ["Indoor", "Outdoor", "Indoor/Outdoor"]
  },
  cameraManufacturer: {
    description: "The manufacturer of the camera.",
    options: ["CheckVideo", "Axis", "KastleVideo", "Avigilon"]
  },
  cameraResolution: {
    description: "The resolution of the camera sensor.",
    options: ["1MP", "2MP", "4MP", "5MP", "7MP", "8MP", "9MP"]
  },
  cameraFrameRate: {
    description: "The frames per second captured by the camera.",
    options: ["5fps", "10fps", "15fps", "20fps", "25fps"]
  },
  elevatorType: {
    description: "The primary use of the elevator.",
    options: ["Type A", "Type C", "Type CI", "Type D", "Destination Dispatch"]
  },
  elevatorSystemType: {
    description: "The mechanical system driving the elevator.",
    options: ["Traction", "Hydraulic", "Machine Room-Less", "Pneumatic"]
  },
  elevatorPhoneType: {
    description: "The type of phone inside the elevator cab.",
    options: ["Standard", "Emergency Only", "Hands-Free", "ADA Compliant"]
  },
  elevatorReaderType: {
    description: "The technology used by the access reader inside the elevator.",
    options: ["Standard", "HID Prox", "HID iCLASS SE", "HID iCLASS SEOS", "Kastle Key", "Biometric"]
  },
  intercomType: {
    description: "The primary features of the intercom unit.",
    options: ["Video", "Audio", "Keypad", "Card Reader", "Other"]
  },
  intercomConnectionType: {
    description: "The communication protocol for the intercom.",
    options: ["IP", "Analog", "SIP", "Other"]
  },
  intercomMountingType: {
    description: "How the intercom unit is mounted.",
    options: ["Surface Mount", "Flush Mount", "Pole Mount", "Wall Mount", "Other"]
  },
  turnstileType: {
    description: "The physical and operational type of the turnstile.",
    options: ["Tripod Arm", "Optical (Sliding/Swing Glass)", "Full-Height Rotor", "Swing Gate (ADA)"]
  },
  turnstileDirectionControl: {
    description: "Specifies the allowed direction of passage for the lanes.",
    options: ["Bidirectional", "Entry Only", "Exit Only"]
  },
  turnstileReaderIntegration: {
    description: "How access control readers are mounted or integrated with the turnstile.",
    options: ["Integrated (Built-in)", "Pedestal/External Mount", "None"]
  }
};

export const salesEngineerEmails = [
    'AKomba@kastle.com', 'BLane@kastle.com', 'bmoore@kastle.com', 'BTo@kastle.com', 
    'Eric.Muhlitner@kastle.com', 'Ilya.Dobrydnev@kastle.com', 'Jacob.Wilder@kastle.com', 
    'Jeremy.Thomas@kastle.com', 'John.Young@kastle.com', 'jstine@kastle.com', 
    'KMyers@kastle.com', 'kpurcell@kastle.com', 'Max.Globin@kastle.com', 
    'Osiel.Martinez@kastle.com', 'Patrick.Rose@kastle.com', 'sbromberek@kastle.com', 
    'Tony.Cook@kastle.com'
].sort((a, b) => a.localeCompare(b));