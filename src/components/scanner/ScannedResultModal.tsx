import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  MapPin,
  ExternalLink,
  RotateCcw,
  Send,
  Boxes,
} from 'lucide-react';
import { InventoryItem, SUB_CATEGORY_METADATA, SubCategoryCode } from '../../types/inventory';
import { findEquipmentByBarcode, parseBarcode } from '../../utils/barcodeParser';

interface ScannedResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedCode: string;
  inventory: InventoryItem[];
  onAction: (
    action: 'ALLOCATE' | 'DISPATCH' | 'COLLECTIVE' | 'RETURNS' | 'TRANSFER',
    serial: string,
    item?: InventoryItem
  ) => void;
}

export const ScannedResultModal: React.FC<ScannedResultModalProps> = ({
  isOpen,
  onClose,
  scannedCode,
  inventory,
  onAction,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !scannedCode) return null;

  const parsed = parseBarcode(scannedCode);
  const serial = parsed.serialNumber || scannedCode;
  const matchResult = findEquipmentByBarcode(serial, inventory);
  const matchedItem = matchResult.item;
  const categoryMeta = matchedItem ? SUB_CATEGORY_METADATA[matchedItem.subCategory] : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(serial);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--slt-deep-blue)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Barcode Scanned Successfully
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#BAE6FD', margin: 0 }}>
                Universal Barcode Engine • Serial Number Extracted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: '#FFFFFF',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>
          {/* Serial Number Display Pill */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                EXTRACTED SERIAL NUMBER (S/N):
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-outline"
                style={{
                  padding: '2px 8px',
                  height: 26,
                  fontSize: '0.72rem',
                  gap: 4,
                  borderColor: copied ? '#10B981' : '#CBD5E1',
                  color: copied ? '#10B981' : 'var(--text-primary)',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy S/N'}</span>
              </button>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--slt-deep-blue)',
                letterSpacing: '0.5px',
                wordBreak: 'break-all',
              }}
            >
              {serial}
            </div>

            {/* Raw & Format note if different */}
            {scannedCode !== serial && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginTop: 6,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Raw Barcode: {scannedCode}
              </div>
            )}
            {parsed.detectedBrand && (
              <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                <span
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: 'var(--slt-deep-blue)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  Brand: {parsed.detectedBrand}
                </span>
              </div>
            )}
          </div>

          {/* Matched Equipment Card */}
          {matchedItem ? (
            <div
              style={{
                border: '1px solid #93C5FD',
                backgroundColor: '#EFF6FF',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Package size={16} color="var(--slt-deep-blue)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slt-deep-blue)' }}>
                  MATCHED EQUIPMENT IN STOCK REGISTRY
                </span>
                {categoryMeta && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: categoryMeta.badgeColor,
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {categoryMeta.code}
                  </span>
                )}
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', marginBottom: 4 }}>
                {matchedItem.materialCode} - {matchedItem.description}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginTop: 8,
                  fontSize: '0.78rem',
                  color: '#475569',
                }}
              >
                <div>
                  <strong>Category:</strong> {matchedItem.subCategory}
                </div>
                <div>
                  <strong>On-Hand:</strong> {matchedItem.quantity} {matchedItem.unit}
                </div>
                {matchedItem.binLocation && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={13} color="#0284C7" />
                    <span>{matchedItem.binLocation}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '1px dashed #CBD5E1',
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 20,
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                ℹ️ Serial Ready for Any Equipment Model
              </div>
              <div>
                This serial number ({serial}) is valid and can be assigned to any stock equipment, allocated to a customer, received into inventory, or recorded as a return.
              </div>
            </div>
          )}

          {/* Action Choice Header */}
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Choose an operation for this scanned serial number:
          </div>

          {/* Quick Action Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={() => onAction('ALLOCATE', serial, matchedItem || undefined)}
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                padding: '10px 12px',
                textAlign: 'left',
                borderColor: '#BFDBFE',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--slt-deep-blue)', marginRight: 8, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--slt-deep-blue)' }}>
                  Allocate to Customer
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  New Connection (TC-OPNC)
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAction('DISPATCH', serial, matchedItem || undefined)}
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                padding: '10px 12px',
                textAlign: 'left',
                borderColor: '#BBF7D0',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', marginRight: 8, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#047857' }}>
                  Inbound / Receive
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Dispatch Intake Registry
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAction('COLLECTIVE', serial, matchedItem || undefined)}
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                padding: '10px 12px',
                textAlign: 'left',
                borderColor: '#E9D5FF',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#9333EA', marginRight: 8, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#7E22CE' }}>
                  Customer Recovery
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Collective Stock (TC-OPNC-C)
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAction('RETURNS', serial, matchedItem || undefined)}
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                padding: '10px 12px',
                textAlign: 'left',
                borderColor: '#FED7AA',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F97316', marginRight: 8, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#C2410C' }}>
                  Workshop Return
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Repair Returns (TC-OPNC-R)
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
