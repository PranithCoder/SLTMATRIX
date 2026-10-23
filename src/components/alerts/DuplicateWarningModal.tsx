import React from 'react';
import { CustomerIssuance } from '../../types/inventory';
import { AlertTriangle, ShieldAlert, User, Calendar, MapPin, Phone, Hash, X } from 'lucide-react';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  duplicateType: 'SERIAL' | 'ACCOUNT' | 'BOTH';
  duplicateValue: string;
  existingRecord: CustomerIssuance;
  operatorName: string;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  duplicateType,
  duplicateValue,
  existingRecord,
  operatorName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 560,
          boxShadow: 'var(--shadow-floating)',
          border: '2px solid #EF4444',
          overflow: 'hidden',
        }}
      >
        {/* Urgent Warning Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Duplicate Record Detected!
                </h3>
                <span
                  style={{
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  CRITICAL
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#FECACA' }}>
                {duplicateType === 'SERIAL'
                  ? `Serial Number [${duplicateValue}] is already registered in the system!`
                  : duplicateType === 'ACCOUNT'
                  ? `Customer Account [${duplicateValue}] already exists in active records!`
                  : `Duplicate Serial & Account detected!`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Informing Kanishka Notice Banner */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#FEF2F2',
            borderBottom: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.78rem',
            color: '#991B1B',
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>System Alert Logged:</strong> This duplicate attempt has been recorded and transmitted to Super Admin <strong>Mr. Kanishka</strong>.
          </span>
        </div>

        {/* Existing Customer Details Card */}
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
            Existing Issuance Record Details:
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>Customer Name:</span>
              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>{existingRecord.customerName}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={14} color="#0056B3" />
                <span style={{ color: '#64748B' }}>Account:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{existingRecord.accountNo}</strong>
              </div>
              {existingRecord.serialNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Hash size={14} color="#D97706" />
                  <span style={{ color: '#64748B' }}>Serial:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: '#B45309' }}>{existingRecord.serialNumber}</strong>
                </div>
              )}
            </div>

            <div style={{ color: '#334155' }}>
              <span style={{ color: '#64748B' }}>Device / Item: </span>
              <strong>{existingRecord.materialCode}</strong> — {existingRecord.materialDescription}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 6, borderTop: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} />
                <span>Issued: <strong style={{ color: '#0F172A' }}>{existingRecord.issueDate}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={13} />
                <span>By: <strong style={{ color: '#0F172A' }}>{existingRecord.issuedBy}</strong></span>
              </div>
            </div>

            {existingRecord.customerContact && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#64748B' }}>
                <Phone size={13} color="#059669" />
                <span>Contact: {existingRecord.customerContact}</span>
              </div>
            )}

            {existingRecord.customerAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#64748B' }}>
                <MapPin size={13} color="#DC2626" />
                <span>Address: {existingRecord.customerAddress}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>Record Status:</span>
              <span
                style={{
                  backgroundColor: existingRecord.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                  color: existingRecord.status === 'ACTIVE' ? '#15803D' : '#92400E',
                  border: `1px solid ${existingRecord.status === 'ACTIVE' ? '#86EFAC' : '#FCD34D'}`,
                  padding: '1px 8px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              >
                {existingRecord.status}
              </span>
            </div>
          </div>

          <p style={{ margin: '12px 0 0 0', fontSize: '0.74rem', color: '#64748B', lineHeight: 1.4 }}>
            Please verify if this customer is requesting an authorized replacement or if the previous hardware was already recovered in TC-OPNC-C/R records.
          </p>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ flex: 1, minHeight: 38, fontWeight: 700 }}
          >
            Cancel & Correct Entry
          </button>
          {onProceed && (
            <button
              onClick={onProceed}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0 16px',
                minHeight: 38,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Proceed Anyway
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
