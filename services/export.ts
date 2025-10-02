import { PDFDocument, rgb, StandardFonts, PDFFont, PageSizes, degrees, Color, BlendMode, LineCapStyle } from 'pdf-lib';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import * as xlsx from 'xlsx';
import { 
    AnyEdit, 
    Project, 
    Floorplan, 
    DeviceEdit, 
    MarkerEdit, 
    TextEdit, 
    DrawingEdit, 
    RectangleEdit, 
    DeviceData,
    ConduitEdit,
    MarkerData,
    MiscellaneousData,
    CameraData,
    MarkerType,
    GatewayCalculation,
    ConduitCalculation,
    LaborCalculation
} from '../types';
import { EQUIPMENT_CONFIG, DEVICE_TYPE_TITLES } from './equipmentConfig';
import { getEditIconKey, sanitizeFilename, convertAuditLogToCsv } from '../utils';
import { getFile } from './fileStorage';

const hexToRgb = (hex: string): Color => {
    if (!hex || !hex.startsWith('#')) return rgb(0, 0, 0);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
};

const degreesToRadians = (deg: number) => deg * (Math.PI / 180);

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


const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
    const words = text.split(' ');
    if (words.length === 0) return [];
    
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

export const generatePdfBlob = async (
    pdfBuffer: ArrayBuffer | undefined, 
    project: Project,
    floorplan: Floorplan,
    analysis: string | null
): Promise<Blob> => {
    const pdfDoc = pdfBuffer ? await PDFDocument.load(pdfBuffer) : await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Determine page dimensions from existing PDF or default to Letter
    let pageDimensions: [number, number];
    if (pdfDoc.getPageCount() === 0) {
        const letterSize = PageSizes.Letter;
        pdfDoc.addPage(letterSize);
        pageDimensions = letterSize;
    } else {
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();
        pageDimensions = [width, height];
    }
    
    const pages = pdfDoc.getPages();

    const editsByPage = floorplan.inventory.reduce((acc, edit) => {
        if (!acc[edit.pageIndex]) acc[edit.pageIndex] = [];
        acc[edit.pageIndex].push(edit);
        return acc;
    }, {} as Record<number, AnyEdit[]>);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { height: pageHeight } = page.getSize();
        const editsForPage = editsByPage[i] || [];

        // Draw FOVs first
        const camerasOnPage = editsForPage.filter(e => e.type === 'device' && e.deviceType === 'camera') as DeviceEdit[];
        for (const edit of camerasOnPage) {
            const data = edit.data as CameraData;
            const { fieldOfViewAngle: angle = 90, fieldOfViewDistance: distance = 100, fieldOfViewRotation: rotation = -90 } = data;
            if (!angle || !distance) continue;

            const centerX = edit.x + edit.width / 2;
            const centerY = edit.y + edit.height / 2;
            
            const startAngleRad = degreesToRadians(rotation - angle / 2);
            const endAngleRad = degreesToRadians(rotation + angle / 2);

            // Flip Y for path
            const flippedCenterY = pageHeight - centerY;
            const flippedStartY = pageHeight - (centerY + distance * Math.sin(startAngleRad));
            const flippedEndY = pageHeight - (centerY + distance * Math.sin(endAngleRad));
            const startX = centerX + distance * Math.cos(startAngleRad);
            const endX = centerX + distance * Math.cos(endAngleRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            // Sweep flag is flipped because Y-axis is inverted.
            const sweepFlag = 0; 
            
            const fovPathData = `M ${centerX},${flippedCenterY} L ${startX},${flippedStartY} A ${distance},${distance} 0 ${largeArcFlag} ${sweepFlag} ${endX},${flippedEndY} Z`;
            
            // FIX: Changed `fillColor` to `color` and `fillOpacity` to `opacity` to match pdf-lib API.
            page.drawSvgPath(fovPathData, {
                color: hexToRgb(edit.data.color || '#3b82f6'),
                opacity: 0.3,
                borderColor: hexToRgb(edit.data.color || '#3b82f6'),
                borderWidth: 1.5,
                borderLineCap: LineCapStyle.Round,
                borderDashArray: [5, 2],
            });
        }

        // Draw other vector annotations
        for (const edit of editsForPage) {
            switch (edit.type) {
                case 'rectangle':
                    page.drawRectangle({
                        x: edit.x, 
                        y: pageHeight - edit.y - edit.height, 
                        width: edit.width, 
                        height: edit.height,
                        color: hexToRgb(edit.fillColor),
                        opacity: edit.fillOpacity,
                        borderColor: hexToRgb(edit.color),
                        borderWidth: edit.strokeWidth,
                        rotate: degrees(edit.rotation), // pdf-lib rotation is clockwise, but our system is counter-clockwise.
                    });
                    break;
                case 'draw': {
                     const flippedPath = edit.path.replace(/([LMQC])\s*([\d.-]+)\s*([\d.-]+)/g, (match, cmd, x, y) => {
                        return `${cmd} ${x} ${edit.originalHeight - parseFloat(y)}`;
                    });
                    page.drawSvgPath(flippedPath, {
                        x: edit.x, 
                        y: pageHeight - edit.y - edit.height,
                        scale: (edit.width / edit.originalWidth),
                        borderColor: hexToRgb(edit.color),
                        borderWidth: edit.strokeWidth,
                    });
                    break;
                }
                case 'conduit':
                    page.drawLine({
                        start: { x: edit.x, y: pageHeight - edit.y },
                        end: { x: edit.x + edit.width, y: pageHeight - (edit.y + edit.height) },
                        color: hexToRgb(edit.color),
                        thickness: edit.strokeWidth,
                    });
                    break;
                case 'text': {
                    const { text, fontSize, fontFamily, color, width, height, lineHeight: lh, padding: pad, rotation,
                            borderWidth, borderColor, borderStyle, fillColor, fillOpacity } = edit;
                    
                    const flippedY = pageHeight - edit.y - height;

                    if (borderWidth && borderWidth > 0 && borderColor) {
                        const style = borderStyle ?? 'solid';
                        const dashArray = style === 'dashed' ? [borderWidth * 2.5, borderWidth * 2.5] : style === 'dotted' ? [borderWidth, borderWidth * 2] : undefined;
                        
                        const options = {
                            x: edit.x, y: flippedY, width, height,
                            borderColor: hexToRgb(borderColor),
                            borderWidth: borderWidth,
                            color: fillColor ? hexToRgb(fillColor) : undefined,
                            opacity: fillOpacity ?? 0.2,
                            borderDashArray: dashArray,
                            rotate: degrees(rotation),
                        };

                        if (style === 'cloud') {
                           const path = generateCloudPath(width, height);
                           page.drawSvgPath(path, { x: edit.x, y: flippedY, borderColor: options.borderColor, borderWidth: options.borderWidth, color: options.color, opacity: options.opacity, rotate: degrees(rotation) });
                        } else {
                           page.drawRectangle(options);
                        }
                    }

                    const padding = pad ?? 5;
                    const lines = wrapText(text, font, fontSize, width - padding * 2);
                    const lineHeight = fontSize * (lh || 1.2);
                    const totalTextHeight = lines.length * lineHeight;
                    const startYOffset = (height - totalTextHeight) / 2;
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const textWidth = font.widthOfTextAtSize(line, fontSize);
                        page.drawText(line, {
                            x: edit.x + (width - textWidth) / 2,
                            y: flippedY + height - (startYOffset + ((i + 1) * lineHeight)) + (lineHeight - fontSize) / 2,
                            font,
                            size: fontSize,
                            color: rgb(color[0], color[1], color[2]),
                            lineHeight,
                            rotate: degrees(rotation),
                        });
                    }
                    break;
                }
            }
        }

        // Draw Devices/Markers (on top)
        const devicesAndMarkers = editsForPage.filter(e => e.type === 'device' || e.type === 'marker') as (DeviceEdit | MarkerEdit)[];
        for (const edit of devicesAndMarkers) {
            const config = EQUIPMENT_CONFIG[getEditIconKey(edit)];
            if (!config) continue;

            const finalColor = (edit.data as any).color ? hexToRgb((edit.data as any).color) : hexToRgb(config.pdfColor);
            const flippedY = pageHeight - edit.y - edit.height;
            
            page.drawCircle({
                x: edit.x + edit.width / 2,
                y: flippedY + edit.height / 2,
                size: edit.width / 2,
                color: finalColor,
            });

            const text = config.pdfInitials;
            const fontSize = Math.max(5, edit.width * 0.4);
            const textWidth = fontBold.widthOfTextAtSize(text, fontSize);
            const textHeight = fontBold.heightAtSize(fontSize);

            page.drawText(text, {
                x: edit.x + edit.width / 2 - textWidth / 2,
                y: flippedY + edit.height / 2 - textHeight / 2.5, // Approximate vertical center
                font: fontBold,
                size: fontSize,
                color: rgb(1, 1, 1),
            });
        }

        // Draw legend in original coordinate system
        const legendItems = Object.entries(EQUIPMENT_CONFIG)
            .map(([key, config]) => ({
                key, ...config,
                count: editsForPage.filter(e => (e.type === 'device' || e.type === 'marker') && getEditIconKey(e) === key).length
            }))
            .filter(item => item.count > 0);

        if (legendItems.length > 0) {
            const legendWidth = 150;
            const legendHeight = legendItems.length * 20 + 30;
            const x = page.getWidth() - legendWidth - 20;
            const y = page.getHeight() - legendHeight - 20;

            page.drawRectangle({
                x, y, width: legendWidth, height: legendHeight,
                color: rgb(0.95, 0.95, 0.95), opacity: 0.8,
                borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1,
            });
            page.drawText('Legend', { x: x + 10, y: y + legendHeight - 20, font: fontBold, size: 12, color: rgb(0, 0, 0) });
            
            legendItems.forEach((item, index) => {
                const itemY = y + legendHeight - 40 - (index * 20);
                page.drawCircle({ x: x + 20, y: itemY + 5, size: 6, color: hexToRgb(item.pdfColor) });
                page.drawText(`${item.label} (${item.count})`, { x: x + 35, y: itemY, font, size: 10, color: rgb(0, 0, 0) });
            });
        }
    }
    
    // --- ADD NEW SUMMARY & ANALYSIS PAGES ---
    const margin = 50;
    const [pageWidth, pageHeight] = pageDimensions;
    const contentWidth = pageWidth - margin * 2;

    // Add Equipment Summary Page if there are items
    const allItems = floorplan.inventory;
    const devicesAndMarkers = allItems.filter(e => e.type === 'device' || e.type === 'marker') as (DeviceEdit | MarkerEdit)[];

    if (devicesAndMarkers.length > 0) {
        const summaryPage = pdfDoc.addPage(pageDimensions);
        let currentY = pageHeight - margin;

        summaryPage.drawText('Equipment Summary', {
            x: margin,
            y: currentY,
            font: fontBold,
            size: 24,
            color: rgb(0, 0, 0),
        });
        currentY -= 40;

        const counts = devicesAndMarkers.reduce<Record<string, number>>((acc, item) => {
            const key = getEditIconKey(item);
            const label = EQUIPMENT_CONFIG[key]?.label || 'Unknown';
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
        
        const sortedSummary = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));

        for (const [label, count] of sortedSummary) {
            if (currentY < margin) {
                // Future improvement: add new page if content overflows
                break; 
            }
            summaryPage.drawText(`${label}:`, {
                x: margin,
                y: currentY,
                font: fontBold,
                size: 12,
                color: rgb(0, 0, 0)
            });
            summaryPage.drawText(String(count), {
                x: margin + 200,
                y: currentY,
                font: font,
                size: 12,
                color: rgb(0, 0, 0)
            });
            currentY -= 20;
        }
    }

    // Add AI Analysis Page if analysis is provided
    if (analysis) {
        const analysisPage = pdfDoc.addPage(pageDimensions);
        let currentY = pageHeight - margin;
        const lines = analysis.split('\n');

        for (const line of lines) {
            let useFont = font;
            let useSize = 10;
            let useLineHeight = 12;
            let lineText = line;
            let leftMargin = margin;

            if (line.startsWith('###')) {
                useFont = fontBold;
                useSize = 14;
                lineText = line.replace(/###/g, '').trim();
                currentY -= 8;
            } else if (line.startsWith('##')) {
                useFont = fontBold;
                useSize = 18;
                lineText = line.replace(/##/g, '').trim();
                currentY -= 12;
            } else if (line.startsWith('#')) {
                useFont = fontBold;
                useSize = 24;
                lineText = line.replace(/#/g, '').trim();
                currentY -= 16;
            } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                lineText = `• ${line.trim().substring(2)}`;
                leftMargin += 10;
            }
            
            const wrappedLines = wrapText(lineText, useFont, useSize, contentWidth - (leftMargin - margin));

            for (const wrapped of wrappedLines) {
                 if (currentY < margin) {
                    break;
                }
                analysisPage.drawText(wrapped, {
                    x: leftMargin,
                    y: currentY,
                    font: useFont,
                    size: useSize,
                    lineHeight: useLineHeight,
                    color: rgb(0, 0, 0),
                });
                currentY -= useLineHeight;
            }
            if (line.trim() === '') {
                currentY -= (useLineHeight / 2);
            }
        }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};


export const generateProjectZipBlob = async (project: Project, floorplanFiles: Record<string, {name: string, data: ArrayBuffer}>): Promise<{blob: Blob, filename: string}> => {
    const zip = new JSZip();
    
    const projectToSave: Project = JSON.parse(JSON.stringify(project));
    projectToSave.floorplans.forEach(fp => delete (fp as any).pdfFile);

    zip.file("project.json", JSON.stringify(projectToSave, null, 2));

    const floorplansFolder = zip.folder("floorplans");
    if (floorplansFolder) {
        for (const [id, fileData] of Object.entries(floorplanFiles)) {
            floorplansFolder.file(`${id}.pdf`, fileData.data);
        }
    }
    
    const imagesFolder = zip.folder("images");
    if (imagesFolder) {
        const allImageIds = new Set<string>();
        const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
        allInventory.forEach(item => {
            if ((item.type === 'device' || item.type === 'marker') && item.data.images) {
                item.data.images.forEach(img => allImageIds.add(img.localId));
            }
        });

        for (const id of Array.from(allImageIds)) {
            const file = await getFile(id);
            if (file) {
                const extension = file.name.split('.').pop() || 'jpg';
                imagesFolder.file(`${id}.${extension}`, file);
            }
        }
    }
    
    const blob = await zip.generateAsync({ type: "blob" });
    const filename = `${sanitizeFilename(project.name)}.floorplan`;
    return { blob, filename };
};

export const generateDeliverablesZipBlob = async (project: Project, floorplanFiles: Record<string, {name: string, data: ArrayBuffer}>): Promise<{blob: Blob, filename: string}> => {
    const zip = new JSZip();

    for (const fp of project.floorplans) {
        if (fp.pdfFileName) {
            const pdfBuffer = floorplanFiles[fp.id]?.data;
            if (pdfBuffer) {
                const blob = await generatePdfBlob(pdfBuffer.slice(0), project, fp, null);
                zip.file(`${sanitizeFilename(fp.name)}.pdf`, blob);
            }
        }
    }

    const excelBlob = generateDeliverablesExcelBlob(project);
    zip.file("Deliverables.xlsx", excelBlob);
    
    const auditLogCsv = convertAuditLogToCsv(project.auditLog || []);
    zip.file("AuditLog.csv", auditLogCsv);

    if (project.analysis_result) {
        zip.file("AI_Analysis.md", project.analysis_result);
    }
    
    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
        const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
        const itemsWithImages = allInventory.filter(
            item => (item.type === 'device' || item.type === 'marker') && item.data.images && item.data.images.length > 0
        ) as (DeviceEdit | MarkerEdit)[];

        for (const item of itemsWithImages) {
            let typeName = 'Miscellaneous';
            if (item.type === 'device') {
                typeName = DEVICE_TYPE_TITLES[item.deviceType] || 'Miscellaneous';
            } else if (item.type === 'marker') {
                typeName = EQUIPMENT_CONFIG[item.markerType]?.label || 'Markers';
            }
            
            const folderName = sanitizeFilename(typeName);
            const subFolder = imagesFolder.folder(folderName);
            
            if (subFolder && item.data.images) {
                for (const img of item.data.images) {
                    const file = await getFile(img.localId);
                    if (file) {
                        const itemLocation = (item.data as any).location || (item.data as any).label || item.id.substring(0, 8);
                        const safeItemLocation = sanitizeFilename(itemLocation);
                        const newFileName = `${safeItemLocation}_${file.name}`;
                        subFolder.file(newFileName, file);
                    }
                }
            }
        }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `${sanitizeFilename(project.name)}_Deliverables.zip`;
    return { blob, filename };
};

export const generateBackupZipBlob = async (projects: Project[], floorplanFileData: Record<string, {name: string, data: ArrayBuffer}>): Promise<{blob: Blob, filename: string}> => {
    const zip = new JSZip();
    
    const projectsToSave = JSON.parse(JSON.stringify(projects));
    projectsToSave.forEach((p: Project) => p.floorplans.forEach(fp => delete (fp as any).pdfFile));
    zip.file("backup.json", JSON.stringify({ projects: projectsToSave }, null, 2));

    const floorplansFolder = zip.folder("floorplans");
    if (floorplansFolder) {
        for (const [id, fileData] of Object.entries(floorplanFileData)) {
            floorplansFolder.file(`${id}.pdf`, fileData.data);
        }
    }
    
    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
        const allImageIds = new Set<string>();
        projects.forEach(p => {
             const allInventory = [...p.projectLevelInventory, ...p.floorplans.flatMap(fp => fp.inventory)];
             allInventory.forEach(item => {
                if ((item.type === 'device' || item.type === 'marker') && item.data.images) {
                    item.data.images.forEach(img => allImageIds.add(img.localId));
                }
            });
        });

        for (const id of Array.from(allImageIds)) {
            const file = await getFile(id);
            if (file) {
                const extension = file.name.split('.').pop() || 'jpg';
                imagesFolder.file(`${id}.${extension}`, file);
            }
        }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `Kastle-Wizard-Backup-${new Date().toISOString().split('T')[0]}.zip`;
    return { blob, filename };
};

const autoSizeColumns = (ws: xlsx.WorkSheet, data: any[]) => {
    if (data.length === 0) return;
    const objectMaxLength: number[] = [];
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        objectMaxLength.push(header.length);
    });
    data.forEach(item => {
        headers.forEach((header, i) => {
            const value = item[header];
            if (value !== null && value !== undefined) {
                const len = String(value).length;
                if (objectMaxLength[i] < len) {
                    objectMaxLength[i] = len;
                }
            }
        });
    });
    ws['!cols'] = objectMaxLength.map(w => ({ wch: Math.min(w + 2, 60) })); // Add padding, cap at 60
};

