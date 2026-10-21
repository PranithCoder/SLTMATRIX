import React, { useState } from 'react';
import { 
  RotateCcw, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Download, 
  Printer, 
  Edit2, 
  ShieldCheck, 
  ChevronRight,
  PackagePlus,
  Hash,
  Calendar,
  Plus,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';
import { InventoryItem, SubCategoryCode, UserPersona, OpenScannerFn } from '../../types/inventory';
import { storageService } from '../../services/storage';
import { extractSerialNumber, findEquipmentByBarcode } from '../../utils/barcodeParser';
import confetti from 'canvas-confetti';

interface WorkflowReturnsProps {
  inventory: InventoryItem[];
  activeUser: UserPersona;
  onSuccess: (message: string) => void;
  onOpenScanner: OpenScannerFn;
  prefilledSerial?: string;
  onClearPrefill?: () => void;
  onAddProduct?: (category?: SubCategoryCode) => void;
  onEditProduct?: (item: InventoryItem) => void;
  onDeleteProduct?: (item: InventoryItem) => void;
  onTransferProduct?: (item?: InventoryItem) => void;
}

export const WorkflowReturns: React.FC<WorkflowReturnsProps> = ({
  inventory,
  activeUser,
  onSuccess,
  onOpenScanner,
  prefilledSerial,
  onClearPrefill,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onTransferProduct,
}) => {
  const [returnType, setReturnType] = useState<SubCategoryCode>('TCOPNC-R');
  
  // Return items corresponding to subcategory
  const currentCategoryItems = inventory.filter((item) => item.subCategory === returnType);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>(
    currentCategoryItems[0]?.materialCode || 'CPEFTH055S'
  );
  const [serialNumber, setSerialNumber] = useState<string>(prefilledSerial || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [accountOrWorkOrder, setAccountOrWorkOrder] = useState<string>('WR-2026-0412');
  const [reasonCode, setReasonCode] = useState<string>('Repaired & Tested OK (From Workshop)');
  const [itemCondition, setItemCondition] = useState<'GOOD_REUSABLE' | 'FAULTY_REPAIR' | 'SCRAP'>('GOOD_REUSABLE');
  const [notes, setNotes] = useState<string>('Received from Central Workshop / Repair Center. Tested and verified functional.');
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick edit stage modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editOnHand, setEditOnHand] = useState<number>(0);
  const [editReceiving, setEditReceiving] = useState<number>(0);
  const [editInbound, setEditInbound] = useState<number>(0);

  React.useEffect(() => {
    if (prefilledSerial) {
      const clean = extractSerialNumber(prefilledSerial);
      setSerialNumber(clean);
      const match = findEquipmentByBarcode(clean, inventory);
      if (match.item) {
        setSelectedMaterialCode(match.item.materialCode);
      }
    }
  }, [prefilledSerial, inventory]);

  // Handle return type change
  const handleTypeChange = (newType: SubCategoryCode) => {
    setReturnType(newType);
    const firstItem = inventory.find((i) => i.subCategory === newType);
    if (firstItem) {
      setSelectedMaterialCode(firstItem.materialCode);
    }
    if (newType === 'TCOPNC-R') {
      setAccountOrWorkOrder('WR-2026-0412');
      setReasonCode('Repaired & Tested OK (From Workshop)');
      setQuantity(1);
    } else {
      setAccountOrWorkOrder('WO-2025-08190');
      setReasonCode('Decommissioned Aerial Span Recovery');
      setQuantity(5);
    }
    setValidationError(null);
  };

  const isWorkshopReturn = returnType === 'TCOPNC-R';
  const selectedInventoryItem = currentCategoryItems.find((i) => i.materialCode === selectedMaterialCode);
  const isSerialized = Boolean(
    selectedInventoryItem?.isSerialized ||
    selectedMaterialCode.endsWith('S') ||
    selectedMaterialCode.includes('ONT') ||
    selectedMaterialCode.includes('RTR') ||
    selectedMaterialCode.includes('STB')
  );

  const filteredItems = currentCategoryItems.filter((i) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || i.materialCode.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
  });

  const totalOnHand = currentCategoryItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalReceiving = currentCategoryItems.reduce((sum, i) => sum + (i.receiving || 0), 0);
  const totalInbound = currentCategoryItems.reduce((sum, i) => sum + (i.inbound || 0), 0);

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditOnHand(item.quantity);
    setEditReceiving(item.receiving || 0);
    setEditInbound(item.inbound || 0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    storageService.updateItemStockStages(editingItem.id, {
      quantity: editOnHand,
      receiving: editReceiving,
      inbound: editInbound,
    });

    onSuccess(`Updated stages for ${editingItem.materialCode}: On-hand: ${editOnHand}, Receiving: ${editReceiving}, Inbound: ${editInbound}`);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (isSerialized && !serialNumber.trim()) {
      setValidationError('Serial Number is mandatory for customer return serialized equipment.');
      return;
    }

    if (!isSerialized && (!quantity || quantity <= 0)) {
      setValidationError('Return quantity must be at least 1.');
      return;
    }

    if (!accountOrWorkOrder.trim()) {
      setValidationError(
        isWorkshopReturn ? 'Workshop Job Card / Repair Order Number is required.' : 'Work Order Number (WO#) is required.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const description = selectedInventoryItem?.description || selectedMaterialCode;
      const unit = selectedInventoryItem?.unit || (isSerialized ? 'UNITS' : 'PCS');

      const result = storageService.executeTransaction({
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: isWorkshopReturn ? 'CUSTOMER_RETURN' : 'REHAB_RECOVERY',
        mainCategory: isWorkshopReturn ? 'New Connection' : 'Rehabilitation',
        subCategory: returnType,
        materialCode: selectedMaterialCode.toUpperCase(),
        materialDescription: description,
        quantityDelta: isSerialized ? 1 : quantity,
        unit,
        serialNumber: isSerialized ? serialNumber.trim() : undefined,
        workOrderNo: accountOrWorkOrder.trim(),
        entryDate: returnDate,
        reasonCode: reasonCode.trim(),
        itemCondition,
        notes: `Condition: ${itemCondition} | ${notes.trim()}`,
      });

      // If matching equipment in customer issuance registry, update its return status to workshop returned
      if (isWorkshopReturn) {
        const issuances = storageService.getCustomerIssuances();
        const matchIdx = issuances.findIndex(
          (i) => i.status === 'ACTIVE' && 
                 ((serialNumber && i.serialNumber === serialNumber.trim()) || i.accountNo === accountOrWorkOrder.trim())
        );
        if (matchIdx >= 0) {
          issuances[matchIdx] = {
            ...issuances[matchIdx],
            status: 'RETURNED_WORKSHOP',
            returnDate: returnDate,
            returnType: 'TCOPNC-R',
            returnCondition: itemCondition,
            returnedBy: activeUser.name,
          };
          storageService.saveCustomerIssuances(issuances);
        }
      }

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#E65100', '#0099FF', '#43B02A'],
        });
      } catch {
        // Fallback
      }

      const syncMsg = result.isQueuedOffline
        ? 'Cached Offline (Will sync when connectivity restores)'
        : 'Logged to segregated return inventory!';

      onSuccess(
        `Returned item successfully credited to ${returnType} (+${isSerialized ? 1 : quantity} ${unit}). ${syncMsg}`
      );

      setSerialNumber('');
      if (onClearPrefill) onClearPrefill();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Return failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = returnType === 'TC-OPCDR-R'
      ? ['Locator', 'Item', 'Item Description', 'UOM', 'On-hand', 'Inbound']
      : ['Item', 'Item Description', 'On-hand', 'Receiving', 'Inbound'];

    const rows = currentCategoryItems.map((i) => {
      if (returnType === 'TC-OPCDR-R') {
        return [
          `"${i.binLocation || 'USB-TC-OPCD--'}"`,
          `"${i.materialCode}"`,
          `"${i.description}"`,
          `"${i.unit}"`,
          i.quantity,
          i.inbound || '',
        ];
      }
      return [
        `"${i.materialCode}"`,
        `"${i.description}"`,
        i.quantity,
        i.receiving || '',
        i.inbound || '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${returnType}_Verification_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Workflow Banner */}
      <div
        className="card"
        style={{
          background: returnType === 'TC-OPCDR-R'
            ? 'linear-gradient(135deg, #0C4A6E 0%, #0284C7 100%)'
            : 'linear-gradient(135deg, #7C2D12 0%, #C2410C 100%)',
          color: '#FFFFFF',
          padding: '20px 24px',
          border: 'none',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  backgroundColor: '#FFFFFF',
                  color: returnType === 'TC-OPCDR-R' ? '#0284C7' : '#C2410C',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                SUB-CATEGORY: {returnType === 'TCOPNC-R' ? 'TC-OPNC-R' : 'TC-OPCDR-R'}
              </span>
              <span style={{ fontSize: '0.8rem', color: returnType === 'TC-OPCDR-R' ? '#BAE6FD' : '#FED7AA', fontWeight: 600 }}>
                {returnType === 'TC-OPCDR-R' ? 'Field Rehab Recoveries & Salvage' : 'Central Workshop Returns & Repaired Stock'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              {returnType === 'TCOPNC-R' ? 'TC-OPNC-R Workshop Returns Inventory' : 'TC-OPCDR-R Field Rehab Recoveries Sheet'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: returnType === 'TC-OPCDR-R' ? '#E0F2FE' : '#FFEDD5', marginTop: 2, maxWidth: 680 }}>
              {returnType === 'TC-OPCDR-R'
                ? 'Official SLT-MOBITEL dostocks records for field rehabilitation recoveries (10 items, 4,452 units) under depot locator USB-TC-OPCD--.'
                : 'Inbound returns holding ledger for equipment returned from Central Workshops and Repair Centers.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleExportCSV}
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '8px 14px',
                minHeight: 40,
                fontSize: '0.85rem',
              }}
            >
              <Download size={16} />
              <span>Export Sheet</span>
            </button>

            <button
              onClick={() => window.print()}
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '8px 14px',
                minHeight: 40,
                fontSize: '0.85rem',
              }}
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subcategory Toggle */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          padding: 8,
          backgroundColor: '#F1F5F9',
        }}
      >
        <button
          type="button"
          onClick={() => handleTypeChange('TCOPNC-R')}
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: returnType === 'TCOPNC-R' ? '2px solid #C2410C' : '1px solid transparent',
            backgroundColor: returnType === 'TCOPNC-R' ? '#FFFFFF' : 'transparent',
            color: returnType === 'TCOPNC-R' ? '#C2410C' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: returnType === 'TCOPNC-R' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <div>🔧 TC-OPNC-R (Central Workshop Returns)</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 500, marginTop: 2 }}>
            {currentCategoryItems.length} Registered Dostocks Items
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('TC-OPCDR-R')}
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: returnType === 'TC-OPCDR-R' ? '2px solid #0284C7' : '1px solid transparent',
            backgroundColor: returnType === 'TC-OPCDR-R' ? '#FFFFFF' : 'transparent',
            color: returnType === 'TC-OPCDR-R' ? '#0284C7' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: returnType === 'TC-OPCDR-R' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <div>♻️ TC-OPCDR-R (Field Rehab Recoveries)</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 500, marginTop: 2 }}>
            10 Official Dostocks Items (4,452 Units)
          </div>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div
          className="card"
          style={{
            padding: '14px 18px',
            borderLeft: returnType === 'TC-OPCDR-R' ? '4px solid #0284C7' : '4px solid #C2410C',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total SKUs Master</div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: returnType === 'TC-OPCDR-R' ? '#0284C7' : '#C2410C',
              marginTop: 4,
            }}
          >
            {currentCategoryItems.length} Items
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In {returnType} sheet</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>On-Hand Stock</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-success)', marginTop: 4 }}>
            {totalOnHand.toLocaleString()} Units
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Segregated in warehouse</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--slt-deep-blue)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Receiving Stage</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slt-deep-blue)', marginTop: 4 }}>
            {totalReceiving} Units
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Under inspection</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Inbound Stage</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-warning)', marginTop: 4 }}>
            {totalInbound} Units
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In-transit from branches</div>
        </div>
      </div>

      {/* The Dostocks Table (Exact replica of user's provided sheet) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            backgroundColor: returnType === 'TC-OPCDR-R' ? '#F0F9FF' : '#FFF7ED',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: returnType === 'TC-OPCDR-R' ? '#0369A1' : '#9A3412',
              }}
            >
              {returnType === 'TCOPNC-R'
                ? `TC-OPNC-R Workshop Returns Sheet (${currentCategoryItems.length} Items)`
                : `TC-OPCDR-R Field Recoveries Sheet (${currentCategoryItems.length} Items)`}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {returnType === 'TCOPNC-R'
                ? 'Official records for equipment returned from Central Workshops and Repair Centers.'
                : 'Official records for field rehabilitation recoveries under depot locator USB-TC-OPCD--.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {onAddProduct && (
              <button
                type="button"
                onClick={() => onAddProduct(returnType)}
                className="btn btn-primary"
                style={{
                  minHeight: 36,
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  gap: 5,
                  backgroundColor: returnType === 'TC-OPCDR-R' ? '#0284C7' : '#EA580C',
                  borderColor: returnType === 'TC-OPCDR-R' ? '#0369A1' : '#C2410C',
                }}
              >
                <Plus size={14} />
                <span>+ Add Product</span>
              </button>
            )}

            {onTransferProduct && (
              <button
                type="button"
                onClick={() => onTransferProduct()}
                className="btn btn-outline"
                style={{
                  minHeight: 36,
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  gap: 5,
                  color: returnType === 'TC-OPCDR-R' ? '#0369A1' : '#EA580C',
                  borderColor: returnType === 'TC-OPCDR-R' ? '#7DD3FC' : '#FDBA74',
                }}
              >
                <ArrowRightLeft size={14} />
                <span>Transfer (Move Order)</span>
              </button>
            )}

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Item Code or Description..."
                className="input-field"
                style={{ width: 200, minHeight: 36, paddingLeft: 32, fontSize: '0.8rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: 440, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: returnType === 'TC-OPCDR-R' ? '#E0F2FE' : '#FFEDD5' }}>
                <th style={{ width: 36, textAlign: 'center' }}>#</th>
                <th style={{ width: 130 }}>Locator</th>
                <th>Item (Material Code)</th>
                <th>Item Description</th>
                <th style={{ width: 70, textAlign: 'center' }}>UOM</th>
                <th style={{ textAlign: 'center', width: 80 }}>On-hand</th>
                <th style={{ textAlign: 'center', width: 80 }}>Receiving</th>
                <th style={{ textAlign: 'center', width: 80 }}>Inbound</th>
                <th style={{ textAlign: 'right', width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: returnType === 'TC-OPCDR-R' ? '#EFF6FF' : '#F1F5F9',
                        color: returnType === 'TC-OPCDR-R' ? '#1E40AF' : 'var(--text-secondary)',
                        display: 'inline-block',
                      }}
                    >
                      {item.binLocation || (returnType === 'TC-OPCDR-R' ? 'USB-TC-OPCD--' : 'RET-BAY')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          color: returnType === 'TC-OPCDR-R' ? '#0369A1' : '#9A3412',
                        }}
                      >
                        {item.materialCode}
                      </strong>
                      {item.isSerialized && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            backgroundColor: '#FED7AA',
                            color: '#9A3412',
                          }}
                        >
                          SERIALIZED
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {item.description}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {item.unit || 'PCS'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: item.quantity > 0 ? '#DCFCE7' : '#FEE2E2',
                        color: item.quantity > 0 ? '#15803D' : '#B91C1C',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        minWidth: 36,
                      }}
                    >
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 4,
                        backgroundColor: (item.receiving || 0) > 0 ? '#EFF6FF' : '#F1F5F9',
                        color: (item.receiving || 0) > 0 ? '#1D4ED8' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        minWidth: 32,
                      }}
                    >
                      {item.receiving || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 4,
                        backgroundColor: (item.inbound || 0) > 0 ? '#FEF3C7' : '#F1F5F9',
                        color: (item.inbound || 0) > 0 ? '#B45309' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        minWidth: 32,
                      }}
                    >
                      {item.inbound || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      {onEditProduct && (
                        <button
                          type="button"
                          onClick={() => onEditProduct(item)}
                          className="btn btn-outline"
                          title="Edit Product"
                          style={{
                            minHeight: 28,
                            padding: '3px 7px',
                            fontSize: '0.72rem',
                            color: '#9A3412',
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {onTransferProduct && (
                        <button
                          type="button"
                          onClick={() => onTransferProduct(item)}
                          className="btn btn-outline"
                          title="Transfer via Move Order"
                          style={{
                            minHeight: 28,
                            padding: '3px 7px',
                            fontSize: '0.72rem',
                            color: '#0284C7',
                          }}
                        >
                          <ArrowRightLeft size={12} />
                        </button>
                      )}
                      {onDeleteProduct && (
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(item)}
                          className="btn btn-outline"
                          title="Delete Product"
                          style={{
                            minHeight: 28,
                            padding: '3px 7px',
                            fontSize: '0.72rem',
                            color: '#DC2626',
                            borderColor: '#FCA5A5',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn btn-outline"
                        style={{
                          minHeight: 28,
                          padding: '3px 7px',
                          fontSize: '0.72rem',
                          gap: 3,
                        }}
                        title="Update On-hand / Receiving / Inbound stages"
                      >
                        <span>Stages</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Stage Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C2410C' }}>
                  Update Stock Stages
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {editingItem.materialCode} — {editingItem.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="input-group">
                <label className="input-label">
                  <span>1. On-Hand Stock (Available in Segregated Bay)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editOnHand}
                  onChange={(e) => setEditOnHand(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field mono"
                  style={{ fontWeight: 800 }}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span>2. Receiving Stage (Under Verification)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editReceiving}
                  onChange={(e) => setEditReceiving(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field mono"
                  style={{ fontWeight: 800 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span>3. Inbound Stage (In-Transit)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editInbound}
                  onChange={(e) => setEditInbound(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field mono"
                  style={{ fontWeight: 800 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-outline"
                  style={{ flex: 1, minHeight: 44 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, minHeight: 44, backgroundColor: '#C2410C' }}
                >
                  Save Stages
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Intake Form */}
      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Process Return Intake ({returnType === 'TCOPNC-R' ? 'TC-OPNC-R Workshop Return' : 'TC-OPCDR-R Rehab Recovery'})
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Credits stock (<code>+</code>) into the {returnType === 'TCOPNC-R' ? 'workshop returns' : 'rehab recoveries'} ledger with workshop inspection condition and repair reference.
          </p>
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

        {/* Material Selection */}
        <div className="input-group">
          <label className="input-label">
            <span>Select Return Material / SKU</span>
            <span className="code-tag">{returnType}</span>
          </label>
          <select
            value={selectedMaterialCode}
            onChange={(e) => setSelectedMaterialCode(e.target.value)}
            className="input-field"
            style={{ fontWeight: 600 }}
          >
            {currentCategoryItems.map((item) => (
              <option key={item.id} value={item.materialCode}>
                {item.materialCode} - {item.description} (Stock: {item.quantity} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Serial Number (if serialized) OR Quantity (if bulk) */}
        {isSerialized ? (
          <div className="input-group">
            <div className="input-label">
              <span>Scanned Device Serial Number (S/N)</span>
              <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SLT-RET-HW55-09"
                className="input-field mono"
                style={{ fontWeight: 700 }}
                required
              />
              <button
                type="button"
                onClick={() =>
                  onOpenScanner(
                    'Scan Return Item Barcode / S/N (All Equipment & Models)',
                    (scanned) => {
                      const clean = extractSerialNumber(scanned);
                      setSerialNumber(clean);
                      const match = findEquipmentByBarcode(clean, inventory);
                      if (match.item) {
                        setSelectedMaterialCode(match.item.materialCode);
                      }
                    }
                  )
                }
                className="btn btn-primary"
                style={{ padding: '0 16px', minHeight: 48, gap: 6 }}
              >
                <QrCode size={18} />
                <span>Scan S/N</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="input-group">
            <label className="input-label">
              <span>Returned / Recovered Quantity</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="input-field mono"
              style={{ fontWeight: 700 }}
              required
            />
          </div>
        )}

        {/* Source Reference: Workshop Order # or Work Order # & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">
              <span>{isWorkshopReturn ? 'Workshop Job Card / Repair Order #' : 'Rehab Work Order # (WO#)'}</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={accountOrWorkOrder}
              onChange={(e) => setAccountOrWorkOrder(e.target.value)}
              placeholder={isWorkshopReturn ? 'e.g. WR-2026-0412' : 'e.g. WO-2025-08190'}
              className="input-field mono"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <span>Return Date (Date-wise entry)</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
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

          {/* Return Reason Code */}
          <div className="input-group">
            <label className="input-label">
              <span>Return / Recovery Reason Code</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="input-field"
            >
              {isWorkshopReturn ? (
                <>
                  <option value="Repaired & Tested OK (From Workshop)">Repaired & Tested OK (From Workshop)</option>
                  <option value="Central Workshop Repair Completed">Central Workshop Repair Completed</option>
                  <option value="Factory Refurbished Unit Return">Factory Refurbished Unit Return</option>
                  <option value="Unrepairable BER / Condemned Handover">Unrepairable BER / Condemned Handover</option>
                </>
              ) : (
                <>
                  <option value="Decommissioned Aerial Span Recovery">Decommissioned Aerial Span Recovery</option>
                  <option value="Pole Replacement Salvage">Pole Replacement Salvage</option>
                  <option value="Excess Field Material Handover">Excess Field Material Handover</option>
                  <option value="Storm Damage Recovery">Storm Damage Recovery</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Physical Condition Status */}
        <div className="input-group">
          <label className="input-label">
            <span>Physical Condition & Grading</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'GOOD_REUSABLE', label: 'Good / Reusable', color: 'var(--status-success)', icon: '✅' },
              { id: 'FAULTY_REPAIR', label: 'Faulty / Repair', color: 'var(--status-warning)', icon: '⚠️' },
              { id: 'SCRAP', label: 'Damaged / Scrap', color: 'var(--status-danger)', icon: '❌' },
            ].map((cond) => (
              <button
                key={cond.id}
                type="button"
                onClick={() => setItemCondition(cond.id as typeof itemCondition)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: itemCondition === cond.id ? `2px solid ${cond.color}` : '1px solid var(--border-color)',
                  backgroundColor: itemCondition === cond.id ? '#F8FAFC' : '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{cond.icon}</span>
                <span>{cond.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="input-group">
          <label className="input-label">Audit Notes & Inspection Check</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Visual inspection passed, power pack included."
            className="input-field"
          />
        </div>

        {/* Submit */}
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
            <span>Operator: <strong>{activeUser.name}</strong></span>
            <span>Return Ledger: <strong style={{ color: '#C2410C' }}>+{isSerialized ? 1 : quantity} into {returnType}</strong></span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{
              width: '100%',
              minHeight: 52,
              fontSize: '1.05rem',
              fontWeight: 800,
              gap: 10,
              backgroundColor: '#C2410C',
            }}
          >
            <RotateCcw size={22} />
            <span>{isSubmitting ? 'Receiving Return...' : `Increase Return Stock (+) in ${returnType}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
