import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, History, CheckCircle2, Clock, FileSpreadsheet, ShieldAlert, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { LedgerTransaction, SubCategoryCode, SUB_CATEGORY_METADATA } from '../../types/inventory';

interface AuditLedgerTableProps {
  ledger: LedgerTransaction[];
  onRefresh: () => void;
}

export const AuditLedgerTable: React.FC<AuditLedgerTableProps> = ({ ledger }) => {
  const [filterSubCategory, setFilterSubCategory] = useState<SubCategoryCode | 'ALL'>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLedger = useMemo(() => {
    return ledger.filter((tx) => {
      const matchCat = filterSubCategory === 'ALL' || tx.subCategory === filterSubCategory;
      const matchAction = filterAction === 'ALL' || tx.actionType === filterAction;
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
        tx.locatorId?.toLowerCase().includes(q) ||
        tx.notes?.toLowerCase().includes(q);

      return matchCat && matchAction && matchQuery;
    });
  }, [ledger, filterSubCategory, filterAction, searchQuery]);

  // Export full ledger CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Timestamp',
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
      'Work Order #',
      'Batch Locator ID',
      'Reason Code',
      'Condition',
      'Notes',
      'Sync Status',
    ];

    const rows = filteredLedger.map((tx) => [
      `"${tx.id}"`,
      `"${tx.timestamp}"`,
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
      `"${tx.workOrderNo || ''}"`,
      `"${tx.locatorId || ''}"`,
      `"${tx.reasonCode || ''}"`,
      `"${tx.itemCondition || ''}"`,
      `"${tx.notes || ''}"`,
      `"${tx.syncStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SLT_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                100% Immutable Transaction Ledger
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              SLT-MOBITEL Infrastructure Audit Trail
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: 2 }}>
              Cryptographically timestamped record of all stock dispatches, field installations, rehab work orders, and recoveries.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="btn btn-primary"
            style={{ minHeight: 42, padding: '0 16px', gap: 8 }}
          >
            <FileSpreadsheet size={18} />
            <span>Export Full Ledger (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Serial #, WO#, Account #, SKU, or Tech..."
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

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator / Tech</th>
                <th>Action Type</th>
                <th>Sub-Category</th>
                <th>Material & Specs</th>
                <th style={{ textAlign: 'right' }}>Delta</th>
                <th>Serial / Reference</th>
                <th>Sync Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    No transactions matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx) => {
                  const meta = SUB_CATEGORY_METADATA[tx.subCategory];
                  const isNegative = tx.quantityDelta < 0;

                  return (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {tx.timestamp}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{tx.userName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.userId}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 4,
                            backgroundColor:
                              tx.actionType === 'INTER_BRANCH_TRANSFER'
                                ? '#EFF6FF'
                                : tx.actionType === 'CUSTOMER_COLLECT'
                                ? '#FAF5FF'
                                : isNegative
                                ? '#FEF2F2'
                                : '#F0FDF4',
                            color:
                              tx.actionType === 'INTER_BRANCH_TRANSFER'
                                ? '#1D4ED8'
                                : tx.actionType === 'CUSTOMER_COLLECT'
                                ? '#7E22CE'
                                : isNegative
                                ? 'var(--status-danger)'
                                : 'var(--status-success)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {isNegative ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                          {tx.actionType === 'INTER_BRANCH_TRANSFER'
                            ? 'MOVE ORDER TRANSFER'
                            : tx.actionType === 'CUSTOMER_COLLECT'
                            ? 'CUSTOMER COLLECT'
                            : tx.actionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          className="code-tag"
                          style={{
                            color: meta?.badgeColor || 'var(--slt-deep-blue)',
                            backgroundColor: `${meta?.badgeColor}15`,
                            borderColor: `${meta?.badgeColor}35`,
                          }}
                        >
                          {tx.subCategory}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                          {tx.materialCode}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {tx.materialDescription}
                        </div>
                        {tx.notes && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong
                          style={{
                            fontSize: '1rem',
                            fontFamily: 'var(--font-mono)',
                            color: isNegative ? 'var(--status-danger)' : 'var(--status-success)',
                          }}
                        >
                          {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta} {tx.unit}
                        </strong>
                      </td>
                      <td>
                        {tx.moveOrderNo && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.78rem', color: '#1D4ED8' }}>
                            MO#: {tx.moveOrderNo}
                          </div>
                        )}
                        {tx.destinationDistrict && (
                          <div style={{ fontSize: '0.72rem', color: '#0F172A', fontWeight: 600 }}>
                            Dest: {tx.destinationBranch || tx.destinationDistrict} ({tx.destinationDistrict})
                          </div>
                        )}
                        {tx.serialNumber && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--slt-deep-blue)' }}>
                            S/N: {tx.serialNumber}
                          </div>
                        )}
                        {tx.accountNo && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            Acct: <strong>{tx.accountNo}</strong> {tx.customerName ? `(${tx.customerName})` : ''}
                          </div>
                        )}
                        {tx.workOrderNo && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            WO#: <strong>{tx.workOrderNo}</strong>
                          </div>
                        )}
                        {tx.locatorId && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Tag: {tx.locatorId}
                          </div>
                        )}
                      </td>
                      <td>
                        {tx.syncStatus === 'SYNCED' ? (
                          <span className="status-pill online" style={{ fontSize: '0.7rem' }}>
                            <CheckCircle2 size={11} /> Synced
                          </span>
                        ) : (
                          <span className="status-pill queued" style={{ fontSize: '0.7rem' }}>
                            <Clock size={11} /> Cached Offline
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
