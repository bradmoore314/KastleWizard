import ExcelJS from 'exceljs';
import { Project, DeviceEdit, MarkerEdit, GatewayCalculation, ConduitCalculation, LaborCalculation, PartnerBudgetCalculation, TEECalculation } from '../types';
import { EQUIPMENT_CONFIG, DEVICE_TYPE_TITLES } from './equipmentConfig';
import { sanitizeFilename } from '../utils';

// Professional color scheme for reports
const COLORS = {
    primary: 'FF1E40A6',      // Kastle blue
    secondary: 'FF3B82F6',    // Light blue
    accent: 'FF10B981',       // Green
    warning: 'FFF59E0B',      // Orange
    danger: 'FFEF4444',       // Red
    light: 'FFF8FAFC',        // Light gray
    dark: 'FF1F2937',         // Dark gray
    white: 'FFFFFFFF',        // White
    black: 'FF000000',        // Black
    border: 'FFE5E7EB',       // Light border
    header: 'FFF3F4F6',       // Header background
};

// Typography configuration
const FONTS = {
    title: { name: 'Arial', size: 20, bold: true, color: { argb: COLORS.primary } },
    header: { name: 'Arial', size: 16, bold: true, color: { argb: COLORS.dark } },
    subheader: { name: 'Arial', size: 14, bold: true, color: { argb: COLORS.dark } },
    bold: { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.dark } },
    body: { name: 'Arial', size: 11, color: { argb: COLORS.dark } },
};

// Helper function to get floorplan name from ID
const getFloorplanName = (itemId: string, project: Project): string => {
    for (const floorplan of project.floorplans) {
        if (floorplan.inventory.some(item => item.id === itemId)) {
            return floorplan.name;
        }
    }
    return 'Project Level';
};

// Create section header with styling
const createSectionHeader = (worksheet: ExcelJS.Worksheet, title: string, startRow: number): number => {
    const titleRow = worksheet.getRow(startRow);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = FONTS.header;
    titleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.header }
    };
    titleRow.height = 25;
    return startRow + 1;
};

// Create header row with styling
const createHeaderRow = (worksheet: ExcelJS.Worksheet, headers: string[], startRow: number): number => {
    const headerRow = worksheet.getRow(startRow);
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.primary }
        };
        cell.font = {
            color: { argb: COLORS.white },
            bold: true,
            size: 12
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    headerRow.height = 20;
    return startRow + 1;
};

// Auto-size columns with professional spacing
const autoSizeColumns = (worksheet: ExcelJS.Worksheet) => {
    if (!worksheet.columns) return;

    worksheet.columns.forEach((column, index) => {
        if (column && column.eachCell) {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            // Set minimum width and add padding
            column.width = Math.max(maxLength + 2, 12);
        }
    });
};

