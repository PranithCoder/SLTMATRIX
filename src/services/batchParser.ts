import { ParsedBatchCode, SubCategoryCode } from '../types/inventory';

/**
 * Standard SLT Main Branch Batch Code / Locator Tag Parser
 * Example:
 * "TC-01-REH-250104-999 | OSPFIT002 | AERIAL CABLE FITTING - SHARP ANGLED"
 */
export function parseBatchLocatorCode(input: string): ParsedBatchCode {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      rawString: input,
      locatorId: '',
      materialCode: '',
      materialDescription: '',
      detectedCategory: 'TC-OPCDR',
      isValid: false,
      errorMessage: 'Batch code string is empty.',
    };
  }

  // Support pipe '|', slash '/', or comma delimiters
  let parts: string[] = [];
  if (trimmed.includes('|')) {
    parts = trimmed.split('|').map(s => s.trim());
  } else if (trimmed.includes(' - ') && !trimmed.includes('|')) {
    parts = trimmed.split(' - ').map(s => s.trim());
  } else if (trimmed.includes(',')) {
    parts = trimmed.split(',').map(s => s.trim());
  } else {
    // Fallback if scanned as single blob without pipes
    parts = [trimmed];
  }

  const locatorId = parts[0] || '';
  const materialCode = parts[1] || '';
  const materialDescription = parts.slice(2).join(' - ') || '';

  // Determine sub-category: strictly TC-OPCDR (Rehab) or TCOPNC (New Connection) for new dispatch stock
  let detectedCategory: SubCategoryCode = 'TC-OPCDR';
  const upperLocator = locatorId.toUpperCase();
  
  if (upperLocator.includes('NC') || upperLocator.includes('TCOPNC') || upperLocator.includes('NEW')) {
    detectedCategory = 'TCOPNC';
  } else {
    // Default to TC-OPCDR for REH / OPCDR / general OSP
    detectedCategory = 'TC-OPCDR';
  }

  // Parse batch date if in format YYMMDD (e.g. 250104 -> 2025-01-04)
  let dispatchBatchDate: string | undefined;
  const dateMatch = locatorId.match(/(\d{6})/);
  if (dateMatch) {
    const rawDigits = dateMatch[1];
    const year = `20${rawDigits.slice(0, 2)}`;
    const month = rawDigits.slice(2, 4);
    const day = rawDigits.slice(4, 6);
    dispatchBatchDate = `${year}-${month}-${day}`;
  }

  const isValid = Boolean(locatorId && materialCode);

  return {
    rawString: trimmed,
    locatorId,
    materialCode: materialCode.toUpperCase(),
    materialDescription,
    detectedCategory,
    dispatchBatchDate,
    isValid,
    errorMessage: isValid ? undefined : 'Invalid locator format. Expected format: LOCATOR_ID | MATERIAL_CODE | DESCRIPTION',
  };
}

/**
 * Format a batch code tag string
 */
export function formatBatchLocatorTag(locatorId: string, materialCode: string, description: string): string {
  return `${locatorId} | ${materialCode} | ${description}`;
}
