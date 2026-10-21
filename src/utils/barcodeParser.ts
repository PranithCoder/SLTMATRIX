import { InventoryItem, SubCategoryCode } from '../types/inventory';

export interface ParsedBarcode {
  raw: string;
  serialNumber: string;
  format?: string;
  macAddress?: string;
  model?: string;
  partNumber?: string;
  isBatchTag: boolean;
  isWorkOrder: boolean;
  detectedBrand?: string;
}

/**
 * Checks if a string looks like a network MAC address:
 * e.g., 00:1A:2B:3C:4D:5E or 00-1A-2B-3C-4D-5E or 001A.2B3C.4D5E or raw 12 hex chars labeled MAC
 */
export function isMacAddress(str: string): boolean {
  const trimmed = str.trim();
  if (/^mac\s*[:=\-]?\s*/i.test(trimmed)) return true;
  // Standard colon or hyphen separated MAC (6 pairs of hex)
  if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(trimmed)) return true;
  // Cisco 3 groups of 4 hex dots
  if (/^([0-9A-Fa-f]{4}\.){2}([0-9A-Fa-f]{4})$/.test(trimmed)) return true;
  return false;
}

/**
 * Universal Serial Number Extractor
 * Operates across ALL telecommunications, network, and electronic hardware:
 * Huawei, ZTE, Nokia/Alcatel, FiberHome, Cisco, TP-Link, Prolink, D-Link, MikroTik,
 * Aruba, Fortinet, Ubiquiti, as well as universal linear and 2D matrix barcodes.
 */
export function extractSerialNumber(rawInput: string): string {
  if (!rawInput) return '';
  let str = rawInput.trim();

  // 1. Remove non-printable / zero-width characters
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  // 2. If it's a Batch Locator Tag, preserve it as-is
  if (str.includes('|') && (str.includes('TC-01') || str.includes('BIN-') || str.includes('LOC-'))) {
    return str;
  }

  // 3. If it's a Rehab Work Order barcode, preserve it as-is
  if (/^WO-\d{4}-\d+/i.test(str)) {
    return str;
  }

  // 4. Multi-line 2D DataMatrix / QR Code (labels on router PCBs, packaging)
  if (str.includes('\n') || str.includes('\r')) {
    const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    // Look for explicit Serial Number lines first
    for (const line of lines) {
      const match = line.match(/^(?:S\/?N|SERIAL(?:\s*NO|\s*NUM|\s*NUMBER)?|SER(?:\s*NO)?)\s*[:=\-]?\s*([A-Za-z0-9_\-\.\/]+)/i);
      if (match && match[1]) {
        return cleanSerialString(match[1]);
      }
    }
    // Look for lines that look like a serial and NOT a MAC address
    for (const line of lines) {
      if (!isMacAddress(line) && !/^MAC/i.test(line) && !/^(MODEL|PROD|P\/N|SSID|WIFI|KEY|PIN):/i.test(line)) {
        if (/^[A-Za-z0-9_\-]{6,36}$/.test(line)) {
          return cleanSerialString(line);
        }
      }
    }
  }

  // 5. Key-Value structured format (e.g., "SN=48575443F8B310A4;MAC=00:1A:2B:...")
  if (str.includes(';') || str.includes('&')) {
    const pairs = str.split(/[;&]/);
    for (const pair of pairs) {
      const match = pair.trim().match(/^(?:SN|S\/N|SERIAL|SER_NO|SERIALNUMBER)=([A-Za-z0-9_\-\.]+)/i);
      if (match && match[1]) {
        return cleanSerialString(match[1]);
      }
    }
  }

  // 6. URL formatted router onboarding QR codes (e.g. https://setup.slt.lk/?sn=ALCLB8341902&mac=...)
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const parsedUrl = new URL(str);
      const snParam =
        parsedUrl.searchParams.get('sn') ||
        parsedUrl.searchParams.get('serial') ||
        parsedUrl.searchParams.get('s/n') ||
        parsedUrl.searchParams.get('serialNumber');
      if (snParam) return cleanSerialString(snParam);
    } catch {
      // URL parsing fallback
    }
  }

  // 7. GS1 Application Identifier (21) for Serial Number: e.g. (21)48575443F8B310A4
  const gs1Match = str.match(/^\(21\)\s*([A-Za-z0-9_\-\.]+)/i);
  if (gs1Match && gs1Match[1]) {
    return cleanSerialString(gs1Match[1]);
  }

  // 8. Automotive / Telecom AI (S) or [S]: e.g. (S)ZTEGC8217391 or [S]SLT123
  const sAiMatch = str.match(/^[\(\[]S[\)\]]\s*([A-Za-z0-9_\-\.]+)/i);
  if (sAiMatch && sAiMatch[1]) {
    return cleanSerialString(sAiMatch[1]);
  }

  // 9. Standard hardware label prefixes: "S/N: 12345", "SN: 12345", "SERIAL NO: 12345", "S/N 12345"
  const prefixMatch = str.match(/^(?:S\/?N|SERIAL(?:\s*NO|\s*NUM|\s*NUMBER)?|SER(?:\s*NO)?)\s*[:=\-]?\s*([A-Za-z0-9_\-\.\/]+)/i);
  if (prefixMatch && prefixMatch[1]) {
    return cleanSerialString(prefixMatch[1]);
  }

  // 10. Code 39 asterisk wrapping: *ZTEGC8217391* -> ZTEGC8217391
  if (str.startsWith('*') && str.endsWith('*') && str.length > 2) {
    str = str.slice(1, -1).trim();
  }

  // 11. Clean raw string
  return cleanSerialString(str);
}

