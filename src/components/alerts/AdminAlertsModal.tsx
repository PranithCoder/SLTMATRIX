import React, { useState } from 'react';
import { SystemAlert, UserPersona } from '../../types/inventory';
import { storageService } from '../../services/storage';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  X,
  ShieldCheck,
  User,
  Clock,
  Hash,
  Trash2
} from 'lucide-react';

interface AdminAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserPersona;
  onAlertsUpdated?: () => void;
}

export const AdminAlertsModal: React.FC<AdminAlertsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAlertsUpdated,
}) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>(() => storageService.getSystemAlerts());

  if (!isOpen) return null;

  const refreshAlerts = () => {
    const updated = storageService.getSystemAlerts();
    setAlerts(updated);
    if (onAlertsUpdated) onAlertsUpdated();
  };

  const handleResolve = (alertId: string) => {
    storageService.resolveSystemAlert(alertId, currentUser.name);
    refreshAlerts();
  };

  const handleClearAll = () => {
    storageService.saveSystemAlerts([]);
    refreshAlerts();
  };

  const unreadAlerts = alerts.filter(a => !a.resolved);

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
        zIndex: 1150,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 680,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #7F1D1D 0%, #1E293B 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
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
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Admin Duplicate & Security Alerts
                </h3>
                {unreadAlerts.length > 0 && (
                  <span
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {unreadAlerts.length} Unresolved
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#CBD5E1' }}>
                Priority security feed for Super Admin <strong>{currentUser.name}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {alerts.length > 0 && (
              <button
                onClick={handleClearAll}
                className="btn btn-outline"
                style={{
                  minHeight: 30,
                  padding: '0 10px',
                  fontSize: '0.72rem',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#FFFFFF',
                  gap: 4,
                }}
                title="Clear all alerts"
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}
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
        </div>

        {/* Alerts List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <ShieldCheck size={48} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                No duplicate or security warnings logged.
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                When technicians enter existing serial numbers or duplicate customer accounts, live security alerts will appear here.
              </div>
            </div>
          ) : (
            alerts.map(a => (
              <div
                key={a.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: a.resolved ? '1px solid #E2E8F0' : '1px solid #FCA5A5',
                  backgroundColor: a.resolved ? '#F8FAFC' : '#FEF2F2',
                  opacity: a.resolved ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                  <AlertTriangle
                    size={18}
                    color={a.resolved ? '#64748B' : '#DC2626'}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>
                        {a.type === 'DUPLICATE_SERIAL' ? 'Duplicate Serial Number' : 'Duplicate Customer Account'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: a.resolved ? '#E2E8F0' : '#FEE2E2',
                          color: a.resolved ? '#475569' : '#DC2626',
                        }}
                      >
                        {a.resolved ? 'RESOLVED' : 'ACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                      Attempted by technician: <strong>{a.userName}</strong>
                    </div>

                    {a.serialNumber && (
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        Serial Number: <strong style={{ fontFamily: 'var(--font-mono)', color: '#D97706' }}>{a.serialNumber}</strong>
                      </div>
                    )}

                    {a.accountNo && (
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        Customer Account: <strong style={{ fontFamily: 'var(--font-mono)', color: '#0056B3' }}>{a.accountNo}</strong>
                      </div>
                    )}

                    {/* Existing Record Snapshot */}
                    {a.existingRecord && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: '8px 10px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 6,
                          fontSize: '0.73rem',
                          color: '#475569',
                          lineHeight: 1.4,
                        }}
                      >
                        <div>
                          Existing: <strong>{a.existingRecord.customerName}</strong> ({a.existingRecord.accountNo})
                        </div>
                        <div>
                          Item: {a.existingRecord.materialCode} — {a.existingRecord.materialDescription}
                        </div>
                        <div>
                          Issued: {a.existingRecord.issueDate} by {a.existingRecord.issuedBy} ({a.existingRecord.status})
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.7rem', color: '#94A3B8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                      {a.resolved && a.resolvedBy && (
                        <span>Resolved by {a.resolvedBy}</span>
                      )}
                    </div>
                  </div>
                </div>

                {!a.resolved && (
                  <button
                    onClick={() => handleResolve(a.id)}
                    className="btn btn-primary"
                    style={{
                      minHeight: 32,
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#059669',
                      borderColor: '#059669',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          <span>Real-time safety checks active across all field terminals</span>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 16px' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
