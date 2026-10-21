import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Truck, 
  MapPin, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Hash, 
  Building2, 
  Layers, 
  Printer, 
  Sparkles,
  QrCode
} from 'lucide-react';
import { 
  InventoryItem, 
  SubCategoryCode, 
  SUB_CATEGORY_METADATA, 
  UserPersona, 
  StockTransfer,
  OpenScannerFn
} from '../../types/inventory';
import { storageService } from '../../services/storage';
import { extractSerialNumber } from '../../utils/barcodeParser';
import confetti from 'canvas-confetti';

export const SRI_LANKA_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

export const SLT_BRANCHES = [
  'SLT Regional Telecom Office - Colombo Central (Lotus Rd)',
  'SLT Regional Depot - Havelock Town (Colombo South)',
  'SLT Regional Depot - Kotahena (Colombo North)',
  'SLT Regional Office - Gampaha',
  'SLT Regional Office - Negombo',
  'SLT Regional Depot - Kalutara',
  'SLT Regional Telecom Office - Kandy Peradeniya Rd',
  'SLT Regional Office - Matale',
  'SLT Regional Office - Nuwara Eliya',
  'SLT Regional Telecom Center - Galle',
  'SLT Regional Depot - Matara',
  'SLT Regional Office - Hambantota',
  'SLT Central Depot - Kurunegala',
  'SLT Regional Depot - Chilaw / Puttalam',
  'SLT Regional Depot - Anuradhapura',
  'SLT Regional Office - Polonnaruwa',
  'SLT Regional Office - Ratnapura',
  'SLT Regional Depot - Kegalle',
  'SLT Regional Depot - Badulla',
  'SLT Regional Office - Bandarawela',
  'SLT Regional Telecom Center - Jaffna',
  'SLT Regional Depot - Vavuniya',
  'SLT Regional Office - Trincomalee',
  'SLT Regional Depot - Batticaloa',
  'SLT Regional Center - Ampara',
];

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  inventory: InventoryItem[];
  preselectedItem?: InventoryItem | null;
  activeUser: UserPersona;
  onOpenScanner?: OpenScannerFn;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inventory,
  preselectedItem,
  activeUser,
  onOpenScanner,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [subCategory, setSubCategory] = useState<SubCategoryCode>(
    preselectedItem?.subCategory || 'TCOPNC'
  );
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItem?.id || ''
  );

  const [moveOrderNo, setMoveOrderNo] = useState<string>(() => {
    return `MO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [transferDate, setTransferDate] = useState<string>(todayStr);
  const [destinationDistrict, setDestinationDistrict] = useState<string>('Kandy');
  const [destinationBranch, setDestinationBranch] = useState<string>(
    'SLT Regional Telecom Office - Kandy Peradeniya Rd'
  );
  const [customBranch, setCustomBranch] = useState<string>('');
  const [useCustomBranch, setUseCustomBranch] = useState<boolean>(false);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [carrierVehicle, setCarrierVehicle] = useState<string>('WP-CAD-8812 (SLT Fleet Logistics)');
  const [notes, setNotes] = useState<string>('Inter-branch inventory transfer and rebalance.');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter items in current selected category
  const categoryItems = inventory.filter((i) => i.subCategory === subCategory);
  const selectedItem = inventory.find((i) => i.id === selectedItemId);

  useEffect(() => {
    if (preselectedItem) {
      setSubCategory(preselectedItem.subCategory);
      setSelectedItemId(preselectedItem.id);
      setQuantity(Math.min(1, preselectedItem.quantity));
      if (preselectedItem.isSerialized && preselectedItem.serialNumbers?.length) {
        setSelectedSerials([preselectedItem.serialNumbers[0]]);
      } else {
        setSelectedSerials([]);
      }
    } else {
      const first = inventory.find((i) => i.subCategory === subCategory && i.quantity > 0) || categoryItems[0];
      if (first) {
        setSelectedItemId(first.id);
        setQuantity(Math.min(1, first.quantity));
        if (first.isSerialized && first.serialNumbers?.length) {
          setSelectedSerials([first.serialNumbers[0]]);
        }
      }
    }
  }, [preselectedItem, isOpen]);

  const handleCategoryChange = (newCat: SubCategoryCode) => {
    setSubCategory(newCat);
    const first = inventory.find((i) => i.subCategory === newCat && i.quantity > 0) || inventory.find((i) => i.subCategory === newCat);
    if (first) {
      setSelectedItemId(first.id);
      setQuantity(Math.min(1, first.quantity));
      if (first.isSerialized && first.serialNumbers?.length) {
        setSelectedSerials([first.serialNumbers[0]]);
      } else {
        setSelectedSerials([]);
      }
    } else {
      setSelectedItemId('');
      setQuantity(0);
      setSelectedSerials([]);
    }
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = inventory.find((i) => i.id === itemId);
    if (item) {
      setQuantity(Math.min(1, item.quantity));
      if (item.isSerialized && item.serialNumbers?.length) {
        setSelectedSerials([item.serialNumbers[0]]);
      } else {
        setSelectedSerials([]);
      }
    }
  };

  const generateNewMO = () => {
    const code = `MO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setMoveOrderNo(code);
  };

  const handleToggleSerial = (serial: string) => {
    if (selectedSerials.includes(serial)) {
      const next = selectedSerials.filter((s) => s !== serial);
      setSelectedSerials(next);
      setQuantity(Math.max(1, next.length));
    } else {
      const next = [...selectedSerials, serial];
      setSelectedSerials(next);
      setQuantity(next.length);
    }
  };

  const handleSelectAllSerials = () => {
    if (!selectedItem?.serialNumbers) return;
    setSelectedSerials([...selectedItem.serialNumbers]);
    setQuantity(selectedItem.serialNumbers.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!moveOrderNo.trim()) {
      setErrorMsg('Please enter a valid Move Order Number.');
      return;
    }

    if (!selectedItem) {
      setErrorMsg('Please select a material / product to transfer.');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Transfer quantity must be at least 1.');
      return;
    }

    if (quantity > selectedItem.quantity) {
      setErrorMsg(
        `Insufficient stock! Requested ${quantity} ${selectedItem.unit}, but only ${selectedItem.quantity} ${selectedItem.unit} is available on-hand.`
      );
      return;
    }

    if (selectedItem.isSerialized && selectedSerials.length !== quantity) {
      setErrorMsg(`Please select exactly ${quantity} serial numbers for this transfer.`);
      return;
    }

    const branch = useCustomBranch && customBranch.trim() ? customBranch.trim() : destinationBranch;

    setIsSubmitting(true);
    try {
      const result = storageService.executeTransfer({
        moveOrderNo: moveOrderNo.trim(),
        subCategory,
        materialCode: selectedItem.materialCode,
        quantity,
        serialNumbers: selectedItem.isSerialized ? selectedSerials : undefined,
        destinationDistrict,
        destinationBranch: branch,
        dispatchOfficer: activeUser.name,
        carrierVehicle,
        notes,
        transferDate,
        operatorId: activeUser.id,
        operatorName: activeUser.name,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }

      onSuccess(
        `Move Order #${result.transfer.moveOrderNo} dispatched! Transferred ${quantity} ${selectedItem.unit} of ${selectedItem.materialCode} to ${branch} (${destinationDistrict}).`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Transfer failed to execute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentMeta = SUB_CATEGORY_METADATA[subCategory];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0056B3 0%, #002D5E 100%)',
            color: '#FFFFFF',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    backgroundColor: 'var(--mobitel-lime)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}
                >
                  INTER-BRANCH / DISTRICT TRANSFER
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0', color: '#FFFFFF' }}>
                Stock Transfer via Move Order #
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#BAE6FD', margin: '2px 0 0' }}>
                Transfer items from any of the 5 categories to another branch or district
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {errorMsg && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-md)',
                color: '#B91C1C',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Move Order # & Transfer Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                <Hash size={14} color="var(--slt-deep-blue)" />
                <span>Move Order Number</span>
                <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={moveOrderNo}
                  onChange={(e) => setMoveOrderNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MO-2026-9041"
                  className="input-field mono"
                  style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}
                  required
                />
                <button
                  type="button"
                  onClick={generateNewMO}
                  className="btn btn-outline"
                  title="Generate New Move Order #"
                  style={{ padding: '0 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  <Sparkles size={14} />
                  <span>Gen #</span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                <Calendar size={14} color="var(--slt-deep-blue)" />
                <span>Transfer Date</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="input-field mono"
                required
              />
            </div>
          </div>

          {/* Source Category Selection (All 5 Categories) */}
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 700 }}>
              <Layers size={14} color="var(--slt-deep-blue)" />
              <span>Source Stock Category (Select from 5 Categories)</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <select
              value={subCategory}
              onChange={(e) => handleCategoryChange(e.target.value as SubCategoryCode)}
              className="input-field"
              style={{ fontWeight: 600, fontSize: '0.88rem' }}
            >
              <option value="TCOPNC">TCOPNC - Standard New Connection Material / Devices</option>
              <option value="TCOPNC-C">TCOPNC-C - Collective Stock (Direct Customer Collections)</option>
              <option value="TCOPNC-R">TCOPNC-R - Workshop Returns (From Central Workshop / Repair)</option>
              <option value="TC-OPCDR">TC-OPCDR - Rehab Project Materials (Outside Plant)</option>
              <option value="TC-OPCDR-R">TC-OPCDR-R - Rehab Returned Materials (Salvage & Reusable)</option>
            </select>
          </div>

          {/* Product / Material Selection */}
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 700 }}>
              <span>Material / Product to Transfer</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="input-field"
              style={{ fontWeight: 600 }}
              required
            >
              {categoryItems.length === 0 ? (
                <option value="">No items available in {subCategory}</option>
              ) : (
                categoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.materialCode} - {item.description} (On-hand: {item.quantity} {item.unit})
                  </option>
                ))
              )}
            </select>

            {selectedItem && (
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#F1F5F9',
                  fontSize: '0.78rem',
                }}
              >
                <span>
                  Available Stock: <strong style={{ color: 'var(--slt-deep-blue)' }}>{selectedItem.quantity} {selectedItem.unit}</strong>
                </span>
                <span>
                  Tracking: <strong>{selectedItem.isSerialized ? `Serialized (${selectedItem.serialNumbers?.length || 0} S/N)` : 'Bulk Non-Serialized'}</strong>
                </span>
                <span>Bin: <strong>{selectedItem.binLocation || 'BIN-01'}</strong></span>
              </div>
            )}
          </div>

          {/* Transfer Quantity */}
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 700 }}>
              <span>Quantity to Transfer ({selectedItem?.unit || 'UNITS'})</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              max={selectedItem?.quantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(selectedItem?.quantity || 1, Number(e.target.value))))}
              className="input-field mono"
              style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--slt-deep-blue)' }}
              required
            />
          </div>

          {/* Serial Number Selection if Serialized */}
          {selectedItem?.isSerialized && selectedItem.serialNumbers && selectedItem.serialNumbers.length > 0 && (
            <div
              style={{
                padding: 14,
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E40AF' }}>
                  Select Serial Numbers to Transfer ({selectedSerials.length} of {quantity} selected)
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {onOpenScanner && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenScanner('Scan Barcode to Select Transfer S/N', (scanned) => {
                          const clean = extractSerialNumber(scanned);
                          if (!selectedSerials.includes(clean)) {
                            const next = [...selectedSerials, clean];
                            setSelectedSerials(next);
                            setQuantity(next.length);
                          }
                        })
                      }
                      className="btn btn-outline"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', minHeight: 26, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <QrCode size={12} />
                      <span>Scan Barcode</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSelectAllSerials}
                    className="btn btn-outline"
                    style={{ fontSize: '0.72rem', padding: '3px 8px', minHeight: 26 }}
                  >
                    Select All
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  maxHeight: 140,
                  overflowY: 'auto',
                  padding: 4,
                }}
              >
                {selectedItem.serialNumbers.map((sn) => {
                  const isChecked = selectedSerials.includes(sn);
                  return (
                    <button
                      key={sn}
                      type="button"
                      onClick={() => handleToggleSerial(sn)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: isChecked ? '1px solid #1D4ED8' : '1px solid #CBD5E1',
                        backgroundColor: isChecked ? '#1D4ED8' : '#FFFFFF',
                        color: isChecked ? '#FFFFFF' : '#334155',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{sn}</span>
                      {isChecked && <CheckCircle2 size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Destination District & Branch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                <MapPin size={14} color="var(--slt-deep-blue)" />
                <span>Destination District</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <select
                value={destinationDistrict}
                onChange={(e) => setDestinationDistrict(e.target.value)}
                className="input-field"
                style={{ fontWeight: 600 }}
                required
              >
                {SRI_LANKA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist} District
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="input-label" style={{ fontWeight: 700, marginBottom: 0 }}>
                  <Building2 size={14} color="var(--slt-deep-blue)" />
                  <span>Destination Branch / Depot</span>
                  <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomBranch(!useCustomBranch)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--slt-deep-blue)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {useCustomBranch ? 'Use Preset Branches' : '+ Type Custom'}
                </button>
              </div>

              {useCustomBranch ? (
                <input
                  type="text"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  placeholder="Enter destination depot or office name..."
                  className="input-field"
                  required
                />
              ) : (
                <select
                  value={destinationBranch}
                  onChange={(e) => setDestinationBranch(e.target.value)}
                  className="input-field"
                  style={{ fontWeight: 600, fontSize: '0.84rem' }}
                  required
                >
                  {SLT_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Carrier Vehicle & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">
                <Truck size={14} color="var(--slt-deep-blue)" />
                <span>Transport Carrier / Vehicle No</span>
              </label>
              <input
                type="text"
                value={carrierVehicle}
                onChange={(e) => setCarrierVehicle(e.target.value)}
                placeholder="e.g. WP-CAD-8812 (SLT Fleet Logistics)"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <FileText size={14} color="var(--slt-deep-blue)" />
                <span>Transfer Notes / Reason</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Emergency depot balancing for fiber project"
                className="input-field"
              />
            </div>
          </div>

          {/* Dispatch Summary Bar */}
          <div
            style={{
              padding: 14,
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Dispatch Officer: <strong>{activeUser.name} ({activeUser.role})</strong></span>
              <span>Origin Depot: <strong>SLT Colombo HQ Central Depot</strong></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 700 }}>
              <span>Stock Deduction: <span style={{ color: 'var(--status-danger)' }}>-{quantity} {selectedItem?.unit}</span></span>
              <span>Category: <strong>{subCategory}</strong></span>
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 6,
              paddingTop: 16,
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
              style={{ minHeight: 46, padding: '8px 20px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedItem || selectedItem.quantity === 0}
              className="btn btn-primary"
              style={{
                minHeight: 46,
                padding: '8px 26px',
                fontWeight: 800,
                fontSize: '0.95rem',
                gap: 8,
              }}
            >
              <ArrowRightLeft size={18} />
              <span>{isSubmitting ? 'Transferring Stock...' : `Dispatch Move Order #${moveOrderNo}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
