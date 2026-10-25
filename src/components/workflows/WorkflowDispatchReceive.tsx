import React, { useState, useMemo, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  PackagePlus, 
  Calendar, 
  Tag, 
  Layers, 
  Sparkles, 
  Search, 
  Download, 
  Printer, 
  Filter, 
  Clock, 
  Truck, 
  Hash, 
  Boxes,
  Cable,
  Check,
  Cpu,
  Copy,
  Plus,
  X,
  ListPlus,
  UploadCloud,
  RotateCcw,
  Scan,
  Eye,
  FileCheck
} from 'lucide-react';
import { InventoryItem, LedgerTransaction, SubCategoryCode, UserPersona, OpenScannerFn } from '../../types/inventory';
import { storageService } from '../../services/storage';
import { parseBatchLocatorCode } from '../../services/batchParser';
import { extractSerialNumber, findEquipmentByBarcode, parseBarcode } from '../../utils/barcodeParser';
import confetti from 'canvas-confetti';
import { SearchableSelect } from '../common/SearchableSelect';

interface WorkflowDispatchReceiveProps {
  inventory: InventoryItem[];
  activeUser: UserPersona;
  onSuccess: (message: string) => void;
  onOpenScanner: OpenScannerFn;
  prefilledBatchString?: string;
  onClearPrefill?: () => void;
  prefilledSerial?: string;
}

