import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Project, StreamCamera, Stream, Gateway, CameraData, DeviceEdit, GatewayConfiguration } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { getBitrateForResolution, parseResolution, parseFrameRate } from '../utils';
// FIX: Update imports to use exported icon components.
import { HelpCircleIcon, AddIcon, DeleteIcon, CopyIcon, ChevronsRightIcon, VideoGatewayIcon, CameraIcon, CloseIcon, ChevronDownIcon } from './Icons';
import { toast } from 'react-hot-toast';
import { useAppDispatch } from '../state/AppContext';

interface GatewayCalculatorProps {
    project: Project | null | undefined;
    onFinish: () => void;
}

const GATEWAY_SPECS = {
    '8ch': { maxStreams: 8, maxThroughput: 320, maxStorage: 6000 },
    '16ch': { maxStreams: 16, maxThroughput: 640, maxStorage: 12000 },
};

const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(true);
    return (
        <div className="fixed inset-0 bg-black/70 z-[130] flex items-center justify-center p-4" onClick={onClose}>
            <div ref={modalRef} className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-on-surface">Gateway Calculator Help</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4 text-on-surface-variant">
                    <section>
                        <h3 className="font-bold text-lg text-on-surface mb-2">Gateway Specifications</h3>
                        <p><strong>8-Channel Gateway:</strong> Max 8 Streams, 320 MP/s Throughput, 6 TB (6000 GB) Storage.</p>
                        <p><strong>16-Channel Gateway:</strong> Max 16 Streams, 640 MP/s Throughput, 12 TB (12000 GB) Storage.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg text-on-surface mb-2">Calculation Methodology</h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Total Streams:</strong> Sum of the "Lens Count" for all cameras.</li>
                            <li><strong>Total Throughput (MP/s):</strong> For each camera, this is `Streaming Resolution × Frame Rate × Lens Count`. The total is the sum for all cameras.</li>
                            <li><strong>Total Storage (GB):</strong> Calculated based on recording resolution, frame rate, storage days, and lens count, using an industry-standard bitrate table.</li>
                        </ul>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg text-on-surface mb-2">How It Works</h3>
                        <p><strong>Step 1:</strong> Add or import cameras and define their specifications.</p>
                        <p><strong>Step 2:</strong> The tool calculates the total load and recommends a gateway configuration. You can adjust this configuration to see real-time capacity usage.</p>
                        <p><strong>Step 3:</strong> Assign camera streams to your configured gateways, either manually by dragging and dropping, or automatically with the load-balancing algorithm.</p>
                    </section>
                </main>
            </div>
        </div>
    );
};


