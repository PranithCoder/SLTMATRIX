import React, { useState } from 'react';
import { 
  RotateCcw, 
  Layers, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  Hash, 
  Box, 
  ShieldAlert, 
  Check 
} from 'lucide-react';
import { CustomerIssuance, UserPersona } from '../../types/inventory';
import { storageService } from '../../services/storage';
import confetti from 'canvas-confetti';

interface CustomerReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  issuance: CustomerIssuance | null;
  activeUser: UserPersona;
  onSuccess: (message: string) => void;
}

export const CustomerReturnModal: React.FC<CustomerReturnModalProps> = ({
  isOpen,
  onClose,
  issuance,
  activeUser,
  onSuccess,
}) => {
  if (!isOpen || !issuance) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const [returnType, setReturnType] = useState<'TCOPNC-C' | 'TCOPNC-R'>('TCOPNC-C');
  const [returnDate, setReturnDate] = useState<string>(todayStr);
  const [quantity, setQuantity] = useState<number>(issuance.quantity || 1);
  const [itemCondition, setItemCondition] = useState<'GOOD_REUSABLE' | 'FAULTY_REPAIR' | 'SCRAP'>('GOOD_REUSABLE');
  const [returnNotes, setReturnNotes] = useState<string>('Equipment collected directly from customer premise and credited to Collective stock.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!returnDate) {
      setErrorMsg('Please select a valid collection date.');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Collection quantity must be at least 1.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = storageService.processCustomerReturn({
        issuanceId: issuance.id,
        materialCode: issuance.materialCode,
        materialDescription: issuance.materialDescription,
        serialNumber: issuance.serialNumber,
        quantity,
        unit: issuance.unit,
        returnType: 'TCOPNC-C', // Directly into Collective Stock (TC-OPNC-C)
        returnDate,
        itemCondition,
        accountNo: issuance.accountNo,
        customerName: issuance.customerName,
        returnNotes,
        operatorName: activeUser.name,
        operatorId: activeUser.id,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#6B21A8', '#9333EA', '#0099FF', '#43B02A'],
        });
      } catch {
        // Fallback
      }

      onSuccess(
        `Customer equipment ${issuance.serialNumber ? `(S/N: ${issuance.serialNumber})` : issuance.materialCode} successfully collected into Collective Stock (TC-OPNC-C) on ${returnDate}!`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Return failed to process.');
    } finally {
      setIsSubmitting(false);
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
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF5FF',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#7E22CE',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Direct Customer Return &amp; Collection
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B21A8', fontWeight: 600 }}>
                Direct Customer Collection &rarr; Credited directly to <strong>Collective Stock (TC-OPNC-C)</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {errorMsg && (
            <div 
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FEF2F2',
                border: '1px solid #F87171',
                color: '#991B1B',
                fontSize: '0.84rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Customer & Item Summary Card */}
          <div 
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0056B3', textTransform: 'uppercase' }}>
                  Equipment Details
                </span>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                  {issuance.materialDescription}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
                  CODE: {issuance.materialCode} | ISSUED: {issuance.issueDate}
                </div>
              </div>
              {issuance.serialNumber ? (
                <div 
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1D4ED8',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  S/N: {issuance.serialNumber}
                </div>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                  Non-serialized Bulk
                </span>
              )}
            </div>

            <div 
              style={{
                borderTop: '1px dashed #CBD5E1',
                paddingTop: 8,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                fontSize: '0.78rem',
                color: '#334155',
              }}
            >
              <div>
                <strong>Customer:</strong> {issuance.customerName}
              </div>
              <div>
                <strong>Account #:</strong> {issuance.accountNo}
              </div>
              {issuance.customerContact && (
                <div>
                  <strong>Tel:</strong> {issuance.customerContact}
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Destination Confirmation Banner */}
          <div 
            style={{ 
              marginBottom: 18,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FAF5FF',
              border: '2px solid #C084FC',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#7E22CE',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Check size={18} strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#581C87' }}>
                Crediting Directly into: Collective Stock (TC-OPNC-C)
              </div>
              <div style={{ fontSize: '0.74rem', color: '#7E22CE', marginTop: 2 }}>
                Customer return is credited directly into Collective Stock (TC-OPNC-C). Stock increases (+) immediately upon completion.
              </div>
            </div>
          </div>

          {/* Section 2: Date Selection & Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6, color: '#334155' }}>
                Return Date (Date-wise entry): <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                />
                <Calendar 
                  size={16} 
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6, color: '#334155' }}>
                Quantity ({issuance.unit}):
              </label>
              <input 
                type="number"
                min={1}
                max={issuance.quantity || 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* Section 3: Item Condition Triage */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6, color: '#334155' }}>
              Physical & Working Condition:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { key: 'GOOD_REUSABLE', label: 'Good / Reusable', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC' },
                { key: 'FAULTY_REPAIR', label: 'Faulty (Needs Workshop)', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
                { key: 'SCRAP', label: 'Scrap (Beyond Repair)', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setItemCondition(c.key as any)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-md)',
                    border: itemCondition === c.key ? `2px solid ${c.color}` : `1px solid ${c.border}`,
                    backgroundColor: itemCondition === c.key ? c.bg : '#FFFFFF',
                    color: itemCondition === c.key ? c.color : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Return Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6, color: '#334155' }}>
              Return Reason / Inspection Notes:
            </label>
            <textarea
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="e.g., Customer premise churn, verified with power supply and patch cord..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                resize: 'none',
              }}
            />
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: '#7E22CE',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(126, 34, 206, 0.3)',
              }}
            >
              <Layers size={16} />
              <span>{isSubmitting ? 'Crediting Stock...' : 'Collect & Credit to Collective (TC-OPNC-C)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
