import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, MouseEvent } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { AnyEdit, Tool, DeviceEdit, MarkerEdit, TextEdit, DrawingEdit, RectangleEdit, ConduitEdit, CameraData } from '../types';
import { getEditIconKey } from '../utils';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';
import { useAppState, useAppDispatch } from '../state/AppContext';

// Handle exposed to parent component
export interface PdfViewerHandle {
  zoomIn: () => void;
  zoomOut: () => void;
}

// Props for the component
interface PdfViewerProps {
  pdfJsDoc: PDFDocumentProxy | null;
  currentPage: number;
  edits: AnyEdit[];
  updateEdits: (previous: AnyEdit[], current: AnyEdit[]) => void;
  addPlacedEdit: (edit: AnyEdit) => void;
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  selectedEditIds: string[];
  setSelectedEditIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  pageDimensions: { width: number; height: number }[];
  onShowTooltip: (edit: AnyEdit, event: React.MouseEvent) => void;
  onHideTooltip: () => void;
  onPlaceItem: (x: number, y: number) => void;
  onOpenDeviceFormOnDoubleClick: (device: DeviceEdit) => void;
  onOpenMarkerFormOnDoubleClick: (marker: MarkerEdit) => void;
  startEditingTextId: string | null;
  onStartEditingText: (id: string | null) => void;
  onEndEditingText: () => void;
  onViewportChange: (viewport: { zoom: number; pan: { x: number; y: number } }) => void;
  isDefiningAiArea: boolean;
  onAiAreaDefined: (area: { x: number; y: number; width: number; height: number }) => void;
}

const hexToRgba = (hex: string, alpha: number) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const generateCloudPath = (width: number, height: number, puffRadius: number = 8): string => {
    const puffs = (p1: {x:number, y:number}, p2: {x:number, y:number}, puffNo?: number) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const puffLen = Math.sqrt(dx * dx + dy * dy);
        const puffNum = puffNo || Math.round(puffLen / (puffRadius * 1.5));
        if (puffNum === 0) return '';
        const puffUnit = { x: dx / puffNum, y: dy / puffNum };

        let path = '';
        for (let i = 1; i <= puffNum; i++) {
            const p = { x: p1.x + i * puffUnit.x, y: p1.y + i * puffUnit.y };
            const m = { x: p.x - puffUnit.x / 2, y: p.y - puffUnit.y / 2 };
            const r = { x: puffUnit.y / 2, y: -puffUnit.x / 2 };
            const rLen = Math.sqrt(r.x * r.x + r.y * r.y);
            if (rLen === 0) continue;
            r.x *= puffRadius / rLen;
            r.y *= puffRadius / rLen;
            path += ` Q ${m.x + r.x},${m.y + r.y} ${p.x},${p.y}`;
        }
        return path;
    };

    let path = `M0,0`;
    path += puffs({ x: 0, y: 0 }, { x: width, y: 0 });
    path += puffs({ x: width, y: 0 }, { x: width, y: height });
    path += puffs({ x: width, y: height }, { x: 0, y: height });
    path += puffs({ x: 0, y: height }, { x: 0, y: 0 });

    return path + ' Z';
};


type DragState = {
    type: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'fov-distance-rotate' | 'fov-angle-start' | 'fov-angle-end';
    editId: string;
    originalEdit: AnyEdit;
    startX: number;
    startY: number;
} | null;

const degToRad = (deg: number) => deg * (Math.PI / 180);

