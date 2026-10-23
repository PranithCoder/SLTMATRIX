import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Search,
  Filter,
  History,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Archive,
  AlertCircle,
  X
} from 'lucide-react';
import { LedgerTransaction, SubCategoryCode, SUB_CATEGORY_METADATA } from '../../types/inventory';
import { storageService } from '../../services/storage';

interface AuditLedgerTableProps {
  ledger: LedgerTransaction[];
  onRefresh: () => void;
}

export const AuditLedgerTable: React.FC<AuditLedgerTableProps> = ({ ledger, onRefresh }) => {
  const [filterSubCategory, setFilterSubCategory] = useState<SubCategoryCode | 'ALL'>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Date Filtering State
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'LAST_7' | 'LAST_30' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 30-Day Auto Archive Notification State
  const [archiveNotice, setArchiveNotice] = useState<string | null>(null);

  // Helper to export CSV
  const exportTransactionsCSV = (txs: LedgerTransaction[], filename: string) => {
    const headers = [
      'Transaction ID',
      'Timestamp',
      'Entry Date',
      'User ID',
      'User Name',
      'Action Type',
      'Main Category',
      'Sub Category',
      'Material SKU',
      'Material Description',
      'Quantity Delta',
      'Unit',
      'Serial Number',
      'Customer Account #',
      'Customer Name',
      'Work Order #',
      'Move Order #',
      'Destination Branch',
      'Batch Locator ID',
      'Notes',
      'Sync Status',
    ];

    const rows = txs.map((tx) => [
      `"${tx.id}"`,
      `"${tx.timestamp}"`,
      `"${tx.entryDate || ''}"`,
      `"${tx.userId}"`,
      `"${tx.userName}"`,
      `"${tx.actionType}"`,
      `"${tx.mainCategory}"`,
      `"${tx.subCategory}"`,
      `"${tx.materialCode}"`,
      `"${tx.materialDescription}"`,
      tx.quantityDelta,
      `"${tx.unit}"`,
      `"${tx.serialNumber || ''}"`,
      `"${tx.accountNo || ''}"`,
      `"${tx.customerName || ''}"`,
      `"${tx.workOrderNo || ''}"`,
      `"${tx.moveOrderNo || ''}"`,
      `"${tx.destinationBranch || ''}"`,
      `"${tx.locatorId || ''}"`,
      `"${tx.notes || ''}"`,
      `"${tx.syncStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 30-Day Auto-Retention Policy Check on Mount
  useEffect(() => {
    const { pruned } = storageService.pruneLedgerOlderThan(30);
    if (pruned.length > 0) {
      exportTransactionsCSV(
        pruned,
        `SLT_Audit_Archive_Older_Than_30_Days_${new Date().toISOString().slice(0, 10)}.csv`
      );
      setArchiveNotice(
        `30-Day Auto-Archive Policy Enforced: ${pruned.length} transactions older than 30 days were automatically downloaded to your PC and cleaned from the active database.`
      );
      onRefresh();
    }
  }, []);

  // Manual Trigger for 30-day prune
  const handleManualArchive30Days = () => {
    const { pruned } = storageService.pruneLedgerOlderThan(30);
    if (pruned.length > 0) {
      exportTransactionsCSV(
        pruned,
        `SLT_Audit_Archive_Older_Than_30_Days_${new Date().toISOString().slice(0, 10)}.csv`
      );
      setArchiveNotice(
        `Archived & Downloaded: ${pruned.length} transactions older than 30 days removed from ledger.`
      );
      onRefresh();
    } else {
      setArchiveNotice('All records are currently within the 30-day active retention window.');
      setTimeout(() => setArchiveNotice(null), 4000);
    }
  };

  const filteredLedger = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return ledger.filter((tx) => {
      // Category filter
      const matchCat = filterSubCategory === 'ALL' || tx.subCategory === filterSubCategory;

      // Action filter
      const matchAction = filterAction === 'ALL' || tx.actionType === filterAction;

      // Date filter
      let matchDate = true;
      const txDateStr = tx.entryDate || (tx.timestamp ? tx.timestamp.split(' ')[0] : '');

      if (datePreset === 'TODAY') {
        matchDate = txDateStr === todayStr;
      } else if (datePreset === 'LAST_7') {
        const d7 = new Date();
        d7.setDate(now.getDate() - 7);
        const d7Str = d7.toISOString().slice(0, 10);
        matchDate = txDateStr >= d7Str && txDateStr <= todayStr;
      } else if (datePreset === 'LAST_30') {
        const d30 = new Date();
        d30.setDate(now.getDate() - 30);
        const d30Str = d30.toISOString().slice(0, 10);
        matchDate = txDateStr >= d30Str && txDateStr <= todayStr;
      } else if (datePreset === 'CUSTOM') {
        if (startDate && txDateStr < startDate) matchDate = false;
        if (endDate && txDateStr > endDate) matchDate = false;
      }

      // Query filter
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        tx.materialCode.toLowerCase().includes(q) ||
        tx.materialDescription.toLowerCase().includes(q) ||
        tx.userId.toLowerCase().includes(q) ||
        tx.userName.toLowerCase().includes(q) ||
        tx.serialNumber?.toLowerCase().includes(q) ||
        tx.accountNo?.toLowerCase().includes(q) ||
        tx.workOrderNo?.toLowerCase().includes(q) ||
        tx.moveOrderNo?.toLowerCase().includes(q) ||
        tx.destinationBranch?.toLowerCase().includes(q) ||
        tx.locatorId?.toLowerCase().includes(q) ||
        tx.notes?.toLowerCase().includes(q);

      return matchCat && matchAction && matchDate && matchQuery;
    });
  }, [ledger, filterSubCategory, filterAction, datePreset, startDate, endDate, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 30-Day Auto Archive Banner */}
      {archiveNotice && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            border: '1px solid #6366F1',
            color: '#E0E7FF',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Archive size={20} color="#818CF8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{archiveNotice}</span>
          </div>
          <button
            onClick={() => setArchiveNotice(null)}
            style={{ background: 'transparent', border: 'none', color: '#C7D2FE', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Ledger Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <History size={18} color="var(--cyan-electric)" />
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
                SLT-MOBITEL Infrastructure 30-Day Active Ledger
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              SLT Immutable Audit Trail
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: 2 }}>
              Cryptographically timestamped transaction log. Records past 30 days are automatically archived to PC CSV & purged.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleManualArchive30Days}
              className="btn btn-outline"
              style={{
                minHeight: 42,
                padding: '0 14px',
                gap: 6,
                borderColor: '#64748B',
                color: '#E2E8F0',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
              title="Archive records older than 30 days and clean active storage"
            >
              <Archive size={16} />
              <span>Clean & Archive (&gt;30 Days)</span>
            </button>

            <button
              onClick={() =>
                exportTransactionsCSV(
                  filteredLedger,
                  `SLT_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
              className="btn btn-primary"
              style={{ minHeight: 42, padding: '0 16px', gap: 8 }}
            >
              <FileSpreadsheet size={18} />
              <span>Export Filtered CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div
        className="card"
        style={{
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Top Filter Row: Search & Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Serial #, WO#, Account #, Move Order #, SKU, or Tech..."
              className="input-field"
              style={{ height: 40, paddingLeft: 36, fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          </div>

          {/* Sub-Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
            <select
              value={filterSubCategory}
              onChange={(e) => setFilterSubCategory(e.target.value as any)}
              className="input-field"
              style={{ width: 'auto', height: 40, fontSize: '0.8rem', fontWeight: 600 }}
            >
              <option value="ALL">All Categories</option>
              <option value="TCOPNC">TCOPNC (New Conn)</option>
              <option value="TCOPNC-R">TCOPNC-R (Customer Return)</option>
              <option value="TCOPNC-C">TCOPNC-C (Collective)</option>
              <option value="TC-OPCDR">TC-OPCDR (Rehab)</option>
              <option value="TC-OPCDR-R">TC-OPCDR-R (Rehab Return)</option>
            </select>
          </div>

          {/* Action Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input-field"
              style={{ width: 'auto', height: 40, fontSize: '0.8rem', fontWeight: 600 }}
            >
              <option value="ALL">All Actions</option>
              <option value="INTER_BRANCH_TRANSFER">Inter-Branch Transfer (Move Order)</option>
              <option value="CUSTOMER_COLLECT">Direct Customer Collect (TC-OPNC-C)</option>
              <option value="CUSTOMER_RETURN">Central Workshop Return (TC-OPNC-R)</option>
              <option value="DEVICE_ALLOCATION">Device Allocation (TC-OPNC)</option>
              <option value="REHAB_CONSUMPTION">Rehab Consumption (TC-OPCDR)</option>
              <option value="REHAB_RECOVERY">Rehab Recovery (TC-OPCDR-R)</option>
              <option value="DISPATCH_RECEIVE">Dispatch Tag Receive</option>
              <option value="COLLECTIVE_AUDIT">Collective Audit</option>
              <option value="PRODUCT_CREATE">Product Created</option>
              <option value="PRODUCT_UPDATE">Product Updated</option>
              <option value="PRODUCT_DELETE">Product Deleted</option>
            </select>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            paddingTop: 10,
            borderTop: '1px solid #E2E8F0',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#475569' }}>
            <Calendar size={16} color="#0284C7" />
            <span>Filter by Date:</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(
              [
                { id: 'ALL', label: 'All Time' },
                { id: 'TODAY', label: 'Today' },
                { id: 'LAST_7', label: 'Last 7 Days' },
                { id: 'LAST_30', label: 'Last 30 Days' },
                { id: 'CUSTOM', label: 'Custom Range' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: datePreset === preset.id ? '#0056B3' : '#F8FAFC',
                  color: datePreset === preset.id ? '#FFFFFF' : '#334155',
                  borderColor: datePreset === preset.id ? '#0056B3' : '#CBD5E1',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {datePreset === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                style={{ height: 32, fontSize: '0.78rem', padding: '0 8px' }}
                placeholder="Start Date"
              />
              <span style={{ color: '#64748B' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
                style={{ height: 32, fontSize: '0.78rem', padding: '0 8px' }}
                placeholder="End Date"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          <div style={{ marginLeft: 'auto', color: '#64748B', fontSize: '0.78rem' }}>
            Showing <strong>{filteredLedger.length}</strong> of {ledger.length} records
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Operator / Tech</th>
                <th>Action Type</th>
                <th>Sub-Category</th>
                <th>Material & Specs</th>
                <th style={{ textAlign: 'right' }}>Delta</th>
                <th>Serial / Reference</th>
                <th>Notes / Destination</th>
                <th style={{ textAlign: 'center' }}>Sync</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No transactions match the selected date or search filters.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx) => {
                  const isPositive = tx.quantityDelta > 0;
                  const catMeta = SUB_CATEGORY_METADATA[tx.subCategory];

                  return (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {tx.entryDate || tx.timestamp?.slice(0, 10)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {tx.timestamp?.slice(11) || tx.timestamp}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{tx.userName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {tx.userId}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            backgroundColor:
                              tx.actionType === 'INTER_BRANCH_TRANSFER'
                                ? '#E0F2FE'
                                : tx.actionType.includes('DISPATCH') || tx.actionType.includes('RETURN') || tx.actionType.includes('COLLECT')
                                ? 'rgba(67, 176, 42, 0.12)'
                                : 'rgba(0, 86, 179, 0.12)',
                            color:
                              tx.actionType === 'INTER_BRANCH_TRANSFER'
                                ? '#0284C7'
                                : tx.actionType.includes('DISPATCH') || tx.actionType.includes('RETURN') || tx.actionType.includes('COLLECT')
                                ? 'var(--mobitel-dark-green)'
                                : 'var(--slt-deep-blue)',
                          }}
                        >
                          {tx.actionType}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: catMeta ? `${catMeta.badgeColor}18` : '#F1F5F9',
                            color: catMeta ? catMeta.badgeColor : '#475569',
                            border: `1px solid ${catMeta ? `${catMeta.badgeColor}40` : '#CBD5E1'}`,
                            fontSize: '0.72rem',
                          }}
                        >
                          {tx.subCategory}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem' }}>
                          {tx.materialCode}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tx.materialDescription}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                            color: isPositive ? 'var(--mobitel-dark-green)' : 'var(--danger)',
                          }}
                        >
                          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          <span>{isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {tx.unit}
                          </span>
                        </div>
                      </td>
                      <td>
                        {tx.serialNumber && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#0056B3', fontWeight: 600 }}>
                            S/N: {tx.serialNumber}
                          </div>
                        )}
                        {tx.accountNo && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            A/C: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{tx.accountNo}</span>
                          </div>
                        )}
                        {tx.customerName && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Cust: {tx.customerName}
                          </div>
                        )}
                        {tx.workOrderNo && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            WO#: <span style={{ fontFamily: 'var(--font-mono)' }}>{tx.workOrderNo}</span>
                          </div>
                        )}
                        {tx.moveOrderNo && (
                          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600 }}>
                            Move#: <span style={{ fontFamily: 'var(--font-mono)' }}>{tx.moveOrderNo}</span>
                          </div>
                        )}
                        {tx.locatorId && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Loc: <span style={{ fontFamily: 'var(--font-mono)' }}>{tx.locatorId}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.notes || '—'}
                        </div>
                        {tx.destinationBranch && (
                          <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 600 }}>
                            Dest: {tx.destinationBranch} ({tx.destinationDistrict})
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {tx.syncStatus === 'SYNCED' ? (
                          <span title="Synced to Database" style={{ color: 'var(--mobitel-dark-green)', display: 'inline-flex', alignItems: 'center' }}>
                            <CheckCircle2 size={16} />
                          </span>
                        ) : (
                          <span title="Queued Offline" style={{ color: 'var(--warning-amber)', display: 'inline-flex', alignItems: 'center' }}>
                            <Clock size={16} />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
