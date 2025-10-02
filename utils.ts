import JSZip from 'jszip';
import { AnyEdit, DeviceEdit, MarkerEdit, Project, Floorplan, DeviceData, AccessDoorData, CameraData, TurnstileData, DeviceType, PartialDeviceData, MiscellaneousData, EquipmentImage, MarkerType, AuditLogEntry } from './types';
import { EQUIPMENT_CONFIG } from './services/equipmentConfig';
import { saveFile } from './services/fileStorage';

export const camelCaseToTitle = (text: string) => {
    const result = text.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

export const sanitizeFilename = (name: string): string => {
    return name.replace(/[\\/?%*:|"<>]/g, '-');
};

export const getClientUserId = (): string => {
    let userId = localStorage.getItem('clientUserId');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('clientUserId', userId);
    }
    return userId;
};

export const migrateProjectDataToV2 = (projects: any[]): Project[] => {
    return projects.map(proj => {
        const migrateEdit = (edit: any): AnyEdit | null => {
            if (!edit) return null;
            const newEdit = JSON.parse(JSON.stringify(edit));

            if (newEdit.type === 'device' || newEdit.type === 'marker') {
                if (newEdit.width === undefined || newEdit.width === null) newEdit.width = 24;
                if (newEdit.height === undefined || newEdit.height === null) newEdit.height = 24;
                if (newEdit.rotation === undefined || newEdit.rotation === null) newEdit.rotation = 0;
            }

            if (newEdit.type === 'device') {
                const data = newEdit.data || {};
                const isV1 = 'placementType' in data || 'isIndoor' in data || (Array.isArray(data.images) && data.images.length > 0 && typeof data.images[0] === 'object' && data.images[0] && 'dataUrl' in data.images[0]);
                
                if (isV1) {
                    const oldData = data;
                    const migratedData: { [key: string]: any } = {};

                    const keymap: Record<string, string> = {
                        placementType: 'install_type', exstPanelLocation: 'exst_panel_location',
                        exstPanelType: 'exst_panel_type', exstReaderType: 'exst_reader_type',
                        newPanelLocation: 'new_panel_location', newPanelType: 'new_panel_type',
                        readerType: 'reader_type', lockType: 'lock_type',
                        monitoringType: 'monitoring_type', doorContact: 'door_contact',
                        rex: 'rex', pushToExit: 'push_to_exit',
                        intercomBuzzer: 'intercom_buzzer', lockProvider: 'lock_provider',
                        interiorPerimeter: 'interior_perimeter', cameraTypeNew: 'camera_type_new',
                        mountTypeNew: 'mount_type_new', pullWire: 'pull_wire',
                        frameRate: 'frame_rate', ipAddress: 'ip_address',
                        mountingHeight: 'mounting_height', elevatorType: 'elevator_type',
                        floorCount: 'floor_count', elevatorCompany: 'elevator_company',
                        elevatorPhoneNumber: 'elevator_phone_number', freightSecureType: 'freight_secure_type',
                        freightCarNumbers: 'freight_car_numbers', intercomType: 'intercom_type',
                        connectionType: 'connection_type', mountingType: 'mounting_type',
                        videoCapability: 'video_capability',
                    };

                    for (const oldKey in oldData) {
                        const newKey = keymap[oldKey] || oldKey;
                        migratedData[newKey] = oldData[oldKey];
                    }

                    if (oldData.placementType === 'New') migratedData.install_type = 'New Install';
                    if (oldData.placementType === 'Takeover') migratedData.install_type = 'Takeover';

                    if (typeof oldData.isIndoor !== 'undefined') migratedData.environment = oldData.isIndoor ? 'Indoor' : 'Outdoor';
                    if (oldData.cameraType) migratedData.camera_type_new = oldData.cameraType;
                    
                    if(Array.isArray(oldData.monitoringType)) migratedData.monitoring_type = oldData.monitoringType[0] || "No Monitoring";
                    
                    if(Array.isArray(oldData.images) && oldData.images[0] && 'dataUrl' in oldData.images[0]) {
                         migratedData.images = oldData.images.map((img: any) => {
                            const newImage: EquipmentImage = { 
                                localId: img.id || crypto.randomUUID(), 
                                id: 0, 
                                createdAt: new Date().toISOString(),
                                image_url: img.dataUrl, // Temporarily carry over for processing
                            };
                            return newImage;
                        });
                    }
                    newEdit.data = migratedData;
                }
            }
            if (newEdit.type === 'marker' && (newEdit.markerType === 'ubiquiti-tx' || newEdit.markerType === 'ubiquiti-rx')) {
                newEdit.markerType = 'ubiquiti-wireless';
                if (newEdit.data) {
                    newEdit.data.label = 'Ubiquiti Wireless';
                }
            }
            return newEdit;
        };

        // First, migrate all individual edit objects everywhere
        let migratedFloorplans = (proj.floorplans || []).map((fp: any) => ({
            ...fp,
            inventory: (fp.inventory || []).map(migrateEdit).filter(Boolean) as AnyEdit[],
        }));
        
        let initialProjectLevelInventory: AnyEdit[] = (proj.projectLevelInventory || []).map(migrateEdit).filter(Boolean) as AnyEdit[];

        // Handle legacy "General Notes" floorplan by merging its items into the initial project inventory
        const generalNotesFp = migratedFloorplans.find((fp: Floorplan) => fp.name === 'General Notes & Equipment');
        if (generalNotesFp) {
            initialProjectLevelInventory.push(...generalNotesFp.inventory);
            migratedFloorplans = migratedFloorplans.filter((fp: Floorplan) => fp.name !== 'General Notes & Equipment');
        }

        // --- Data Structure Normalization for Backward Compatibility ---
        // 1. Create a master list of all unique items found anywhere in the project.
        const allItemsFromAllSources = [...initialProjectLevelInventory, ...migratedFloorplans.flatMap(fp => fp.inventory)];
        const masterInventoryMap = new Map<string, AnyEdit>();
        allItemsFromAllSources.forEach(item => {
            masterInventoryMap.set(item.id, item);
        });
        const finalProjectLevelInventory = Array.from(masterInventoryMap.values());

        // 2. Rebuild each floorplan's inventory to be a correctly referenced subset of the new master list.
        const finalFloorplans = migratedFloorplans.map((fp: Floorplan) => {
            // For very old formats, `placedEditIds` might not exist. If so, infer placement from the item's presence in the original floorplan inventory.
            const placedIds = new Set(fp.placedEditIds && fp.placedEditIds.length > 0 ? fp.placedEditIds : fp.inventory.map(i => i.id));
            
            const newInventory = finalProjectLevelInventory.filter(item => placedIds.has(item.id));

            return {
                ...fp,
                inventory: newInventory,
                // Ensure placedEditIds is clean and only contains IDs that actually exist in the master inventory.
                placedEditIds: newInventory.map(item => item.id),
            };
        });

        // Handle migration of single gatewayConfiguration to gatewayCalculations array
        const gatewayCalculations = [];
        if (proj.gatewayConfiguration) {
            gatewayCalculations.push({
                id: crypto.randomUUID(),
                name: "Default Calculation",
                ...proj.gatewayConfiguration
            });
        }

        return {
            id: proj.id,
            server_id: proj.server_id,
            name: proj.name,
            client: proj.client || '',
            site_address: proj.site_address || '',
            se_name: proj.se_name,
            bdm_name: proj.bdm_name,
            created_at: proj.created_at,
            updated_at: proj.updated_at,
            latitude: proj.latitude,
            longitude: proj.longitude,
            floorplans: finalFloorplans,
            projectLevelInventory: finalProjectLevelInventory,
            checklistAnswers: proj.checklistAnswers || {},
            analysis_result: proj.analysis_result,
            gatewayCalculations: proj.gatewayCalculations || gatewayCalculations,
            conduitCalculations: proj.conduitCalculations || [],
            laborCalculations: proj.laborCalculations || [],
            elevator_letter_content: proj.elevator_letter_content,
            elevatorLetterFormData: proj.elevatorLetterFormData,
            auditLog: proj.auditLog || [],
        };
    });
};

export const createDefaultDevice = (deviceType: DeviceType, overrides: Omit<Partial<DeviceEdit>, 'data'> & { data?: Partial<DeviceData> } = {}): DeviceEdit => {
    let defaultData: DeviceData;

    switch (deviceType) {
        case 'access-door':
            defaultData = { location: 'New Door', install_type: 'New Install', reader_type: 'EverPresence -Wall Mount', lock_type: '-', monitoring_type: 'No Monitoring', door_contact: false, rex: false, push_to_exit: false, intercom_buzzer: false, crash_bar: false, interior_perimeter: 'Interior' };
            break;
        case 'camera':
            defaultData = { location: 'New Camera', install_type: 'New Install', camera_type_new: 'Dome', environment: 'Indoor', import_to_gateway: false, onvif_compliant: false, camera_working: false, h264_compliant: true, camera_verified: false, fieldOfViewAngle: 90, fieldOfViewDistance: 100, fieldOfViewRotation: -90 };
            break;
        case 'elevator':
            defaultData = { location: 'New Elevator', elevator_type: 'Type A', rear_hall_calls: false, rear_hall_control: false, reader_mounting_surface_ferrous: false, flush_mount_required: false, elevator_phones_for_visitors: false, engineer_override_key_switch: false };
            break;
        case 'intercom':
            defaultData = { location: 'New Intercom', intercom_type: 'Audio', connection_type: 'IP' };
            break;
        case 'turnstile':
            defaultData = { location: 'New Turnstile', turnstile_type: 'Tripod Arm', lane_count: 1, direction_control: 'Bidirectional', is_ada_lane: false, reader_integration: 'Integrated (Built-in)', fire_safety_release: false };
            break;
        case 'miscellaneous':
            defaultData = { location: 'New Equipment', custom_fields: [] } as MiscellaneousData;
            break;
        default:
            const exhaustiveCheck: never = deviceType;
            throw new Error(`Unknown device type for default creation: ${exhaustiveCheck}`);
    }
    
    const { data: dataOverride, ...restOverrides } = overrides;
    const data = { ...defaultData, ...(dataOverride || {}) };

    return {
        id: crypto.randomUUID(),
        type: 'device',
        deviceType: deviceType,
        data: data as DeviceData,
        pageIndex: -1,
        x: 0, y: 0, width: 24, height: 24, rotation: 0,
        ...restOverrides,
    };
};

export const createDefaultMarker = (markerType: MarkerType, overrides: Partial<MarkerEdit> = {}): MarkerEdit => {
    const config = EQUIPMENT_CONFIG[markerType];
    if (!config) throw new Error(`Unknown marker type: ${markerType}`);

    return {
        id: crypto.randomUUID(),
        type: 'marker',
        markerType: markerType,
        data: {
            label: config.label,
            notes: '',
        },
        pageIndex: -1,
        x: 0, y: 0, width: 24, height: 24, rotation: 0,
        ...overrides,
    };
};

export const getEditIconKey = (edit: DeviceEdit | MarkerEdit): string => {
    if (edit.type === 'device') {
        const data = edit.data as any;
        if (edit.deviceType === 'access-door') {
            return `access-door-${data.interior_perimeter?.toLowerCase() || 'interior'}`;
        }
        if (edit.deviceType === 'camera') {
            return `camera-${(data.environment?.toLowerCase() || 'indoor').includes('outdoor') ? 'outdoor' : 'indoor'}`;
        }
        return edit.deviceType;
    }
    if (edit.type === 'marker') {
        return edit.markerType;
    }
    return 'unknown';
};


export const generateProjectDataForAI = (project: Project): string => {
    const simplifiedProject = {
        projectName: project.name,
        checklistAnswers: project.checklistAnswers || {},
        projectLevelEquipment: project.projectLevelInventory.map(edit => {
             const itemEdit = edit as DeviceEdit | MarkerEdit;
             const cleanData: Record<string, any> = {};
             if (itemEdit.type === 'device') {
                 for (const [key, value] of Object.entries(itemEdit.data)) {
                     if (value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0) && key !== 'images') {
                         cleanData[key] = value;
                     }
                 }
             }
             return { id: itemEdit.id, equipmentType: itemEdit.type === 'device' ? itemEdit.deviceType : itemEdit.markerType, data: cleanData };
        }),
        floorplans: project.floorplans.map(fp => ({
            floorplanName: fp.name,
            equipment: fp.inventory
                .filter(edit => (edit.type === 'device' || edit.type === 'marker') && fp.placedEditIds.includes(edit.id))
                .map(edit => {
                    const itemEdit = edit as DeviceEdit | MarkerEdit;
                    const cleanData: Record<string, any> = {};

                    if (itemEdit.type === 'device') {
                        for (const [key, value] of Object.entries(itemEdit.data)) {
                            if (value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
                               if (key !== 'images') {
                                 cleanData[key] = value;
                               }
                            }
                        }
                    } else if (itemEdit.type === 'marker') {
                        cleanData.label = itemEdit.data.label;
                    }

                    return {
                        id: itemEdit.id,
                        equipmentType: itemEdit.type === 'device' ? itemEdit.deviceType : itemEdit.markerType,
                        data: cleanData
                    };
                })
        }))
    };
    return JSON.stringify(simplifiedProject, null, 2);
}

export const loadProjectFromZip = async (zipFile: File): Promise<{ project?: Project; projects?: Project[]; isBackup: boolean; floorplanFiles: Record<string, File> }> => {
    console.log(`[DEBUG] Attempting to load archive: ${zipFile.name}, size: ${zipFile.size}`);
    const zip = await JSZip.loadAsync(zipFile);
    
    const fileList = Object.keys(zip.files);
    console.log(`[DEBUG] Files found in archive: [${fileList.join(', ')}]`);

    const dataUrlToBlob = (dataUrl: string): Blob => {
        const parts = dataUrl.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    };

    let loadedProjects: Project[];
    let isBackup = false;
    let project: Project | undefined = undefined;

    const backupJsonEntry = zip.file('backup.json');
    const projectJsonEntry = zip.file('project.json');

    if (backupJsonEntry) {
        isBackup = true;
        console.log('[DEBUG] Found "backup.json", processing as a multi-project backup.');
        const backupJson = await backupJsonEntry.async('string');
        const backupData = JSON.parse(backupJson);
        loadedProjects = migrateProjectDataToV2(backupData.projects || []);
    } else if (projectJsonEntry) {
        isBackup = false;
        console.log('[DEBUG] Found "project.json", processing as a single project file.');
        const projectJson = await projectJsonEntry.async('string');
        const singleProject = migrateProjectDataToV2([JSON.parse(projectJson)])[0];
        loadedProjects = [singleProject];
        project = singleProject;
    } else {
        console.error('[DEBUG] Import failed: Neither "backup.json" nor "project.json" found in the archive.');
        throw new Error('Invalid project file: missing project.json or backup.json.');
    }

    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
        const imageLoadPromises = imagesFolder.filter((_, file) => !file.dir).map(file => {
            const filenameWithExt = file.name.split('/').pop() || file.name;
            const localId = filenameWithExt.replace(/\.[^/.]+$/, "");
            return file.async('blob').then(blob => saveFile(localId, new File([blob], filenameWithExt)));
        });
        await Promise.all(imageLoadPromises);
    }

    const floorplanFiles: Record<string, File> = {};
    const floorplansFolder = zip.folder("floorplans");
    if (floorplansFolder) {
        const allFloorplans = loadedProjects.flatMap(p => p.floorplans);
        const floorplanPromises = floorplansFolder.filter((_, file) => !file.dir).map(file => {
            const filenameWithExt = file.name.split('/').pop() || file.name;
            const floorplanIdFromFile = filenameWithExt.replace(/\.pdf$/i, '');
            const correspondingFloorplan = allFloorplans.find(fp => fp.id === floorplanIdFromFile);
            
            if (correspondingFloorplan) {
                const id = correspondingFloorplan.id;
                const userFriendlyFilename = correspondingFloorplan.pdfFileName || file.name;
                return file.async('blob').then(blob => {
                    floorplanFiles[id] = new File([blob], userFriendlyFilename, { type: 'application/pdf' });
                });
            } else {
                console.warn(`Could not find a matching floorplan in project data for PDF file: ${file.name}`);
                return Promise.resolve();
            }
        });
        await Promise.all(floorplanPromises);
    }
    
    const allEdits = loadedProjects.flatMap(p => [...p.projectLevelInventory, ...p.floorplans.flatMap(fp => fp.inventory)]);
    const imageMigrationPromises: Promise<any>[] = [];

    for (const edit of allEdits) {
        if ((edit.type === 'device' || edit.type === 'marker') && edit.data.images) {
            for (const image of edit.data.images) {
                if (image.image_url) {
                    const promise = (async () => {
                        try {
                            const blob = dataUrlToBlob(image.image_url!);
                            const file = new File([blob], `${image.localId}.png`, { type: blob.type });
                            await saveFile(image.localId, file);
                            delete image.image_url;
                        } catch (err) {
                            console.warn(`Could not migrate image ${image.localId}:`, err);
                        }
                    })();
                    imageMigrationPromises.push(promise);
                }
            }
        }
    }
    await Promise.all(imageMigrationPromises);

    if (isBackup) {
        return { projects: loadedProjects, floorplanFiles, isBackup };
    } else {
        return { project: loadedProjects[0], projects: loadedProjects, floorplanFiles, isBackup };
    }
};

