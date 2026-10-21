import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Check, Package, ShieldAlert } from 'lucide-react';
import { InventoryItem, SUB_CATEGORY_METADATA, UserPersona } from '../../types/inventory';
import { storageService } from '../../services/storage';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  item: InventoryItem | null;
  activeUser: UserPersona;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
  activeUser,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const meta = SUB_CATEGORY_METADATA[item.subCategory];

  const handleDelete = () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const success = storageService.deleteProduct(item.id, activeUser.name, activeUser.id);
      if (success) {
        onSuccess(`Product SKU ${item.materialCode} successfully deleted from ${item.subCategory}.`);
        onClose();
      } else {
        setErrorMsg('Could not find product to delete.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: 480,
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#FEF2F2',
            borderBottom: '1px solid #FEE2E2',
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
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
              }}
            >
              <Trash2 size={18} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#991B1B' }}>
              Delete Product Confirmation
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#FEE2E2',
                borderRadius: 'var(--radius-md)',
                color: '#B91C1C',
                fontSize: '0.82rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to permanently remove this product from the inventory catalog?
          </p>

          <div
            style={{
              padding: 14,
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#0F172A' }}>
                {item.materialCode}
              </strong>
              <span
                className="code-tag"
                style={{
                  backgroundColor: `${meta?.badgeColor}15`,
                  color: meta?.badgeColor || '#0056B3',
                  borderColor: `${meta?.badgeColor}40`,
                  fontSize: '0.72rem',
                }}
              >
                {item.subCategory}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              {item.description}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 6,
                paddingTop: 8,
                borderTop: '1px dashed var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>On-hand Stock: <strong style={{ color: '#0F172A' }}>{item.quantity} {item.unit}</strong></span>
              <span>Bin: <strong style={{ color: '#0F172A' }}>{item.binLocation || 'N/A'}</strong></span>
            </div>
          </div>

          {item.quantity > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#B45309',
                fontSize: '0.8rem',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Warning:</strong> This item has <strong>{item.quantity} {item.unit}</strong> on-hand.
                Deleting it will deduct this stock and record a deletion entry in the audit ledger.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 10,
              paddingTop: 14,
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isDeleting}
              style={{ minHeight: 40, padding: '6px 16px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn"
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                minHeight: 40,
                padding: '6px 20px',
                fontWeight: 700,
                fontSize: '0.85rem',
                gap: 6,
              }}
            >
              <Trash2 size={16} />
              <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