function cleanSerialString(val: string): string {
  // Remove enclosing quotes, leading/trailing punctuation except hyphens/underscores
  let cleaned = val.replace(/^["'`\s]+|["'`\s]+$/g, '');
  // If wrapped in parenthesis, remove
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

/**
 * Complete Barcode Analysis
 */
export function parseBarcode(rawText: string, format?: string): ParsedBarcode {
  const raw = (rawText || '').trim();
  const isBatchTag = raw.includes('|') && (raw.includes('TC-01') || raw.includes('BIN-') || raw.includes('LOC-'));
  const isWorkOrder = /^WO-\d{4}-\d+/i.test(raw);

  let serialNumber = extractSerialNumber(raw);
  let macAddress: string | undefined;
  let model: string | undefined;
  let partNumber: string | undefined;
  let detectedBrand: string | undefined;

  // Extract auxiliary details from multi-line labels
  if (raw.includes('\n')) {
    const lines = raw.split(/\r?\n/).map((l) => l.trim());
    for (const line of lines) {
      if (isMacAddress(line)) {
        macAddress = line.replace(/^MAC\s*[:=\-]?\s*/i, '').trim();
      } else if (/^(?:MODEL|PROD)\s*[:=\-]?\s*(.+)/i.test(line)) {
        model = line.replace(/^(?:MODEL|PROD)\s*[:=\-]?\s*/i, '').trim();
      } else if (/^(?:P\/N|PART\s*NO)\s*[:=\-]?\s*(.+)/i.test(line)) {
        partNumber = line.replace(/^(?:P\/N|PART\s*NO)\s*[:=\-]?\s*/i, '').trim();
      }
    }
  }

  // Detect brand heuristics across telecom hardware
  const upper = (serialNumber + ' ' + raw).toUpperCase();
  if (upper.includes('4857') || upper.includes('HWTC') || upper.includes('HUAWEI') || upper.includes('HG8')) {
    detectedBrand = 'Huawei';
  } else if (upper.includes('ZTEG') || upper.includes('ZTE') || upper.includes('F660') || upper.includes('F670')) {
    detectedBrand = 'ZTE';
  } else if (upper.includes('ALCL') || upper.includes('NOKIA') || upper.includes('ALCATEL') || upper.includes('G-240')) {
    detectedBrand = 'Nokia';
  } else if (upper.includes('FHTT') || upper.includes('FIBERHOME') || upper.includes('HG-180') || upper.includes('AN5506')) {
    detectedBrand = 'FiberHome';
  } else if (upper.includes('CISCO') || upper.includes('FOC') || upper.includes('FTX') || upper.includes('C1121')) {
    detectedBrand = 'Cisco';
  } else if (upper.includes('TP-LINK') || upper.includes('TD-W') || upper.includes('TP8951')) {
    detectedBrand = 'TP-Link';
  } else if (upper.includes('PROLINK') || upper.includes('PRS1140') || upper.includes('PL1140')) {
    detectedBrand = 'Prolink';
  } else if (upper.includes('ARUBA') || upper.includes('AP-303')) {
    detectedBrand = 'Aruba';
  } else if (upper.includes('FORTINET') || upper.includes('FG40') || upper.includes('FG60')) {
    detectedBrand = 'Fortinet';
  } else if (upper.includes('D-LINK')) {
    detectedBrand = 'D-Link';
  } else if (upper.includes('MIKROTIK')) {
    detectedBrand = 'MikroTik';
  }

  return {
    raw,
    serialNumber,
    format,
    macAddress,
    model,
    partNumber,
    isBatchTag,
    isWorkOrder,
    detectedBrand,
  };
}

/**
 * Disambiguates and ranks multiple barcodes found in a single video frame.
 * Router / ONT labels commonly feature 2 or 3 barcodes (MAC, Serial, Model SKU).
 * This ensures the SERIAL NUMBER is automatically prioritized for ANY equipment.
 */
export function rankBarcodeCandidates(
  candidates: Array<{ text: string; format?: string }>,
  inventory: InventoryItem[] = []
): Array<{ text: string; format?: string; score: number; label: string; serialNumber: string }> {
  return candidates
    .map((c) => {
      const parsed = parseBarcode(c.text, c.format);
      const sn = parsed.serialNumber;
      let score = 10;
      let label = 'Barcode';

      // Explicit S/N prefix gets top priority
      if (/^(?:S\/?N|SERIAL|SER|SN)[\s:=\-]/i.test(c.text) || c.text.startsWith('(21)') || c.text.startsWith('(S)')) {
        score += 80;
        label = 'Device Serial Number';
      }

      // If it matches a known serial number in inventory, absolute top score
      const exactMatch = inventory.some((item) =>
        item.serialNumbers?.some((s) => s.toLowerCase() === sn.toLowerCase())
      );
      if (exactMatch) {
        score += 100;
        label = 'In-Stock Equipment Serial';
      }

      // If it's a MAC address, lower score for serial
      if (isMacAddress(c.text) || isMacAddress(sn)) {
        score -= 50;
        label = 'MAC Address';
      }

      // If it's a batch locator tag
      if (parsed.isBatchTag) {
        score += 60;
        label = 'Batch Locator Tag';
      }

      // If it's a work order
      if (parsed.isWorkOrder) {
        score += 60;
        label = 'Rehab Work Order';
      }

      // Standard telecom serial length (usually 8 to 24 alphanumeric chars)
      if (sn.length >= 8 && sn.length <= 26 && /^[A-Za-z0-9\-_]+$/.test(sn)) {
        score += 20;
      }

      return {
        text: c.text,
        format: c.format,
        score,
        label,
        serialNumber: sn,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface EquipmentMatchResult {
  item: InventoryItem | null;
  matchType: 'EXACT_SERIAL' | 'MATERIAL_CODE' | 'MODEL_PREFIX' | 'DESCRIPTION' | 'NONE';
  category?: SubCategoryCode;
}

/**
 * Searches the entire inventory (all 5 categories: TCOPNC, TCOPNC-C, TCOPNC-R, TC-OPCDR, TC-OPCDR-R)
 * to match ANY scanned barcode or serial number to its corresponding equipment.
 */
export function findEquipmentByBarcode(
  barcodeOrSerial: string,
  inventory: InventoryItem[]
): EquipmentMatchResult {
  if (!barcodeOrSerial || !inventory || inventory.length === 0) {
    return { item: null, matchType: 'NONE' };
  }

  const clean = extractSerialNumber(barcodeOrSerial).trim().toLowerCase();
  const rawClean = barcodeOrSerial.trim().toLowerCase();

  // 1. Exact Serial Number Match in any item's stock
  for (const item of inventory) {
    if (item.serialNumbers && item.serialNumbers.length > 0) {
      const found = item.serialNumbers.some((s) => s.toLowerCase() === clean || s.toLowerCase() === rawClean);
      if (found) {
        return { item, matchType: 'EXACT_SERIAL', category: item.subCategory };
      }
    }
  }

  // 2. Exact Material Code / SKU Barcode Match
  for (const item of inventory) {
    if (item.materialCode.toLowerCase() === clean || item.materialCode.toLowerCase() === rawClean) {
      return { item, matchType: 'MATERIAL_CODE', category: item.subCategory };
    }
  }

  // 3. Serial Number Prefix to Model Heuristic Mapping
  // Handles real telecom equipment where serial prefixes encode the equipment model
  const prefixMap: Array<{ pattern: RegExp; codeMatch: string }> = [
    { pattern: /^(?:SLT-RTR-TP|TP8951|TD-W8951)/i, codeMatch: 'CPERTR022S' }, // TP-Link ADSL Router
    { pattern: /^(?:SLT-RTR-PL|PRS1140|PL1140)/i, codeMatch: 'CPERTR045S' },  // Prolink ADSL Router
    { pattern: /^(?:SLT-RTR-FH|HG-180|FH180)/i, codeMatch: 'CPERTR042' },     // FiberHome ADSL Router
    { pattern: /^(?:SLT-CISCO-1121|C1121|1121X)/i, codeMatch: 'NWKCS001' },   // Cisco 1121X
    { pattern: /^(?:SLT-CISCO-891|C891|891F)/i, codeMatch: 'NWKCS002' },      // Cisco 891F
    { pattern: /^(?:SLT-AP-ARUBA|ARUBA303|AP-303)/i, codeMatch: 'NWKWFM049' },// Aruba AP-303
    { pattern: /^(?:SLT-FG40|FG40F)/i, codeMatch: 'NWKFW001' },               // FortiGate 40F
    { pattern: /^(?:SLT-FG60|FG60F)/i, codeMatch: 'NWKFW002' },               // FortiGate 60F
    { pattern: /^(?:SLT-SHDSL-1424)/i, codeMatch: 'NWKRT001' },               // SHDSL 1424
    { pattern: /^(?:SLT-SHDSL-1432)/i, codeMatch: 'NWKRT002' },               // SHDSL 1432
    { pattern: /^(?:SLT-ONT-TD64|TD64)/i, codeMatch: 'CPEONT001' },           // ONT TD64
    { pattern: /^(?:SLT-ONT-CD65|CD65)/i, codeMatch: 'CPEONT002' },           // ONT CD65
  ];

  for (const { pattern, codeMatch } of prefixMap) {
    if (pattern.test(clean) || pattern.test(rawClean)) {
      const item = inventory.find((i) => i.materialCode.toUpperCase() === codeMatch.toUpperCase());
      if (item) {
        return { item, matchType: 'MODEL_PREFIX', category: item.subCategory };
      }
    }
  }

  // 4. Description Substring Match
  for (const item of inventory) {
    const desc = item.description.toLowerCase();
    if (clean.length >= 6 && desc.includes(clean)) {
      return { item, matchType: 'DESCRIPTION', category: item.subCategory };
    }
  }

  return { item: null, matchType: 'NONE' };
}
