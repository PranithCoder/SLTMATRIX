import React, { useState, useEffect } from 'react';
import { 
  X, 
  PackagePlus, 
  Edit3, 
  Layers, 
  Tag, 
  FileText, 
  Hash, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Barcode, 
  ShieldCheck,
  QrCode,
  Scan,
  Plus
} from 'lucide-react';
import { 
  InventoryItem, 
  SubCategoryCode, 
  SUB_CATEGORY_METADATA, 
  UserPersona,
  OpenScannerFn
} from '../../types/inventory';
import { storageService } from '../../services/storage';
import { extractSerialNumber } from '../../utils/barcodeParser';
import confetti from 'canvas-confetti';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingItem?: InventoryItem | null;
  defaultSubCategory?: SubCategoryCode;
  activeUser: UserPersona;
  onOpenScanner?: OpenScannerFn;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
  defaultSubCategory = 'TCOPNC',
  activeUser,
  onOpenScanner,
}) => {
  const isEditing = Boolean(editingItem);

  const [subCategory, setSubCategory] = useState<SubCategoryCode>(defaultSubCategory);
  const [materialCode, setMaterialCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<InventoryItem['unit']>('UNITS');
  const [quantity, setQuantity] = useState<number>(1);
  const [receiving, setReceiving] = useState<number>(0);
  const [inbound, setInbound] = useState<number>(0);
  const [isSerialized, setIsSerialized] = useState<boolean>(false);
  const [serialInput, setSerialInput] = useState<string>('');
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [binLocation, setBinLocation] = useState<string>('BIN-01');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setSubCategory(editingItem.subCategory);
      setMaterialCode(editingItem.materialCode);
      setDescription(editingItem.description);
      setUnit(editingItem.unit);
      setQuantity(editingItem.quantity);
      setReceiving(editingItem.receiving || 0);
      setInbound(editingItem.inbound || 0);
      setIsSerialized(editingItem.isSerialized);
      setSerialInput(editingItem.serialNumbers?.join('\n') || '');
      setMinThreshold(editingItem.minThreshold ?? 5);
      setBinLocation(editingItem.binLocation || 'BIN-01');
    } else {
      setSubCategory(defaultSubCategory);
      setMaterialCode('');
      setDescription('');
      setUnit('UNITS');
      setQuantity(1);
      setReceiving(0);
      setInbound(0);
      setIsSerialized(false);
      setSerialInput('');
      setMinThreshold(5);
      setBinLocation('BIN-01');
    }
    setErrorMsg(null);
  }, [editingItem, defaultSubCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = materialCode.trim().toUpperCase();
    const cleanDesc = description.trim();

    if (!cleanCode) {
      setErrorMsg('Material SKU / Code is mandatory (e.g. CPEFTH055S).');
      return;
    }
    if (!cleanDesc) {
      setErrorMsg('Equipment description is mandatory.');
      return;
    }

    // Process serials if serialized
    let parsedSerials: string[] | undefined = undefined;
    if (isSerialized) {
      parsedSerials = serialInput
        .split(/[\n,]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (parsedSerials.length === 0 && quantity > 0) {
        setErrorMsg('Please enter at least one Serial Number or disable serialized tracking.');
        return;
      }
    }

    const mainCategory = 
      subCategory.startsWith('TC-OPCDR') ? 'Rehabilitation' : 'New Connection';

    setIsSubmitting(true);
    try {
      if (isEditing && editingItem) {
        storageService.updateProduct(
          editingItem.id,
          {
            materialCode: cleanCode,
            description: cleanDesc,
            subCategory,
            mainCategory,
            unit,
            quantity: isSerialized && parsedSerials ? parsedSerials.length : Number(quantity),
            receiving: Number(receiving),
            inbound: Number(inbound),
            isSerialized,
            serialNumbers: parsedSerials,
            minThreshold: Number(minThreshold),
            binLocation: binLocation.trim(),
          },
          activeUser.name,
          activeUser.id
        );

        onSuccess(`Product ${cleanCode} updated successfully in ${subCategory}!`);
      } else {
        storageService.addProduct(
          {
            materialCode: cleanCode,
            description: cleanDesc,
            subCategory,
            mainCategory,
            unit,
            quantity: isSerialized && parsedSerials ? parsedSerials.length : Number(quantity),
            receiving: Number(receiving),
            inbound: Number(inbound),
            isSerialized,
            serialNumbers: parsedSerials,
            minThreshold: Number(minThreshold),
            binLocation: binLocation.trim(),
          },
          activeUser.name,
          activeUser.id
        );

        try {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // ignore
        }

        onSuccess(`New product ${cleanCode} added to ${subCategory} catalog!`);
      }

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMeta = SUB_CATEGORY_METADATA[subCategory];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth: 640,
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
            background: isEditing
              ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
              : 'linear-gradient(135deg, #0056B3 0%, #003F82 100%)',
            color: '#FFFFFF',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              {isEditing ? <Edit3 size={20} /> : <PackagePlus size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {isEditing ? `Edit Product: ${editingItem?.materialCode}` : 'Add New Product SKU'}
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#BAE6FD', margin: '2px 0 0' }}>
                {isEditing
                  ? 'Update product specifications, category assignment, and stock'
                  : 'Register a new equipment SKU into one of the 5 official stock categories'}
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
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SubCategory Selection */}
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 700 }}>
              <Layers size={14} color="var(--slt-deep-blue)" />
              <span>Stock Category (1 of 5 Categories)</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value as SubCategoryCode)}
              className="input-field"
              style={{ fontWeight: 600, fontSize: '0.88rem' }}
            >
              <option value="TCOPNC">TCOPNC - Standard New Connection Material / Devices</option>
              <option value="TCOPNC-C">TCOPNC-C - Collective Stock (Direct Customer Collections)</option>
              <option value="TCOPNC-R">TCOPNC-R - Workshop Returns (From Central Workshop / Repair)</option>
              <option value="TC-OPCDR">TC-OPCDR - Rehab Project Materials (Outside Plant / Work Order)</option>
              <option value="TC-OPCDR-R">TC-OPCDR-R - Rehab Returned Materials (Salvage & Reusable)</option>
            </select>
            {currentMeta && (
              <div
                style={{
                  marginTop: 6,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: `${currentMeta.badgeColor}12`,
                  border: `1px solid ${currentMeta.badgeColor}30`,
                  fontSize: '0.75rem',
                  color: currentMeta.badgeColor,
                  fontWeight: 600,
                }}
              >
                {currentMeta.name}: {currentMeta.description}
              </div>
            )}
          </div>

          {/* Material Code & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                <Tag size={14} color="var(--slt-deep-blue)" />
                <span>Material SKU / Code</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                placeholder="e.g. CPEFTH055S or OSPFIT002"
                className="input-field mono"
                style={{ textTransform: 'uppercase', fontWeight: 800 }}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                <span>Unit of Measure</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as InventoryItem['unit'])}
                className="input-field"
                style={{ fontWeight: 700 }}
              >
                <option value="UNITS">UNITS</option>
                <option value="PCS">PCS</option>
                <option value="METERS">METERS</option>
                <option value="SETS">SETS</option>
                <option value="ROLLS">ROLLS</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 700 }}>
              <FileText size={14} color="var(--slt-deep-blue)" />
              <span>Full Equipment Description</span>
              <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. ECHOLIFE HG8145V5 ONT BASE UNIT (HUAWEI)"
              className="input-field"
              required
            />
          </div>

          {/* Stock Levels: On-hand, Receiving, Inbound */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                <span>On-Hand Stock</span>
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="input-field mono"
                style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span>Receiving Stage</span>
              </label>
              <input
                type="number"
                min={0}
                value={receiving}
                onChange={(e) => setReceiving(Math.max(0, Number(e.target.value)))}
                className="input-field mono"
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span>Inbound Stage</span>
              </label>
              <input
                type="number"
                min={0}
                value={inbound}
                onChange={(e) => setInbound(Math.max(0, Number(e.target.value)))}
                className="input-field mono"
              />
            </div>
          </div>

          {/* Bin Location & Min Threshold */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">
                <MapPin size={14} color="var(--slt-deep-blue)" />
                <span>Bin / Shelf Location</span>
              </label>
              <input
                type="text"
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                placeholder="e.g. BIN-A02 or NC-RTR-01"
                className="input-field mono"
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <Hash size={14} color="var(--slt-deep-blue)" />
                <span>Low Stock Threshold Alert</span>
              </label>
              <input
                type="number"
                min={0}
                value={minThreshold}
                onChange={(e) => setMinThreshold(Math.max(0, Number(e.target.value)))}
                className="input-field mono"
              />
            </div>
          </div>

          {/* Serialized Device Tracking */}
          <div
            style={{
              padding: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
                <Barcode size={18} color="var(--slt-deep-blue)" />
                <span>Device Serial Number Tracking</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={isSerialized}
                  onChange={(e) => setIsSerialized(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--slt-deep-blue)' }}
                />
                <span style={{ fontWeight: 600 }}>Enable S/N Tracking</span>
              </label>
            </div>

            {isSerialized && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="input-label" style={{ fontSize: '0.78rem', margin: 0 }}>
                    <span>Serial Numbers (One per line or comma-separated)</span>
                    <span style={{ color: 'var(--slt-deep-blue)', fontWeight: 700, marginLeft: 8 }}>
                      Count: {serialInput.split(/[\n,]+/).filter((s) => s.trim()).length}
                    </span>
                  </label>
                  {onOpenScanner && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenScanner('Scan Equipment Barcode / S/N', (scanned) => {
                            const clean = extractSerialNumber(scanned);
                            setSerialInput((prev) => {
                              const existing = prev ? prev.trim().split('\n') : [];
                              if (!existing.includes(clean)) {
                                existing.push(clean);
                              }
                              setQuantity(existing.length);
                              return existing.join('\n');
                            });
                          })
                        }
                        className="btn btn-outline"
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          height: 26,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          borderColor: 'var(--slt-deep-blue)',
                          color: 'var(--slt-deep-blue)',
                        }}
                        title="Scan Barcode with Camera"
                      >
                        <QrCode size={13} />
                        <span>Scan Barcode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenScanner(
                            'Continuous Batch Scan All Equipment Barcodes',
                            (lastScanned, allScanned) => {
                              if (allScanned && allScanned.length > 0) {
                                setSerialInput((prev) => {
                                  const existing = prev ? prev.trim().split('\n') : [];
                                  for (const raw of allScanned) {
                                    const clean = extractSerialNumber(raw);
                                    if (!existing.includes(clean)) {
                                      existing.push(clean);
                                    }
                                  }
                                  setQuantity(existing.length);
                                  return existing.join('\n');
                                });
                              }
                            },
                            true
                          )
                        }
                        className="btn btn-outline"
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          height: 26,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          borderColor: '#10B981',
                          color: '#047857',
                        }}
                        title="Continuous Multi-Barcode Scanner"
                      >
                        <Scan size={13} />
                        <span>Batch Multi-Scan</span>
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  value={serialInput}
                  onChange={(e) => {
                    setSerialInput(e.target.value);
                    const count = e.target.value.split(/[\n,]+/).filter((s) => s.trim()).length;
                    if (count > 0) setQuantity(count);
                  }}
                  rows={4}
                  placeholder={`SLT-ONT-HW8145-01\nSLT-ONT-HW8145-02\nSLT-ONT-HW8145-03`}
                  className="input-field mono"
                  style={{ fontSize: '0.82rem', resize: 'vertical' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Scan or type barcodes. Serial numbers will automatically synchronize the on-hand stock quantity.
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 10,
              paddingTop: 16,
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
              style={{ minHeight: 44, padding: '8px 18px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ minHeight: 44, padding: '8px 24px', fontWeight: 800, gap: 8 }}
            >
              <CheckCircle2 size={18} />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Product Changes' : 'Add Product to Inventory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