const createGatewayCalcsWorksheet = (calcs: GatewayCalculation[]): xlsx.WorkSheet | null => {
    if (calcs.length === 0) return null;
    const data: any[] = [];
    calcs.forEach(calc => {
        data.push({ A: `Calculation: ${calc.name}`, B: '' });
        data.push({ A: '--- Camera Inputs ---', B: '' });
        data.push({ A: 'Name', B: 'Lens Count', C: 'Streaming Res (MP)', D: 'Recording Res (MP)', E: 'Frame Rate (fps)', F: 'Storage (Days)' });
        calc.cameras.forEach(cam => {
            data.push({ A: cam.name, B: cam.lensCount, C: cam.streamingResolution, D: cam.recordingResolution, E: cam.frameRate, F: cam.storageDays });
        });
        data.push({ A: '', B: '' });
        data.push({ A: '--- Gateway Configuration ---' });
        calc.gateways.forEach(gw => {
            data.push({ A: `Gateway #${gw.id} (${gw.type})`, B: 'Assigned Streams:' });
            gw.assignedStreams.forEach(s => data.push({ B: s.name }));
        });
        if (calc.unassignedStreams.length > 0) {
            data.push({ A: 'Unassigned Streams:' });
            calc.unassignedStreams.forEach(s => data.push({ B: s.name }));
        }
        data.push({ A: '', B: '' }); // Spacer row
    });
    const ws = xlsx.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    return ws;
};

