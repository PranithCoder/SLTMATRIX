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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500/70 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Urgent Warning Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-b border-red-500/40 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Duplicate Record Detected!
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-red-500 text-white rounded">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-red-300">
                {duplicateType === 'SERIAL'
                  ? `Serial Number [${duplicateValue}] already issued!`
                  : duplicateType === 'ACCOUNT'
                  ? `Customer Account [${duplicateValue}] already exists!`
                  : `Duplicate Serial & Account detected!`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informing Kanishka Notice Banner */}
        <div className="px-5 py-2.5 bg-red-950/60 border-b border-red-500/30 flex items-center gap-2 text-xs text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>
            <strong>System Alert Logged:</strong> This duplicate attempt has been flagged and transmitted to Admin <strong>Mr. Kanishka</strong>.
          </span>
        </div>

        {/* Existing Customer Details Card */}
        <div className="p-5 space-y-3.5 text-xs">
          <div className="text-slate-300 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span>Existing Issuance Record Details:</span>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Customer Name:</span>
              <span className="font-bold text-white text-sm">{existingRecord.customerName}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Account:</span>
                <span className="font-mono font-bold text-white">{existingRecord.accountNo}</span>
              </div>
              {existingRecord.serialNumber && (
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Serial:</span>
                  <span className="font-mono font-bold text-amber-300">{existingRecord.serialNumber}</span>
                </div>
              )}
            </div>

            <div className="text-slate-300">
              <span className="text-slate-400">Device / Item: </span>
              <strong className="text-white">{existingRecord.materialCode}</strong> — {existingRecord.materialDescription}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-slate-400 text-[11px]">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Issued: <strong className="text-slate-300">{existingRecord.issueDate}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>By: <strong className="text-slate-300">{existingRecord.issuedBy}</strong></span>
              </div>
            </div>

            {existingRecord.customerContact && (
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact: {existingRecord.customerContact}</span>
              </div>
            )}

            {existingRecord.customerAddress && (
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Address: {existingRecord.customerAddress}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Record Status:</span>
              <span className={`px-2 py-0.5 rounded font-semibold ${
                existingRecord.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {existingRecord.status}
              </span>
            </div>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Please verify if this customer is requesting a secondary ONT or if the device has already been collected / swapped in SLT records.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel & Correct Entry
          </button>
          {onProceed && (
            <button
              onClick={onProceed}
              className="py-2 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors border border-red-500/50"
            >
              Proceed Anyway
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