// Create professional project summary sheet
const createProjectSummarySheet = (workbook: ExcelJS.Workbook, project: Project): void => {
    const worksheet = workbook.addWorksheet('Project Summary', {
        properties: { tabColor: { argb: COLORS.primary } }
    });

    let currentRow = 1;

    // Project header with branding
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = 'KASTLE FLOOR PLAN TOOL';
    titleRow.getCell(1).font = { name: 'Arial', size: 20, bold: true, color: { argb: COLORS.primary } };
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    currentRow += 2;

    // Enhanced project information
    currentRow = createSectionHeader(worksheet, 'Project Information', currentRow);

    const projectInfo = [
        ['Project Name:', project.name],
        ['Client:', project.client || 'Not specified'],
        ['Site Address:', project.site_address || 'Not specified'],
        ['Sales Engineer:', project.se_name || 'Not specified'],
        ['BDM Name:', project.bdm_name || 'Not specified'],
        ['Created:', new Date(project.createdAt).toLocaleDateString()],
        ['Last Modified:', new Date(project.lastModified).toLocaleDateString()],
        ['Total Floorplans:', project.floorplans.length.toString()],
        ['Total Equipment Items:', (project.projectLevelInventory.length + project.floorplans.reduce((sum, fp) => sum + fp.inventory.length, 0)).toString()]
    ];

    projectInfo.forEach(([label, value]) => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = label;
        row.getCell(1).font = FONTS.bold;
        row.getCell(2).value = value;
        row.getCell(2).font = FONTS.body;
        currentRow++;
    });

    currentRow += 2;

    // Equipment summary
    currentRow = createSectionHeader(worksheet, 'Equipment Summary', currentRow);

    const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
    const deviceCounts = new Map<string, number>();

    allInventory.forEach(item => {
        if (item.type === 'device') {
            const deviceData = item.data as any;
            const deviceType = deviceData.deviceType || 'Unknown';
            deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
        }
    });

    const headers = ['Device Type', 'Count'];
    currentRow = createHeaderRow(worksheet, headers, currentRow);

    deviceCounts.forEach((count, deviceType) => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = deviceType;
        row.getCell(2).value = count;

        [1, 2].forEach(col => {
            const cell = row.getCell(col);
            cell.font = FONTS.body;
            cell.border = {
                top: { style: 'thin', color: { argb: COLORS.border } },
                left: { style: 'thin', color: { argb: COLORS.border } },
                bottom: { style: 'thin', color: { argb: COLORS.border } },
                right: { style: 'thin', color: { argb: COLORS.border } }
            };

            if (currentRow % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: COLORS.light }
                };
            }
        });

        currentRow++;
    });

    autoSizeColumns(worksheet);
};

// Create floor-by-floor breakdown sheet
const createFloorBreakdownSheet = (workbook: ExcelJS.Workbook, project: Project): void => {
    const worksheet = workbook.addWorksheet('Floor Breakdown', {
        properties: { tabColor: { argb: COLORS.accent } }
    });

    let currentRow = 1;
    currentRow = createSectionHeader(worksheet, 'Equipment by Floor', currentRow);

    const headers = ['Floorplan', 'Device Type', 'Count', 'Percentage'];
    currentRow = createHeaderRow(worksheet, headers, currentRow);

    // Group equipment by floorplan
    const floorplanData = new Map<string, Map<string, number>>();

    project.floorplans.forEach(floorplan => {
        const deviceCounts = new Map<string, number>();
        floorplan.inventory.forEach(item => {
            if (item.type === 'device') {
                const deviceData = item.data as any;
                const deviceType = deviceData.deviceType || 'Unknown';
                deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
            }
        });
        floorplanData.set(floorplan.name, deviceCounts);
    });

    // Add project-level inventory
    const projectLevelCounts = new Map<string, number>();
    project.projectLevelInventory.forEach(item => {
        if (item.type === 'device') {
            const deviceData = item.data as any;
            const deviceType = deviceData.deviceType || 'Unknown';
            projectLevelCounts.set(deviceType, (projectLevelCounts.get(deviceType) || 0) + 1);
        }
    });
    if (projectLevelCounts.size > 0) {
        floorplanData.set('Project Level', projectLevelCounts);
    }

    // Calculate totals for percentages
    const totalDevices = Array.from(floorplanData.values())
        .flatMap(counts => Array.from(counts.values()))
        .reduce((sum, count) => sum + count, 0);

    // Add data rows
    floorplanData.forEach((deviceCounts, floorplanName) => {
        deviceCounts.forEach((count, deviceType) => {
            const row = worksheet.getRow(currentRow);
            row.getCell(1).value = floorplanName;
            row.getCell(2).value = deviceType;
            row.getCell(3).value = count;
            row.getCell(4).value = `${((count / totalDevices) * 100).toFixed(1)}%`;

            [1, 2, 3, 4].forEach(col => {
                const cell = row.getCell(col);
                cell.font = FONTS.body;
                cell.border = {
                    top: { style: 'thin', color: { argb: COLORS.border } },
                    left: { style: 'thin', color: { argb: COLORS.border } },
                    bottom: { style: 'thin', color: { argb: COLORS.border } },
                    right: { style: 'thin', color: { argb: COLORS.border } }
                };

                if (currentRow % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: COLORS.light }
                    };
                }
            });

            currentRow++;
        });
    });

    autoSizeColumns(worksheet);
};

