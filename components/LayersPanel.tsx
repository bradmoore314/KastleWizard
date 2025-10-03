import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EyeIcon as Eye, EyeOffIcon as EyeOff, GridIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';

const LAYER_KEYS: Record<string, string[]> = {
    'Cameras': ['camera-indoor', 'camera-outdoor'],
    'Access Doors': ['access-door-interior', 'access-door-perimeter'],
    'Elevators': ['elevator'],
    'Intercoms': ['intercom'],
    'Turnstiles': ['turnstile'],
    'Markers': Object.keys(EQUIPMENT_CONFIG).filter(k => EQUIPMENT_CONFIG[k].type === 'marker')
};


const LayersPanel: React.FC = () => {
    const { visibleLayers, isGridVisible } = useAppState();
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = (keys: string[]) => {
        // A bit smarter toggle: if any are visible, hide all. If all are hidden, show all.
        const isAnyVisible = keys.some(key => visibleLayers.has(key));

        keys.forEach(key => {
            if (isAnyVisible) { // If any are on, turn all off
                if (visibleLayers.has(key)) {
                    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', payload: key });
                }
            } else { // If all are off, turn all on
                 if (!visibleLayers.has(key)) {
                    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', payload: key });
                }
            }
        });
    };

    const handleShowAllLayers = () => {
        // Make all layers visible
        Object.keys(EQUIPMENT_CONFIG).forEach(key => {
            if (!visibleLayers.has(key)) {
                dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', payload: key });
            }
        });
    };
    
    // Determine if the layer group is visible (if at least one sub-item is visible)
    const isLayerGroupVisible = (keys: string[]) => keys.some(key => visibleLayers.has(key));

    return (
        <div className="bg-surface/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg w-56">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-on-surface font-semibold"
            >
                <span>Layers</span>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isOpen && (
                <div className="p-3 border-t border-white/10">
                    <div className="mb-3">
                        <button 
                            onClick={handleShowAllLayers}
                            className="w-full px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                        >
                            Show All Layers
                        </button>
                    </div>
                    <ul className="space-y-2">
                        {Object.entries(LAYER_KEYS).map(([label, keys]) => (
                            <li key={label} className="flex items-center justify-between gap-3">
                                <span className="text-sm text-on-surface-variant flex-1">{label}</span>
                                <button onClick={() => handleToggle(keys)} className="p-1 rounded-full hover:bg-white/20">
                                    {isLayerGroupVisible(keys) ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-on-surface-variant/50" />}
                                </button>
                            </li>
                        ))}
                         <div className="border-t border-white/10 my-2"></div>
                         <li className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-on-surface-variant flex-1">
                               <GridIcon className="w-4 h-4" />
                               <span>Coordinate Grid</span>
                            </div>
                            <button onClick={() => dispatch({ type: 'TOGGLE_GRID_VISIBILITY' })} className="p-1 rounded-full hover:bg-white/20">
                                {isGridVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-on-surface-variant/50" />}
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LayersPanel;