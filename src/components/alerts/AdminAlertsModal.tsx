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
  ExternalLink,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Admin System Duplicate Alerts
                </h3>
                {unreadAlerts.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold uppercase bg-red-500 text-white rounded-full">
                    {unreadAlerts.length} Unresolved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Security & Duplicate Notification feed for Super Admin <strong className="text-white">{currentUser.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 text-slate-400 hover:text-red-400 text-xs rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
                title="Clear all alerts"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-medium text-slate-400">No duplicate or security warnings logged.</p>
              <p className="text-xs text-slate-500 mt-1">
                When technicians attempt to issue existing serial numbers or duplicate customer accounts, you will be notified here immediately.
              </p>
            </div>
          ) : (
            alerts.map(a => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border transition-all ${
                  a.resolved
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-red-950/20 border-red-500/30 shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        a.resolved ? 'text-slate-500' : 'text-red-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {a.type === 'DUPLICATE_SERIAL' ? 'Duplicate Serial Number' : 'Duplicate Customer Account'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            a.resolved ? 'bg-slate-800 text-slate-400' : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {a.resolved ? 'RESOLVED' : 'ACTIVE'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Attempted by:</span>
                          <strong className="text-blue-300">{a.userName}</strong>
                        </div>
                        {a.serialNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Serial #:</span>
                            <span className="font-mono text-amber-300 font-bold">{a.serialNumber}</span>
                          </div>
                        )}
                        {a.accountNo && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Customer Acc #:</span>
                            <span className="font-mono text-white font-bold">{a.accountNo}</span>
                          </div>
                        )}
                      </div>

                      {/* Existing Customer Snapshot */}
                      {a.existingRecord && (
                        <div className="mt-2.5 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 space-y-1">
                          <div className="text-slate-300 font-semibold">
                            Existing Customer: <span className="text-white">{a.existingRecord.customerName}</span> ({a.existingRecord.accountNo})
                          </div>
                          <div>
                            Device: <span className="text-slate-200">{a.existingRecord.materialCode}</span> — {a.existingRecord.materialDescription}
                          </div>
                          <div>
                            Issued: {a.existingRecord.issueDate} by {a.existingRecord.issuedBy} (Status: {a.existingRecord.status})
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
                      className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold border border-emerald-500/40 transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Real-time safety checks active for all technicians</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
