import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ShieldCheck, 
  Search, 
  Download, 
  Printer, 
  ArrowRight, 
  PackageCheck, 
  Truck, 
  Edit2, 
  Calendar, 
  QrCode, 
  Wrench,
  Check,
  Plus,
  Trash2,
  ArrowRightLeft,
  Users,
  User,
  Phone,
  Home
} from 'lucide-react';
import { InventoryItem, UserPersona, SubCategoryCode, OpenScannerFn } from '../../types/inventory';
import { storageService } from '../../services/storage';
import { extractSerialNumber, findEquipmentByBarcode } from '../../utils/barcodeParser';
import confetti from 'canvas-confetti';

interface WorkflowCollectiveProps {
  inventory: InventoryItem[];
  activeUser: UserPersona;
  onSuccess: (message: string) => void;
  onOpenScanner?: OpenScannerFn;
  prefilledSerial?: string;
  onClearPrefill?: () => void;
  onAddProduct?: (category?: SubCategoryCode) => void;
  onEditProduct?: (item: InventoryItem) => void;
  onDeleteProduct?: (item: InventoryItem) => void;
  onTransferProduct?: (item?: InventoryItem) => void;
}

export const WorkflowCollective: React.FC<WorkflowCollectiveProps> = ({
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
  const collItems = inventory.filter((item) => item.subCategory === 'TCOPNC-C');
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>(collItems[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [receivedDate, setReceivedDate] = useState<string>(todayStr);
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [accountNo, setAccountNo] = useState<string>('0112789456');
  const [customerName, setCustomerName] = useState<string>('R. M. Bandara');
  const [customerContact, setCustomerContact] = useState<string>('0714589210');
  const [collectionReason, setCollectionReason] = useState<string>('Service Churn / Disconnection');
  const [condition, setCondition] = useState<'GOOD_REUSABLE' | 'FAULTY_REPAIR' | 'SCRAP'>('GOOD_REUSABLE');
  const [notes, setNotes] = useState<string>('Directly collected from customer premises. Equipment, power adapter, and fiber patch cord verified.');

  useEffect(() => {
    if (prefilledSerial) {
      const clean = extractSerialNumber(prefilledSerial);
      setSerialNumber(clean);
      const match = findEquipmentByBarcode(clean, inventory);
      if (match.item) {
        setSelectedItemId(match.item.id);
      }
    }
  }, [prefilledSerial, inventory]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick edit modal for Receiving / Inbound
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editOnHand, setEditOnHand] = useState<number>(0);
  const [editReceiving, setEditReceiving] = useState<number>(0);
  const [editInbound, setEditInbound] = useState<number>(0);

  const selectedItem = inventory.find((i) => i.id === selectedItemId);

  const filteredItems = collItems.filter((i) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || i.materialCode.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
  });

  const totalOnHand = collItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalReceiving = collItems.reduce((sum, i) => sum + (i.receiving || 0), 0);
  const totalInbound = collItems.reduce((sum, i) => sum + (i.inbound || 0), 0);

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

    onSuccess(`Updated stock stages for ${editingItem.materialCode}: On-hand: ${editOnHand}, Receiving: ${editReceiving}, Inbound: ${editInbound}`);
    setEditingItem(null);
  };

  // Strictly STOCK INCREASE (+) ONLY - Direct Collection from Customer Premises
  const handleCustomerCollect = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedItem) {
      setValidationError('Please select an equipment item.');
      return;
    }

    if (quantity <= 0) {
      setValidationError('Collected quantity must be at least 1.');
      return;
    }

    if (!accountNo.trim()) {
      setValidationError('Customer Account Number is required.');
      return;
    }

    if (!customerName.trim()) {
      setValidationError('Customer Name is required.');
      return;
    }

    if (!receivedDate) {
      setValidationError('Please select the collection date.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Always positive delta (+) into TCOPNC-C (Collective Stock)
      const result = storageService.executeTransaction({
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: 'CUSTOMER_COLLECT',
        mainCategory: 'New Connection',
        subCategory: 'TCOPNC-C',
        materialCode: selectedItem.materialCode,
        materialDescription: selectedItem.description,
        quantityDelta: quantity, // Stock Increase ONLY (+)
        unit: selectedItem.unit,
        serialNumber: serialNumber.trim() || undefined,
        accountNo: accountNo.trim(),
        customerName: customerName.trim(),
        entryDate: receivedDate,
        itemCondition: condition,
        reasonCode: collectionReason,
        notes: `Customer Premise Collection: ${customerName.trim()} (Acc: ${accountNo.trim()}) | Reason: ${collectionReason} | Condition: ${condition} | ${notes.trim()}`,
      });

      // Update matching customer issuance if found
      const issuances = storageService.getCustomerIssuances();
      const matchIdx = issuances.findIndex(
        (i) => i.status === 'ACTIVE' && 
               ((serialNumber && i.serialNumber === serialNumber.trim()) || i.accountNo === accountNo.trim())
      );
      if (matchIdx >= 0) {
        issuances[matchIdx] = {
          ...issuances[matchIdx],
          status: 'RETURNED_DIRECT',
          returnDate: receivedDate,
          returnType: 'TCOPNC-C',
          returnCondition: condition,
          returnNotes: notes.trim(),
          returnedBy: activeUser.name,
        };
        storageService.saveCustomerIssuances(issuances);
      }

      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#6B21A8', '#9333EA', '#15803D'],
        });
      } catch {
        // Fallback
      }

      onSuccess(
        `Collected ${quantity} ${selectedItem.unit} of ${selectedItem.materialCode} directly from customer ${customerName.trim()} (Acc: ${accountNo.trim()}) into TC-OPNC-C Collective Stock (+) on ${receivedDate}!`
      );

      // Reset serial and quantity
      setSerialNumber('');
      setQuantity(1);
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Customer collection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV matching user's exact sheet format
  const handleExportCSV = () => {
    const headers = ['Material Code', 'Item Description', 'On-Hand', 'Receiving', 'Inbound'];
    const rows = collItems.map((i) => [
      `"${i.materialCode}"`,
      `"${i.description}"`,
      i.quantity,
      i.receiving || 0,
      i.inbound || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TC_OPNC_C_Customer_Collective_Stock_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Official Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
          color: '#FFFFFF',
          padding: '22px 24px',
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
                  color: '#4C1D95',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                SUB-CATEGORY: TC-OPNC-C
              </span>
              <span
                style={{
                  backgroundColor: '#15803D',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                STOCK INCREASE ONLY (+)
              </span>
              <span style={{ fontSize: '0.8rem', color: '#DDD6FE', fontWeight: 600 }}>
                Direct Customer Premise Collections
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              TC-OPNC-C: Collective Stock (Customer Collections)
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#EDE9FE', margin: '4px 0 0', maxWidth: 680 }}>
              Dedicated inventory for equipment collected directly from customer premises (churn, cancellations, fault swaps). Stock movement in this category is strictly <strong>incoming / stock increase (+)</strong>.
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

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #6D28D9' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total SKUs Master</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4C1D95', marginTop: 4 }}>{collItems.length} Items</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered in TC-OPNC-C</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>On-Hand Stock</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-success)', marginTop: 4 }}>{totalOnHand} Units</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Available in depot</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--slt-deep-blue)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Receiving Stage</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slt-deep-blue)', marginTop: 4 }}>{totalReceiving} Units</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Under depot verification</div>
        </div>

          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Inbound Stage</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-warning)', marginTop: 4 }}>{totalInbound} Units</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In-transit from Field Recovery Teams</div>
        </div>
      </div>

      {/* The 17 Dostocks Table */}
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
            backgroundColor: '#FAF5FF',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4C1D95' }}>
              TC-OPNC-C Stock Sheet ({collItems.length} Items)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Showing all registered hardware models, customer collected ONTs, STBs, and premise recovery units.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {onAddProduct && (
              <button
                type="button"
                onClick={() => onAddProduct('TCOPNC-C')}
                className="btn btn-primary"
                style={{
                  minHeight: 36,
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  gap: 5,
                  backgroundColor: '#7E22CE',
                  borderColor: '#6B21A8',
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
                  color: '#7E22CE',
                  borderColor: '#C084FC',
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
                style={{ width: 220, minHeight: 36, paddingLeft: 32, fontSize: '0.8rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr style={{ backgroundColor: '#F3E8FF' }}>
                <th style={{ width: 40, textAlign: 'center' }}>#</th>
                <th style={{ width: 140 }}>Material Code</th>
                <th>Item Description</th>
                <th style={{ width: 90, textAlign: 'center' }}>Primary</th>
                <th style={{ width: 100, textAlign: 'center' }}>On-hand</th>
                <th style={{ width: 90, textAlign: 'center' }}>Receiving</th>
                <th style={{ width: 90, textAlign: 'center' }}>Inbound</th>
                <th style={{ width: 160, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#6D28D9' }}>
                      {item.materialCode}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {item.description}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {item.unit}
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
                      {item.quantity}
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
                            color: '#4C1D95',
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
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          gap: 3,
                        }}
                        title="Update Stock Stages"
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

      {/* Quick Edit Modal for On-hand, Receiving, Inbound */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4C1D95' }}>
                  Update Stock Stages
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {editingItem.materialCode} &mdash; {editingItem.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="input-group">
                <label className="input-label">
                  <span>1. On-Hand Stock (Available)</span>
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
                  <span>3. Inbound Stage (In-Transit from Field Teams)</span>
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
                  style={{ flex: 1, minHeight: 44, backgroundColor: '#6D28D9' }}
                >
                  Save Stages
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Increase Form: Direct Customer Premise Collection */}
      <form onSubmit={handleCustomerCollect} className="card" style={{ borderTop: '4px solid #6D28D9' }}>
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div 
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#FAF5FF',
                  border: '1px solid #C4B5FD',
                  color: '#6D28D9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={16} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Collect Equipment Directly from Customer (TC-OPNC-C)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Credits stock <strong>(+)</strong> into TC-OPNC-C collective stock when recovering or collecting equipment directly from customer premises (churn, fault replacement, disconnect, or swap).
            </p>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#F0FDF4',
              border: '1px solid #86EFAC',
              color: '#15803D',
              fontWeight: 800,
              fontSize: '0.82rem',
            }}
          >
            <PlusCircle size={16} />
            <span>Stock Increase Only (+)</span>
          </div>
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
            <span style={{ fontWeight: 700, color: '#4C1D95' }}>Select Recovered Customer Equipment / SKU Model</span>
            <span style={{ color: '#6D28D9', fontWeight: 700 }}>TC-OPNC-C Catalog ({collItems.length} SKUs)</span>
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="input-field"
            style={{ fontWeight: 600 }}
          >
            {collItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.materialCode} - {item.description} (Current On-hand: {item.quantity} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Customer Information Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">
              <span>Customer Account # / Tele No</span>
              <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
            </label>
            <input
              type="text"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              placeholder="e.g. 0112789456"
              className="input-field mono"
              style={{ fontWeight: 700 }}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <span>Customer Full Name</span>
              <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. R. M. Bandara"
              className="input-field"
              style={{ fontWeight: 600 }}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <span>Customer Contact / Phone</span>
            </label>
            <input
              type="text"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="e.g. 0714589210"
              className="input-field mono"
            />
          </div>
        </div>

        {/* Date, Quantity & Serial */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Collection Date */}
          <div className="input-group">
            <label className="input-label">
              <span>Date Collected from Customer</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
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

          {/* Quantity */}
          <div className="input-group">
            <label className="input-label">
              <span>Quantity Collected (+)</span>
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

          {/* Serial Number */}
          <div className="input-group">
            <label className="input-label">
              <span>Device Serial Number (S/N)</span>
              <span style={{ color: '#059669', fontWeight: 600 }}>{selectedItem?.isSerialized ? 'Mandatory' : 'Optional'}</span>
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SLT-ONT-HW81-99 or scan barcode"
                className="input-field mono"
                style={{ fontWeight: 700 }}
                required={selectedItem?.isSerialized}
              />
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenScanner(
                      'Scan Recovered Equipment Barcode / S/N (All Models)',
                      (scanned) => {
                        const clean = extractSerialNumber(scanned);
                        setSerialNumber(clean);
                        const match = findEquipmentByBarcode(clean, inventory);
                        if (match.item) {
                          setSelectedItemId(match.item.id);
                        }
                      }
                    )
                  }
                  className="btn btn-outline"
                  style={{ minHeight: 48, padding: '0 12px' }}
                  title="Scan Any Equipment Barcode with Camera"
                >
                  <QrCode size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reason & Condition */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">
              <span>Customer Collection Reason</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <select
              value={collectionReason}
              onChange={(e) => setCollectionReason(e.target.value)}
              className="input-field"
              style={{ fontWeight: 600 }}
            >
              <option value="Service Churn / Disconnection">Service Churn / Disconnection</option>
              <option value="Faulty Hardware Replacement (Swap)">Faulty Hardware Replacement (Swap)</option>
              <option value="Speed Upgrade / Technology Swap">Speed Upgrade / Technology Swap</option>
              <option value="Customer Relocation Recovery">Customer Relocation Recovery</option>
              <option value="Account Suspension Recovery">Account Suspension Recovery</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">
              <span>Hardware Physical Condition</span>
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="input-field"
              style={{ fontWeight: 600 }}
            >
              <option value="GOOD_REUSABLE">Good / Reusable (Operational Condition)</option>
              <option value="FAULTY_REPAIR">Faulty / Needs Repair Testing</option>
              <option value="SCRAP">Damaged / Scrap (BER / Physical Damage)</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Customer Collection Remarks</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Directly collected from customer premises. Equipment, power adapter, and fiber patch cord verified."
            className="input-field"
            required
          />
        </div>

        {/* Footer & Submit */}
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
              Collecting Officer: <strong>{activeUser.name}</strong>
            </span>
            <span>
              Stock Addition: <strong style={{ color: '#15803D' }}>+{quantity} {selectedItem?.unit || 'UNITS'}</strong> into TC-OPNC-C
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: 52,
              backgroundColor: '#6D28D9',
              fontSize: '1.05rem',
              fontWeight: 800,
              gap: 10,
            }}
          >
            <PlusCircle size={22} />
            <span>
              {isSubmitting
                ? 'Collecting Hardware...'
                : `Collect & Add ${quantity} ${selectedItem?.unit || 'Units'} into TC-OPNC-C Stock (+)`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
