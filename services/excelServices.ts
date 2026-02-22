
import * as XLSX from 'xlsx';
import { ExtractedOrderData } from "../types";

/**
 * Parses an Excel file to extract work order data.
 * Updated to support specific CSV Column Mapping:
 * - Departments: Row 2 (V-AB). Can contain 'x' or a number (hours budget).
 * - Treatments: Column X (Rows 3-8) DIRECT BOOLEAN MAPPING.
 */
export const parseExcelWorkOrder = async (file: File): Promise<ExtractedOrderData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const result: ExtractedOrderData = {
                    requiredTasks: [],
                    preservationParts: [],
                    hourBudget: {}
                };

                // --- HELPER FUNCTIONS ---
                const getVal = (addr: string): string => {
                    const cell = worksheet[addr];
                    return cell ? String(cell.v || '').trim() : '';
                };

                const getDate = (addr: string): string | undefined => {
                    const cell = worksheet[addr];
                    if (!cell || !cell.v) return undefined;
                    
                    if (cell.v instanceof Date) {
                        const d = new Date(cell.v.getTime() - (cell.v.getTimezoneOffset() * 60000));
                        return d.toISOString().split('T')[0];
                    }
                    
                    const d = new Date(cell.v);
                    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                    return undefined;
                };

                // Helper: Check if a value implies "Active" for Departments ( > 0 or 'x')
                // Returns the number if found (as budget), otherwise 0 (inactive) or 1 (active flag only)
                const getBudgetOrActive = (cell: any): number => {
                    if (!cell || cell.v === undefined || cell.v === null) return 0;
                    
                    // If raw number
                    if (typeof cell.v === 'number') return cell.v;

                    const s = String(cell.v).toLowerCase().trim();
                    if (!s) return 0;
                    if (s === '0' || s === '0.0' || s === '0,0') return 0;

                    // Try parsing "40" or "40,5"
                    const f = parseFloat(s.replace(',', '.'));
                    if (!isNaN(f) && f > 0) return f;

                    // Boolean check
                    if (['x', 'v', '✓', '✔', 'ja', 'yes', 'true', 'waar', '1'].includes(s)) return 1;

                    return 0;
                };

                // --- 1. BASIC FIELDS ---
                result.opdrachtgever = getVal('D5') || getVal('A5') || getVal('B5');
                result.orderNumber = getVal('G2') || getVal('F2'); 
                result.projectRef = getVal('D21') || getVal('A21');

                if (!result.orderNumber || result.orderNumber.length < 3) {
                     const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:Z10");
                     for (let C = range.s.c; C <= range.e.c; ++C) {
                         const cell = worksheet[XLSX.utils.encode_cell({c: C, r: 1})]; // Riga 2
                         if (cell && /202\d-\d+/.test(String(cell.v))) {
                             result.orderNumber = String(cell.v);
                             break;
                         }
                     }
                }

                const adresParts = [getVal('D23'), getVal('D25'), getVal('D27')].filter(Boolean);
                if (adresParts.length > 0) result.address = adresParts.join(', ');

                result.deliveryDate = getDate('D33'); 
                result.measurementDate = getDate('D34'); 
                const algemeneDatum = getDate('G7');
                result.date = algemeneDatum || result.deliveryDate || result.measurementDate || new Date().toISOString().split('T')[0];

                // --- 2. DESCRIPTION ---
                const descParts: string[] = [];
                const descRange = XLSX.utils.decode_range("I4:S18"); 
                for (let R = descRange.s.r; R <= descRange.e.r; ++R) {
                    let lineParts: string[] = [];
                    for (let C = descRange.s.c; C <= descRange.e.c; ++C) {
                        const cell = worksheet[XLSX.utils.encode_cell({c: C, r: R})];
                        if (cell && cell.v) lineParts.push(String(cell.v).trim());
                    }
                    if (lineParts.length > 0) descParts.push(lineParts.join(' '));
                }

                // --- 3. DEPARTMENT CHECKS & BUDGETS (ROW 2 -> INDEX 1) ---
                const rowToCheck = 1; // Riga 2 (0-indexed = 1)
                
                const checkColumn = (colIndex: number, taskCode: string, budgetKey?: string) => {
                    const cell = worksheet[XLSX.utils.encode_cell({c: colIndex, r: rowToCheck})];
                    const val = getBudgetOrActive(cell);
                    
                    if (val > 0) {
                        // Add to required tasks if active
                        if (!result.requiredTasks?.includes(taskCode)) {
                            result.requiredTasks?.push(taskCode);
                        }
                        // Add to budget if value looks like a real hour count (e.g. > 1 to avoid 'x'=1 being budget)
                        // However, prompt asks to treat numbers as budget. We'll trust numeric parsing.
                        // If it was 'x', getBudgetOrActive returns 1. If it was 40, it returns 40.
                        // If specific budgetKey is present, save it.
                        if (budgetKey && result.hourBudget) {
                            // Logic: If user types '1' in Excel it might mean 1 hour OR just 'Active'.
                            // We will assume it is a budget if it's a number.
                            result.hourBudget[budgetKey] = (result.hourBudget[budgetKey] || 0) + val;
                        }
                    }
                };

                checkColumn(21, 'WVB', 'wvb'); // Col V
                checkColumn(22, 'PLW', 'plw'); // Col W
                checkColumn(23, 'KBW', 'kbw'); // Col X
                checkColumn(24, 'RVS'); // Col Y
                checkColumn(25, 'MON', 'montage'); // Col Z
                checkColumn(26, 'LEVERING'); // Col AA (VRA)
                
                // Travel time often added to montage budget
                const reisCell = worksheet[XLSX.utils.encode_cell({c: 27, r: rowToCheck})]; // Col AB
                const reisVal = getBudgetOrActive(reisCell);
                if (reisVal > 0) {
                    if (!result.requiredTasks?.includes('MON')) result.requiredTasks?.push('MON');
                    if (result.hourBudget) {
                        result.hourBudget['montage'] = (result.hourBudget['montage'] || 0) + reisVal;
                    }
                }

                // --- 4. TREATMENT CHECKS ---
                const isActiveValue = (cell: any) => getBudgetOrActive(cell) > 0;
                
                result.thermischVerzinkt = isActiveValue(worksheet['X3']);
                result.stralen = isActiveValue(worksheet['X4']);
                result.stralenPrimer = isActiveValue(worksheet['X5']);
                result.schoopperenPrimer = isActiveValue(worksheet['X6']);
                result.poedercoaten = isActiveValue(worksheet['X7']);
                result.onbehandeld = isActiveValue(worksheet['X8']);

                // Generazione stringa riassuntiva
                const activeTreatments: string[] = [];
                if (result.thermischVerzinkt) activeTreatments.push('Thermisch verzinkt');
                if (result.stralen) activeTreatments.push('Stralen');
                if (result.stralenPrimer) activeTreatments.push('Stralen + Primer');
                if (result.schoopperenPrimer) activeTreatments.push('Schoopperen + Primer');
                if (result.poedercoaten) activeTreatments.push('Poedercoaten');
                if (result.onbehandeld) activeTreatments.push('Onbehandeld');

                result.preservationParts = activeTreatments;

                if (activeTreatments.length > 0) {
                    if (activeTreatments.length > 1 && result.onbehandeld) {
                        result.onbehandeld = false; 
                        const idx = activeTreatments.indexOf('Onbehandeld');
                        if (idx > -1) activeTreatments.splice(idx, 1);
                    }
                    result.preservationType = activeTreatments.join(' + ');
                    const descTreatmentString = activeTreatments.join(', ');
                    descParts.unshift(`[BEHANDELING: ${descTreatmentString}]`);
                } else {
                    result.preservationType = "Onbehandeld";
                    descParts.unshift(`[BEHANDELING: Onbehandeld]`);
                }

                result.description = descParts.join('\n');

                console.log('Gegevens geëxtraheerd uit Excel:', result);

                resolve(result);

            } catch (err) {
                console.error("Excel Parse Error:", err);
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