const GatewayCalculator: React.FC<GatewayCalculatorProps> = ({ project, onFinish }) => {
    const [step, setStep] = useState(1);
    const [cameras, setCameras] = useState<StreamCamera[]>([]);
    const [selectedGatewayType, setSelectedGatewayType] = useState<'8ch' | '16ch'>('16ch');
    const [gatewayCount, setGatewayCount] = useState(1);
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [unassignedStreams, setUnassignedStreams] = useState<Stream[]>([]);
    const [draggedStream, setDraggedStream] = useState<Stream | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<'unassigned' | number | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isImportMode, setIsImportMode] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    
    const viewRef = useFocusTrap<HTMLDivElement>(true);
    const dispatch = useAppDispatch();
    const didMountRef = useRef(false);

    const resetState = useCallback(() => {
        setStep(1);
        setCameras([]);
        setSelectedGatewayType('16ch');
        setGatewayCount(1);
        setGateways([]);
        setUnassignedStreams([]);
        setIsImportMode(false);
    }, []);

    const saveConfiguration = useCallback(() => {
        if (!project) return;
        const configuration: GatewayConfiguration = {
            cameras,
            selectedGatewayType,
            gatewayCount,
            gateways,
            unassignedStreams,
        };
        dispatch({ type: 'UPDATE_GATEWAY_CONFIG', payload: { projectId: project.id, configuration } });
    }, [cameras, selectedGatewayType, gatewayCount, gateways, unassignedStreams, project, dispatch]);

    // Load configuration from project, but ONLY when the project ID changes.
    // This prevents the component from resetting its state due to its own save operations.
    // FIX: Load from `project.gatewayCalculations[0]` instead of the legacy `project.gatewayConfiguration`.
    // IMPORTANT: Do NOT depend on project?.gatewayCalculations as this component updates it,
    // which would cause a circular update loop and flickering.
    useEffect(() => {
        // The project has `gatewayCalculations`, which is an array.
        // This component seems to manage just one calculation.
        // I will assume it should operate on the first calculation in the array.
        const firstCalc = project?.gatewayCalculations?.[0];
        if (firstCalc) {
            const config = firstCalc;
            setCameras(config.cameras || []);
            setSelectedGatewayType(config.selectedGatewayType || '16ch');
            setGatewayCount(config.gatewayCount || 1);
            setGateways(config.gateways || []);
            setUnassignedStreams(config.unassignedStreams || []);
    
            // Determine the starting step based on the loaded configuration
            if (config.gateways?.length > 0 || config.unassignedStreams?.length > 0) {
                setStep(3);
            } else if (config.cameras?.length > 0) {
                setStep(2);
            } else {
                setStep(1);
            }
        } else {
            // Reset to default state if there's no project or no saved configuration
            resetState();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id]);

    // Auto-save configuration on changes, but skip the very first mount render
    // to avoid overwriting loaded data with initial state.
    useEffect(() => {
        if (didMountRef.current) {
            saveConfiguration();
        } else {
            didMountRef.current = true;
        }
    }, [saveConfiguration]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);


    const handleImportFromProject = () => {
        if (!project) {
            toast.error("No active project to import from.");
            return;
        }
        const projectCameras = [...project.projectLevelInventory, ...project.floorplans.flatMap(f => f.inventory)]
            .filter(e => e.type === 'device' && e.deviceType === 'camera' && (e.data as CameraData).import_to_gateway) as DeviceEdit[];
        
        if (projectCameras.length === 0) {
            toast.error("No cameras marked for gateway import found in the active project.");
            return;
        }

        const importedStreamCameras: StreamCamera[] = projectCameras.map(cam => {
            const data = cam.data as CameraData;
            const streamingResolution = parseResolution(data.resolution);
            return {
                id: crypto.randomUUID(),
                name: data.location,
                lensCount: 1, // Default, as this isn't in CameraData
                streamingResolution,
                recordingResolution: streamingResolution,
                isRecordingResSameAsStreaming: true,
                frameRate: parseFrameRate(data.frame_rate),
                storageDays: 30, // Default
                camera_type: data.camera_type_new,
                mounting_type: data.mount_type_new,
                notes: data.notes
            };
        });
        
        setCameras(prev => [...prev, ...importedStreamCameras]);
        setIsImportMode(true);
        toast.success(`Imported ${importedStreamCameras.length} cameras from "${project.name}".`);
    };

    // --- STEP 1 LOGIC ---
    const handleAddCamera = () => {
        setCameras(prev => [...prev, {
            id: crypto.randomUUID(),
            name: `Camera ${prev.length + 1}`,
            lensCount: 1,
            streamingResolution: 5,
            recordingResolution: 5,
            isRecordingResSameAsStreaming: true,
            frameRate: 10,
            storageDays: 30,
        }]);
    };

    const handleUpdateCamera = (id: string, field: keyof StreamCamera, value: any) => {
        setCameras(prev => prev.map(cam => {
            if (cam.id !== id) return cam;
            
            let updatedCam = { ...cam, [field]: value };

            if (field === 'streamingResolution') {
                if (updatedCam.isRecordingResSameAsStreaming) {
                    updatedCam.recordingResolution = Number(value) || 1;
                }
            } else if (field === 'isRecordingResSameAsStreaming') {
                if (value === true) {
                    updatedCam.recordingResolution = updatedCam.streamingResolution;
                } else {
                    updatedCam.recordingResolution = 1;
                }
            }
            return updatedCam;
        }));
    };

    const handleDuplicateCamera = (id: string) => {
        const camToCopy = cameras.find(c => c.id === id);
        if (!camToCopy) return;
        setCameras(prev => [...prev, {
            ...camToCopy,
            id: crypto.randomUUID(),
            name: `${camToCopy.name} (Copy)`
        }]);
    };

    const handleDeleteCamera = (id: string) => {
        setCameras(prev => prev.filter(c => c.id !== id));
    };

    // --- CALCULATIONS ---
    const totals = useMemo(() => {
        // FIX: Explicitly type the accumulator in the `reduce` function to prevent type inference issues.
        // This ensures TypeScript correctly infers the types of `acc`'s properties, preventing them
        // from being typed as `unknown` which caused comparison errors later in the code.
        return cameras.reduce(
            (acc: { totalStreams: number; totalThroughput: number; totalStorage: number; }, cam: StreamCamera) => {
                const bitrate = getBitrateForResolution(cam.recordingResolution);
                acc.totalStreams += cam.lensCount;
                acc.totalThroughput += cam.streamingResolution * cam.frameRate * cam.lensCount;
                acc.totalStorage += (86400 * cam.storageDays * bitrate * cam.lensCount) / 8000;
                return acc;
            },
            { totalStreams: 0, totalThroughput: 0, totalStorage: 0 }
        );
    }, [cameras]);
    
    const totalCameras = cameras.length;
    const totalStreams = cameras.reduce((acc, cam) => acc + cam.lensCount, 0);

    const recommendedConfig = useMemo(() => {
        const { totalStreams, totalThroughput, totalStorage } = totals;
        const spec8ch = GATEWAY_SPECS['8ch'];

        if (totalStreams <= spec8ch.maxStreams && totalThroughput <= spec8ch.maxThroughput && totalStorage <= spec8ch.maxStorage) {
            return { type: '8ch', count: 1 } as const;
        }
        
        const spec16ch = GATEWAY_SPECS['16ch'];
        const gatewaysForStreams = Math.ceil(totalStreams / spec16ch.maxStreams);
        const gatewaysForThroughput = Math.ceil(totalThroughput / spec16ch.maxThroughput);
        const gatewaysForStorage = Math.ceil(totalStorage / spec16ch.maxStorage);
        const count = Math.max(gatewaysForStreams, gatewaysForThroughput, gatewaysForStorage, 1);

        return { type: '16ch', count } as const;

    }, [totals]);
    
    useEffect(() => {
        if (gateways.length === 0 && unassignedStreams.length === 0) {
            setSelectedGatewayType(recommendedConfig.type);
            setGatewayCount(recommendedConfig.count);
        }
    }, [recommendedConfig, gateways, unassignedStreams]);
    
    // --- STEP 2 LOGIC ---
    const currentCapacity = useMemo(() => {
        const spec = GATEWAY_SPECS[selectedGatewayType];
        return {
            streams: spec.maxStreams * gatewayCount,
            throughput: spec.maxThroughput * gatewayCount,
            storage: spec.maxStorage * gatewayCount,
        };
    }, [selectedGatewayType, gatewayCount]);

    const capacityUsage = useMemo(() => {
        return {
            streams: (totals.totalStreams / currentCapacity.streams) * 100,
            throughput: (totals.totalThroughput / currentCapacity.throughput) * 100,
            storage: (totals.totalStorage / currentCapacity.storage) * 100,
        };
    }, [totals, currentCapacity]);
    
    const isStep2Valid = Object.values(capacityUsage).every(v => v <= 100);

    // --- SAVING AND NAVIGATION ---
    const handleNavigateToStep = (targetStep: number) => {
        if (targetStep < 3 && step === 3) {
            if (gateways.length > 0 || unassignedStreams.length > 0) {
                setGateways([]);
                setUnassignedStreams([]);
                toast('Assignments cleared to allow re-configuration.');
            }
        }

        if (targetStep === 2) {
            if (cameras.length === 0) {
                toast.error("Please add at least one camera to proceed.");
                return;
            }
        }
        if (targetStep === 3) {
            const allStreams: Stream[] = cameras.flatMap(cam =>
                Array.from({ length: cam.lensCount }, (_, i) => {
                    const bitrate = getBitrateForResolution(cam.recordingResolution);
                    return {
                        id: `${cam.id}-${i}`,
                        cameraId: cam.id,
                        name: cam.lensCount > 1 ? `${cam.name} - Lens ${i + 1}` : cam.name,
                        throughput: cam.streamingResolution * cam.frameRate,
                        storage: (86400 * cam.storageDays * bitrate) / 8000
                    };
                })
            );

            const newGateways: Gateway[] = Array.from({ length: gatewayCount }, (_, i) => ({
                id: i + 1,
                type: selectedGatewayType,
                assignedStreams: [],
            }));
            
            setGateways(newGateways);
            setUnassignedStreams(allStreams);
        }
        setStep(targetStep);
    };

    const handleFinish = () => {
        saveConfiguration();
        toast.success("Gateway configuration saved to project!");
        onFinish();
    };

    // --- STEP 3 DRAG & DROP LOGIC ---
    const handleDragStart = (e: React.DragEvent, stream: Stream) => {
        setDraggedStream(stream);
        e.dataTransfer.setData('application/json', JSON.stringify(stream));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, target: 'unassigned' | number) => {
        e.preventDefault();
        setDragOverTarget(target);
    };
    
    const handleDragLeave = () => {
        setDragOverTarget(null);
    };

    const handleDrop = (e: React.DragEvent, target: 'unassigned' | number) => {
        e.preventDefault();
        setDragOverTarget(null);
        if (!draggedStream) return;
        
        let source: 'unassigned' | number = 'unassigned';
        if (!unassignedStreams.some(s => s.id === draggedStream.id)) {
            const sourceGateway = gateways.find(g => g.assignedStreams.some(s => s.id === draggedStream.id));
            if (sourceGateway) {
                source = sourceGateway.id;
            }
        }
        
        if (source === target) {
            setDraggedStream(null);
            return;
        }

        let tempUnassigned = [...unassignedStreams];
        let tempGateways = [...gateways];

        if (source === 'unassigned') {
            tempUnassigned = tempUnassigned.filter(s => s.id !== draggedStream.id);
        } else {
            tempGateways = tempGateways.map(g => g.id === source ? { ...g, assignedStreams: g.assignedStreams.filter(s => s.id !== draggedStream.id) } : g);
        }

        if (target === 'unassigned') {
            tempUnassigned.push(draggedStream);
        } else {
            tempGateways = tempGateways.map(g => g.id === target ? { ...g, assignedStreams: [...g.assignedStreams, draggedStream!] } : g);
        }

        setUnassignedStreams(tempUnassigned);
        setGateways(tempGateways);
        setDraggedStream(null);
    };

    const handleAssignToGateway = (stream: Stream, gatewayId: number) => {
        // Remove from unassigned streams
        const newUnassignedStreams = unassignedStreams.filter(s => s.id !== stream.id);

        // Remove from current gateway if assigned
        let newGateways = gateways.map(g => ({
            ...g,
            assignedStreams: g.assignedStreams.filter(s => s.id !== stream.id)
        }));

        // Add to selected gateway
        newGateways = newGateways.map(g =>
            g.id === gatewayId
                ? { ...g, assignedStreams: [...g.assignedStreams, stream] }
                : g
        );

        setUnassignedStreams(newUnassignedStreams);
        setGateways(newGateways);
    };

    const getAvailableGateways = (stream: Stream) => {
        return gateways.map(gateway => {
            const spec = GATEWAY_SPECS[gateway.type];
            const currentUsage = gateway.assignedStreams.reduce((acc, s) => ({
                streams: acc.streams + 1,
                throughput: acc.throughput + s.throughput,
                storage: acc.storage + s.storage
            }), { streams: 0, throughput: 0, storage: 0 });

            const hasCapacity = currentUsage.streams + 1 <= spec.maxStreams &&
                              currentUsage.throughput + stream.throughput <= spec.maxThroughput &&
                              currentUsage.storage + stream.storage <= spec.maxStorage;

            return {
                ...gateway,
                hasCapacity
            };
        }).filter(g => g.hasCapacity);
    };

    const handleAutoAssign = () => {
        let streams = [...unassignedStreams, ...gateways.flatMap(g => g.assignedStreams)];
        let gws = gateways.map(g => ({ ...g, assignedStreams: [] as Stream[] }));

        streams.sort((a, b) => b.storage - a.storage);

        for (const stream of streams) {
            let bestGateway: Gateway | null = null;
            let bestGatewayScore = Infinity;

            for (const gw of gws) {
                const spec = GATEWAY_SPECS[gw.type];
                const currentStreams = gw.assignedStreams.length;
                const currentThroughput = gw.assignedStreams.reduce((sum, s) => sum + s.throughput, 0);
                const currentStorage = gw.assignedStreams.reduce((sum, s) => sum + s.storage, 0);

                if (currentStreams + 1 > spec.maxStreams) continue;
                if (currentThroughput + stream.throughput > spec.maxThroughput) continue;
                if (currentStorage + stream.storage > spec.maxStorage) continue;

                const score = (currentStorage / spec.maxStorage) + (currentThroughput / spec.maxThroughput);
                if (score < bestGatewayScore) {
                    bestGatewayScore = score;
                    bestGateway = gw;
                }
            }

            if (bestGateway) {
                bestGateway.assignedStreams.push(stream);
            } else {
                setUnassignedStreams(prev => [...prev, stream]);
            }
        }
        setGateways(gws);
        setUnassignedStreams([]);
    };

    // --- RENDER FUNCTIONS ---
    const renderProgressBar = (value: number, label: string) => {
        const color = value > 100 ? 'bg-red-500' : value > 90 ? 'bg-yellow-500' : 'bg-green-500';
        return (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-on-surface-variant">{label}</span>
                    <span className={`text-sm font-bold ${value > 100 ? 'text-red-400' : 'text-on-surface'}`}>{value.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2.5">
                    <div className={`${color} h-2.5 rounded-full`} style={{ width: `${Math.min(value, 100)}%` }}></div>
                </div>
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="p-2 sm:p-4 md:p-8">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
                <div>
                    <h2 className="text-lg sm:text-2xl font-bold">Step 1: Define Camera Streams</h2>
                    <p className="text-sm sm:text-base text-on-surface-variant mt-1">Add cameras and specify their recording and streaming settings.</p>
                </div>
                 <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={handleImportFromProject} className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm bg-surface hover:bg-white/10 border border-white/20 rounded-md flex items-center gap-1 sm:gap-2" title="Import cameras marked for gateway use from the current project">
                        <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4" /> <span>Import</span>
                    </button>
                    <button onClick={handleAddCamera} className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-md flex items-center gap-1 sm:gap-2">
                        <AddIcon className="w-4 h-4" /> <span>Add Camera</span>
                    </button>
                    <button type="button" onClick={() => handleNavigateToStep(2)} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <span>Next</span> <ChevronsRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>
            
            <div className="mt-4 mb-6 p-4 bg-surface rounded-lg border border-white/10 flex items-center gap-8">
                <div>
                    <h4 className="text-sm font-medium text-on-surface-variant">Total Cameras</h4>
                    <p className="text-3xl font-bold text-on-surface">{totalCameras}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-on-surface-variant">Total Streams</h4>
                    <p className="text-3xl font-bold text-on-surface">{totalStreams}</p>
                </div>
            </div>
            
            <div className="space-y-4">
                {cameras.map((cam, index) => (
                    <div key={cam.id} className="bg-surface p-4 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg">Camera #{index + 1} {isImportMode && cam.camera_type && `(${cam.camera_type})`}</h3>
                            <div>
                                <button onClick={() => handleDuplicateCamera(cam.id)} className="p-2 text-on-surface-variant hover:text-on-surface"><CopyIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteCamera(cam.id)} className="p-2 text-on-surface-variant hover:text-red-400"><DeleteIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="flex flex-row flex-wrap items-end gap-x-4 gap-y-3">
                            <div>
                                <label className="text-xs font-medium text-on-surface-variant block mb-1">Name</label>
                                <input type="text" value={cam.name} onChange={e => handleUpdateCamera(cam.id, 'name', e.target.value)} className="w-40 bg-background p-2 rounded-md border border-white/20" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-on-surface-variant block mb-1">Lens Count</label>
                                <input type="number" value={cam.lensCount} min="1" onChange={e => handleUpdateCamera(cam.id, 'lensCount', parseInt(e.target.value) || 1)} className="w-24 bg-background p-2 rounded-md border border-white/20" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-on-surface-variant block mb-1">Streaming Res (MP)</label>
                                <input type="number" value={cam.streamingResolution} min="1" step="0.1" onChange={e => handleUpdateCamera(cam.id, 'streamingResolution', parseFloat(e.target.value) || 1)} className="w-24 bg-background p-2 rounded-md border border-white/20" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-on-surface-variant block mb-1">Recording Res (MP)</label>
                                <div className="flex items-center gap-2">
                                     <input type="number" value={cam.recordingResolution} className="w-24 bg-background p-2 rounded-md border border-white/20 disabled:opacity-70" disabled={cam.isRecordingResSameAsStreaming} onChange={e => handleUpdateCamera(cam.id, 'recordingResolution', parseFloat(e.target.value) || 1)} />
                                     <div className="flex items-center h-10" title="Recording resolution will match streaming resolution">
                                        <input type="checkbox" id={`same-res-${cam.id}`} checked={cam.isRecordingResSameAsStreaming} onChange={e => handleUpdateCamera(cam.id, 'isRecordingResSameAsStreaming', e.target.checked)} className="h-4 w-4 rounded text-primary-600 bg-surface border-gray-500 focus:ring-primary-500" />
                                        <label htmlFor={`same-res-${cam.id}`} className="ml-2 text-xs text-on-surface-variant whitespace-nowrap">Same</label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-on-surface-variant block mb-1">Frame Rate (fps)</label>
                                <input type="number" value={cam.frameRate} min="1" onChange={e => handleUpdateCamera(cam.id, 'frameRate', parseInt(e.target.value) || 1)} className="w-24 bg-background p-2 rounded-md border border-white/20" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-on-surface-variant block mb-1">Storage (Days)</label>
                                <input type="number" value={cam.storageDays} min="1" onChange={e => handleUpdateCamera(cam.id, 'storageDays', parseInt(e.target.value) || 1)} className="w-24 bg-background p-2 rounded-md border border-white/20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold">Step 2: Configure Gateways</h2>
            <p className="text-on-surface-variant mt-1">Review the total system load and configure the number and type of gateways.</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h3 className="text-xl font-semibold mb-4">System Load Totals</h3>
                    <div className="space-y-2 text-lg">
                        <p><strong>Total Streams:</strong> <span className="font-mono text-primary-400">{totals.totalStreams}</span></p>
                        <p><strong>Total Throughput:</strong> <span className="font-mono text-primary-400">{totals.totalThroughput.toFixed(2)} MP/s</span></p>
                        <p><strong>Total Storage:</strong> <span className="font-mono text-primary-400">{totals.totalStorage.toFixed(2)} GB</span></p>
                    </div>
                     <div className="mt-6 p-3 bg-background rounded-md text-sm">
                        <h4 className="font-bold text-on-surface mb-2">Recommendation</h4>
                        <p className="text-on-surface-variant">Based on the load, we recommend at least <strong className="text-white">{recommendedConfig.count} x {recommendedConfig.type} Gateway(s)</strong>.</p>
                    </div>
                </div>

                 <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h3 className="text-xl font-semibold mb-4">Your Configuration</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-sm text-on-surface-variant">Gateway Type</label>
                            <div className="flex items-center gap-1 bg-background rounded-lg p-1 mt-1">
                                <button onClick={() => setSelectedGatewayType('8ch')} className={`flex-1 py-1.5 px-3 rounded-md text-sm transition-colors ${selectedGatewayType === '8ch' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}>8-Channel</button>
                                <button onClick={() => setSelectedGatewayType('16ch')} className={`flex-1 py-1.5 px-3 rounded-md text-sm transition-colors ${selectedGatewayType === '16ch' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}>16-Channel</button>
                            </div>
                        </div>
                         <div className="flex-1">
                            <label className="text-sm text-on-surface-variant">Gateway Count</label>
                            <input type="number" min="1" value={gatewayCount} onChange={e => setGatewayCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-background p-2 rounded-lg border border-white/20 mt-1" />
                        </div>
                    </div>
                    <div className="mt-6 space-y-4">
                        <h4 className="font-semibold text-on-surface">Capacity Usage</h4>
                        {renderProgressBar(capacityUsage.streams, 'Streams')}
                        {renderProgressBar(capacityUsage.throughput, 'Throughput')}
                        {renderProgressBar(capacityUsage.storage, 'Storage')}
                        {!isStep2Valid && <p className="text-xs text-yellow-400 text-center mt-2">Your configuration does not meet the system load requirements.</p>}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
                 <button type="button" onClick={() => handleNavigateToStep(1)} className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">Back</button>
                 <button
                    type="button"
                    onClick={() => handleNavigateToStep(3)}
                    disabled={!isStep2Valid}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Next <ChevronsRightIcon className="inline w-4 h-4" />
                </button>
            </div>
        </div>
    );
    
    const renderStep3 = () => (
         <div className="p-3 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold">Step 3: Assign Streams to Gateways</h2>
            <p className="text-on-surface-variant mt-1 text-sm">Drag and drop streams to assign them to a gateway.</p>

            <div className="mt-4 flex justify-end gap-2">
                 <button onClick={handleAutoAssign} className="px-3 py-1.5 text-sm bg-surface hover:bg-white/10 border border-white/20 rounded-md">Auto-assign</button>
            </div>
            
            <div className="mt-3 grid grid-cols-1 xl:grid-cols-4 gap-3">
                <div
                    className={`xl:col-span-1 bg-surface p-3 rounded-lg border-2 h-fit transition-colors ${dragOverTarget === 'unassigned' ? 'border-primary-500' : 'border-white/10'}`}
                    onDragOver={(e) => handleDragOver(e, 'unassigned')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'unassigned')}
                >
                    <h3 className="text-base font-semibold mb-2">Unassigned Streams ({unassignedStreams.length})</h3>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                        {unassignedStreams.map(s => {
                            const availableGateways = getAvailableGateways(s);
                            return (
                                <div key={s.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, s)}
                                    className={`w-full text-left p-1.5 rounded-md border text-xs cursor-grab bg-background border-transparent ${draggedStream?.id === s.id ? 'opacity-50' : ''} relative`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate text-xs">{s.name}</p>
                                            <p className="text-on-surface-variant/80 font-mono text-xs">T: {s.throughput.toFixed(1)} MP/s, S: {s.storage.toFixed(1)} GB</p>
                                        </div>
                                        {availableGateways.length > 0 && (
                                            <div className="relative dropdown-container">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdown(openDropdown === s.id ? null : s.id);
                                                    }}
                                                    className="p-0.5 hover:bg-white/10 rounded"
                                                    title="Assign to gateway"
                                                >
                                                    <ChevronDownIcon className="w-3.5 h-3.5" />
                                                </button>
                                                {openDropdown === s.id && (
                                                    <div className="absolute right-0 top-full mt-0.5 w-44 bg-surface border border-white/20 rounded-md shadow-lg z-50 dropdown-container">
                                                        <div className="py-0.5">
                                                            {availableGateways.map(gateway => (
                                                                <button
                                                                    key={gateway.id}
                                                                    onClick={() => {
                                                                        handleAssignToGateway(s, gateway.id);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-white/10 flex items-center gap-2"
                                                                >
                                                                    <VideoGatewayIcon className="w-3.5 h-3.5 text-primary-400" />
                                                                    <span>Gateway #{gateway.id} ({gateway.type})</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gateways.map(gw => {
                        const spec = GATEWAY_SPECS[gw.type];
                        const usage = gw.assignedStreams.reduce((acc, s) => ({
                            streams: acc.streams + 1,
                            throughput: acc.throughput + s.throughput,
                            storage: acc.storage + s.storage
                        }), { streams: 0, throughput: 0, storage: 0 });
                        
                        return (
                            <div
                                key={gw.id}
                                className={`bg-surface p-3 rounded-lg border-2 transition-colors ${dragOverTarget === gw.id ? 'border-primary-500' : 'border-white/10'}`}
                                onDragOver={(e) => handleDragOver(e, gw.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, gw.id)}
                            >
                                <h3 className="text-base font-semibold flex items-center gap-2"><VideoGatewayIcon className="w-4 h-4 text-primary-400" />Gateway #{gw.id} ({gw.type})</h3>
                                <div className="mt-2 space-y-1.5 text-xs">
                                    {renderProgressBar((usage.streams / spec.maxStreams) * 100, `Streams: ${usage.streams}/${spec.maxStreams}`)}
                                    {renderProgressBar((usage.throughput / spec.maxThroughput) * 100, `Throughput: ${usage.throughput.toFixed(1)}/${spec.maxThroughput} MP/s`)}
                                    {renderProgressBar((usage.storage / spec.maxStorage) * 100, `Storage: ${usage.storage.toFixed(1)}/${spec.maxStorage} GB`)}
                                </div>
                                <div className="mt-3 space-y-1 min-h-[40px]">
                                    {gw.assignedStreams.map(s => (
                                        <div key={s.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, s)}
                                            className="bg-background p-1 rounded-md flex items-center justify-between text-xs cursor-grab">
                                            <div className="truncate">
                                                <p className="font-bold truncate text-xs">{s.name}</p>
                                                <p className="text-on-surface-variant/80 font-mono text-xs">T: {s.throughput.toFixed(1)}, S: {s.storage.toFixed(1)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                 </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
                 <button type="button" onClick={() => handleNavigateToStep(2)} className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">Back</button>
                 <button type="button" onClick={handleFinish} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">Finish & Save</button>
            </div>
        </div>
    );


    return (
        <div ref={viewRef} className="w-full h-full flex flex-col">
            <header className="p-2 sm:p-4 md:p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                    Gateway Calculator
                </h1>
                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={resetState} className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-md hover:bg-white/10">Reset</button>
                    <button onClick={() => setIsHelpOpen(true)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10"><HelpCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    <button onClick={onFinish} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-background">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
            {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
        </div>
    );
};

export default GatewayCalculator;
