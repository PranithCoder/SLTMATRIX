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
  Check
} from 'lucide-react';
import { InventoryItem, LedgerTransaction, SubCategoryCode, UserPersona, OpenScannerFn } from '../../types/inventory';
import { storageService } from '../../services/storage';
import { parseBatchLocatorCode } from '../../services/batchParser';
import { extractSerialNumber, findEquipmentByBarcode } from '../../utils/barcodeParser';
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

  // 6. Serial Number (Optional)
  const [serialNumber, setSerialNumber] = useState<string>('');

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
        const matchSerial = tx.serialNumber && tx.serialNumber.toLowerCase().includes(q);
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
      const result = storageService.executeTransaction({
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: 'DISPATCH_RECEIVE',
        mainCategory: targetCategory === 'TC-OPCDR' ? 'Rehabilitation' : 'New Connection',
        subCategory: targetCategory,
        materialCode: selectedItem.materialCode,
        materialDescription: selectedItem.description,
        quantityDelta: quantity,
        unit,
        locatorId: locatorId.trim(),
        serialNumber: serialNumber.trim() || undefined,
        entryDate: arrivalDate,
        notes: `${notes.trim()} (Locator: ${locatorId.trim()})`,
      });

      refreshLedger();

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: targetCategory === 'TC-OPCDR' ? ['#43B02A', '#15803D', '#0099FF'] : ['#0056B3', '#0284C7', '#43B02A'],
        });
      } catch {
        // Fallback
      }

      const syncMsg = result.isQueuedOffline
        ? 'Cached locally in offline queue.'
        : 'Stock increased and recorded date-wise in audit ledger.';

      onSuccess(
        `Dispatch received! Added +${quantity} ${unit} of ${selectedItem.materialCode} into ${targetCategory} (Locator: ${locatorId}) on ${arrivalDate}. ${syncMsg}`
      );

      // Reset form
      setSerialNumber('');
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

          {/* Step 6: Serial Number (Optional) & Logistics Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">
                <span>Device Serial Number (S/N)</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>Optional (ONT/Router)</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SLT-ONT-8245H-9912 (or leave empty for bulk)"
                  className="input-field mono"
                  style={{ fontWeight: 700 }}
                />
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
                  style={{ minHeight: 48, padding: '0 12px' }}
                  title="Scan Serial with Camera"
                >
                  <QrCode size={18} />
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Logistics Dispatch Notes / Container Reference</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received via Colombo Central Logistics Hub Container #14"
                className="input-field"
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
                          {tx.serialNumber ? (
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
                              Bulk / Non-serialized
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
