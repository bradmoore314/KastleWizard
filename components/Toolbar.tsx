import React, { useState, useRef, useEffect } from 'react';
import { Tool, DeviceEdit } from '../types';
import { SelectIcon, PanIcon, TextIcon, ImageIcon, DrawIcon, DownloadIcon, ZoomInIcon, ZoomOutIcon, RectangleIcon, UndoIcon, RedoIcon, BringToFrontIcon, SendToBackIcon, ConduitIcon, SameSizeIcon, PlaceFromInventoryIcon, AddIcon, MoreVerticalIcon } from './Icons';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';

interface ToolbarProps {
  selectedTool: Tool;
  onSelectTool: (tool: Tool) => void;
  onAddItem: () => void;
  onDownload: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomLevel: number;
  isProcessing: boolean;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  selectedEditIds: string[];
  onBringToFront: () => void;
  onSendToBack: () => void;
  unplacedDevices: DeviceEdit[];
  onSelectDeviceToPlace: (device: DeviceEdit) => void;
  activeFloorplanId: string;
}

const baseTools: { name: Tool; icon: React.FC<React.SVGProps<SVGSVGElement>>; title: string }[] = [
  { name: 'select', icon: SelectIcon, title: 'Select (V)' },
  { name: 'pan', icon: PanIcon, title: 'Pan (H)' },
  { name: 'conduit', icon: ConduitIcon, title: 'Conduit' },
  { name: 'text', icon: TextIcon, title: 'Text' },
  { name: 'draw', icon: DrawIcon, title: 'Draw' },
  { name: 'rectangle', icon: RectangleIcon, title: 'Rectangle' },
];

// Split tools for responsive mobile view
const primaryTools = baseTools.slice(0, 2); // Select, Pan
const secondaryTools = baseTools.slice(2); // The rest

const getDeviceLabel = (device: DeviceEdit) => {
    const data = device.data as any;
    return data.location || 'Unnamed Device';
}

