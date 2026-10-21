import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Search, 
  Download, 
  Printer, 
  MapPin, 
  Building2, 
  Layers, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  FileText, 
  Hash, 
  Eye, 
  X, 
  Barcode 
} from 'lucide-react';
import { 
  StockTransfer, 
  SubCategoryCode, 
  SUB_CATEGORY_METADATA, 
  UserPersona, 
  InventoryItem 
} from '../../types/inventory';
import { storageService } from '../../services/storage';

interface WorkflowTransferProps {
  inventory: InventoryItem[];
  activeUser: UserPersona;
  onOpenTransferModal: () => void;
  onSuccess: (message: string) => void;
}

export const WorkflowTransfer: React.FC<WorkflowTransferProps> = ({
  inventory,
  activeUser,
  onOpenTransferModal,
  onSuccess,
}) => {
  const [transfers, setTransfers] = useState<StockTransfer[]>(() => storageService.getTransfers());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SubCategoryCode | 'ALL'>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [selectedWaybill, setSelectedWaybill] = useState<StockTransfer | null>(null);

  const refreshTransfers = () => {
    setTransfers(storageService.getTransfers());
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchCat = categoryFilter === 'ALL' || t.subCategory === categoryFilter;
      const matchDist = districtFilter === 'ALL' || t.destinationDistrict === districtFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.moveOrderNo.toLowerCase().includes(q) ||
        t.materialCode.toLowerCase().includes(q) ||
        t.materialDescription.toLowerCase().includes(q) ||
        t.destinationDistrict.toLowerCase().includes(q) ||
        t.destinationBranch.toLowerCase().includes(q) ||
        t.dispatchOfficer.toLowerCase().includes(q) ||
        t.serialNumbers?.some((s) => s.toLowerCase().includes(q));

      return matchCat && matchDist && matchQuery;
    });
  }, [transfers, categoryFilter, districtFilter, searchQuery]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set(transfers.map((t) => t.destinationDistrict));
    return Array.from(set).sort();
  }, [transfers]);

  const totalTransferredUnits = useMemo(
    () => transfers.reduce((sum, t) => sum + t.quantity, 0),
    [transfers]
  );

  const handleExportCSV = () => {
    const headers = [
      'Move Order #',
      'Transfer Date',
      'Category',
      'Material Code',
      'Description',
      'Quantity',
      'Unit',
      'Destination District',
      'Destination Branch',
      'Dispatch Officer',
      'Carrier Vehicle',
      'Serial Numbers',
      'Status',
      'Notes',
    ];

    const rows = filteredTransfers.map((t) => [
      `"${t.moveOrderNo}"`,
      `"${t.transferDate}"`,
      `"${t.subCategory}"`,
      `"${t.materialCode}"`,
      `"${t.materialDescription}"`,
      t.quantity,
      `"${t.unit}"`,
      `"${t.destinationDistrict}"`,
      `"${t.destinationBranch}"`,
      `"${t.dispatchOfficer}"`,
      `"${t.carrierVehicle || ''}"`,
      `"${t.serialNumbers?.join(', ') || ''}"`,
      `"${t.status}"`,
      `"${t.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SLT_Move_Orders_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintWaybill = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0056B3 0%, #002D5E 100%)',
          color: '#FFFFFF',
          padding: '22px 24px',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  backgroundColor: 'var(--mobitel-lime)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.04em',
                }}
              >
                INTER-DISTRICT & INTER-BRANCH DISPATCH
              </span>
              <span style={{ fontSize: '0.8rem', color: '#BAE6FD', fontWeight: 600 }}>
                SLT-MOBITEL Telecom Logistics & Move Orders
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              Inter-Branch Stock Transfers (Move Order System)
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#E0F2FE', marginTop: 4, maxWidth: 680 }}>
              Transfer equipment and materials across all <strong>5 categories</strong> (TCOPNC, TCOPNC-C, TCOPNC-R, TC-OPCDR, TC-OPCDR-R) to any Sri Lankan telecom branch or district using authorized <strong>Move Order Numbers</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onOpenTransferModal}
              className="btn"
              style={{
                backgroundColor: 'var(--mobitel-lime)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '10px 18px',
                minHeight: 44,
                gap: 8,
                boxShadow: '0 4px 12px rgba(67, 176, 42, 0.35)',
              }}
            >
              <ArrowRightLeft size={18} />
              <span>+ New Move Order Transfer</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '10px 14px',
                minHeight: 44,
                fontSize: '0.85rem',
              }}
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card" style={{ borderLeft: '4px solid var(--slt-deep-blue)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Move Orders</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: '#0F172A' }}>
            {transfers.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--slt-deep-blue)', marginTop: 4 }}>
            Dispatches across 5 categories
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--mobitel-lime)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Transferred Units</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: '#0F172A' }}>
            {totalTransferredUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--status-success)', marginTop: 4 }}>
            Deducted from depot inventory
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #7E22CE' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Destination Districts Reached</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: '#0F172A' }}>
            {uniqueDistricts.length} / 25
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7E22CE', marginTop: 4 }}>
            Nationwide coverage
          </div>
        </div>
      </div>

      {/* Move Orders Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Dispatched Move Orders Registry
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Showing {filteredTransfers.length} Move Orders with complete Waybill trace
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search MO#, SKU, District..."
                className="input-field"
                style={{ width: 220, paddingLeft: 34, minHeight: 38, fontSize: '0.82rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="input-field"
              style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
            >
              <option value="ALL">All 5 Categories</option>
              <option value="TCOPNC">TCOPNC - Standard New Connection</option>
              <option value="TCOPNC-C">TCOPNC-C - Collective Stock (Customer)</option>
              <option value="TCOPNC-R">TCOPNC-R - Workshop Returns</option>
              <option value="TC-OPCDR">TC-OPCDR - Rehab Project</option>
              <option value="TC-OPCDR-R">TC-OPCDR-R - Rehab Returned</option>
            </select>

            {/* District Filter */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
            >
              <option value="ALL">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: 600, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: '#E2E8F0' }}>
                <th style={{ width: 140 }}>Move Order #</th>
                <th style={{ width: 100 }}>Date</th>
                <th style={{ width: 110 }}>Category</th>
                <th>Product Description</th>
                <th style={{ width: 80, textAlign: 'center' }}>Qty</th>
                <th>Destination (Branch &amp; District)</th>
                <th style={{ width: 130 }}>Carrier / Officer</th>
                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>No Move Orders found.</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                      Click <strong>+ New Move Order Transfer</strong> above to dispatch stock to another branch or district.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => {
                  const meta = SUB_CATEGORY_METADATA[t.subCategory];

                  return (
                    <tr key={t.id}>
                      <td>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: 4,
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.84rem',
                          }}
                        >
                          {t.moveOrderNo}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                        {t.transferDate}
                      </td>
                      <td>
                        <span
                          className="code-tag"
                          style={{
                            backgroundColor: `${meta?.badgeColor}15`,
                            color: meta?.badgeColor || '#0056B3',
                            borderColor: `${meta?.badgeColor}40`,
                            fontSize: '0.72rem',
                          }}
                        >
                          {t.subCategory}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                          {t.materialDescription}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                          SKU: {t.materialCode}
                        </div>
                        {t.isSerialized && t.serialNumbers && t.serialNumbers.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#2563EB', marginTop: 2 }}>
                            S/N: {t.serialNumbers.slice(0, 3).join(', ')}
                            {t.serialNumbers.length > 3 && ` +${t.serialNumbers.length - 3} more`}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: 'var(--status-danger)' }}>
                        -{t.quantity} {t.unit}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                          {t.destinationBranch}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#0056B3', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} />
                          <span>{t.destinationDistrict} District</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                          {t.dispatchOfficer}
                        </div>
                        {t.carrierVehicle && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Truck size={11} />
                            <span>{t.carrierVehicle}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedWaybill(t)}
                          className="btn btn-outline"
                          style={{
                            minHeight: 28,
                            padding: '4px 8px',
                            fontSize: '0.74rem',
                            gap: 4,
                          }}
                          title="View & Print Waybill"
                        >
                          <Eye size={12} />
                          <span>Waybill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Order Waybill Preview Modal */}
      {selectedWaybill && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
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
              maxWidth: 600,
              boxShadow: 'var(--shadow-floating)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} color="var(--slt-deep-blue)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Move Order Waybill Slip #{selectedWaybill.moveOrderNo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedWaybill(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Waybill Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SLT Official Header */}
              <div
                style={{
                  borderBottom: '2px solid #0056B3',
                  paddingBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0056B3', letterSpacing: 0.5 }}>
                    SLT-MOBITEL
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                    Infrastructure Material Transfer Waybill
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                    {selectedWaybill.moveOrderNo}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Date: {selectedWaybill.transferDate}
                  </div>
                </div>
              </div>

              {/* Waybill Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Origin Branch:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>SLT Colombo HQ Central Depot</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Destination Branch:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedWaybill.destinationBranch}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Destination District:</span>
                  <div style={{ fontWeight: 700, color: '#0056B3' }}>{selectedWaybill.destinationDistrict} District</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Stock Category:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedWaybill.subCategory}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Carrier / Vehicle:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedWaybill.carrierVehicle || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Dispatch Officer:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedWaybill.dispatchOfficer}</div>
                </div>
              </div>

              {/* Material Box */}
              <div
                style={{
                  padding: 14,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                      {selectedWaybill.materialDescription}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                      SKU: {selectedWaybill.materialCode}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0056B3' }}>
                      {selectedWaybill.quantity} {selectedWaybill.unit}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>
                      DISPATCH VERIFIED
                    </div>
                  </div>
                </div>

                {selectedWaybill.serialNumbers && selectedWaybill.serialNumbers.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #CBD5E1' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Serialized Devices Transferred ({selectedWaybill.serialNumbers.length} S/N):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedWaybill.serialNumbers.map((sn) => (
                        <span
                          key={sn}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #BFDBFE',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            color: '#1D4ED8',
                            fontWeight: 700,
                          }}
                        >
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedWaybill.notes && (
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  <strong>Notes:</strong> {selectedWaybill.notes}
                </div>
              )}

              {/* Signature Blocks for Print */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20,
                  marginTop: 10,
                  paddingTop: 16,
                  borderTop: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  color: '#64748B',
                }}
              >
                <div>
                  <div>Dispatched By: ___________________</div>
                  <div style={{ marginTop: 4 }}>{selectedWaybill.dispatchOfficer}</div>
                </div>
                <div>
                  <div>Received By (Depot Officer): ___________________</div>
                  <div style={{ marginTop: 4 }}>Destination Depot Officer Signature</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedWaybill(null)}
                  className="btn btn-outline"
                  style={{ minHeight: 38, padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintWaybill}
                  className="btn btn-primary"
                  style={{ minHeight: 38, padding: '6px 18px', fontSize: '0.82rem', gap: 6 }}
                >
                  <Printer size={15} />
                  <span>Print Waybill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
