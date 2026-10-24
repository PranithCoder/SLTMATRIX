import React, { useState, useMemo, useRef } from 'react';
import { 
  Cable, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Search, 
  Download, 
  Printer, 
  Edit2, 
  Layers, 
  Send,
  MapPin,
  Building2,
  Package,
  Clock,
  ChevronDown,
  Plus,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';
import { InventoryItem, UserPersona, SubCategoryCode } from '../../types/inventory';
import { storageService } from '../../services/storage';
import confetti from 'canvas-confetti';
import { SearchableSelect } from '../common/SearchableSelect';

interface WorkflowRehabProps {
  inventory: InventoryItem[];
  activeUser: UserPersona;
  onSuccess: (message: string) => void;
  onOpenScanner: (hint?: string) => void;
  prefilledMaterialCode?: string;
  prefilledWorkOrder?: string;
  onClearPrefill?: () => void;
  onAddProduct?: (category?: SubCategoryCode) => void;
  onEditProduct?: (item: InventoryItem) => void;
  onDeleteProduct?: (item: InventoryItem) => void;
  onTransferProduct?: (item?: InventoryItem) => void;
}

export const WorkflowRehab: React.FC<WorkflowRehabProps> = ({
  inventory,
  activeUser,
  onSuccess,
  onOpenScanner,
  prefilledMaterialCode,
  prefilledWorkOrder,
  onClearPrefill,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onTransferProduct,
}) => {
  // Filter all TC-OPCDR items
  const rehabItems = useMemo(
    () => inventory.filter((item) => item.subCategory === 'TC-OPCDR'),
    [inventory]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepot, setSelectedDepot] = useState<string>('ALL');
  const [activeViewTab, setActiveViewTab] = useState<'SHEET1' | 'ALLOCATE'>('SHEET1');

  // Allocation Form State
  const [selectedItemId, setSelectedItemId] = useState<string>(rehabItems[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [workOrderNo, setWorkOrderNo] = useState<string>(prefilledWorkOrder || 'WO-2025-08190');
  const [siteLocation, setSiteLocation] = useState<string>('Span #12 - Pole Junction 44, Havelock Town');
  const [remarks, setRemarks] = useState<string>('Replaced damaged cross-arm brackets and tension fittings.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick edit modal for On-hand / Inbound stages
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editOnHand, setEditOnHand] = useState<number>(0);
  const [editInbound, setEditInbound] = useState<number>(0);
  const [editReceiving, setEditReceiving] = useState<number>(0);

  const formSectionRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (prefilledMaterialCode) {
      const match = rehabItems.find(
        (item) => item.materialCode.toUpperCase() === prefilledMaterialCode.toUpperCase()
      );
      if (match) {
        setSelectedItemId(match.id);
        setActiveViewTab('ALLOCATE');
      }
    }
  }, [prefilledMaterialCode, rehabItems]);

  React.useEffect(() => {
    if (prefilledWorkOrder) {
      setWorkOrderNo(prefilledWorkOrder);
    }
  }, [prefilledWorkOrder]);

  const selectedItem = inventory.find((i) => i.id === selectedItemId);

  // Distinct Depot Prefixes from Locators
  const depotPrefixes = useMemo(() => {
    const prefixes = new Set<string>();
    rehabItems.forEach((i) => {
      const loc = i.binLocation || '';
      if (loc.startsWith('TC-01-REH')) prefixes.add('TC-01-REH (Rehab Field Depot)');
      else if (loc.startsWith('TC-01-CDR')) prefixes.add('TC-01-CDR (Central Cable Depot)');
      else if (loc.startsWith('TC-01-SSD')) prefixes.add('TC-01-SSD (Sub-Station Depot)');
      else if (loc) prefixes.add(loc);
    });
    return Array.from(prefixes).sort();
  }, [rehabItems]);

  // Unique locators count
  const uniqueLocatorsCount = useMemo(() => {
    const locs = new Set(rehabItems.map((i) => i.binLocation).filter(Boolean));
    return locs.size;
  }, [rehabItems]);

  // Filtered items for Sheet1
  const filteredItems = useMemo(() => {
    return rehabItems.filter((i) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        i.materialCode.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.binLocation && i.binLocation.toLowerCase().includes(q));

      let matchDepot = true;
      if (selectedDepot !== 'ALL') {
        const loc = i.binLocation || '';
        if (selectedDepot.startsWith('TC-01-REH')) {
          matchDepot = loc.startsWith('TC-01-REH');
        } else if (selectedDepot.startsWith('TC-01-CDR')) {
          matchDepot = loc.startsWith('TC-01-CDR');
        } else if (selectedDepot.startsWith('TC-01-SSD')) {
          matchDepot = loc.startsWith('TC-01-SSD');
        } else {
          matchDepot = loc === selectedDepot;
        }
      }

      return matchQuery && matchDepot;
    });
  }, [rehabItems, searchQuery, selectedDepot]);

  const totalOnHand = useMemo(
    () => rehabItems.reduce((sum, i) => sum + i.quantity, 0),
    [rehabItems]
  );
  const totalInbound = useMemo(
    () => rehabItems.reduce((sum, i) => sum + (i.inbound || 0), 0),
    [rehabItems]
  );

  // Quick Edit Modal Trigger
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditOnHand(item.quantity);
    setEditInbound(item.inbound || 0);
    setEditReceiving(item.receiving || 0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    storageService.updateItemStockStages(editingItem.id, {
      quantity: editOnHand,
      inbound: editInbound,
      receiving: editReceiving,
    });

    onSuccess(
      `Updated stages for ${editingItem.materialCode}: On-hand: ${editOnHand} ${editingItem.unit}, Inbound: ${editInbound}`
    );
    setEditingItem(null);
  };

  // Quick Action: select row to allocate
  const handleSelectForAllocation = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setActiveViewTab('ALLOCATE');
    setValidationError(null);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Export CSV matching user's exact Sheet1 layout
  const handleExportCSV = () => {
    const headers = ['Locator', 'Item', 'Item Description', 'UOM', 'On-hand', 'Inbound'];
    const rows = rehabItems.map((i) => [
      `"${i.binLocation || ''}"`,
      `"${i.materialCode}"`,
      `"${i.description}"`,
      `"${i.unit}"`,
      i.quantity,
      i.inbound || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TC_OPCDR_Material_Verification_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedItem) {
      setValidationError('Please select a rehabilitation material item.');
      return;
    }

    if (!quantity || quantity <= 0) {
      setValidationError('Quantity consumed must be greater than 0.');
      return;
    }

    if (quantity > selectedItem.quantity) {
      setValidationError(
        `Quantity requested (${quantity} ${selectedItem.unit}) exceeds current available stock (${selectedItem.quantity} ${selectedItem.unit}) in TC-OPCDR.`
      );
      return;
    }

    if (!workOrderNo.trim()) {
      setValidationError(
        'Mandatory Field: Work Order Number (WO#) is required for rehabilitation allocations.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = storageService.executeTransaction({
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: 'REHAB_CONSUMPTION',
        mainCategory: 'Rehabilitation',
        subCategory: 'TC-OPCDR',
        materialCode: selectedItem.materialCode,
        materialDescription: selectedItem.description,
        quantityDelta: -quantity,
        unit: selectedItem.unit,
        workOrderNo: workOrderNo.trim(),
        locatorId: selectedItem.binLocation,
        notes: `Site: ${siteLocation.trim()} | ${remarks.trim()}`,
      });

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#43B02A', '#0056B3', '#0099FF'],
        });
      } catch {
        // Fallback
      }

      const syncMsg = result.isQueuedOffline
        ? 'Cached Offline (Will sync when connectivity restores)'
        : 'Logged to immutable audit ledger!';

      onSuccess(
        `Successfully consumed ${quantity} ${selectedItem.unit} of ${selectedItem.materialCode} for Work Order ${workOrderNo}. ${syncMsg}`
      );

      // Reset form
      setQuantity(1);
      if (onClearPrefill) onClearPrefill();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Official Header Banner matching Material Verification Sheet */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0056B3 100%)',
          color: '#FFFFFF',
          padding: '22px 24px',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  backgroundColor: 'var(--mobitel-lime)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  padding: '3px 9px',
                  borderRadius: 4,
                  letterSpacing: '0.04em',
                }}
              >
                SUB-CATEGORY: TC-OPCDR
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#BAE6FD',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  padding: '3px 9px',
                  borderRadius: 4,
                }}
              >
                WORKFLOW B
              </span>
              <span
                style={{
                  backgroundColor: '#0369A1',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  padding: '3px 9px',
                  borderRadius: 4,
                }}
              >
                VERIFICATION: 2026-06-07
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              TC-OPCDR Material Verification & Work Order Allocation
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#E0F2FE', marginTop: 4, maxWidth: 740, lineHeight: 1.4 }}>
              Official SLT-MOBITEL Rehabilitation Project inventory covering 86 lines and 12,058 on-hand units across
              regional depot locators (cables, poles, fittings, clamp hardware, dropwire, and splice closures).
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
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
              <span>Export Sheet1 CSV</span>
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
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--slt-deep-blue)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Verified SKUs</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slt-deep-blue)', marginTop: 4 }}>
            {rehabItems.length} Lines
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Official Verification 2026-06-07</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total On-Hand Stock</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--status-success)', marginTop: 4 }}>
            {totalOnHand.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cables, Poles & Fittings Available</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #7C3AED' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Depot Locators Active</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7C3AED', marginTop: 4 }}>
            {uniqueLocatorsCount} Locators
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REH, CDR & SSD Depot Bays</div>
        </div>
      </div>

      {/* Navigation Switch between Sheet1 and Quick Allocate */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: 4,
        }}
      >
        <button
          onClick={() => setActiveViewTab('SHEET1')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            border: 'none',
            background: activeViewTab === 'SHEET1' ? '#0056B3' : 'transparent',
            color: activeViewTab === 'SHEET1' ? '#FFFFFF' : 'var(--text-secondary)',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Layers size={16} />
          <span>Sheet1: Material Verification (86 Items)</span>
        </button>

        <button
          onClick={() => setActiveViewTab('ALLOCATE')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            border: 'none',
            background: activeViewTab === 'ALLOCATE' ? '#0056B3' : 'transparent',
            color: activeViewTab === 'ALLOCATE' ? '#FFFFFF' : 'var(--text-secondary)',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Send size={16} />
          <span>Workflow B: Work Order Allocation Form</span>
        </button>
      </div>

      {/* VIEW 1: Sheet1 Material Verification Table */}
      {activeViewTab === 'SHEET1' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Controls & Filter Header */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    backgroundColor: 'var(--slt-deep-blue)',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}
                >
                  SHEET 1
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                  Material Verification 2026-06-07 Live Ledger
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Displaying {filteredItems.length} of {rehabItems.length} items. Click &ldquo;Allocate&rdquo; to charge against a Work Order.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {/* Add New Product Button */}
              {onAddProduct && (
                <button
                  onClick={() => onAddProduct('TC-OPCDR')}
                  className="btn btn-primary"
                  style={{ minHeight: 38, fontSize: '0.8rem', padding: '0 12px', gap: 6 }}
                  title="Add new product under TC-OPCDR"
                >
                  <Plus size={15} />
                  <span>+ Add Product</span>
                </button>
              )}

              {/* Transfer (Move Order) Button */}
              {onTransferProduct && (
                <button
                  onClick={() => onTransferProduct()}
                  className="btn btn-secondary"
                  style={{ minHeight: 38, fontSize: '0.8rem', padding: '0 12px', gap: 6 }}
                  title="Inter-Branch or Inter-District Transfer (Move Order)"
                >
                  <ArrowRightLeft size={15} />
                  <span>Transfer (Move Order)</span>
                </button>
              )}

              {/* Depot Locator Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={15} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={selectedDepot}
                  onChange={(e) => setSelectedDepot(e.target.value)}
                  className="input-field"
                  style={{ width: 'auto', minHeight: 38, fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <option value="ALL">All Locators (86)</option>
                  {depotPrefixes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keyword Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by SKU, description, locator..."
                  className="input-field"
                  style={{ width: 240, minHeight: 38, paddingLeft: 32, fontSize: '0.8rem' }}
                />
                <Search
                  size={15}
                  style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: 600, overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ backgroundColor: '#E2E8F0' }}>
                  <th style={{ width: 36, textAlign: 'center' }}>#</th>
                  <th style={{ width: 180 }}>Locator</th>
                  <th style={{ width: 130 }}>Item Code</th>
                  <th>Item Description</th>
                  <th style={{ width: 80, textAlign: 'center' }}>UOM</th>
                  <th style={{ width: 100, textAlign: 'center' }}>On-hand</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} style={{ transition: 'background-color 0.1s' }}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: item.binLocation?.includes('REH')
                            ? '#EFF6FF'
                            : item.binLocation?.includes('CDR')
                            ? '#FEF3C7'
                            : '#F1F5F9',
                          color: item.binLocation?.includes('REH')
                            ? '#1E40AF'
                            : item.binLocation?.includes('CDR')
                            ? '#92400E'
                            : '#334155',
                          display: 'inline-block',
                        }}
                      >
                        {item.binLocation || 'TC-01-REH--'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#0056B3' }}>
                        {item.materialCode}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {item.description}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: 3,
                          backgroundColor: '#F1F5F9',
                        }}
                      >
                        {item.unit}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: item.quantity > 0 ? '#DCFCE7' : '#FEE2E2',
                          color: item.quantity > 0 ? '#15803D' : '#B91C1C',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          minWidth: 38,
                        }}
                      >
                        {item.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleSelectForAllocation(item)}
                          className="btn btn-primary"
                          style={{
                            minHeight: 28,
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            gap: 4,
                          }}
                          title={`Allocate ${item.materialCode} for Work Order`}
                        >
                          <Send size={11} />
                          <span>Allocate</span>
                        </button>

                        {onTransferProduct && (
                          <button
                            onClick={() => onTransferProduct(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                              color: 'var(--slt-deep-blue)',
                            }}
                            title={`Move Order Transfer for ${item.materialCode}`}
                          >
                            <ArrowRightLeft size={11} />
                          </button>
                        )}

                        {onEditProduct ? (
                          <button
                            onClick={() => onEditProduct(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                            }}
                            title={`Edit product ${item.materialCode}`}
                          >
                            <Edit2 size={11} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                            }}
                            title="Update On-hand or Inbound stage"
                          >
                            <Edit2 size={11} />
                          </button>
                        )}

                        {onDeleteProduct && (
                          <button
                            onClick={() => onDeleteProduct(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                              color: 'var(--slt-crimson)',
                            }}
                            title={`Delete product ${item.materialCode}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Work Order Allocation Form (Workflow B Execution) */}
      <div ref={formSectionRef} className="card" style={{ display: activeViewTab === 'ALLOCATE' ? 'block' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span
                style={{
                  backgroundColor: 'var(--mobitel-lime)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 3,
                }}
              >
                WORKFLOW B FORM
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Non-Serialized Material Allocation
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Consumes bulk materials directly charged against an authorized SLT Work Order Number (<code>WO#</code>).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveViewTab('SHEET1')}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 36 }}
          >
            &larr; Back to Sheet1 Table
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
              <span>Select Material Code & Description</span>
              <span style={{ color: 'var(--mobitel-lime-dark)', fontWeight: 700 }}>
                Sub-Category: TC-OPCDR ({rehabItems.length} SKUs)
              </span>
            </label>
            <SearchableSelect
              value={selectedItemId}
              onChange={(val) => setSelectedItemId(val)}
              placeholder="Search rehab material code or description..."
              searchPlaceholder="Type SKU code, cable type, or locator..."
              options={rehabItems.map((item) => ({
                value: item.id,
                label: item.materialCode,
                subLabel: item.description,
                group: item.binLocation || 'DEPOT',
                badge: `Stock: ${item.quantity} ${item.unit}`,
                badgeColor: item.quantity > 0 ? '#15803D' : '#94A3B8',
              }))}
            />
          </div>

          {/* Consumed Quantity & Available Balance Badge */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <div className="input-group">
              <label className="input-label">
                <span>Consumed Quantity</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="1"
                  max={selectedItem?.quantity || 9999}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="input-field mono"
                  style={{ fontWeight: 700, fontSize: '1.1rem' }}
                  required
                />
                <span
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {selectedItem?.unit || 'PCS'}
                </span>
              </div>
              {selectedItem && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Warehouse Balance: <strong>{selectedItem.quantity.toLocaleString()} {selectedItem.unit}</strong> |
                  Remaining After:{' '}
                  <strong
                    style={{
                      color:
                        selectedItem.quantity - quantity < 5
                          ? 'var(--status-danger)'
                          : 'var(--status-success)',
                    }}
                  >
                    {Math.max(0, selectedItem.quantity - quantity).toLocaleString()} {selectedItem.unit}
                  </strong>
                </div>
              )}
            </div>

            {/* Mandatory Work Order Number */}
            <div className="input-group">
              <label className="input-label">
                <span>Work Order Number (WO#)</span>
                <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={workOrderNo}
                    onChange={(e) => setWorkOrderNo(e.target.value)}
                    placeholder="e.g. WO-2025-08190"
                    className="input-field mono"
                    style={{ fontWeight: 700 }}
                    required
                  />
                  <FileText
                    size={18}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 13,
                      color: 'var(--text-muted)',
                    }}
                  />
                </div>

                {/* Scan Work Order barcode */}
                <button
                  type="button"
                  onClick={() => onOpenScanner('Scan Work Order Barcode (WO#)')}
                  className="btn btn-outline"
                  style={{ padding: '0 12px', minHeight: 48 }}
                  title="Scan Work Order barcode with camera"
                >
                  <QrCode size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Site Location & Notes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div className="input-group">
              <label className="input-label">Rehab Site / Pole Span Location</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  placeholder="e.g. Span #12 - Pole Junction 44, Havelock Town"
                  className="input-field"
                  style={{ paddingLeft: 34 }}
                />
                <MapPin
                  size={16}
                  style={{ position: 'absolute', left: 10, top: 14, color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Field Execution Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Routine storm damage repair"
                className="input-field"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div
            style={{
              marginTop: 14,
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
                Operator: <strong>{activeUser.name}</strong>
              </span>
              <span>
                Category Impact:{' '}
                <strong style={{ color: 'var(--status-danger)' }}>
                  -{quantity} {selectedItem?.unit}
                </strong>{' '}
                from <code>{selectedItem?.binLocation || 'DEPOT'}</code>
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
              <CheckCircle2 size={22} />
              <span>
                {isSubmitting
                  ? 'Processing Allocation...'
                  : `Consume Stock & Post to WO# ${workOrderNo}`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Edit Modal for On-hand, Inbound, Receiving stages */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 24 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slt-deep-blue)' }}>
                  Update Stock Stages
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {editingItem.materialCode} — {editingItem.description}
                </p>
                <div style={{ marginTop: 2 }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: '#EFF6FF',
                      padding: '2px 6px',
                      borderRadius: 4,
                      color: 'var(--slt-deep-blue)',
                      fontWeight: 700,
                    }}
                  >
                    Locator: {editingItem.binLocation}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="input-group">
                <label className="input-label">
                  <span>1. On-Hand Stock (Available)</span>
                  <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>
                    {editingItem.unit}
                  </span>
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
                  <span>2. Inbound Stock (En-route from Dispatch)</span>
                  <span style={{ color: '#D97706', fontWeight: 700 }}>{editingItem.unit}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editInbound}
                  onChange={(e) => setEditInbound(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field mono"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span>3. Receiving Bay</span>
                  <span style={{ color: 'var(--text-muted)' }}>Optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editReceiving}
                  onChange={(e) => setEditReceiving(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field mono"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
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
                  style={{ flex: 1, minHeight: 44, fontWeight: 800 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