const createConduitCalcsWorksheet = (calcs: ConduitCalculation[]): xlsx.WorkSheet | null => {
    if (calcs.length === 0) return null;
    const data = calcs.map(c => ({
        'Calculation Name': c.name,
        'Length (ft)': c.length,
        'Bends': c.bends,
        'Conduit Type': c.conduitType,
        'Conduit Size (in)': c.conduitSize,
        'Environment': c.environment,
        'Labor Rate ($/hr)': c.laborRate,
    }));
    const ws = xlsx.utils.json_to_sheet(data);
    autoSizeColumns(ws, data);
    return ws;
};

const createLaborCalcsWorksheet = (calcs: LaborCalculation[]): xlsx.WorkSheet | null => {
    if (calcs.length === 0) return null;
    const data: any[] = [];
     calcs.forEach(calc => {
        data.push({ A: `Calculation: ${calc.name}`, B: '' });
        data.push({ A: 'Task', B: 'Quantity', C: 'Hours/Unit', D: 'Total Hours' });
        // This is a placeholder; a full implementation would need TASK_DATA.
        // For now, we'll just show the totals.
        data.push({ A: 'Total Specialist Hours', B: '...', C: 'Cost', D: '...' });
        data.push({ A: 'Total Installer Hours', B: '...', C: 'Cost', D: '...' });
        data.push({ A: '---', B: '---' });
    });
    const ws = xlsx.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    return ws;
};