// Create enhanced equipment details sheet
const createEquipmentDetailsSheet = (workbook: ExcelJS.Workbook, project: Project): void => {
    const worksheet = workbook.addWorksheet('Equipment Details', {
        properties: { tabColor: { argb: COLORS.secondary } }
    });

    let currentRow = 1;

    // Header
    currentRow = createSectionHeader(worksheet, 'Detailed Equipment List', currentRow);

    // Enhanced column headers
    const headers = [
        'Floorplan',
        'Device Type',
        'Location',
        'Model',
        'Serial Number',
        'Status',
        'Installation Date',
        'Notes',
        'Images Count'
    ];

    currentRow = createHeaderRow(worksheet, headers, currentRow);

    // Equipment data
    const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];

    allInventory.forEach(item => {
        if (item.type === 'device') {
            const deviceData = item.data as any;
            const row = worksheet.getRow(currentRow);

            row.getCell(1).value = getFloorplanName(item.id, project);
            row.getCell(2).value = deviceData.deviceType || 'Unknown';
            row.getCell(3).value = deviceData.location || '';
            row.getCell(4).value = deviceData.model || '';
            row.getCell(5).value = deviceData.serialNumber || '';
            row.getCell(6).value = deviceData.status || 'Active';
            row.getCell(7).value = deviceData.installationDate || '';
            row.getCell(8).value = deviceData.notes || '';
            row.getCell(9).value = deviceData.images ? deviceData.images.length : 0;

            // Apply formatting
            [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(col => {
                const cell = row.getCell(col);
                cell.font = FONTS.body;
                cell.border = {
                    top: { style: 'thin', color: { argb: COLORS.border } },
                    left: { style: 'thin', color: { argb: COLORS.border } },
                    bottom: { style: 'thin', color: { argb: COLORS.border } },
                    right: { style: 'thin', color: { argb: COLORS.border } }
                };

                // Alternating row colors
                if (currentRow % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: COLORS.light }
                    };
                }
            });

            currentRow++;
        }
    });

    autoSizeColumns(worksheet);

    // Add conditional formatting for status column
    const statusColumn = 6; // Status column
    const dataStartRow = 3; // After headers
    const dataEndRow = currentRow - 1;

    if (dataEndRow > dataStartRow) {
        worksheet.addConditionalFormatting({
            ref: `${String.fromCharCode(64 + statusColumn)}${dataStartRow}:${String.fromCharCode(64 + statusColumn)}${dataEndRow}`,
            rules: [
                {
                    type: 'cellIs',
                    operator: 'equal',
                    formulae: ['"Active"'],
                    style: {
                        fill: {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: COLORS.accent }
                        },
                        font: { color: { argb: COLORS.white } }
                    }
                },
                {
                    type: 'cellIs',
                    operator: 'equal',
                    formulae: ['"Inactive"'],
                    style: {
                        fill: {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: COLORS.danger }
                        },
                        font: { color: { argb: COLORS.white } }
                    }
                }
            ]
        });
    }
};

