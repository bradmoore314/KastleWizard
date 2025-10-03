

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DeviceEdit, DeviceType, DeviceData, DeviceTypeFormConfig, FormFieldConfig, EquipmentImage, DeviceFormConfig, CustomField, MiscellaneousData } from '../types';
import { Trash2, PlusCircle, EyeIcon, EyeOffIcon, Plus, GripVerticalIcon, ChevronDown, Camera as CameraIcon, UploadCloud, Palette } from 'lucide-react';
import { CloseIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { toast } from 'react-hot-toast';
import ImageWithFallback from './ImageWithFallback';
import CameraCapture from './CameraCapture';

interface DeviceFormProps {
  devices: Partial<DeviceEdit> | Partial<DeviceEdit>[];
  onClose: () => void;
  isCreating: boolean;
  onImagesAdded: (deviceId: string, files: FileList) => void;
  onViewImage: (imageLocalId: string) => void;
  isAdminMode: boolean;
}

const TITLES: Record<DeviceType, string> = {
    'access-door': 'Access Point Details',
    'camera': 'Camera Details',
    'elevator': 'Elevator Details',
    'intercom': 'Intercom Details',
    'turnstile': 'Turnstile Details',
    'miscellaneous': 'Miscellaneous Equipment',
};

const DeviceForm: React.FC<DeviceFormProps> = ({ devices, onClose, isCreating, onImagesAdded, onViewImage, isAdminMode }) => {
  const { formConfig } = useAppState();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const modalRef = useFocusTrap<HTMLDivElement>(!isCameraCaptureOpen);

  const isBulkEdit = Array.isArray(devices);
  const deviceList = useMemo(() => isBulkEdit ? devices : [devices], [devices, isBulkEdit]);
  const deviceType = deviceList[0]?.deviceType;

  const deviceIdsKey = useMemo(() => deviceList.map(d => d.id).join(','), [deviceList]);

  useEffect(() => {
    if (!deviceList.length || !deviceType) return;

    let initialData: Record<string, any> = {};

    if (isBulkEdit) {
        const firstDeviceData = deviceList[0].data as DeviceData;
        for (const key in firstDeviceData) {
            if (Object.prototype.hasOwnProperty.call(firstDeviceData, key)) {
                const firstValue = (firstDeviceData as any)[key];
                const allSame = deviceList.slice(1).every(d => 
                    JSON.stringify((d.data as any)[key]) === JSON.stringify(firstValue)
                );

                if (allSame) {
                    (initialData as any)[key] = firstValue;
                }
            }
        }
    } else {
        initialData = { ...deviceList[0].data };
    }
    
    setFormData(initialData);
    setChangedFields(new Set());
    setShowAdvanced(false); // Reset advanced view on device change
  }, [deviceIdsKey, isBulkEdit, deviceList, deviceType]);


  useEffect(() => {
    if (isBulkEdit || !devices || Array.isArray(devices)) return;
    const deviceImages = (devices as Partial<DeviceEdit>).data?.images;
    setFormData(currentData => {
        if (JSON.stringify(currentData.images) !== JSON.stringify(deviceImages)) {
            return { ...currentData, images: deviceImages };
        }
        return currentData;
    });
  }, [devices, isBulkEdit]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (name: string, value: any) => {
    const newFormData = { ...formData, [name]: value };
    const newChangedFields = new Set(changedFields).add(name);

    if (name === 'lock_type' && typeof value === 'string' && value.toLowerCase().includes('mag')) {
        newFormData.rex = true;
        newChangedFields.add('rex');
    }
    
    // Auto-update FOV based on environment change for cameras
    if (name === 'environment' && deviceType === 'camera') {
        if (value === 'Outdoor') {
            newFormData.fieldOfViewAngle = 90;
            newFormData.fieldOfViewDistance = 100;
        } else { // Handles Indoor and Indoor/Outdoor
            newFormData.fieldOfViewAngle = 110;
            newFormData.fieldOfViewDistance = 50;
        }
        newChangedFields.add('fieldOfViewAngle');
        newChangedFields.add('fieldOfViewDistance');
    }
    
    setFormData(newFormData);
    setChangedFields(newChangedFields);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(formData).length === 0 && !isCreating) {
        onClose();
        return;
    }

    if (isBulkEdit) {
        const dataToUpdate: Partial<DeviceData> = {};
        changedFields.forEach(field => {
            const config = deviceConfig.fields[field];
            let value = formData[field];
            if (config?.type === 'number') {
                const num = Number(value);
                (dataToUpdate as any)[field] = isNaN(num) ? undefined : num;
            } else {
                (dataToUpdate as any)[field] = value;
            }
        });
        // Make sure color is included if it was changed
        if (changedFields.has('color')) {
            (dataToUpdate as any).color = formData.color;
        }
        
        const deviceIds = deviceList.map(d => d.id!);
        dispatch({ type: 'UPDATE_MULTIPLE_DEVICE_DATA', payload: { deviceIds, data: dataToUpdate } });
        toast.success(`${deviceIds.length} devices updated!`);
    } else {
        const finalData = { ...deviceList[0].data, ...formData };
        Object.keys(finalData).forEach(key => {
            const config = deviceConfig.fields[key];
            if (config?.type === 'number') {
                const num = Number(finalData[key]);
                finalData[key] = isNaN(num) ? undefined : num;
            }
        });

        const deviceId = deviceList[0].id!;
        dispatch({ type: 'UPDATE_DEVICE_DATA', payload: { deviceId, data: finalData as DeviceData } });
        toast.success("Device details saved!");
    }
    onClose();
  };


  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0 && deviceList[0].id) {
          onImagesAdded(deviceList[0].id, e.target.files);
      }
      e.target.value = ''; // Reset input to allow re-selecting the same file
  };

  const handlePhotosTaken = (files: File[]) => {
    setIsCameraCaptureOpen(false);
    if (files.length > 0 && deviceList[0].id) {
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        onImagesAdded(deviceList[0].id, dataTransfer.files);
    }
  }
  
  const onImageDeleted = (deviceId: string, imageLocalId: string) => {
      dispatch({ type: 'DELETE_IMAGE_FROM_DEVICE', payload: { deviceId, imageLocalId } });
      setFormData(prev => ({
          ...prev,
          images: prev.images?.filter((img: EquipmentImage) => img.localId !== imageLocalId)
      }));
  }

  const handleCustomFieldChange = (index: number, field: 'label' | 'value', value: string) => {
      const currentFields = (formData as any).custom_fields || [];
      const newCustomFields = [...currentFields];
      newCustomFields[index] = { ...newCustomFields[index], [field]: value };
      handleChange('custom_fields', newCustomFields);
  };

  const handleAddCustomField = () => {
      const newField = { id: crypto.randomUUID(), label: '', value: '' };
      const currentFields = (formData as any).custom_fields || [];
      const newCustomFields = [...currentFields, newField];
      handleChange('custom_fields', newCustomFields);
  };

  const handleRemoveCustomField = (id: string) => {
      const currentFields = (formData as any).custom_fields || [];
      const newCustomFields = currentFields.filter((f: CustomField) => f.id !== id);
      handleChange('custom_fields', newCustomFields);
  };

  const handleAdminUpdate = (updater: (config: DeviceFormConfig) => DeviceFormConfig) => {
      const newConfig = updater(JSON.parse(JSON.stringify(formConfig)));
      dispatch({ type: 'SET_FORM_CONFIG', payload: newConfig });
  };
  
  const handleVisibilityToggle = (fieldKey: string) => {
      if (!deviceType) return;
      handleAdminUpdate(config => {
          config[deviceType].fields[fieldKey].visible = !config[deviceType].fields[fieldKey].visible;
          return config;
      });
  };

  const handleAddOption = (fieldKey: string) => {
      if (!deviceType) return;
      const newOption = newOptionValues[fieldKey]?.trim();
      if (!newOption) return;

      handleAdminUpdate(config => {
          const field = config[deviceType!].fields[fieldKey];
          if (!field.options) field.options = [];
          if (!field.options.includes(newOption)) {
              field.options = [...(field.options || []), newOption];
          }
          return config;
      });
      setNewOptionValues(prev => ({ ...prev, [fieldKey]: '' }));
  };
  
  const handleRemoveOption = (fieldKey: string, optionToRemove: string) => {
      if (!deviceType) return;
      handleAdminUpdate(config => {
          const field = config[deviceType!].fields[fieldKey];
          field.options = field.options?.filter(opt => opt !== optionToRemove);
          return config;
      });
  };

  const handleDragStart = (e: React.DragEvent, fieldKey: string) => {
    setDraggedItem(fieldKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fieldKey);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetItemKey: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetItemKey || !deviceType) return;

    handleAdminUpdate(config => {
        const deviceConf: DeviceTypeFormConfig = config[deviceType!];
        const draggedIndex = deviceConf.fieldOrder.indexOf(draggedItem);
        const targetIndex = deviceConf.fieldOrder.indexOf(targetItemKey);
        if (draggedIndex === -1 || targetIndex === -1) return config;
        
        const [removed] = deviceConf.fieldOrder.splice(draggedIndex, 1);
        deviceConf.fieldOrder.splice(targetIndex, 0, removed);
        return config;
    });
    setDraggedItem(null);
  };

  const advancedAccessDoorFields = useMemo(() => new Set([
    'reader_type',
    'door_contact',
    'rex',
    'push_to_exit',
    'intercom_buzzer',
    'crash_bar',
    'new_panel_location',
    'new_panel_type',
  ]), []);

  const advancedCameraFields = useMemo(() => new Set([
      'manufacturer',
      'resolution',
      'frame_rate',
      'ip_address',
      'mounting_height',
      'username',
      'password',
      'camera_working',
      'import_to_gateway',
      'camera_verified',
      'onvif_compliant',
      'h264_compliant',
      'fieldOfViewAngle',
      'fieldOfViewDistance',
  ]), []);
  
  const advancedElevatorFields = useMemo(() => new Set([
    'management_company',
    'management_contact_person',
    'management_phone_number',
    'elevator_company',
    'elevator_contact_person',
    'elevator_phone_number',
    'elevator_system_type',
    'elevator_phone_type',
    'reader_type',
    'secured_floors',
    'visitor_processing',
    'rear_hall_calls',
    'rear_hall_control',
    'reader_mounting_surface_ferrous',
    'flush_mount_required',
    'elevator_phones_for_visitors',
    'engineer_override_key_switch',
  ]), []);

  const advancedTurnstileFields = useMemo(() => new Set([
    'direction_control',
    'is_ada_lane',
    'passage_width_inches',
    'reader_integration',
    'reader_type',
    'fire_safety_release',
    'finish_material',
    'throughput_per_minute',
    'power_requirements',
  ]), []);

  const checkVisibility = (config: FormFieldConfig): boolean => {
    if (isBulkEdit) return true;
    if (!config.visibilityCondition) {
        return true;
    }
    const { field, value, values, operator } = config.visibilityCondition;
    const fieldValue = (formData as any)[field];

    if (operator === 'not_equals') {
        return fieldValue !== value;
    }

    if (values) {
      return values.includes(fieldValue);
    }
    
    return fieldValue === value;
  };

  if (!deviceType) return null;

  const deviceConfig = formConfig[deviceType];
  const title = isBulkEdit 
    ? `Bulk Edit ${deviceList.length} Items` 
    : (isCreating ? 'Add New ' : 'Edit ') + TITLES[deviceType];
  const titleId = "device-form-title";

  const isAccessDoor = deviceType === 'access-door';
  const isCamera = deviceType === 'camera';
  const isElevator = deviceType === 'elevator';
  const isTurnstile = deviceType === 'turnstile';
  const fieldOrder = deviceConfig.fieldOrder;

  let basicFields = fieldOrder;
  let advancedFields: string[] = [];
  
  if (isAccessDoor) {
      const advancedSet = advancedAccessDoorFields;
      basicFields = fieldOrder.filter(key => !advancedSet.has(key));
      advancedFields = fieldOrder.filter(key => advancedSet.has(key));
  } else if (isCamera) {
      const advancedSet = advancedCameraFields;
      basicFields = fieldOrder.filter(key => !advancedSet.has(key));
      advancedFields = fieldOrder.filter(key => advancedSet.has(key));
  } else if (isElevator) {
      const advancedSet = advancedElevatorFields;
      basicFields = fieldOrder.filter(key => !advancedSet.has(key));
      advancedFields = fieldOrder.filter(key => advancedSet.has(key));
  } else if (isTurnstile) {
      const advancedSet = advancedTurnstileFields;
      basicFields = fieldOrder.filter(key => !advancedSet.has(key));
      advancedFields = fieldOrder.filter(key => advancedSet.has(key));
  }


  const renderField = (key: string) => {
    const config = deviceConfig.fields[key];
    if (!config) return null;
    
    const isVisible = checkVisibility(config);
    if (!isVisible && !isAdminMode) return null;
    if (!config.visible && !isAdminMode) return null;

    const value = formData[key];
    const hasValue = value !== undefined && value !== null;
    const placeholder = isBulkEdit && !hasValue ? 'Mixed Values' : '';
    const labelId = `label-for-${key}`;
    
    let inputElement: React.ReactNode;
    switch(config.type) {
        case 'boolean':
            inputElement = (
                <div role="group" aria-labelledby={labelId} className="flex gap-2">
                    <button type="button" onClick={() => handleChange(key, true)} className={`flex-1 py-2 rounded-md transition-colors text-sm ${value === true ? 'bg-primary-600 text-white' : 'bg-background hover:bg-white/10'} ${!hasValue && isBulkEdit ? 'border border-dashed border-primary-500' : ''}`} id={`${labelId}-yes`}>Yes</button>
                    <button type="button" onClick={() => handleChange(key, false)} className={`flex-1 py-2 rounded-md transition-colors text-sm ${value === false ? 'bg-red-600 text-white' : 'bg-background hover:bg-white/10'} ${!hasValue && isBulkEdit ? 'border border-dashed border-primary-500' : ''}`} id={`${labelId}-no`}>No</button>
                </div>
            );
            break;
        case 'select':
            inputElement = (
                <select id={key} name={key} value={hasValue ? value : ''} onChange={(e) => handleChange(key, e.target.value)} className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base">
                    {!hasValue && isBulkEdit && <option disabled value="">-- Mixed Values --</option>}
                    <option value="">-- Select --</option>
                    {config.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
            break;
        case 'textarea':
            inputElement = <textarea id={key} name={key} value={hasValue ? value : ''} onChange={(e) => handleChange(key, e.target.value)} rows={3} className="w-full bg-background border border-white/20 rounded-md p-3 md:p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base min-h-[44px] md:min-h-0 resize-none" placeholder={placeholder}/>;
            break;
        case 'password':
            inputElement = <input type="password" id={key} name={key} value={hasValue ? value : ''} onChange={(e) => handleChange(key, e.target.value)} className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base" placeholder={placeholder}/>;
            break;
        case 'number':
            inputElement = <input type="number" id={key} name={key} value={hasValue ? value : ''} onChange={(e) => handleChange(key, e.target.value)} className="w-full bg-background border border-white/20 rounded-md p-3 md:p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base min-h-[44px] md:min-h-0" placeholder={placeholder} inputMode="numeric" pattern="[0-9]*"/>;
            break;
        case 'tel':
            inputElement = <input type="tel" id={key} name={key} value={hasValue ? value : ''} onChange={(e) => handleChange(key, e.target.value)} className="w-full bg-background border border-white/20 rounded-md p-3 md:p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base min-h-[44px] md:min-h-0" placeholder={placeholder} inputMode="tel"/>;
            break;
        case 'email':
            inputElement = <input type="email" id={key} name={key} value={hasValue ? value : ''} onChange={(e) => handleChange(key, e.target.value)} className="w-full bg-background border border-white/20 rounded-md p-3 md:p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base min-h-[44px] md:min-h-0" placeholder={placeholder} inputMode="email" autoComplete="email"/>;
            break;
        default:
            inputElement = <input type='text' id={key} name={key} value={hasValue ? value : ''} onChange={(e) => handleChange(key, e.target.value)} className="w-full bg-background border border-white/20 rounded-md p-3 md:p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base min-h-[44px] md:min-h-0" placeholder={placeholder}/>;
            break;
    }

    return (
        <div 
            key={key} 
            draggable={isAdminMode}
            onDragStart={e => handleDragStart(e, key)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, key)}
            className={`flex flex-col relative transition-all
              ${!isVisible ? 'hidden' : ''}
              ${!config.visible ? 'opacity-50' : ''} 
              ${config.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}
              ${draggedItem === key ? 'opacity-30' : ''}
              ${isAdminMode ? 'p-2 border border-dashed border-transparent hover:border-primary-600 rounded-lg' : ''}`
            }
        >
           {isAdminMode && <div className="absolute top-2 left-0 cursor-grab text-on-surface-variant"><GripVerticalIcon className="w-5 h-5"/></div>}
           <div className={`flex items-center justify-between mb-1 ${isAdminMode ? 'pl-4' : ''}`}>
                <label id={labelId} htmlFor={key} className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                    <span className="text-lg">{config.icon}</span>
                    {config.label}
                </label>
                {isAdminMode && (
                    <button type="button" onClick={() => handleVisibilityToggle(key)} title={config.visible ? 'Hide field' : 'Show field'}>
                        {config.visible ? <EyeIcon className="w-4 h-4"/> : <EyeOffIcon className="w-4 h-4"/>}
                    </button>
                )}
           </div>
           {inputElement}
           {isAdminMode && config.type === 'select' && (
               <div className="mt-2 p-2 bg-background/50 rounded-md border border-white/10">
                   <h4 className="text-xs font-bold mb-2 text-on-surface-variant">Admin: Edit Options</h4>
                   <ul className="space-y-1 mb-2">
                       {config.options?.map(opt => (
                           <li key={opt} className="flex items-center justify-between bg-white/5 p-1 rounded">
                               <span className="text-xs pl-1">{opt}</span>
                               <button type="button" onClick={() => handleRemoveOption(key, opt)} className="p-0.5 hover:bg-red-500/50 rounded-full"><CloseIcon className="w-3 h-3"/></button>
                           </li>
                       ))}
                   </ul>
                   <div className="flex gap-1">
                        <input 
                            type="text" 
                            value={newOptionValues[key] || ''}
                            onChange={(e) => setNewOptionValues(p => ({...p, [key]: e.target.value}))}
                            placeholder="New option"
                            className="flex-grow w-full bg-background border border-white/20 rounded-md px-2 py-1 text-on-surface text-xs focus:ring-1 focus:ring-primary-500"
                        />
                        <button type="button" onClick={() => handleAddOption(key)} className="p-1.5 bg-primary-700 rounded-md"><Plus className="w-3 h-3"/></button>
                   </div>
               </div>
           )}
        </div>
    )
  }

  const modalContainerClasses = `bg-black/60 z-[100] flex justify-center fixed inset-0 items-end sm:items-center`;

  return (
    <>
    <div className={modalContainerClasses} onClick={onClose} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="bg-background rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-background sm:bg-transparent rounded-t-xl">
          <div>
            <h2 id={titleId} className="text-xl md:text-2xl font-bold text-on-surface">{title}</h2>
             <p className="text-sm md:text-base text-on-surface-variant">
                {isBulkEdit ? "Only changed fields will be updated across all items." : "Fill in the details for the selected device."}
             </p>
          </div>
          {isAdminMode && <div className="px-3 py-1 bg-primary-900 text-primary-300 text-sm font-bold rounded-full">ADMIN MODE</div>}
        </div>
        <form 
            onSubmit={handleSubmit} 
            className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface"
        >
          <div className="mb-4">
              <label htmlFor="device-color" className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                  <Palette className="w-4 h-4" /> Custom Color
              </label>
              <div className="flex items-center gap-2 mt-1">
                  <input
                      id="device-color"
                      type="color"
                      value={formData.color || '#ffffff'}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="w-12 h-10 p-1 bg-background border border-white/20 rounded-md cursor-pointer"
                  />
                  <input
                      type="text"
                      value={formData.color || ''}
                      onChange={(e) => handleChange('color', e.target.value)}
                      placeholder={isBulkEdit && !formData.hasOwnProperty('color') ? 'Mixed Values' : '#RRGGBB'}
                      className="flex-1 bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                  <button type="button" onClick={() => handleChange('color', undefined)} className="text-xs text-on-surface-variant hover:text-white underline">
                      Reset
                  </button>
              </div>
              <p className="text-xs text-on-surface-variant/70 mt-1">Overrides the default icon color on PDF exports and in the editor.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {basicFields.map(key => renderField(key))}
          </div>

          {(isAccessDoor || isCamera || isElevator || isTurnstile) && advancedFields.length > 0 && (
            <div className="mt-6">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(prev => !prev)}
                    className={`w-full flex justify-between items-center p-3 bg-background border border-white/20 hover:bg-white/10 transition ${showAdvanced ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
                    aria-expanded={showAdvanced}
                >
                    <span className="font-semibold text-on-surface">Advanced Options</span>
                    <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 p-4 bg-background/50 rounded-b-lg border border-t-0 border-white/20">
                        {advancedFields.map(key => renderField(key))}
                    </div>
                )}
            </div>
          )}
          
          {deviceType === 'miscellaneous' && !isBulkEdit && (
              <div className="md:col-span-full mt-6 pt-6 border-t border-white/20">
                  <h3 className="text-lg font-semibold text-on-surface mb-4">Custom Fields</h3>
                  <div className="space-y-3">
                      {((formData as Partial<MiscellaneousData>).custom_fields)?.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                              <input
                                  type="text"
                                  placeholder="Field Label (e.g., Serial Number)"
                                  value={field.label}
                                  onChange={e => handleCustomFieldChange(index, 'label', e.target.value)}
                                  className="flex-[2] bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm"
                              />
                              <input
                                  type="text"
                                  placeholder="Value"
                                  value={field.value}
                                  onChange={e => handleCustomFieldChange(index, 'value', e.target.value)}
                                  className="flex-[3] bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm"
                              />
                              <button
                                  type="button"
                                  onClick={() => handleRemoveCustomField(field.id)}
                                  className="p-2 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                  title="Remove field"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                      {(!(formData as Partial<MiscellaneousData>).custom_fields || (formData as Partial<MiscellaneousData>).custom_fields?.length === 0) && (
                          <p className="text-sm text-on-surface-variant text-center py-2">No custom fields added yet.</p>
                      )}
                  </div>
                  <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="mt-4 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-semibold"
                  >
                      <PlusCircle className="w-5 h-5" />
                      Add Custom Field
                  </button>
              </div>
          )}

          {!isBulkEdit && (
              <div className="md:col-span-full mt-6 pt-6 border-t border-white/20">
                  <h3 className="text-lg font-semibold text-on-surface mb-4">📷 Images</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-4">
                    {(formData.images as EquipmentImage[])?.map(image => (
                       <div key={image.localId} className="relative group aspect-square">
                           <ImageWithFallback
                                localId={image.localId}
                                alt="Device attachment"
                                className="w-full h-full object-cover rounded-md cursor-pointer"
                                onClick={() => onViewImage(image.localId)}
                           />
                           <button type="button" onClick={() => deviceList[0].id && onImageDeleted(deviceList[0].id, image.localId)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Image">
                               <Trash2 className="w-4 h-4" />
                           </button>
                       </div>
                    ))}
                    <div className="aspect-square border-2 border-dashed border-white/30 rounded-md p-2 flex flex-col items-center justify-center text-on-surface-variant">
                        <p className="text-sm font-semibold text-center mb-2">Add Photos</p>
                        <div className="flex flex-col items-stretch justify-center gap-2 w-full px-4">
                          <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-background hover:bg-white/10 border border-white/20 transition-colors text-sm">
                              <UploadCloud className="w-4 h-4" />
                              <span>Upload</span>
                          </button>
                          <button type="button" onClick={() => setIsCameraCaptureOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-background hover:bg-white/10 border border-white/20 transition-colors text-sm">
                              <CameraIcon className="w-4 h-4" />
                              <span>Camera</span>
                          </button>
                        </div>
                    </div>
                    <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageInputChange} multiple />
                  </div>
              </div>
          )}
        </form>
        <div className="p-4 md:p-6 border-t border-white/10 flex justify-end gap-2 md:gap-4 flex-shrink-0 bg-background sm:bg-transparent">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">Save Details</button>
        </div>
      </div>
    </div>
    {isCameraCaptureOpen && (
        <CameraCapture 
            isOpen={isCameraCaptureOpen}
            onClose={() => setIsCameraCaptureOpen(false)}
            onPhotosTaken={handlePhotosTaken}
        />
    )}
    </>
  );
};

export default DeviceForm;