const TooltipWrapper: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
  const [show, setShow] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = window.setTimeout(() => {
      setShow(true);
    }, 300); // Small delay to prevent flashing
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShow(false);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {show && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md pointer-events-none whitespace-nowrap z-20">{title}</div>}
    </div>
  )
};

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool, onSelectTool, onAddItem, onDownload, onZoomIn, onZoomOut, zoomLevel, isProcessing,
  canUndo, onUndo, canRedo, onRedo, selectedEditIds, onBringToFront, onSendToBack,
  unplacedDevices, onSelectDeviceToPlace, activeFloorplanId
}) => {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const moreToolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (inventoryRef.current && !inventoryRef.current.contains(event.target as Node)) {
            setIsInventoryOpen(false);
        }
        if (moreToolsRef.current && !moreToolsRef.current.contains(event.target as Node)) {
            setIsMoreToolsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelectAndPlace = (device: DeviceEdit) => {
      onSelectDeviceToPlace(device);
      setIsInventoryOpen(false);
  }

  const renderToolButton = (name: Tool, Icon: React.FC<React.SVGProps<SVGSVGElement>>, title: string) => {
      return (
        <TooltipWrapper key={name} title={title}>
            <button
              onClick={() => onSelectTool(name)}
              className={`p-3 rounded-lg transition-colors ${selectedTool === name ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}
            >
              <Icon className="w-5 h-5" />
            </button>
        </TooltipWrapper>
      );
  }
  
  const isSecondaryToolSelected = secondaryTools.some(tool => tool.name === selectedTool);

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:right-auto p-1.5 bg-surface/80 backdrop-blur-md rounded-xl border border-white/10 flex flex-row items-center gap-1 shadow-2xl z-50 overflow-x-auto">
      <div className="flex flex-row items-center gap-1 whitespace-nowrap">
        <TooltipWrapper title="Undo (Ctrl+Z)">
            <button onClick={onUndo} disabled={!canUndo} className="p-3 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <UndoIcon className="w-5 h-5" />
            </button>
        </TooltipWrapper>
        <TooltipWrapper title="Redo (Ctrl+Y)">
            <button onClick={onRedo} disabled={!canRedo} className="p-3 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <RedoIcon className="w-5 h-5" />
            </button>
        </TooltipWrapper>
      
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        
        {/* --- DESKTOP TOOLS --- */}
        <div className="hidden md:flex flex-row items-center gap-1">
            {baseTools.map(({ name, icon: Icon, title }) => renderToolButton(name, Icon, title))}
        </div>

        {/* --- MOBILE TOOLS --- */}
        <div className="flex md:hidden flex-row items-center gap-1">
            {primaryTools.map(({ name, icon: Icon, title }) => renderToolButton(name, Icon, title))}
            
            <div className="relative" ref={moreToolsRef}>
                <TooltipWrapper title="More Tools">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMoreToolsOpen(prev => !prev); }}
                        className={`p-3 rounded-lg transition-colors ${isSecondaryToolSelected ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}
                    >
                        <MoreVerticalIcon className="w-5 h-5" />
                    </button>
                </TooltipWrapper>
                {isMoreToolsOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface border border-white/10 rounded-lg shadow-xl z-10">
                        <ul className="py-1 max-h-72 overflow-y-auto">
                            {secondaryTools.map(tool => (
                                <li key={tool.name}>
                                    <button 
                                      onClick={() => { onSelectTool(tool.name); setIsMoreToolsOpen(false); }}
                                      className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/10 ${selectedTool === tool.name ? 'text-primary-400 font-semibold' : 'text-on-surface-variant'}`}
                                    >
                                      <tool.icon className="w-5 h-5" />
                                      <span>{tool.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>


        <div className="w-px h-6 bg-white/10 mx-1"></div>

        <TooltipWrapper title="Add Item">
          <button onClick={onAddItem} className="p-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
            <AddIcon className="w-5 h-5" />
          </button>
        </TooltipWrapper>
      
        <div className="relative group" ref={inventoryRef}>
            <TooltipWrapper title="Place from Inventory">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsInventoryOpen(prev => !prev);
                    }}
                    disabled={unplacedDevices.length === 0 || activeFloorplanId === 'project-level-inventory'}
                    className={`p-3 rounded-lg transition-colors ${selectedTool === 'place-item' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <PlaceFromInventoryIcon className="w-5 h-5" />
                </button>
            </TooltipWrapper>
            {isInventoryOpen && unplacedDevices.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mb-2 w-64 bg-surface border border-white/10 rounded-lg shadow-xl z-10">
                    <div className="p-2 font-semibold text-on-surface text-sm border-b border-white/10">Unplaced Devices</div>
                    <ul className="py-1 max-h-72 overflow-y-auto">
                        {unplacedDevices.map(device => (
                            <li key={device.id}>
                                <button 
                                  onClick={() => handleSelectAndPlace(device)}
                                  className="w-full text-left flex items-center justify-between gap-3 px-3 py-1.5 text-sm text-on-surface-variant hover:bg-white/10"
                                >
                                  <span className='truncate'>{getDeviceLabel(device)}</span>
                                  <span className='text-xs opacity-60 flex-shrink-0'>({device.deviceType})</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        <div className="hidden md:flex items-center gap-1">
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <TooltipWrapper title="Bring to Front">
          <button onClick={onBringToFront} disabled={selectedEditIds.length === 0} className="p-3 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <BringToFrontIcon className="w-5 h-5" />
          </button>
          </TooltipWrapper>
          <TooltipWrapper title="Send to Back">
          <button onClick={onSendToBack} disabled={selectedEditIds.length === 0} className="p-3 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <SendToBackIcon className="w-5 h-5" />
          </button>
          </TooltipWrapper>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <TooltipWrapper title="Zoom Out">
            <button onClick={onZoomOut} className="p-3 rounded-lg hover:bg-white/10 transition-colors">
              <ZoomOutIcon className="w-5 h-5" />
            </button>
          </TooltipWrapper>
          <span className="text-sm font-mono w-16 text-center">{Math.round(zoomLevel * 100)}%</span>
          <TooltipWrapper title="Zoom In">
            <button onClick={onZoomIn} className="p-3 rounded-lg hover:bg-white/10 transition-colors">
              <ZoomInIcon className="w-5 h-5" />
            </button>
          </TooltipWrapper>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
        </div>
        <TooltipWrapper title="Download PDF">
          <button onClick={onDownload} disabled={isProcessing} className="flex items-center gap-2 p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <DownloadIcon className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">{isProcessing ? 'Saving...' : 'Download'}</span>
          </button>
        </TooltipWrapper>
      </div>
    </div>
  );
};

export default Toolbar;