// Create professional calculator sheets
const createCalculatorSheets = (workbook: ExcelJS.Workbook, project: Project): void => {
    // Gateway Calculator Sheet
    if (project.gatewayCalculations && project.gatewayCalculations.length > 0) {
        const gatewaySheet = workbook.addWorksheet('Gateway Calculator', {
            properties: { tabColor: { argb: COLORS.primary } }
        });

        const calc = project.gatewayCalculations[0];
        let currentRow = 1;

        currentRow = createSectionHeader(gatewaySheet, 'Gateway Configuration', currentRow);

        const gatewayInfo = [
            ['Gateway Model:', calc.gatewayModel],
            ['Storage Capacity (TB):', calc.storageCapacity],
            ['Throughput (Mbps):', calc.throughput]
        ];

        gatewayInfo.forEach(([label, value]) => {
            const row = gatewaySheet.getRow(currentRow);
            row.getCell(1).value = label;
            row.getCell(1).font = FONTS.bold;
            row.getCell(2).value = value;
            row.getCell(2).font = FONTS.body;
            currentRow++;
        });

        currentRow += 2;

        currentRow = createSectionHeader(gatewaySheet, 'Camera Configuration', currentRow);

        const cameraHeaders = ['Camera Name', 'Lens Count', 'Streaming Resolution', 'Recording Resolution', 'Frame Rate', 'Storage Days'];
        currentRow = createHeaderRow(gatewaySheet, cameraHeaders, currentRow);

        calc.cameras.forEach(camera => {
            const row = gatewaySheet.getRow(currentRow);
            row.getCell(1).value = camera.name;
            row.getCell(2).value = camera.lensCount;
            row.getCell(3).value = camera.streamingResolution;
            row.getCell(4).value = camera.recordingResolution;
            row.getCell(5).value = camera.frameRate;
            row.getCell(6).value = camera.storageDays;

            [1, 2, 3, 4, 5, 6].forEach(col => {
                const cell = row.getCell(col);
                cell.font = FONTS.body;
                cell.border = {
                    top: { style: 'thin', color: { argb: COLORS.border } },
                    left: { style: 'thin', color: { argb: COLORS.border } },
                    bottom: { style: 'thin', color: { argb: COLORS.border } },
                    right: { style: 'thin', color: { argb: COLORS.border } }
                };
            });

            currentRow++;
        });

        autoSizeColumns(gatewaySheet);
    }

    // Partner Budget Calculator Sheet
    if (project.partnerBudget) {
        const partnerBudgetSheet = workbook.addWorksheet('Partner Budget', {
            properties: { tabColor: { argb: COLORS.accent } }
        });

        const calc = project.partnerBudget;
        let currentRow = 1;

        currentRow = createSectionHeader(partnerBudgetSheet, 'Partner Budget Configuration', currentRow);

        const budgetInfo = [
            ['Kastle Labor Hours:', calc.kastleLaborHours],
            ['Partner Labor Hours:', calc.partnerLaborHours],
            ['Kastle Labor Cost:', calc.kastleLaborCost],
            ['Partner Budget:', calc.partnerBudget],
            ['Partner Gets:', calc.partnerGets]
        ];

        budgetInfo.forEach(([label, value]) => {
            const row = partnerBudgetSheet.getRow(currentRow);
            row.getCell(1).value = label;
            row.getCell(1).font = FONTS.bold;
            row.getCell(2).value = value;
            row.getCell(2).font = FONTS.body;
            currentRow++;
        });

        currentRow += 2;

        currentRow = createSectionHeader(partnerBudgetSheet, 'Device Breakdown', currentRow);

        const deviceHeaders = ['Device Type', 'Hours'];
        currentRow = createHeaderRow(partnerBudgetSheet, deviceHeaders, currentRow);

        Object.entries(calc.deviceBreakdown).forEach(([device, hours]) => {
            const row = partnerBudgetSheet.getRow(currentRow);
            row.getCell(1).value = device;
            row.getCell(2).value = hours;

            [1, 2].forEach(col => {
                const cell = row.getCell(col);
                cell.font = FONTS.body;
                cell.border = {
                    top: { style: 'thin', color: { argb: COLORS.border } },
                    left: { style: 'thin', color: { argb: COLORS.border } },
                    bottom: { style: 'thin', color: { argb: COLORS.border } },
                    right: { style: 'thin', color: { argb: COLORS.border } }
                };
            });

            currentRow++;
        });

        autoSizeColumns(partnerBudgetSheet);
    }

    // T&E Calculator Sheet
    if (project.teeCalculations) {
        const teeSheet = workbook.addWorksheet('T&E Calculator', {
            properties: { tabColor: { argb: COLORS.warning } }
        });

        const calc = project.teeCalculations;
        let currentRow = 1;

        currentRow = createSectionHeader(teeSheet, 'T&E Configuration', currentRow);

        const teeInfo = [
            ['Total Labor Hours:', calc.totalLaborHours],
            ['Lodging Per Diem:', calc.lodgingPerDiem],
            ['Meals Per Diem:', calc.mealsPerDiem],
            ['Total Weeks:', calc.totalWeeks],
            ['Total Nights T&E:', calc.totalNightsTEE],
            ['Lodging Nights:', calc.lodgingNights],
            ['Meals Nights:', calc.mealsNights],
            ['Lodging Cost:', calc.lodgingCost],
            ['Meals Cost:', calc.mealsCost],
            ['Total T&E:', calc.totalTEE]
        ];

        teeInfo.forEach(([label, value]) => {
            const row = teeSheet.getRow(currentRow);
            row.getCell(1).value = label;
            row.getCell(1).font = FONTS.bold;
            row.getCell(2).value = value;
            row.getCell(2).font = FONTS.body;
            currentRow++;
        });

        autoSizeColumns(teeSheet);
    }
};