export const generateDeliverablesExcelBlob = (project: Project): Blob => {
    const wb = xlsx.utils.book_new();
    
    const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
    const devices = allInventory.filter(item => item.type === 'device') as DeviceEdit[];
    const markers = allInventory.filter(item => item.type === 'marker') as MarkerEdit[];

    const floorplanNameMap = new Map<string, string>();
    project.floorplans.forEach(fp => {
        fp.inventory.forEach(item => {
            if (fp.placedEditIds.includes(item.id)) {
                floorplanNameMap.set(item.id, fp.name);
            }
        });
    });
    const getFloorplanName = (id: string) => floorplanNameMap.get(id) || 'Project Inventory (Unplaced)';

    // --- Summary Sheet ---
    const summarySheetData = [
        ...Object.entries(devices.reduce((acc, dev) => { acc[dev.deviceType] = (acc[dev.deviceType] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([type, count]) => ({ Category: 'Device', 'Equipment Type': DEVICE_TYPE_TITLES[type as keyof typeof DEVICE_TYPE_TITLES] || type, 'Count': count })),
        ...Object.entries(markers.reduce((acc, marker) => { acc[marker.markerType] = (acc[marker.markerType] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([type, count]) => ({ Category: 'Marker', 'Equipment Type': EQUIPMENT_CONFIG[type as MarkerType]?.label || type, 'Count': count }))
    ].sort((a, b) => a['Equipment Type'].localeCompare(b['Equipment Type']));
    
    if (summarySheetData.length > 0) {
        const summaryWs = xlsx.utils.json_to_sheet(summarySheetData, { skipHeader: false });
        autoSizeColumns(summaryWs, summarySheetData);
        xlsx.utils.book_append_sheet(wb, summaryWs, "Summary");
    }

    // --- Device Sheets ---
    Object.keys(DEVICE_TYPE_TITLES).forEach(deviceType => {
        const devicesOfType = devices.filter(d => d.deviceType === deviceType);
        if (devicesOfType.length === 0) return;

        const dataForSheet = devicesOfType.map(d => {
            const cleanData: Record<string, any> = { Floorplan: getFloorplanName(d.id), ...d.data };
            delete cleanData.images;
            delete cleanData.color;
            if (deviceType === 'miscellaneous') {
                cleanData.custom_fields = (d.data as MiscellaneousData).custom_fields.map(f => `${f.label}: ${f.value}`).join('; ');
            }
            return cleanData;
        });
        
        const ws = xlsx.utils.json_to_sheet(dataForSheet);
        autoSizeColumns(ws, dataForSheet);
        xlsx.utils.book_append_sheet(wb, ws, DEVICE_TYPE_TITLES[deviceType as keyof typeof DEVICE_TYPE_TITLES].substring(0, 31));
    });
    
    // --- Marker Sheet ---
    if (markers.length > 0) {
        const dataForSheet = markers.map(m => ({ Floorplan: getFloorplanName(m.id), Type: EQUIPMENT_CONFIG[m.markerType]?.label || m.markerType, ...m.data }));
        const ws = xlsx.utils.json_to_sheet(dataForSheet);
        autoSizeColumns(ws, dataForSheet);
        xlsx.utils.book_append_sheet(wb, ws, "Markers");
    }

    // --- Calculator Sheets ---
    const gatewayCalcsWs = createGatewayCalcsWorksheet(project.gatewayCalculations || []);
    if (gatewayCalcsWs) xlsx.utils.book_append_sheet(wb, gatewayCalcsWs, "Gateway Calcs");

    const conduitCalcsWs = createConduitCalcsWorksheet(project.conduitCalculations || []);
    if (conduitCalcsWs) xlsx.utils.book_append_sheet(wb, conduitCalcsWs, "Conduit Calcs");
    
    const laborCalcsWs = createLaborCalcsWorksheet(project.laborCalculations || []);
    if (laborCalcsWs) xlsx.utils.book_append_sheet(wb, laborCalcsWs, "Labor Calcs");

    const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/octet-stream' });
};

export const generateElevatorLetterDocx = (content: string): Promise<Blob> => {
    const paragraphs = content.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('##') && trimmed.endsWith('##')) {
            return new Paragraph({
                text: trimmed.replace(/##/g, '').trim(),
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            });
        }
        return new Paragraph({
            children: [new TextRun(line)],
        });
    });

    const doc = new Document({
        sections: [{
            children: paragraphs,
        }],
    });

    return Packer.toBlob(doc);
};