export const WorkflowDispatchReceive: React.FC<WorkflowDispatchReceiveProps> = ({
  inventory,
  activeUser,
  onSuccess,
  onOpenScanner,
  prefilledBatchString,
  onClearPrefill,
  prefilledSerial,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Navigation Tabs: Intake Form vs Inbound Summary Registry
  const [activeTab, setActiveTab] = useState<'INTAKE' | 'SUMMARY'>('INTAKE');

  // Ledger state for summarization
  const [ledgerData, setLedgerData] = useState<LedgerTransaction[]>(() => storageService.getLedger());

  const refreshLedger = () => {
    setLedgerData(storageService.getLedger());
  };

  // Intake Form States
  // 1. Select Operation Category (Rehabilitation vs New Connection)
  const [targetCategory, setTargetCategory] = useState<'TC-OPCDR' | 'TCOPNC'>('TC-OPCDR');

  // Catalog items filtered by selected category
  const categoryCatalog = useMemo(() => {
    return inventory.filter((item) => item.subCategory === targetCategory);
  }, [inventory, targetCategory]);

  // 2. Dropdown to select item
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  // 3. Locator ID
  const [locatorId, setLocatorId] = useState<string>('TC-01-REH-260616-001');

  // 4. Quantity & Unit
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<InventoryItem['unit']>('PCS');

  // 5. Date It Came (Arrival Date)
  const [arrivalDate, setArrivalDate] = useState<string>(todayStr);

  // 6. Serial Number & Bulk Serial Intake Engine
  const [serialIntakeMode, setSerialIntakeMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [batchSerials, setBatchSerials] = useState<string[]>([]);
  const [bulkInputText, setBulkInputText] = useState<string>('');
  const [bulkPasteText, setBulkPasteText] = useState<string>('');
  const [showBulkPasteArea, setShowBulkPasteArea] = useState<boolean>(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState<string>('');
  const [selectedPreviewSerial, setSelectedPreviewSerial] = useState<string | null>(null);
  const [autoSyncQuantity, setAutoSyncQuantity] = useState<boolean>(true);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // 7. Logistics Notes
  const [notes, setNotes] = useState<string>('Dispatched from SLT Welikada Central Logistics Hub via Container 14.');

  // Optional: Fast Parser Helper for standard raw tag strings
  const [showRawParser, setShowRawParser] = useState<boolean>(false);
  const [rawTagInput, setRawTagInput] = useState<string>(prefilledBatchString || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Summary Registry Filters
  const [summarySearch, setSummarySearch] = useState<string>('');
  const [summaryCategoryFilter, setSummaryCategoryFilter] = useState<'ALL' | 'TC-OPCDR' | 'TCOPNC'>('ALL');
  const [summaryDateFilter, setSummaryDateFilter] = useState<'ALL' | 'TODAY' | 'PAST_7' | 'CUSTOM'>('ALL');
  const [summaryCustomDate, setSummaryCustomDate] = useState<string>(todayStr);
  const [summarySerialFilter, setSummarySerialFilter] = useState<string>('');
  const [summaryLocatorFilter, setSummaryLocatorFilter] = useState<string>('');

  // Auto-select first item when category changes
  useEffect(() => {
    if (categoryCatalog.length > 0 && (!selectedItemId || !categoryCatalog.some(i => i.id === selectedItemId))) {
      setSelectedItemId(categoryCatalog[0].id);
      setUnit(categoryCatalog[0].unit);
      if (targetCategory === 'TC-OPCDR') {
        setLocatorId('TC-01-REH-260616-001');
      } else {
        setLocatorId('NC-BIN-RTR-01');
      }
    }
  }, [categoryCatalog, targetCategory, selectedItemId]);

  // Sync prefilledBatchString from global scanner
  useEffect(() => {
    if (prefilledBatchString) {
      setRawTagInput(prefilledBatchString);
      const parsed = parseBatchLocatorCode(prefilledBatchString);
      if (parsed.isValid) {
        setLocatorId(parsed.locatorId);
        if (parsed.detectedCategory === 'TCOPNC') {
          setTargetCategory('TCOPNC');
        } else {
          setTargetCategory('TC-OPCDR');
        }
        // Try to find matching material code in inventory
        const match = inventory.find(i => i.materialCode.toUpperCase() === parsed.materialCode.toUpperCase());
        if (match) {
          setSelectedItemId(match.id);
          setUnit(match.unit);
        }
        if (parsed.dispatchBatchDate) {
          setArrivalDate(parsed.dispatchBatchDate);
        }
      }
    }
  }, [prefilledBatchString, inventory]);

  // Sync prefilledSerial from scanner
  useEffect(() => {
    if (prefilledSerial) {
      const clean = extractSerialNumber(prefilledSerial);
      setSerialNumber(clean);
      setSelectedPreviewSerial(clean);
      const match = findEquipmentByBarcode(clean, inventory);
      if (match.item) {
        if (match.item.subCategory === 'TCOPNC' || match.item.subCategory === 'TC-OPCDR') {
          setTargetCategory(match.item.subCategory);
        }
        setSelectedItemId(match.item.id);
        setUnit(match.item.unit);
      }
    }
  }, [prefilledSerial, inventory]);

  // Auto-sync quantity with batch serials count
  useEffect(() => {
    if (serialIntakeMode === 'BULK' && autoSyncQuantity && batchSerials.length > 0) {
      setQuantity(batchSerials.length);
      setUnit('UNITS');
    }
  }, [batchSerials.length, serialIntakeMode, autoSyncQuantity]);

  // Bulk Serial Operations
  const handleAddBatchSerials = (newSerials: string[]) => {
    const cleaned = newSerials
      .map((s) => extractSerialNumber(s).trim())
      .filter((s) => s.length > 0);

    if (cleaned.length === 0) return;

    setBatchSerials((prev) => {
      const existing = new Set(prev.map((s) => s.toUpperCase()));
      const added: string[] = [];
      cleaned.forEach((s) => {
        if (!existing.has(s.toUpperCase())) {
          existing.add(s.toUpperCase());
          added.push(s);
        }
      });
      return [...prev, ...added];
    });

    if (cleaned.length > 0) {
      setSelectedPreviewSerial(cleaned[cleaned.length - 1]);
      // Auto-detect item from first new serial if current selected item doesn't match
      const match = findEquipmentByBarcode(cleaned[0], inventory);
      if (match.item && (!selectedItemId || match.item.id !== selectedItemId)) {
        if (match.item.subCategory === 'TCOPNC' || match.item.subCategory === 'TC-OPCDR') {
          setTargetCategory(match.item.subCategory);
        }
        setSelectedItemId(match.item.id);
        setUnit(match.item.unit);
      }
    }
  };

  const handleParseAndAddPastedSerials = () => {
    if (!bulkPasteText.trim()) return;
    const tokens = bulkPasteText.split(/[\r\n,;\t]+/);
    handleAddBatchSerials(tokens);
    setBulkPasteText('');
    setShowBulkPasteArea(false);
  };

  const handleOpenContinuousCameraScanner = () => {
    onOpenScanner(
      'Continuous Batch Scanner — Scan each device serial barcode one-by-one',
      (scannedText, allScanned) => {
        if (allScanned && allScanned.length > 0) {
          handleAddBatchSerials(allScanned);
        } else if (scannedText) {
          handleAddBatchSerials([scannedText]);
        }
      },
      true
    );
  };

  const handleRemoveBatchSerial = (serialToRemove: string) => {
    setBatchSerials((prev) => prev.filter((s) => s !== serialToRemove));
    if (selectedPreviewSerial === serialToRemove) {
      setSelectedPreviewSerial(null);
    }
  };

  const handleClearAllBatchSerials = () => {
    if (batchSerials.length > 0 && !window.confirm(`Clear all ${batchSerials.length} scanned serial numbers from the intake batch?`)) {
      return;
    }
    setBatchSerials([]);
    setSelectedPreviewSerial(null);
  };

  const handleExportBatchSerials = () => {
    if (batchSerials.length === 0) return;
    const content =
      'data:text/csv;charset=utf-8,' +
      [
        'Index,Serial Number,Item Code,Description,Locator,Intake Date',
        ...batchSerials.map(
          (s, idx) =>
            `${idx + 1},"${s}","${selectedItem ? selectedItem.materialCode : ''}","${selectedItem ? selectedItem.description : ''}","${locatorId}","${arrivalDate}"`
        ),
      ].join('\n');
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Batch_Serials_${selectedItem?.materialCode || 'Intake'}_${arrivalDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySerial = (s: string) => {
    navigator.clipboard.writeText(s);
    setCopiedSerial(s);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  // Active Device for Live Details Card
  const activeSerial = serialIntakeMode === 'SINGLE'
    ? serialNumber.trim()
    : (selectedPreviewSerial || (batchSerials.length > 0 ? batchSerials[batchSerials.length - 1] : ''));

  const parsedActive = useMemo(() => {
    if (!activeSerial) return null;
    return parseBarcode(activeSerial);
  }, [activeSerial]);

  const matchActive = useMemo(() => {
    if (!activeSerial) return null;
    return findEquipmentByBarcode(activeSerial, inventory);
  }, [activeSerial, inventory]);

  const existingInStock = useMemo(() => {
    if (!activeSerial) return null;
    return inventory.find((i) =>
      i.serialNumbers?.some((s) => s.toLowerCase() === activeSerial.toLowerCase())
    );
  }, [activeSerial, inventory]);

  // Duplicates detection across batch and inventory
  const batchSerialsAlreadyInInventory = useMemo(() => {
    if (batchSerials.length === 0) return [];
    const stockSet = new Set<string>();
    inventory.forEach((item) => {
      item.serialNumbers?.forEach((s) => stockSet.add(s.toUpperCase()));
    });
    return batchSerials.filter((s) => stockSet.has(s.toUpperCase()));
  }, [batchSerials, inventory]);

  const filteredBatchSerials = useMemo(() => {
    if (!batchSearchQuery.trim()) return batchSerials;
    const q = batchSearchQuery.toLowerCase().trim();
    return batchSerials.filter((s) => s.toLowerCase().includes(q));
  }, [batchSerials, batchSearchQuery]);

  const selectedItem = inventory.find((i) => i.id === selectedItemId);

  // Filter category catalog by search text inside the selector
  const filteredCatalogItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return categoryCatalog;
    const q = itemSearchQuery.toLowerCase().trim();
    return categoryCatalog.filter(
      (i) => i.materialCode.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }, [categoryCatalog, itemSearchQuery]);

  // Handle Raw Tag Parsing on demand
  const handleApplyRawTag = (rawStr: string) => {
    const parsed = parseBatchLocatorCode(rawStr);
    if (parsed.isValid) {
      setLocatorId(parsed.locatorId);
      if (parsed.detectedCategory === 'TCOPNC') {
        setTargetCategory('TCOPNC');
      } else {
        setTargetCategory('TC-OPCDR');
      }
      const match = inventory.find(i => i.materialCode.toUpperCase() === parsed.materialCode.toUpperCase());
      if (match) {
        setSelectedItemId(match.id);
        setUnit(match.unit);
      }
      if (parsed.dispatchBatchDate) {
        setArrivalDate(parsed.dispatchBatchDate);
      }
      setShowRawParser(false);
    }
  };

  // Filtered Dispatches for Summary Table
  const dispatchHistory = useMemo(() => {
    return ledgerData.filter((l) => l.actionType === 'DISPATCH_RECEIVE');
  }, [ledgerData]);

  const filteredDispatches = useMemo(() => {
    return dispatchHistory.filter((tx) => {
      // Category filter
      if (summaryCategoryFilter !== 'ALL' && tx.subCategory !== summaryCategoryFilter) {
        return false;
      }

      // Name / SKU search
      if (summarySearch.trim()) {
        const q = summarySearch.toLowerCase().trim();
        const matchName = tx.materialDescription?.toLowerCase().includes(q) || tx.materialCode?.toLowerCase().includes(q);
        if (!matchName) return false;
      }

      // Serial Number filter
      if (summarySerialFilter.trim()) {
        const q = summarySerialFilter.toLowerCase().trim();
        const matchSerial =
          (tx.serialNumber && tx.serialNumber.toLowerCase().includes(q)) ||
          (tx.serialNumbers && tx.serialNumbers.some((s) => s.toLowerCase().includes(q)));
        if (!matchSerial) return false;
      }

      // Locator ID filter
      if (summaryLocatorFilter.trim()) {
        const q = summaryLocatorFilter.toLowerCase().trim();
        const matchLoc = tx.locatorId && tx.locatorId.toLowerCase().includes(q);
        if (!matchLoc) return false;
      }

      // Date-wise filter
      const txDate = tx.entryDate || tx.timestamp.slice(0, 10);
      if (summaryDateFilter === 'TODAY') {
        if (txDate !== todayStr) return false;
      } else if (summaryDateFilter === 'CUSTOM') {
        if (txDate !== summaryCustomDate) return false;
      }

      return true;
    });
  }, [dispatchHistory, summaryCategoryFilter, summarySearch, summarySerialFilter, summaryLocatorFilter, summaryDateFilter, summaryCustomDate, todayStr]);

  // Summarization KPI metrics
  const totalUnitsDispatched = useMemo(() => {
    return dispatchHistory.reduce((sum, tx) => sum + tx.quantityDelta, 0);
  }, [dispatchHistory]);

  const rehabUnitsDispatched = useMemo(() => {
    return dispatchHistory
      .filter((tx) => tx.subCategory === 'TC-OPCDR')
      .reduce((sum, tx) => sum + tx.quantityDelta, 0);
  }, [dispatchHistory]);

  const newConnUnitsDispatched = useMemo(() => {
    return dispatchHistory
      .filter((tx) => tx.subCategory === 'TCOPNC')
      .reduce((sum, tx) => sum + tx.quantityDelta, 0);
  }, [dispatchHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedItem) {
      setValidationError('Please select an equipment item from the dropdown.');
      return;
    }

    if (!locatorId.trim()) {
      setValidationError('Locator ID / Batch Tag is required (e.g. TC-01-REH-250104-999).');
      return;
    }

    if (!arrivalDate) {
      setValidationError('Please select the date it arrived.');
      return;
    }

    if (!quantity || quantity <= 0) {
      setValidationError('Received quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isBulk = serialIntakeMode === 'BULK';
      const finalSerials = isBulk
        ? batchSerials
        : (serialNumber.trim() ? [serialNumber.trim()] : []);
      const finalQuantity = isBulk && finalSerials.length > 0 ? finalSerials.length : quantity;

      if (selectedItem.isSerialized && isBulk && finalSerials.length === 0) {
        setValidationError('Please enter or scan at least one serial number for bulk intake of this serialized equipment.');
        setIsSubmitting(false);
        return;
      }

      const result = storageService.executeTransaction({
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: 'DISPATCH_RECEIVE',
        mainCategory: targetCategory === 'TC-OPCDR' ? 'Rehabilitation' : 'New Connection',
        subCategory: targetCategory,
        materialCode: selectedItem.materialCode,
        materialDescription: selectedItem.description,
        quantityDelta: finalQuantity,
        unit,
        locatorId: locatorId.trim(),
        serialNumber:
          finalSerials.length === 1
            ? finalSerials[0]
            : (finalSerials.length > 1 ? `${finalSerials.length} Devices (Batch Intake)` : undefined),
        serialNumbers: finalSerials.length > 0 ? finalSerials : undefined,
        entryDate: arrivalDate,
        notes: `${notes.trim()} (Locator: ${locatorId.trim()}${finalSerials.length > 1 ? `, Serials: ${finalSerials.length} units` : ''})`,
      });

      refreshLedger();

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: targetCategory === 'TC-OPCDR' ? ['#43B02A', '#15803D', '#0099FF'] : ['#0056B3', '#0284C7', '#43B02A'],
        });
      } catch {
        // Fallback
      }

      const syncMsg = result.isQueuedOffline
        ? 'Cached locally in offline queue.'
        : 'Stock increased and recorded date-wise in audit ledger.';

      const serialCountMsg = finalSerials.length > 1
        ? ` with ${finalSerials.length} unique device serial numbers`
        : (finalSerials.length === 1 ? ` (S/N: ${finalSerials[0]})` : '');

      onSuccess(
        `Dispatch received! Added +${finalQuantity} ${unit} of ${selectedItem.materialCode}${serialCountMsg} into ${targetCategory} (Locator: ${locatorId}) on ${arrivalDate}. ${syncMsg}`
      );

      // Reset form
      setSerialNumber('');
      setBatchSerials([]);
      setBulkInputText('');
      setBulkPasteText('');
      setSelectedPreviewSerial(null);
      if (onClearPrefill) onClearPrefill();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Dispatch intake failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Summary to CSV
  const handleExportSummaryCSV = () => {
    const headers = ['Arrival Date', 'Category', 'Locator ID', 'Material Code', 'Item Description', 'Quantity (+)', 'Unit', 'Serial Number', 'Received By', 'Notes'];
    const rows = filteredDispatches.map((tx) => [
      `"${tx.entryDate || tx.timestamp.slice(0, 10)}"`,
      `"${tx.subCategory}"`,
      `"${tx.locatorId || ''}"`,
      `"${tx.materialCode}"`,
      `"${tx.materialDescription || ''}"`,
      tx.quantityDelta,
      `"${tx.unit}"`,
      `"${tx.serialNumber || 'N/A'}"`,
      `"${tx.userName}"`,
      `"${tx.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SLT_Dispatch_Intake_Summary_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0056B3 0%, #0284C7 100%)',
          color: '#FFFFFF',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0056B3',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                SLT MAIN BRANCH LOGISTICS
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                STOCK INCREASE ONLY (+)
              </span>
              <span style={{ fontSize: '0.8rem', color: '#BAE6FD', fontWeight: 600 }}>
                Inbound Dispatch &amp; Summarization
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#FFFFFF', fontWeight: 900, margin: 0 }}>
              Dispatch Intake &amp; Inbound Summarization Registry
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#E0F2FE', margin: '4px 0 0', maxWidth: 700 }}>
              Receive new prime materials for <strong>Rehabilitation (TC-OPCDR)</strong> or <strong>New Connection (TCOPNC)</strong> with dropdown item selection, locator ID, quantity, arrival date, and comprehensive date-wise summarization.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setActiveTab('SUMMARY');
                refreshLedger();
              }}
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '8px 14px',
                minHeight: 40,
                fontSize: '0.85rem',
                gap: 6,
              }}
            >
              <Boxes size={16} />
              <span>View Summaries ({dispatchHistory.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--slt-deep-blue)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Inbound Dispatches</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slt-deep-blue)', marginTop: 4 }}>
            {dispatchHistory.length} Batches
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Received at depot</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Units Inbounded</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--status-success)', marginTop: 4 }}>
            {totalUnitsDispatched.toLocaleString()} Units
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Added to prime stock (+)</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #43B02A' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rehab Stock (TC-OPCDR)</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803D', marginTop: 4 }}>
            {rehabUnitsDispatched.toLocaleString()} Units
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Outside plant hardware &amp; cables</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #0284C7' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>New Connection (TCOPNC)</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {newConnUnitsDispatched.toLocaleString()} Units
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ONTs, Routers, drop wire &amp; fittings</div>
        </div>
      </div>

      {/* Tabs Switcher: Intake vs Summary */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: 4,
        }}
      >
        <button
          onClick={() => setActiveTab('INTAKE')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            border: 'none',
            background: activeTab === 'INTAKE' ? '#0056B3' : 'transparent',
            color: activeTab === 'INTAKE' ? '#FFFFFF' : 'var(--text-secondary)',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <PackagePlus size={16} />
          <span>New Dispatch Intake Entry</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('SUMMARY');
            refreshLedger();
          }}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            border: 'none',
            background: activeTab === 'SUMMARY' ? '#0056B3' : 'transparent',
            color: activeTab === 'SUMMARY' ? '#FFFFFF' : 'var(--text-secondary)',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Boxes size={16} />
          <span>Inbound Dispatch History &amp; Summarization ({dispatchHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: New Dispatch Intake Entry Form */}
      {activeTab === 'INTAKE' && (
        <form onSubmit={handleSubmit} className="card" style={{ borderTop: '4px solid var(--slt-deep-blue)' }}>
          <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Log Inbound Material Dispatch
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Select category &rarr; pick item from dropdown &rarr; specify locator ID &rarr; quantity &rarr; arrival date.
              </p>
            </div>

            {/* Quick helper toggle for raw tag parsing */}
            <button
              type="button"
              onClick={() => setShowRawParser(!showRawParser)}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '4px 10px', minHeight: 32, gap: 4 }}
            >
              <Tag size={13} />
              <span>{showRawParser ? 'Hide Tag String Helper' : 'Scan / Paste Raw Tag String'}</span>
            </button>
          </div>

          {validationError && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: 'var(--radius-md)',
                color: '#991B1B',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={18} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Optional Raw Tag Parser Accordion */}
          {showRawParser && (
            <div
              style={{
                padding: 14,
                backgroundColor: '#F0F9FF',
                border: '1px dashed #0284C7',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369A1', marginBottom: 6 }}>
                Fast Paste / Scan: Standard SLT Batch String
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={rawTagInput}
                  onChange={(e) => setRawTagInput(e.target.value)}
                  placeholder="e.g. TC-01-REH-250104-999 | OSPFIT002 | AERIAL CABLE FITTING"
                  className="input-field mono"
                  style={{ fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() =>
                    onOpenScanner('Scan Main Branch Locator Tag', (scanned) => {
                      setRawTagInput(scanned);
                      handleApplyRawTag(scanned);
                    })
                  }
                  className="btn btn-outline"
                  style={{ minHeight: 40, padding: '0 12px' }}
                  title="Scan Tag with Camera"
                >
                  <QrCode size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRawTag(rawTagInput)}
                  className="btn btn-primary"
                  style={{ minHeight: 40, padding: '0 14px', fontSize: '0.8rem' }}
                >
                  Apply &amp; Auto-Fill
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Select Operation Category (Rehabilitation vs New Connection) */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#1E293B', marginBottom: 8 }}>
              Step 1: Select Operational Category <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Rehab Option */}
              <div
                onClick={() => setTargetCategory('TC-OPCDR')}
                style={{
                  border: targetCategory === 'TC-OPCDR' ? '2px solid #15803D' : '1px solid #CBD5E1',
                  backgroundColor: targetCategory === 'TC-OPCDR' ? '#F0FDF4' : '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cable size={18} color="#15803D" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#166534' }}>
                      Rehabilitation (TC-OPCDR)
                    </span>
                  </div>
                  {targetCategory === 'TC-OPCDR' && (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#15803D', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 700 }}>
                  86 Registered Project Materials
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#166534', lineHeight: 1.3 }}>
                  Outside plant infrastructure, aerial cable fittings, poles, closures, and drop fittings.
                </p>
              </div>

              {/* New Connection Option */}
              <div
                onClick={() => setTargetCategory('TCOPNC')}
                style={{
                  border: targetCategory === 'TCOPNC' ? '2px solid #0056B3' : '1px solid #CBD5E1',
                  backgroundColor: targetCategory === 'TCOPNC' ? '#EFF6FF' : '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PackagePlus size={18} color="#0056B3" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E40AF' }}>
                      New Connection (TCOPNC)
                    </span>
                  </div>
                  {targetCategory === 'TCOPNC' && (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#0056B3', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0056B3', fontWeight: 700 }}>
                  56 Registered Standard SKUs
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#1E3A8A', lineHeight: 1.3 }}>
                  Fiber ONTs, Wi-Fi Routers, PeoTV STBs, drop cables, brackets, and customer premise materials.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2: Dropdown to Select Equipment Item */}
          <div className="input-group">
            <div className="input-label">
              <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}>
                Step 2: Select Material Item from Dropdown
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                {categoryCatalog.length} items available in {targetCategory}
              </span>
            </div>

            {/* Quick Filter Box for Dropdown */}
            <SearchableSelect
              value={selectedItemId}
              onChange={(val) => {
                setSelectedItemId(val);
                const itm = inventory.find((i) => i.id === val);
                if (itm) setUnit(itm.unit);
              }}
              placeholder="Search or select material to dispatch..."
              searchPlaceholder="Type SKU code, description, or keyword..."
              options={categoryCatalog.map((item) => ({
                value: item.id,
                label: item.materialCode,
                subLabel: item.description,
                badge: `Stock: ${item.quantity} ${item.unit}`,
                badgeColor: item.quantity > 0 ? '#15803D' : '#DC2626',
              }))}
            />
          </div>

          {/* Selected Item Preview Chip */}
          {selectedItem && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                marginBottom: 16,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--slt-deep-blue)' }}>
                  SELECTED SKU MASTER:
                </span>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                  {selectedItem.materialCode} &mdash; {selectedItem.description}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem' }}>
                <span className="code-tag">Current On-Hand: {selectedItem.quantity} {selectedItem.unit}</span>
                <span className="code-tag">{selectedItem.isSerialized ? 'Serialized Device' : 'Bulk Material'}</span>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: Locator ID, Quantity, and Arrival Date ("date its came") */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {/* Step 3: Locator ID */}
            <div className="input-group">
              <label className="input-label">
                <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}>Step 3: Locator ID / Batch Tag</span>
                <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={locatorId}
                  onChange={(e) => setLocatorId(e.target.value)}
                  placeholder="e.g. TC-01-REH-250104-999 or NC-BIN-01"
                  className="input-field mono"
                  style={{ fontWeight: 700 }}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    onOpenScanner('Scan Locator Barcode Tag', (scanned) => {
                      const clean = extractSerialNumber(scanned);
                      setLocatorId(clean);
                    })
                  }
                  className="btn btn-outline"
                  style={{ minHeight: 48, padding: '0 12px' }}
                  title="Scan Locator with Camera"
                >
                  <QrCode size={18} />
                </button>
              </div>
            </div>

            {/* Step 4: Inbound Quantity */}
            <div className="input-group">
              <label className="input-label">
                <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}>Step 4: Quantity Received (+)</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="input-field mono"
                  style={{ fontWeight: 800, fontSize: '1.05rem' }}
                  required
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as InventoryItem['unit'])}
                  className="input-field"
                  style={{ width: 110, fontWeight: 700 }}
                >
                  <option value="PCS">PCS</option>
                  <option value="METERS">METERS</option>
                  <option value="ROLLS">ROLLS</option>
                  <option value="SETS">SETS</option>
                  <option value="UNITS">UNITS</option>
                </select>
              </div>
            </div>

            {/* Step 5: Arrival Date ("date its came") */}
            <div className="input-group">
              <label className="input-label">
                <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}>Step 5: Date It Came (Arrival Date)</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: 36, fontWeight: 700 }}
                  required
                />
                <Calendar
                  size={16}
                  style={{ position: 'absolute', left: 12, top: 16, color: '#64748B' }}
                />
              </div>
            </div>
          </div>

          {/* Step 6: Device Serial Number & Bulk Intake Mode Switcher */}
          <div style={{ marginTop: 8, padding: '16px', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="input-label" style={{ marginBottom: 2 }}>
                  <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)', fontSize: '0.95rem' }}>
                    Step 6: Device Serial Numbers (S/N) &amp; Equipment Verification
                  </span>
                  <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.8rem', marginLeft: 6 }}>
                    (ONT / Router / Terminal Equipment)
                  </span>
                </label>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Scan or paste serial numbers to auto-extract device telemetry, brand, and hardware specs.
                </div>
              </div>

              {/* Segmented Mode Selector: Single vs Bulk */}
              <div style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: 3, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setSerialIntakeMode('SINGLE')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: serialIntakeMode === 'SINGLE' ? '#0056B3' : 'transparent',
                    color: serialIntakeMode === 'SINGLE' ? '#FFFFFF' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Cpu size={14} />
                  <span>Single Device S/N</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSerialIntakeMode('BULK')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: serialIntakeMode === 'BULK' ? '#0056B3' : 'transparent',
                    color: serialIntakeMode === 'BULK' ? '#FFFFFF' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListPlus size={14} />
                  <span>Bulk Serial Batch ({batchSerials.length})</span>
                </button>
              </div>
            </div>

            {/* SINGLE MODE */}
            {serialIntakeMode === 'SINGLE' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. 2102312CHW10K1234567 or SLT-ONT-8245H-9912"
                      className="input-field mono"
                      style={{ fontWeight: 700, fontSize: '0.95rem' }}
                    />
                    {serialNumber && (
                      <button
                        type="button"
                        onClick={() => setSerialNumber('')}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: '#94A3B8',
                          padding: 4,
                        }}
                        title="Clear Serial"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenScanner(
                        'Scan Device Barcode / S/N (All Equipment & Models)',
                        (scanned) => {
                          const clean = extractSerialNumber(scanned);
                          setSerialNumber(clean);
                          const match = findEquipmentByBarcode(clean, inventory);
                          if (match.item) {
                            if (match.item.subCategory === 'TCOPNC' || match.item.subCategory === 'TC-OPCDR') {
                              setTargetCategory(match.item.subCategory);
                            }
                            setSelectedItemId(match.item.id);
                            setUnit(match.item.unit);
                          }
                        }
                      )
                    }
                    className="btn btn-outline"
                    style={{ minHeight: 46, padding: '0 16px', gap: 6, fontWeight: 700 }}
                    title="Scan Serial with Camera"
                  >
                    <QrCode size={18} />
                    <span>Scan with Camera</span>
                  </button>
                </div>
              </div>
            )}

            {/* BULK BATCH MODE (For 50, 100, 200+ Devices) */}
            {serialIntakeMode === 'BULK' && (
              <div
                style={{
                  padding: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 14,
                }}
              >
                {/* Bulk Controls Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 12,
                    paddingBottom: 10,
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        padding: '4px 10px',
                        backgroundColor: batchSerials.length > 0 ? '#DCFCE7' : '#F1F5F9',
                        color: batchSerials.length > 0 ? '#15803D' : '#64748B',
                        borderRadius: 20,
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>{batchSerials.length} Devices Loaded in Batch</span>
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.8rem',
                        color: '#334155',
                        cursor: 'pointer',
                        userSelect: 'none',
                        marginLeft: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={autoSyncQuantity}
                        onChange={(e) => {
                          setAutoSyncQuantity(e.target.checked);
                          if (e.target.checked && batchSerials.length > 0) {
                            setQuantity(batchSerials.length);
                            setUnit('UNITS');
                          }
                        }}
                      />
                      <span>Auto-sync quantity (+{batchSerials.length} UNITS)</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleOpenContinuousCameraScanner}
                      className="btn btn-outline"
                      style={{ fontSize: '0.78rem', padding: '5px 12px', minHeight: 34, gap: 5, color: '#0056B3', borderColor: '#0056B3' }}
                      title="Keep scanning devices one after another with your camera"
                    >
                      <Scan size={14} />
                      <span>Continuous Camera Scan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkPasteArea(!showBulkPasteArea)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.78rem', padding: '5px 12px', minHeight: 34, gap: 5 }}
                      title="Paste 100 serials from Excel or text file"
                    >
                      <UploadCloud size={14} />
                      <span>{showBulkPasteArea ? 'Close Paste Area' : 'Paste Multi-line (e.g. 100 S/N)'}</span>
                    </button>

                    {batchSerials.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleExportBatchSerials}
                          className="btn btn-outline"
                          style={{ fontSize: '0.78rem', padding: '5px 10px', minHeight: 34, gap: 4 }}
                          title="Export list of scanned serials to CSV"
                        >
                          <Download size={13} />
                          <span>Export CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearAllBatchSerials}
                          className="btn btn-outline"
                          style={{ fontSize: '0.78rem', padding: '5px 10px', minHeight: 34, gap: 4, color: '#DC2626', borderColor: '#FECACA' }}
                          title="Clear all serials in this batch"
                        >
                          <RotateCcw size={13} />
                          <span>Clear All</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Multi-line Paste Box for receiving 100 devices at once */}
                {showBulkPasteArea && (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #0056B3',
                      borderRadius: 6,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                        Paste Serial Numbers (One per line, comma or tab-separated from Excel / Manifest):
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Supports 100+ serials simultaneously
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder={`Example:\n2102312CHW10K0001\n2102312CHW10K0002\n2102312CHW10K0003\n...`}
                      className="input-field mono"
                      style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical', lineHeight: 1.5 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkPasteText('');
                          setShowBulkPasteArea(false);
                        }}
                        className="btn btn-outline"
                        style={{ fontSize: '0.78rem', padding: '4px 12px', minHeight: 32 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleParseAndAddPastedSerials}
                        disabled={!bulkPasteText.trim()}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '4px 16px', minHeight: 32, gap: 5 }}
                      >
                        <ListPlus size={14} />
                        <span>Process &amp; Add Serials to Batch</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* High-speed Barcode Gun Input (Enter key adds instantly) */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={bulkInputText}
                    onChange={(e) => setBulkInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (bulkInputText.trim()) {
                          handleAddBatchSerials([bulkInputText.trim()]);
                          setBulkInputText('');
                        }
                      }
                    }}
                    placeholder="Scan with USB/Bluetooth barcode gun or enter S/N and press Enter..."
                    className="input-field mono"
                    style={{ fontWeight: 600, fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkInputText.trim()) {
                        handleAddBatchSerials([bulkInputText.trim()]);
                        setBulkInputText('');
                      }
                    }}
                    disabled={!bulkInputText.trim()}
                    className="btn btn-primary"
                    style={{ minHeight: 44, padding: '0 16px', gap: 6, fontWeight: 700 }}
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                {/* Duplicate Inventory Warning if any loaded serial exists already */}
                {batchSerialsAlreadyInInventory.length > 0 && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      color: '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>
                      Notice: <strong>{batchSerialsAlreadyInInventory.length}</strong> serial(s) in this batch (e.g.{' '}
                      <code>{batchSerialsAlreadyInInventory.slice(0, 3).join(', ')}</code>) are already registered in current inventory. Re-receiving will increment tracking.
                    </span>
                  </div>
                )}

                {/* Scanned Serials List / Chips */}
                {batchSerials.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                        Batch Device Manifest ({batchSerials.length} units):
                      </span>
                      {batchSerials.length > 5 && (
                        <input
                          type="text"
                          value={batchSearchQuery}
                          onChange={(e) => setBatchSearchQuery(e.target.value)}
                          placeholder="Search batch..."
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            border: '1px solid #CBD5E1',
                            borderRadius: 4,
                            width: 140,
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        maxHeight: 220,
                        overflowY: 'auto',
                        border: '1px solid #E2E8F0',
                        borderRadius: 6,
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '6px 10px', width: 45 }}>#</th>
                            <th style={{ padding: '6px 10px' }}>Serial Number</th>
                            <th style={{ padding: '6px 10px' }}>Detected Brand</th>
                            <th style={{ padding: '6px 10px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBatchSerials.map((s, idx) => {
                            const parsed = parseBarcode(s);
                            const isSelectedForPreview = selectedPreviewSerial === s;
                            return (
                              <tr
                                key={s + idx}
                                style={{
                                  borderBottom: '1px solid #E2E8F0',
                                  backgroundColor: isSelectedForPreview ? '#EFF6FF' : 'transparent',
                                  transition: 'background-color 0.15s ease',
                                }}
                              >
                                <td style={{ padding: '6px 10px', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                                <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                                  {s}
                                  {isSelectedForPreview && (
                                    <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#0056B3', fontWeight: 800 }}>
                                      [Viewing Specs]
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      backgroundColor: '#E0E7FF',
                                      color: '#3730A3',
                                      borderRadius: 4,
                                      fontWeight: 600,
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    {parsed.detectedBrand || 'Standard CPE'}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPreviewSerial(isSelectedForPreview ? null : s)}
                                      className="btn btn-outline"
                                      style={{ padding: '2px 6px', minHeight: 24, fontSize: '0.72rem', gap: 3 }}
                                      title="Inspect full device specs below"
                                    >
                                      <Eye size={12} />
                                      <span>{isSelectedForPreview ? 'Close' : 'Details'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopySerial(s)}
                                      className="btn btn-outline"
                                      style={{ padding: '2px 6px', minHeight: 24, fontSize: '0.72rem' }}
                                      title="Copy Serial"
                                    >
                                      {copiedSerial === s ? <Check size={12} style={{ color: '#059669' }} /> : <Copy size={12} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBatchSerial(s)}
                                      style={{
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: '#EF4444',
                                        padding: '2px 4px',
                                      }}
                                      title="Remove from batch"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      borderRadius: 6,
                      color: '#64748B',
                      fontSize: '0.82rem',
                    }}
                  >
                    No device serials added yet. Scan devices rapidly using a barcode gun, continuous camera scan, or paste a list of up to 100+ serials above.
                  </div>
                )}
              </div>
            )}

            {/* LIVE DEVICE INFORMATION & SPECIFICATIONS CARD (WHEN A DEVICE IS SCANNED / SELECTED) */}
            {activeSerial && (
              <div
                style={{
                  marginTop: 12,
                  padding: '14px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #0056B3',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 12px rgba(0, 86, 179, 0.08)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: '#EFF6FF',
                        color: '#0056B3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Cpu size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Scanned Device Telemetry &amp; Specs</span>
                        <span
                          style={{
                            padding: '2px 8px',
                            backgroundColor: '#0056B3',
                            color: '#FFFFFF',
                            borderRadius: 12,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          Verified
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Serial:{' '}
                        <code style={{ fontWeight: 800, color: '#0056B3', fontSize: '0.82rem' }}>
                          {activeSerial}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleCopySerial(activeSerial)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', minHeight: 28, gap: 4 }}
                    >
                      {copiedSerial === activeSerial ? (
                        <>
                          <Check size={12} style={{ color: '#059669' }} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy S/N</span>
                        </>
                      )}
                    </button>
                    {serialIntakeMode === 'BULK' && (
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewSerial(null)}
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '4px 8px', minHeight: 28 }}
                        title="Close preview"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Device Specifications Grid */}
                {existingInStock && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#FEF2F2',
                      border: '1.5px solid #EF4444',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      color: '#991B1B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      fontWeight: 700,
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>
                      ⚠️ DUPLICATE SERIAL DETECTED: This serial is already registered in stock under{' '}
                      <u>{existingInStock.materialCode} &mdash; {existingInStock.description}</u>!
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Target Stock Product &amp; Description</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                      {selectedItem ? `${selectedItem.materialCode} — ${selectedItem.description}` : 'Product Not Selected'}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Warehouse Category</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                      {targetCategory}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Inbound Locator</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0056B3', fontFamily: 'monospace', marginTop: 2 }}>
                      {locatorId || 'DEFAULT-BIN'}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Hardware MAC / Identifier</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: '#334155', marginTop: 2 }}>
                      {parsedActive?.macAddress || 'N/A (Standard)'}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Current Warehouse Status</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: 2, color: existingInStock ? '#DC2626' : '#15803D' }}>
                      {existingInStock
                        ? `Already in stock at ${existingInStock.binLocation || 'Bin'} (Qty: ${existingInStock.quantity})`
                        : `Fresh Inbound &rarr; Receiving to ${locatorId || 'Selected Locator'}`}
                    </div>
                  </div>
                </div>

                {/* Auto-Match helper if the scanned serial belongs to a catalog item different from current selection */}
                {matchActive?.item && matchActive.item.id !== selectedItemId && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ color: '#1E40AF' }}>
                      Barcode matches product catalog:{' '}
                      <strong>{matchActive.item.materialCode} - {matchActive.item.description}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (matchActive.item) {
                          if (matchActive.item.subCategory === 'TCOPNC' || matchActive.item.subCategory === 'TC-OPCDR') {
                            setTargetCategory(matchActive.item.subCategory);
                          }
                          setSelectedItemId(matchActive.item.id);
                          setUnit(matchActive.item.unit);
                        }
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.72rem', padding: '3px 10px', minHeight: 26 }}
                    >
                      Select This Product
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Logistics Notes */}
            <div style={{ marginTop: 14 }}>
              <label className="input-label" style={{ fontWeight: 700 }}>
                Logistics Dispatch Notes / Container Reference:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received via Colombo Central Logistics Hub Container #14"
                className="input-field"
                style={{ fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Submit Intake */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 16,
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                Receiving Officer: <strong>{activeUser.name}</strong>
              </span>
              <span>
                Arrival: <strong>{arrivalDate}</strong> | Adding: <strong style={{ color: '#15803D' }}>+{quantity} {unit} into {targetCategory}</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                minHeight: 52,
                fontSize: '1.05rem',
                fontWeight: 800,
                gap: 10,
              }}
            >
              <PackagePlus size={22} />
              <span>
                {isSubmitting
                  ? 'Receiving Inbound Stock...'
                  : `Confirm Dispatch Intake (+${quantity} ${unit} to ${targetCategory})`}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Inbound Dispatch History & Summarization Registry */}
      {activeTab === 'SUMMARY' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Filter Bar */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Boxes size={18} color="var(--slt-deep-blue)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Inbound Dispatch Summarization &amp; Audit Trail
                  </h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Filter and audit every material dispatch received from Main Branch date-wise, by item name, locator ID, or serial number.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleExportSummaryCSV}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 36, gap: 6 }}
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 36, gap: 6 }}
                >
                  <Printer size={14} />
                  <span>Print Summary</span>
                </button>
                <button
                  onClick={() => setActiveTab('INTAKE')}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 36, gap: 6 }}
                >
                  <PackagePlus size={14} />
                  <span>+ Receive New Dispatch</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {/* Item Name / SKU Search */}
              <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <input
                  type="text"
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                  placeholder="Filter by Item Name or SKU..."
                  className="input-field"
                  style={{ paddingLeft: 32, minHeight: 38, fontSize: '0.82rem' }}
                />
                <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: '#64748B' }} />
              </div>

              {/* Serial Number Search */}
              <div style={{ position: 'relative', flex: '1 1 170px' }}>
                <input
                  type="text"
                  value={summarySerialFilter}
                  onChange={(e) => setSummarySerialFilter(e.target.value)}
                  placeholder="Filter by Serial #..."
                  className="input-field mono"
                  style={{ paddingLeft: 32, minHeight: 38, fontSize: '0.82rem' }}
                />
                <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: '#64748B' }} />
              </div>

              {/* Locator ID Search */}
              <div style={{ position: 'relative', flex: '1 1 170px' }}>
                <input
                  type="text"
                  value={summaryLocatorFilter}
                  onChange={(e) => setSummaryLocatorFilter(e.target.value)}
                  placeholder="Filter by Locator ID..."
                  className="input-field mono"
                  style={{ paddingLeft: 32, minHeight: 38, fontSize: '0.82rem' }}
                />
                <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: '#64748B' }} />
              </div>

              {/* Category Filter */}
              <select
                value={summaryCategoryFilter}
                onChange={(e) => setSummaryCategoryFilter(e.target.value as any)}
                className="input-field"
                style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="ALL">All Categories</option>
                <option value="TC-OPCDR">TC-OPCDR (Rehab)</option>
                <option value="TCOPNC">TCOPNC (New Conn)</option>
              </select>

              {/* Date-wise Filter */}
              <select
                value={summaryDateFilter}
                onChange={(e) => setSummaryDateFilter(e.target.value as any)}
                className="input-field"
                style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="ALL">All Arrival Dates</option>
                <option value="TODAY">Arrived Today ({todayStr})</option>
                <option value="CUSTOM">Select Exact Date...</option>
              </select>

              {summaryDateFilter === 'CUSTOM' && (
                <input
                  type="date"
                  value={summaryCustomDate}
                  onChange={(e) => setSummaryCustomDate(e.target.value)}
                  className="input-field"
                  style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
                />
              )}
            </div>
          </div>

          {/* Summarization Table */}
          <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: 600, overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ backgroundColor: '#E2E8F0' }}>
                  <th style={{ width: 105 }}>Arrival Date</th>
                  <th style={{ width: 110 }}>Category</th>
                  <th style={{ width: 160 }}>Locator ID</th>
                  <th>Item Code &amp; Description</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Inbound (+)</th>
                  <th style={{ width: 150 }}>Serial Number</th>
                  <th style={{ width: 130 }}>Received By</th>
                  <th>Logistics Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>No dispatch records matched the filter.</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                        Try clearing search terms or resetting the date filter.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDispatches.map((tx) => {
                    const isRehab = tx.subCategory === 'TC-OPCDR';
                    return (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>
                          {tx.entryDate || tx.timestamp.slice(0, 10)}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 4,
                              backgroundColor: isRehab ? '#DCFCE7' : '#EFF6FF',
                              border: `1px solid ${isRehab ? '#86EFAC' : '#BFDBFE'}`,
                              color: isRehab ? '#15803D' : '#1D4ED8',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                            }}
                          >
                            {tx.subCategory}
                          </span>
                        </td>
                        <td>
                          {tx.locatorId ? (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                color: 'var(--slt-deep-blue)',
                                backgroundColor: '#F1F5F9',
                                padding: '2px 6px',
                                borderRadius: 4,
                              }}
                            >
                              {tx.locatorId}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>&mdash;</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                            {tx.materialDescription || tx.materialCode}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                            {tx.materialCode}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                            }}
                          >
                            +{tx.quantityDelta} {tx.unit}
                          </span>
                        </td>
                        <td>
                          {tx.serialNumbers && tx.serialNumbers.length > 0 ? (
                            <div>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  color: '#0056B3',
                                  backgroundColor: '#EFF6FF',
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  border: '1px solid #BFDBFE',
                                  display: 'inline-block',
                                }}
                                title={tx.serialNumbers.join('\n')}
                              >
                                {tx.serialNumbers.length} Bulk Serials
                              </span>
                              <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.serialNumbers.join(', ')}>
                                {tx.serialNumbers.slice(0, 2).join(', ')}{tx.serialNumbers.length > 2 ? ` +${tx.serialNumbers.length - 2} more` : ''}
                              </div>
                            </div>
                          ) : tx.serialNumber ? (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                color: '#0056B3',
                                backgroundColor: '#EFF6FF',
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: '1px solid #BFDBFE',
                              }}
                            >
                              {tx.serialNumber}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              Non-serialized
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {tx.userName}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: 220 }}>
                          {tx.notes || '&mdash;'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