// Create AI analysis and project insights sheet
const createAnalysisSheet = (workbook: ExcelJS.Workbook, project: Project): void => {
    const worksheet = workbook.addWorksheet('AI Analysis & Insights', {
        properties: { tabColor: { argb: COLORS.warning } }
    });

    let currentRow = 1;

    // AI Analysis section
    if (project.analysis_result) {
        currentRow = createSectionHeader(worksheet, 'AI Analysis Results', currentRow);

        const analysisLines = project.analysis_result.split('\n');
        analysisLines.forEach(line => {
            if (line.trim()) {
                const row = worksheet.getRow(currentRow);
                const cell = row.getCell(1);
                cell.value = line.trim();
                cell.font = FONTS.body;
                cell.alignment = { wrapText: true };

                // Style headers differently
                if (line.startsWith('#')) {
                    cell.font = FONTS.subheader;
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: COLORS.header }
                    };
                }

                currentRow++;
            }
        });

        currentRow += 2;
    }

    // Checklist answers section
    if (project.checklistAnswers && Object.keys(project.checklistAnswers).length > 0) {
        currentRow = createSectionHeader(worksheet, 'Checklist Responses', currentRow);

        const headers = ['Question', 'Answer'];
        currentRow = createHeaderRow(worksheet, headers, currentRow);

        Object.entries(project.checklistAnswers).forEach(([question, answer]) => {
            const row = worksheet.getRow(currentRow);
            row.getCell(1).value = question;
            row.getCell(1).font = FONTS.body;
            row.getCell(2).value = String(answer);
            row.getCell(2).font = FONTS.body;

            [1, 2].forEach(col => {
                const cell = row.getCell(col);
                cell.border = {
                    top: { style: 'thin', color: { argb: COLORS.border } },
                    left: { style: 'thin', color: { argb: COLORS.border } },
                    bottom: { style: 'thin', color: { argb: COLORS.border } },
                    right: { style: 'thin', color: { argb: COLORS.border } }
                };

                if (currentRow % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: COLORS.light }
                    };
                }
            });

            currentRow++;
        });
    }

    autoSizeColumns(worksheet);
};

// Main function to generate professional Excel report
export const generateProfessionalExcelBlob = async (project: Project): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kastle Floor Plan Tool';
    workbook.lastModifiedBy = 'Kastle Floor Plan Tool';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // Create sheets
    createProjectSummarySheet(workbook, project);
    createFloorBreakdownSheet(workbook, project);
    createEquipmentDetailsSheet(workbook, project);
    createCalculatorSheets(workbook, project);
    createAnalysisSheet(workbook, project);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};

// Export function to save professional Excel report
export const exportProfessionalExcel = async (project: Project) => {
    const blob = await generateProfessionalExcelBlob(project);
    const filename = `${sanitizeFilename(project.name)}_Professional_Report.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
