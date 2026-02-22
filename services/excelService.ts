
import * as XLSX from 'xlsx';
import { ExtractedOrderData } from "../types";

/**
 * Parses an Excel file to extract work order data.
 * FIXED LOGIC v6.7.06:
 * - Uses strict coordinate mapping for Budget on ROW 29 (Index 28).
 * - Columns: WVB(J/9), PLW(K/10), KBW(L/11), RVS(M/12), MON(N/13), REIS(O/14).
 * - Safely parses floats handling commas and empty cells.
 * - Added logging to debug import issues.
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
                    hourBudget: {
                        kbw: 0, plw: 0, montage: 0, wvb: 0, rvs: 0, reis: 0
                    }
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

                // --- BUDGET EXTRACTION (ROW 29 / INDEX 28) ---
                console.log("DEBUG EXCEL IMPORT (v6.7.06)");
                
                const getBudgetByColIndex = (colIndex: number, label: string): number => {
                    // Row 29 is index 28 in SheetJS (0-based)
                    const cellAddress = XLSX.utils.encode_cell({c: colIndex, r: 28});
                    const cell = worksheet[cellAddress];

                    if (!cell || cell.v === undefined || cell.v === null) {
                        console.log(`${label} [${cellAddress}]: Empty`);
                        return 0;
                    }

                    // Convert to string, replace comma with dot, parse float
                    const rawVal = String(cell.v);
                    const cleanVal = rawVal.replace(',', '.').trim();
                    const num = parseFloat(cleanVal);
                    
                    console.log(`${label} [${cellAddress}]: Raw="${rawVal}" -> Clean="${cleanVal}" -> Num=${num}`);

                    return isNaN(num) ? 0 : num;
                };

                // Strict Mapping for Row 29
                // J=9, K=10, L=11, M=12, N=13, O=14
                const wvb = getBudgetByColIndex(9, "WVB (Col J)");  
                const plw = getBudgetByColIndex(10, "PLW (Col K)"); // Fixed index
                const kbw = getBudgetByColIndex(11, "KBW (Col L)"); 
                const rvs = getBudgetByColIndex(12, "RVS (Col M)"); 
                const mon = getBudgetByColIndex(13, "MON (Col N)"); 
                const reis = getBudgetByColIndex(14, "REIS (Col O)"); 

                // Assign to result
                if (result.hourBudget) {
                    result.hourBudget.wvb = wvb;
                    result.hourBudget.plw = plw;
                    result.hourBudget.kbw = kbw;
                    result.hourBudget.rvs = rvs;
                    result.hourBudget.montage = mon;
                    result.hourBudget.reis = reis;
                }

                // Add required tasks flags based on budget
                if (wvb > 0) result.requiredTasks?.push('WVB');
                if (plw > 0) result.requiredTasks?.push('PLW');
                if (kbw > 0) result.requiredTasks?.push('KBW');
                if (mon > 0) result.requiredTasks?.push('MON');

                // --- 1. BASIC FIELDS (Top of Sheet) ---
                result.opdrachtgever = getVal('D5') || getVal('A5') || getVal('B5');
                result.orderNumber = getVal('G2') || getVal('F2'); 
                result.projectRef = getVal('D21') || getVal('A21');

                if (!result.orderNumber || result.orderNumber.length < 3) {
                     // Fallback check scan row 2
                     const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:Z10");
                     for (let C = range.s.c; C <= range.e.c; ++C) {
                         const cell = worksheet[XLSX.utils.encode_cell({c: C, r: 1})]; // Row 2
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

                // --- 3. DESCRIPTION ---
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
                
                // --- 4. TREATMENTS ---
                const isMarked = (addr: string): boolean => {
                    const cell = worksheet[addr];
                    if (!cell || !cell.v) return false;
                    const v = String(cell.v).toLowerCase();
                    return ['x', 'v', '✓', '1', 'ja', 'yes', 'true'].some(m => v.includes(m));
                };

                result.thermischVerzinkt = isMarked('X3');
                result.stralen = isMarked('X4');
                result.stralenPrimer = isMarked('X5');
                result.schoopperenPrimer = isMarked('X6');
                result.poedercoaten = isMarked('X7');
                result.onbehandeld = isMarked('X8');

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
                    }
                    result.preservationType = activeTreatments.join(' + ');
                    descParts.unshift(`[BEHANDELING: ${activeTreatments.join(', ')}]`);
                } else {
                    result.preservationType = "Onbehandeld";
                    descParts.unshift(`[BEHANDELING: Onbehandeld]`);
                }

                result.description = descParts.join('\n');

                console.log('Final Result:', result);
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