export const convertAuditLogToCsv = (log: AuditLogEntry[]): string => {
    if (!log || log.length === 0) return "No log entries.";
    
    const headers = ['Timestamp', 'Action', 'Description', 'UserID', 'Details'];
    const csvRows = [headers.join(',')];

    log.forEach(entry => {
        const row = [
            `"${entry.timestamp}"`,
            `"${entry.action}"`,
            `"${entry.description.replace(/"/g, '""')}"`, // Escape double quotes
            `"${entry.userId}"`,
            `"${entry.details ? JSON.stringify(entry.details).replace(/"/g, '""') : ''}"`
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};

export const parseResolution = (resString: string | undefined): number => {
    if (!resString) return 1;
    const match = resString.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
};

export const parseFrameRate = (fpsString: string | undefined): number => {
    if (!fpsString) return 10;
    const match = fpsString.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
};

// Based on CheckVideo bitrate calculator
export const getBitrateForResolution = (resolutionMP: number): number => {
    if (resolutionMP <= 1) return 0.5;
    if (resolutionMP <= 2) return 1.0;
    if (resolutionMP <= 4) return 1.5;
    if (resolutionMP <= 5) return 2.0;
    if (resolutionMP <= 8) return 3.0;
    return 4.0; // For anything > 8MP
};