const SelectionBox: React.FC<{ edit: AnyEdit; zoom: number; onMouseDown: (e: MouseEvent<SVGElement>, edit: AnyEdit, type: DragState['type']) => void; isSingleSelection: boolean; }> = ({ edit, zoom, onMouseDown, isSingleSelection }) => {
    if (!edit) return null;
    const handleSize = 8 / zoom;
    const strokeWidth = Math.min(2, 1 / zoom);
    const isSquare = edit.type === 'device' || edit.type === 'marker';
    
    return (
        <g transform={`rotate(${edit.rotation} ${edit.x + edit.width/2} ${edit.y + edit.height/2})`}>
            <rect x={edit.x} y={edit.y} width={edit.width} height={edit.height} fill="none" stroke="#007bff" strokeWidth={strokeWidth} strokeDasharray={`${4/zoom} ${2/zoom}`} />
            {isSingleSelection && (
                <>
                    <rect onMouseDown={e => onMouseDown(e, edit, 'resize-tl')} className="cursor-nwse-resize" x={edit.x - handleSize/2} y={edit.y - handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#007bff" strokeWidth={0.5/zoom} />
                    <rect onMouseDown={e => onMouseDown(e, edit, 'resize-tr')} className="cursor-nesw-resize" x={edit.x + edit.width - handleSize/2} y={edit.y - handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#007bff" strokeWidth={0.5/zoom} />
                    <rect onMouseDown={e => onMouseDown(e, edit, 'resize-bl')} className="cursor-nesw-resize" x={edit.x - handleSize/2} y={edit.y + edit.height - handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#007bff" strokeWidth={0.5/zoom} />
                    <rect onMouseDown={e => onMouseDown(e, edit, 'resize-br')} className="cursor-nwse-resize" x={edit.x + edit.width - handleSize/2} y={edit.y + edit.height - handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#007bff" strokeWidth={0.5/zoom} />
                </>
            )}
        </g>
    );
};

const CameraRenderer: React.FC<{
    edit: DeviceEdit;
    isSelected: boolean;
    isSingleSelection: boolean;
    zoom: number;
    onMouseDown: (e: MouseEvent<SVGElement>, edit: AnyEdit, type?: DragState['type']) => void;
    onMouseEnter: (e: MouseEvent<SVGElement>, edit: AnyEdit) => void;
    onMouseLeave: (e: MouseEvent<SVGElement>) => void;
}> = ({ edit, isSelected, isSingleSelection, zoom, onMouseDown, onMouseEnter, onMouseLeave }) => {
    const config = EQUIPMENT_CONFIG[getEditIconKey(edit)];
    const customColor = edit.data.color;
    const fovColor = customColor || '#007bff';
    if (!config) return null;

    const data = edit.data as CameraData;
    const label = data.location;
    const {
        fieldOfViewAngle: angle = 90,
        fieldOfViewDistance: distance = 100,
        fieldOfViewRotation: rotation = -90,
    } = data;
    
    const centerX = edit.x + edit.width / 2;
    const centerY = edit.y + edit.height / 2;
    
    // FOV Arc Calculations
    const startAngleRad = degToRad(rotation - angle / 2);
    const endAngleRad = degToRad(rotation + angle / 2);

    const startX = centerX + distance * Math.cos(startAngleRad);
    const startY = centerY + distance * Math.sin(startAngleRad);
    const endX = centerX + distance * Math.cos(endAngleRad);
    const endY = centerY + distance * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const fovPathData = [
        `M ${centerX},${centerY}`,
        `L ${startX},${startY}`,
        `A ${distance},${distance} 0 ${largeArcFlag} 1 ${endX},${endY}`,
        'Z'
    ].join(' ');

    // Handles calculations
    const midAngleRad = degToRad(rotation);
    const distanceHandleX = centerX + distance * Math.cos(midAngleRad);
    const distanceHandleY = centerY + distance * Math.sin(midAngleRad);

    const handleRadius = 6 / zoom;
    const handleStroke = 1 / zoom;

    // Label sizing constants
    const labelFontSize = 10;
    const labelPadding = 4;
    const textWidthEstimate = label ? label.length * labelFontSize * 0.55 : 0;
    const bgWidth = textWidthEstimate + labelPadding * 2;
    const bgHeight = labelFontSize + labelPadding * 2;
    const iconCenterX = edit.x + edit.width / 2;
    const labelY = edit.y + edit.height + labelPadding;

    return (
        <g>
            {/* FOV Cone (always visible, in the back) */}
            <path
                d={fovPathData}
                fill={fovColor}
                fillOpacity="0.3"
                stroke={fovColor}
                strokeWidth={Math.min(5, 1.5 / zoom)}
                strokeDasharray={`${5 / zoom} ${2 / zoom}`}
                style={{ pointerEvents: 'none' }}
            />

            {/* Main Camera Icon (in the middle) */}
            <g
                onMouseDown={(e) => onMouseDown(e, edit, 'move')}
                onMouseEnter={(e) => onMouseEnter(e, edit)}
                onMouseLeave={onMouseLeave}
                className="cursor-move"
            >
                <circle cx={centerX} cy={centerY} r={edit.width / 2} fill={customColor || config.pdfColor} />
                <text
                    x={centerX} y={centerY} fill="white" fontSize={Math.max(6, edit.width * 0.4)} fontWeight="bold"
                    textAnchor="middle" alignmentBaseline="central" style={{ pointerEvents: 'none' }}
                >
                    {config.pdfInitials}
                </text>
            </g>

            {isSelected && <SelectionBox edit={edit} zoom={zoom} onMouseDown={onMouseDown} isSingleSelection={isSingleSelection} />}

            {/* FOV Handles (on top, only when selected) */}
            {isSelected && isSingleSelection && (
                <g>
                    {/* Aim & Distance Handle */}
                    <circle
                        cx={distanceHandleX} cy={distanceHandleY} r={handleRadius}
                        fill="white" stroke={fovColor} strokeWidth={handleStroke}
                        className="cursor-move"
                        onMouseDown={(e) => onMouseDown(e, edit, 'fov-distance-rotate')}
                    />

                    {/* Angle Handles */}
                     <circle
                        cx={startX} cy={startY} r={handleRadius}
                        fill="white" stroke={fovColor} strokeWidth={handleStroke}
                        className="cursor-ew-resize"
                        onMouseDown={(e) => onMouseDown(e, edit, 'fov-angle-start')}
                    />
                     <circle
                        cx={endX} cy={endY} r={handleRadius}
                        fill="white" stroke={fovColor} strokeWidth={handleStroke}
                        className="cursor-ew-resize"
                        onMouseDown={(e) => onMouseDown(e, edit, 'fov-angle-end')}
                    />
                </g>
            )}

            {/* Label */}
            {label && (
                <g style={{ pointerEvents: 'none' }}>
                    <rect
                        x={iconCenterX - bgWidth / 2}
                        y={labelY}
                        width={bgWidth}
                        height={bgHeight}
                        rx="4"
                        ry="4"
                        fill="rgba(23, 23, 23, 0.8)"
                        stroke="#ffffff"
                        strokeWidth={Math.min(2, 0.5 / zoom)}
                        strokeOpacity={0.4}
                    />
                    <text
                        x={iconCenterX}
                        y={labelY + bgHeight / 2}
                        fill="white"
                        fontSize={labelFontSize}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {label}
                    </text>
                </g>
            )}
        </g>
    );
};

const EditRenderer: React.FC<{
    edit: AnyEdit;
    isSelected: boolean;
    isSingleSelection: boolean;
    zoom: number;
    onMouseDown: (e: MouseEvent<SVGElement>, edit: AnyEdit, type?: DragState['type']) => void;
    onMouseEnter: (e: MouseEvent<SVGElement>, edit: AnyEdit) => void;
    onMouseLeave: (e: MouseEvent<SVGElement>) => void;
}> = ({ edit, isSelected, isSingleSelection, zoom, onMouseDown, onMouseEnter, onMouseLeave }) => {
    const { visibleLayers } = useAppState();

    const getWrapperProps = () => ({
        onMouseDown: (e: MouseEvent<SVGElement>) => onMouseDown(e, edit, 'move'),
        onMouseEnter: (e: MouseEvent<SVGElement>) => onMouseEnter(e, edit),
        onMouseLeave: onMouseLeave,
        className: 'cursor-move',
    });

    if (edit.type === 'device' && edit.deviceType === 'camera') {
        return <CameraRenderer edit={edit} isSelected={isSelected} isSingleSelection={isSingleSelection} zoom={zoom} onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />;
    }

    if (edit.type === 'device' || edit.type === 'marker') {
        const iconKey = getEditIconKey(edit);
        if (!visibleLayers.has(iconKey)) {
            return null;
        }
    }
    
    switch (edit.type) {
        case 'device':
        case 'marker': {
            const config = EQUIPMENT_CONFIG[getEditIconKey(edit)];
            const customColor = edit.data.color;
            if (!config) return null;
            const label = (edit.data as any).location || (edit.data as any).label;
            
            // Proportional font size for initials inside the circle
            const fontSize = Math.max(6, edit.width * 0.4);

            // Label sizing constants
            const labelFontSize = 10;
            const labelPadding = 4;
            const textWidthEstimate = label ? label.length * labelFontSize * 0.55 : 0;
            const bgWidth = textWidthEstimate + labelPadding * 2;
            const bgHeight = labelFontSize + labelPadding * 2;
            const iconCenterX = edit.x + edit.width / 2;
            const labelY = edit.y + edit.height + labelPadding;
            
            return (
                <g>
                    <g {...getWrapperProps()}>
                        <g transform={`translate(${edit.x}, ${edit.y})`}>
                            <circle cx={edit.width / 2} cy={edit.height / 2} r={edit.width / 2} fill={customColor || config.pdfColor} />
                            <text
                                x={edit.width / 2} y={edit.height / 2} fill="white" fontSize={fontSize} fontWeight="bold"
                                textAnchor="middle" alignmentBaseline="central" style={{ pointerEvents: 'none' }}
                            >
                                {config.pdfInitials}
                            </text>
                        </g>
                    </g>
                    {isSelected && <SelectionBox edit={edit} zoom={zoom} onMouseDown={onMouseDown} isSingleSelection={isSingleSelection} />}
                     {label && (
                        <g style={{ pointerEvents: 'none' }}>
                            <rect
                                x={iconCenterX - bgWidth / 2}
                                y={labelY}
                                width={bgWidth}
                                height={bgHeight}
                                rx="4"
                                ry="4"
                                fill="rgba(23, 23, 23, 0.8)"
                                stroke="#ffffff"
                                strokeWidth={Math.min(2, 0.5 / zoom)}
                                strokeOpacity={0.4}
                            />
                            <text
                                x={iconCenterX}
                                y={labelY + bgHeight / 2}
                                fill="white"
                                fontSize={labelFontSize}
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                {label}
                            </text>
                        </g>
                    )}
                </g>
            );
        }
        case 'text': {
            const padding = edit.padding ?? 5;
            const borderElement = () => {
                if (!edit.borderWidth || edit.borderWidth <= 0) return null;
        
                const style = edit.borderStyle ?? 'solid';
                const strokeDasharray = style === 'dashed' 
                    ? `${edit.borderWidth * 2.5},${edit.borderWidth * 2.5}` 
                    : style === 'dotted' 
                    ? `${edit.borderWidth},${edit.borderWidth * 2}` 
                    : undefined;

                if (style === 'cloud') {
                    return (
                        <path
                            d={generateCloudPath(edit.width, edit.height)}
                            fill={edit.fillColor ? hexToRgba(edit.fillColor, edit.fillOpacity ?? 0.2) : 'none'}
                            stroke={edit.borderColor ?? 'black'}
                            strokeWidth={edit.borderWidth}
                        />
                    );
                }
                return (
                    <rect
                        x="0"
                        y="0"
                        width={edit.width}
                        height={edit.height}
                        fill={edit.fillColor ? hexToRgba(edit.fillColor, edit.fillOpacity ?? 0.2) : 'none'}
                        stroke={edit.borderColor ?? 'black'}
                        strokeWidth={edit.borderWidth}
                        strokeDasharray={strokeDasharray}
                    />
                );
            };

            const alignmentStyles: React.CSSProperties = {
                justifyContent: edit.textAlign === 'left' ? 'flex-start' : edit.textAlign === 'right' ? 'flex-end' : 'center',
                alignItems: edit.verticalAlign === 'top' ? 'flex-start' : edit.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                textAlign: edit.textAlign ?? 'center',
            };

            return (
                <g>
                    <g {...getWrapperProps()} transform={`translate(${edit.x}, ${edit.y}) rotate(${edit.rotation})`}>
                        {borderElement()}
                        <foreignObject x={0} y={0} width={edit.width} height={edit.height}>
                            {/* FIX: Removed the 'xmlns' attribute, which is not a valid prop for a div in React's typings and was causing a type error. */}
                            <div
                                style={{
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    width: '100%',
                                    height: '100%',
                                    padding: `${padding}px`,
                                    color: `rgb(${edit.color.join(',')})`,
                                    fontSize: `${edit.fontSize}px`,
                                    fontFamily: edit.fontFamily,
                                    lineHeight: edit.lineHeight,
                                    wordBreak: 'break-word',
                                    ...alignmentStyles
                                }}
                            >
                                <div>{edit.text}</div>
                            </div>
                        </foreignObject>
                    </g>
                    {isSelected && <SelectionBox edit={edit} zoom={zoom} onMouseDown={onMouseDown} isSingleSelection={isSingleSelection} />}
                </g>
            );
        }
        case 'rectangle':
            return (
                <g {...getWrapperProps()}>
                    <rect
                        x={edit.x} y={edit.y} width={edit.width} height={edit.height}
                        fill={hexToRgba(edit.fillColor, edit.fillOpacity)}
                        stroke={edit.color} strokeWidth={edit.strokeWidth}
                        transform={`rotate(${edit.rotation} ${edit.x + edit.width/2} ${edit.y + edit.height/2})`}
                    />
                    {isSelected && <SelectionBox edit={edit} zoom={zoom} onMouseDown={onMouseDown} isSingleSelection={isSingleSelection} />}
                </g>
            );
        case 'draw':
            return (
                 <g {...getWrapperProps()}>
                    <path
                        d={edit.path} fill="none" stroke={edit.color} strokeWidth={edit.strokeWidth}
                        transform={`translate(${edit.x} ${edit.y}) scale(${edit.width/edit.originalWidth} ${edit.height/edit.originalHeight})`}
                    />
                     {isSelected && <rect x={edit.x} y={edit.y} width={edit.width} height={edit.height} fill="none" stroke="#007bff" strokeWidth={Math.min(5, 2 / zoom)} />}
                </g>
            );
        case 'conduit':
             return (
                <g {...getWrapperProps()}>
                    <line
                        x1={edit.x} y1={edit.y} x2={edit.x + edit.width} y2={edit.y + edit.height}
                        stroke={edit.color} strokeWidth={edit.strokeWidth}
                    />
                     {isSelected && <rect x={Math.min(edit.x, edit.x + edit.width)} y={Math.min(edit.y, edit.y + edit.height)} width={Math.abs(edit.width)} height={Math.abs(edit.height)} fill="none" stroke="#007bff" strokeWidth={Math.min(5, 2 / zoom)} />}
                </g>
            );
        default:
            return null;
    }
};

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>((props, ref) => {
    const { pdfJsDoc, currentPage, edits, pageDimensions, updateEdits } = props;
    const { isGridVisible } = useAppState();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<RenderTask | null>(null);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    
    const [dragState, setDragState] = useState<DragState | null>(null);
    const lastClickRef = useRef<{ time: number; editId: string | null }>({ time: 0, editId: null });
    const dragStartCoords = useRef({ x: 0, y: 0 });
    const [currentDrawing, setCurrentDrawing] = useState<AnyEdit | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

    const [editingText, setEditingText] = useState<{ id: string; value: string } | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    
    const RENDER_SCALE = 3; // Use a higher fixed scale for sharper rendering on zoom.

    const updateViewport = useCallback((newZoom: number, newPan: { x: number; y: number }) => {
        setZoom(newZoom);
        setPan(newPan);
        props.onViewportChange({ zoom: newZoom, pan: newPan });
    }, [props.onViewportChange]);
    
    const screenToPdfCoords = useCallback((screenX: number, screenY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const x = (screenX - rect.left - pan.x) / zoom;
        const y = (screenY - rect.top - pan.y) / zoom;
        return { x, y };
    }, [zoom, pan]);
    
    useEffect(() => {
        if (props.startEditingTextId) {
            const edit = props.edits.find(e => e.id === props.startEditingTextId) as TextEdit | undefined;
            if (edit) {
                setEditingText({ id: edit.id, value: edit.text });
                setTimeout(() => textAreaRef.current?.focus(), 0);
            }
        } else {
            setEditingText(null);
        }
    }, [props.startEditingTextId, props.edits]);

    useEffect(() => {
        if (pdfJsDoc) {
            const pageDim = pageDimensions[currentPage - 1];
            if (containerRef.current && pageDim) {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleX = clientWidth / pageDim.width;
                const scaleY = clientHeight / pageDim.height;
                const initialZoom = Math.min(scaleX, scaleY) * 0.95;
                const initialPanX = (clientWidth - pageDim.width * initialZoom) / 2;
                const initialPanY = (clientHeight - pageDim.height * initialZoom) / 2;
                updateViewport(initialZoom, { x: initialPanX, y: initialPanY });
            }
        }
    }, [pdfJsDoc, currentPage, pageDimensions, updateViewport]);

    useEffect(() => {
        if (renderTaskRef.current) renderTaskRef.current.cancel();
        if (!pdfJsDoc || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        pdfJsDoc.getPage(currentPage).then(page => {
            const pageDim = pageDimensions[currentPage - 1] || { width: 612, height: 792 };
            
            // Set the canvas backing store size to the scaled resolution for sharpness
            canvas.width = pageDim.width * RENDER_SCALE;
            canvas.height = pageDim.height * RENDER_SCALE;
            
            // Set the canvas display size back to the original PDF dimensions
            canvas.style.width = `${pageDim.width}px`;
            canvas.style.height = `${pageDim.height}px`;

            const viewport = page.getViewport({ scale: RENDER_SCALE });
            // FIX: Add 'canvas' property to render parameters to align with pdf.js v4+ API.
            renderTaskRef.current = page.render({ canvas: canvas, canvasContext: context, viewport });
        });
    }, [pdfJsDoc, currentPage, pageDimensions, RENDER_SCALE]);

     useEffect(() => {
        const gridCanvas = gridCanvasRef.current;
        if (!gridCanvas) return;

        const pageDim = pageDimensions[currentPage - 1] || { width: 612, height: 792 };

        // Set the canvas backing store size for sharpness
        gridCanvas.width = pageDim.width * RENDER_SCALE;
        gridCanvas.height = pageDim.height * RENDER_SCALE;

        // Set the canvas display size
        gridCanvas.style.width = `${pageDim.width}px`;
        gridCanvas.style.height = `${pageDim.height}px`;
        
        const ctx = gridCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        if (!isGridVisible) return;

        // Scale the canvas context to draw crisp lines on high-DPI screens
        ctx.scale(RENDER_SCALE, RENDER_SCALE);

        // --- Grid Drawing Logic ---
        const niceSteps = [10, 20, 25, 50, 100, 200, 500];
        const targetSpacingOnScreen = 75; // px
        const targetSpacingInPdf = targetSpacingOnScreen / zoom;
        const gridSpacing = niceSteps.find(step => step > targetSpacingInPdf) || 500;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = Math.min(2, 1 / zoom);
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

        // Vertical lines and labels
        for (let x = 0; x <= pageDim.width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, pageDim.height);
            ctx.stroke();
            ctx.fillText(String(x), x + 4 / zoom, 12 / zoom);
        }
        // Horizontal lines and labels
        for (let y = 0; y <= pageDim.height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(pageDim.width, y);
            ctx.stroke();
             if (y > 0) { // Don't draw over the top labels
                 ctx.fillText(String(y), 4 / zoom, y - 4 / zoom);
            }
        }

    }, [isGridVisible, zoom, currentPage, pageDimensions, RENDER_SCALE]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const scaleFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
        updateViewport(newZoom, { x: newPanX, y: newPanY });
    }, [zoom, pan, updateViewport]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const { x, y } = screenToPdfCoords(e.clientX, e.clientY);
        dragStartCoords.current = { x: e.clientX, y: e.clientY };
        
        if (props.selectedTool === 'pan' || e.button === 1) {
            setDragState({ type: 'move', editId: 'pan', originalEdit: {x:pan.x, y:pan.y} as any, startX: e.clientX, startY: e.clientY });
            return;
        }

        if (props.isDefiningAiArea) {
            setIsSelecting(true);
            setSelectionBox({ x, y, width: 0, height: 0 });
            return;
        }

        switch (props.selectedTool) {
            case 'draw':
            case 'rectangle':
            case 'conduit': {
                const type = props.selectedTool;
                 setCurrentDrawing({
                    id: crypto.randomUUID(), type, path: `M ${x} ${y}`, x, y, width: 0, height: 0,
                    color: type === 'conduit' ? '#0000ff' : '#ff0000', strokeWidth: type === 'conduit' ? 3 : 2,
                    originalWidth: 1, originalHeight: 1, pageIndex: currentPage - 1, rotation: 0,
                    fillColor: '#ff0000', fillOpacity: 0.2
                } as any);
                break;
            }
            case 'select':
                setIsSelecting(true);
                setSelectionBox({ x, y, width: 0, height: 0 });
                break;
        }
    }, [screenToPdfCoords, props.selectedTool, props.isDefiningAiArea, pan, currentPage]);
    
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (dragState) {
            const pdfCoords = screenToPdfCoords(e.clientX, e.clientY);
            const dx = (e.clientX - dragState.startX) / zoom;
            const dy = (e.clientY - dragState.startY) / zoom;
            const { type, originalEdit } = dragState;
            
            if (type === 'move' && dragState.editId === 'pan') {
                 updateViewport(zoom, { x: originalEdit.x + (e.clientX - dragState.startX), y: originalEdit.y + (e.clientY - dragState.startY) });
                 return;
            }

            let updatedEdit = edits.find(ed => ed.id === dragState.editId)!;
            if (!updatedEdit) return;
            
            const isSquare = updatedEdit.type === 'device' || updatedEdit.type === 'marker';

            switch (type) {
                case 'move':
                    updatedEdit = { ...updatedEdit, x: originalEdit.x + dx, y: originalEdit.y + dy };
                    break;
                case 'resize-br': {
                    let newWidth = originalEdit.width + dx;
                    let newHeight = originalEdit.height + dy;
                    if (isSquare) {
                        const delta = (dx + dy) / 2;
                        newWidth = originalEdit.width + delta;
                        newHeight = originalEdit.height + delta;
                    }
                    updatedEdit = { ...updatedEdit, width: Math.max(10, newWidth), height: Math.max(10, newHeight) };
                    break;
                }
                case 'resize-bl': {
                    let newWidth = originalEdit.width - dx;
                    let newHeight = originalEdit.height + dy;
                    let x = originalEdit.x + dx;
                    if (isSquare) {
                        const delta = (-dx + dy) / 2;
                        newWidth = originalEdit.width + delta;
                        newHeight = originalEdit.height + delta;
                        x = originalEdit.x - delta;
                    }
                    updatedEdit = { ...updatedEdit, x: x, width: Math.max(10, newWidth), height: Math.max(10, newHeight) };
                    break;
                }
                case 'resize-tr': {
                    let newWidth = originalEdit.width + dx;
                    let newHeight = originalEdit.height - dy;
                    let y = originalEdit.y + dy;
                    if (isSquare) {
                        const delta = (dx - dy) / 2;
                        newWidth = originalEdit.width + delta;
                        newHeight = originalEdit.height + delta;
                        y = originalEdit.y - delta;
                    }
                    updatedEdit = { ...updatedEdit, y: y, width: Math.max(10, newWidth), height: Math.max(10, newHeight) };
                    break;
                }
                case 'resize-tl': {
                    let newWidth = originalEdit.width - dx;
                    let newHeight = originalEdit.height - dy;
                    let x = originalEdit.x + dx;
                    let y = originalEdit.y + dy;
                    if (isSquare) {
                        const delta = (-dx - dy) / 2;
                        newWidth = originalEdit.width + delta;
                        newHeight = originalEdit.height + delta;
                        x = originalEdit.x - delta;
                        y = originalEdit.y - delta;
                    }
                    updatedEdit = { ...updatedEdit, x: x, y: y, width: Math.max(10, newWidth), height: Math.max(10, newHeight) };
                    break;
                }
                case 'fov-distance-rotate': {
                    if (updatedEdit.type !== 'device' || updatedEdit.deviceType !== 'camera') break;
                    const centerX = originalEdit.x + originalEdit.width / 2;
                    const centerY = originalEdit.y + originalEdit.height / 2;
                    const deltaX = pdfCoords.x - centerX;
                    const deltaY = pdfCoords.y - centerY;
                    const newDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const newRotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                    updatedEdit = { ...updatedEdit, data: { ...updatedEdit.data, fieldOfViewDistance: newDistance, fieldOfViewRotation: newRotation }};
                    break;
                }
                case 'fov-angle-start':
                case 'fov-angle-end': {
                    if (updatedEdit.type !== 'device' || updatedEdit.deviceType !== 'camera' || originalEdit.type !== 'device' || originalEdit.deviceType !== 'camera') break;
                    
                    const { fieldOfViewRotation = -90, fieldOfViewAngle = 90 } = (originalEdit.data as CameraData);
                    const centerX = originalEdit.x + originalEdit.width / 2;
                    const centerY = originalEdit.y + originalEdit.height / 2;
                    
                    const cursorAngleRad = Math.atan2(pdfCoords.y - centerY, pdfCoords.x - centerX);

                    let newAngleRad;
                    let newRotationRad;

                    if (type === 'fov-angle-start') {
                        const endAngleRad = degToRad(fieldOfViewRotation + fieldOfViewAngle / 2);
                        const newStartAngleRad = cursorAngleRad;
                        newAngleRad = endAngleRad - newStartAngleRad;
                        if (newAngleRad < 0) {
                            newAngleRad += 2 * Math.PI;
                        }
                        newRotationRad = newStartAngleRad + newAngleRad / 2;
                    } else { // fov-angle-end
                        const startAngleRad = degToRad(fieldOfViewRotation - fieldOfViewAngle / 2);
                        const newEndAngleRad = cursorAngleRad;
                        newAngleRad = newEndAngleRad - startAngleRad;
                        if (newAngleRad < 0) {
                            newAngleRad += 2 * Math.PI;
                        }
                        newRotationRad = startAngleRad + newAngleRad / 2;
                    }

                    // Cap angle just below 360 to prevent SVG path rendering issues where start and end points are identical
                    const newAngleDeg = Math.min(newAngleRad * (180 / Math.PI), 359.9);
                    const newRotationDeg = newRotationRad * (180 / Math.PI);
                    
                    updatedEdit = { 
                        ...updatedEdit, 
                        data: { 
                            ...updatedEdit.data, 
                            fieldOfViewAngle: newAngleDeg, 
                            fieldOfViewRotation: newRotationDeg 
                        }
                    };
                    break;
                }
            }
            setCurrentDrawing(updatedEdit);
            return;
        }

        const { x, y } = screenToPdfCoords(e.clientX, e.clientY);

        if (currentDrawing) {
            switch (currentDrawing.type) {
                case 'draw':
                    setCurrentDrawing(prev => ({...prev!, path: (prev as DrawingEdit).path + ` L ${x} ${y}`}));
                    break;
                case 'rectangle':
                    setCurrentDrawing(prev => ({ ...prev!, width: x - prev!.x, height: y - prev!.y }));
                    break;
                case 'conduit':
                    setCurrentDrawing(prev => ({ ...prev!, width: x - prev!.x, height: y - prev!.y }));
                    break;
            }
        }
        
        if (isSelecting && selectionBox) {
            setSelectionBox(prev => ({ ...prev!, width: x - prev!.x, height: y - prev!.y }));
        }
    }, [dragState, screenToPdfCoords, zoom, updateViewport, edits, currentDrawing, isSelecting, selectionBox]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (dragState) {
            if (dragState.editId !== 'pan' && currentDrawing) {
                updateEdits([dragState.originalEdit], [currentDrawing]);
            }
            setDragState(null);
            setCurrentDrawing(null);
            return;
        }
        
        const { x, y } = screenToPdfCoords(e.clientX, e.clientY);
        const wasClick = Math.hypot(e.clientX - dragStartCoords.current.x, e.clientY - dragStartCoords.current.y) < 5;

        if (wasClick && props.selectedTool === 'text') {
            const newTextEdit: TextEdit = {
                id: crypto.randomUUID(), type: 'text', text: '',
                fontSize: 16, color: [0, 0, 0], lineHeight: 1.2, fontFamily: 'Helvetica',
                pageIndex: currentPage - 1, x, y, width: 150, height: 40, rotation: 0,
                borderColor: '#ff0000',
                borderWidth: 2,
                borderStyle: 'solid',
                fillColor: '#ffff00',
                fillOpacity: 0.3,
                padding: 5,
                textAlign: 'center',
                verticalAlign: 'middle',
            };
            props.addPlacedEdit(newTextEdit);
            props.onStartEditingText(newTextEdit.id);
            props.setSelectedTool('select');
            return;
        }
    
        if (currentDrawing) {
            if (wasClick) { // Discard tiny drawings
                setCurrentDrawing(null);
                return;
            }
            let finalEdit = { ...currentDrawing };
            if (finalEdit.type === 'rectangle' || finalEdit.type === 'conduit') {
                if (finalEdit.width < 0) { finalEdit.x += finalEdit.width; finalEdit.width *= -1; }
                if (finalEdit.height < 0) { finalEdit.y += finalEdit.height; finalEdit.height *= -1; }
            } else if (finalEdit.type === 'draw') {
                const points = (finalEdit as DrawingEdit).path.split(/[ML]/).slice(1).map(p => p.trim().split(' ').map(Number));
                const minX = Math.min(...points.map(p => p[0]));
                const minY = Math.min(...points.map(p => p[1]));
                const maxX = Math.max(...points.map(p => p[0]));
                const maxY = Math.max(...points.map(p => p[1]));
                finalEdit = {
                  ...finalEdit, x: minX, y: minY, width: maxX - minX, height: maxY - minY,
                  originalWidth: (maxX-minX) || 1, originalHeight: (maxY-minY) || 1,
                  path: points.map(p => `L ${p[0] - minX} ${p[1] - minY}`).join(' ').replace('L', 'M')
                }
            }
            props.addPlacedEdit(finalEdit);
            setCurrentDrawing(null);
            return;
        }
    
        if (isSelecting && selectionBox) {
            const selW = Math.abs(x - selectionBox.x);
            const selH = Math.abs(y - selectionBox.y);
    
            if (props.isDefiningAiArea) {
                const finalBox = { ...selectionBox, width: x - selectionBox.x, height: y - selectionBox.y };
                if (finalBox.width < 0) { finalBox.x += finalBox.width; finalBox.width *= -1; }
                if (finalBox.height < 0) { finalBox.y += finalBox.height; finalBox.height *= -1; }
                props.onAiAreaDefined(finalBox);
            } else if (selW > 5 || selH > 5) {
                const selX = Math.min(selectionBox.x, x);
                const selY = Math.min(selectionBox.y, y);
                
                const editsOnPage = edits.filter(edit => edit.pageIndex === currentPage - 1);
                const newlySelectedIds = editsOnPage.filter(edit => {
                    const editRect = { x: edit.x, y: edit.y, width: edit.width, height: edit.height };
                    const selectionRect = { x: selX, y: selY, width: selW, height: selH };
                    return editRect.x < selectionRect.x + selectionRect.width &&
                           editRect.x + editRect.width > selectionRect.x &&
                           editRect.y < selectionRect.y + selectionRect.height &&
                           editRect.y + editRect.height > selectionRect.y;
                }).map(edit => edit.id);
    
                if (e.ctrlKey || e.metaKey) {
                    props.setSelectedEditIds(prevIds => Array.from(new Set([...prevIds, ...newlySelectedIds])));
                } else {
                    props.setSelectedEditIds(newlySelectedIds);
                }
            } else if (props.selectedTool === 'select' && !e.ctrlKey && !e.metaKey) {
                props.setSelectedEditIds([]);
            }
    
            setIsSelecting(false);
            setSelectionBox(null);
            return;
        }
        
        if (props.selectedTool === 'place-item') {
            props.onPlaceItem(x, y);
        }
    }, [dragState, currentDrawing, isSelecting, selectionBox, screenToPdfCoords, updateEdits, props, edits, currentPage, dragStartCoords]);

    const handleEditMouseDown = useCallback((e: React.MouseEvent<SVGElement>, edit: AnyEdit, type: DragState['type'] = 'move') => {
        e.stopPropagation();

        const now = Date.now();
        if (now - lastClickRef.current.time < 300 && lastClickRef.current.editId === edit.id) {
            if (edit.type === 'device') props.onOpenDeviceFormOnDoubleClick(edit);
            if (edit.type === 'marker') props.onOpenMarkerFormOnDoubleClick(edit);
            if (edit.type === 'text') props.onStartEditingText(edit.id);
            
            lastClickRef.current = { time: 0, editId: null };
            return;
        }
        lastClickRef.current = { time: now, editId: edit.id };
        
        setDragState({ type, editId: edit.id, originalEdit: edit, startX: e.clientX, startY: e.clientY });
        
        if (props.selectedTool === 'select') {
             if (e.ctrlKey || e.metaKey) {
                props.setSelectedEditIds(prev => prev.includes(edit.id) ? prev.filter(id => id !== edit.id) : [...prev, edit.id]);
            } else if (!props.selectedEditIds.includes(edit.id)) {
                props.setSelectedEditIds([edit.id]);
            }
        }
    }, [props.selectedTool, props.selectedEditIds, props.setSelectedEditIds, props.onOpenDeviceFormOnDoubleClick, props.onOpenMarkerFormOnDoubleClick, props.onStartEditingText]);
    
    useImperativeHandle(ref, () => ({
        zoomIn: () => handleWheel({ deltaY: -1, clientX: containerRef.current!.clientWidth/2, clientY: containerRef.current!.clientHeight/2, preventDefault: () => {} } as React.WheelEvent),
        zoomOut: () => handleWheel({ deltaY: 1, clientX: containerRef.current!.clientWidth/2, clientY: containerRef.current!.clientHeight/2, preventDefault: () => {} } as React.WheelEvent),
    }), [handleWheel]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditingText(prev => prev ? { ...prev, value: e.target.value } : null);
    };

    const handleTextBlur = () => {
        if (editingText && props.startEditingTextId) {
            const originalEdit = props.edits.find(e => e.id === props.startEditingTextId) as TextEdit;
            if (originalEdit && originalEdit.text !== editingText.value) {
                const updatedEdit = { ...originalEdit, text: editingText.value };
                props.updateEdits([originalEdit], [updatedEdit]);
            }
            props.onEndEditingText();
        }
    };

    const pageDim = pageDimensions[currentPage - 1] || { width: 612, height: 792 };
    const editsToRender = (dragState && currentDrawing)
        ? edits.map(e => e.id === dragState.editId ? currentDrawing : e)
        : edits;
        
    const isSingleSelection = props.selectedEditIds.length === 1;
    const textEditToRender = editingText ? props.edits.find(e => e.id === editingText.id) as TextEdit : null;

    return (
        <div 
            ref={containerRef}
            className="w-full h-full bg-gray-600 overflow-hidden relative"
            style={{ cursor: props.selectedTool === 'pan' ? 'grab' : (dragState?.editId === 'pan' ? 'grabbing' : (props.selectedTool === 'select' ? 'default' : 'crosshair')) }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={props.onHideTooltip}
        >
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: pageDim.width, height: pageDim.height, transformOrigin: 'top left' }}>
                <canvas ref={canvasRef} className="bg-white shadow-lg absolute top-0 left-0" />
                <canvas ref={gridCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
                <svg
                    className="absolute top-0 left-0"
                    width={pageDim.width}
                    height={pageDim.height}
                    style={{ pointerEvents: currentDrawing || dragState || isSelecting || editingText ? 'none' : 'auto' }}
                >
                    {editsToRender.filter(e => e.pageIndex === currentPage - 1).map(edit => (
                        <EditRenderer 
                            key={edit.id} 
                            edit={edit} 
                            isSelected={props.selectedEditIds.includes(edit.id)}
                            isSingleSelection={isSingleSelection && props.selectedEditIds[0] === edit.id}
                            zoom={zoom}
                            onMouseDown={handleEditMouseDown}
                            onMouseEnter={(e, edit) => props.onShowTooltip(edit, e as any)}
                            onMouseLeave={props.onHideTooltip}
                        />
                    ))}

                    {currentDrawing && currentDrawing.type === 'draw' &&
                        <path d={(currentDrawing as DrawingEdit).path} fill="none" stroke={currentDrawing.color} strokeWidth={currentDrawing.strokeWidth} />
                    }
                    {currentDrawing && currentDrawing.type === 'rectangle' &&
                        <rect x={currentDrawing.x} y={currentDrawing.y} width={currentDrawing.width} height={currentDrawing.height} fill={hexToRgba((currentDrawing as RectangleEdit).fillColor, (currentDrawing as RectangleEdit).fillOpacity)} stroke={currentDrawing.color} strokeWidth={currentDrawing.strokeWidth}/>
                    }
                    {currentDrawing && currentDrawing.type === 'conduit' &&
                        <line x1={currentDrawing.x} y1={currentDrawing.y} x2={currentDrawing.x + currentDrawing.width} y2={currentDrawing.y + currentDrawing.height} stroke={currentDrawing.color} strokeWidth={currentDrawing.strokeWidth}/>
                    }
                    
                    {(isSelecting || props.isDefiningAiArea) && selectionBox &&
                        <rect
                            x={Math.min(selectionBox.x, selectionBox.x + selectionBox.width)}
                            y={Math.min(selectionBox.y, selectionBox.y + selectionBox.height)}
                            width={Math.abs(selectionBox.width)}
                            height={Math.abs(selectionBox.height)}
                            fill={props.isDefiningAiArea ? "rgba(79, 70, 229, 0.2)" : "rgba(0, 123, 255, 0.2)"}
                            stroke={props.isDefiningAiArea ? "#4F46E5" : "#007bff"}
                            strokeWidth={Math.min(2, 1 / zoom)}
                            strokeDasharray={`${5 / zoom} ${5 / zoom}`}
                        />
                    }
                </svg>
                 {textEditToRender && (
                    <textarea
                        ref={textAreaRef}
                        value={editingText?.value}
                        onChange={handleTextChange}
                        onBlur={handleTextBlur}
                        onKeyDown={e => e.stopPropagation()} // Prevent global hotkeys
                        style={{
                            position: 'absolute',
                            left: textEditToRender.x,
                            top: textEditToRender.y,
                            width: textEditToRender.width,
                            height: textEditToRender.height,
                            transform: `rotate(${textEditToRender.rotation}deg)`,
                            transformOrigin: 'top left',
                            fontSize: textEditToRender.fontSize,
                            fontFamily: textEditToRender.fontFamily,
                            lineHeight: textEditToRender.lineHeight,
                            color: `rgb(${textEditToRender.color.join(',')})`,
                            border: '1px dashed #007bff',
                            background: 'rgba(255, 255, 255, 0.9)',
                            padding: `${textEditToRender.padding ?? 5}px`,
                            margin: 0,
                            resize: 'none',
                            outline: 'none',
                            overflow: 'hidden',
                            zIndex: 10,
                            textAlign: textEditToRender.textAlign ?? 'center',
                        }}
                    />
                )}
            </div>
        </div>
    );
});

export default PdfViewer;
