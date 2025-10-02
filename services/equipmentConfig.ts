
import React from 'react';
import { DeviceType } from '../types';
import {
    AccessDoorIcon,
    CameraIcon,
    ElevatorIcon,
    IntercomIcon,
    TurnstileIcon,
    AcHeadendIcon,
    VideoGatewayIcon,
    UbiquitiWirelessIcon,
    PanicButtonIcon,
    ViewingStationIcon,
    ExistingNvrIcon,
    ExistingPanelIcon,
    SwitchIcon,
    PackageIcon,
    PointToPointIcon,
    SpeakerIcon,
} from '../components/Icons';

export interface EquipmentConfig {
    label: string;
    IconComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    type: 'device' | 'marker';
    color: string; // Tailwind class for UI
    pdfColor: string; // Hex color for PDF
    pdfInitials: string;
}

export const EQUIPMENT_CONFIG: Record<string, EquipmentConfig> = {
    // Devices
    'access-door-interior': { label: 'Interior Door', IconComponent: AccessDoorIcon, type: 'device', color: 'text-primary-500', pdfColor: '#ef4444', pdfInitials: 'CR' },
    'access-door-perimeter': { label: 'Perimeter Door', IconComponent: AccessDoorIcon, type: 'device', color: 'text-red-700', pdfColor: '#b91c1c', pdfInitials: 'CR' },
    'camera-indoor': { label: 'Indoor Camera', IconComponent: CameraIcon, type: 'device', color: 'text-blue-500', pdfColor: '#3b82f6', pdfInitials: 'CAM' },
    'camera-outdoor': { label: 'Outdoor Camera', IconComponent: CameraIcon, type: 'device', color: 'text-teal-500', pdfColor: '#14b8a6', pdfInitials: 'CAM' },
    'elevator': { label: 'Elevator', IconComponent: ElevatorIcon, type: 'device', color: 'text-green-500', pdfColor: '#22c55e', pdfInitials: 'EL' },
    'intercom': { label: 'Intercom', IconComponent: IntercomIcon, type: 'device', color: 'text-violet-500', pdfColor: '#8b5cf6', pdfInitials: 'IC' },
    'turnstile': { label: 'Turnstile', IconComponent: TurnstileIcon, type: 'device', color: 'text-orange-500', pdfColor: '#f97316', pdfInitials: 'TS' },
    'miscellaneous': { label: 'Miscellaneous', IconComponent: PackageIcon, type: 'device', color: 'text-gray-400', pdfColor: '#9ca3af', pdfInitials: 'MISC' },
    
    // Markers
    'ac-headend': { label: 'AC Headend', IconComponent: AcHeadendIcon, type: 'marker', color: 'text-red-800', pdfColor: '#991b1b', pdfInitials: 'AC' },
    'video-gateway': { label: 'Video Gateway', IconComponent: VideoGatewayIcon, type: 'marker', color: 'text-indigo-700', pdfColor: '#4338ca', pdfInitials: 'VG' },
    'ubiquiti-wireless': { label: 'Ubiquiti Wireless', IconComponent: UbiquitiWirelessIcon, type: 'marker', color: 'text-teal-400', pdfColor: '#2dd4bf', pdfInitials: 'W' },
    'panic-button': { label: 'Panic Button', IconComponent: PanicButtonIcon, type: 'marker', color: 'text-amber-400', pdfColor: '#facc15', pdfInitials: 'PB' },
    'viewing-station': { label: 'Viewing Station', IconComponent: ViewingStationIcon, type: 'marker', color: 'text-indigo-400', pdfColor: '#818cf8', pdfInitials: 'VS' },
    'existing-nvr': { label: 'Existing NVR', IconComponent: ExistingNvrIcon, type: 'marker', color: 'text-purple-400', pdfColor: '#c084fc', pdfInitials: 'NVR' },
    'existing-panel': { label: 'Existing Panel', IconComponent: ExistingPanelIcon, type: 'marker', color: 'text-fuchsia-400', pdfColor: '#e879f9', pdfInitials: 'PNL' },
    'switch': { label: 'Switch', IconComponent: SwitchIcon, type: 'marker', color: 'text-pink-400', pdfColor: '#f472b6', pdfInitials: 'SW' },
    'point-to-point': { label: 'Point to Point', IconComponent: PointToPointIcon, type: 'marker', color: 'text-cyan-400', pdfColor: '#22d3ee', pdfInitials: 'P2P' },
    'speaker': { label: 'Speaker', IconComponent: SpeakerIcon, type: 'marker', color: 'text-lime-400', pdfColor: '#a3e635', pdfInitials: 'SPK' },
};

export const DEVICE_TYPE_TITLES: Record<DeviceType, string> = {
  'access-door': 'Access Points',
  'camera': 'Cameras',
  'elevator': 'Elevators',
  'intercom': 'Intercoms',
  'turnstile': 'Turnstiles',
  'miscellaneous': 'Miscellaneous Equipment',
};
