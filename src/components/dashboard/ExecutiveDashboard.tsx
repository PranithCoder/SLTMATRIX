import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  Search, 
  Download, 
  RotateCcw, 
  Layers, 
  Cable, 
  Printer, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';
import { InventoryItem, LedgerTransaction, SubCategoryCode, SUB_CATEGORY_METADATA, UserPersona } from '../../types/inventory';
import { storageService } from '../../services/storage';

interface ExecutiveDashboardProps {
  inventory: InventoryItem[];
  ledger: LedgerTransaction[];
  activeUser: UserPersona;
  onNavigateTab: (tab: any) => void;
  onOpenScanner: (hint?: string) => void;
  onRefreshData: () => void;
  onAddProduct?: (category?: SubCategoryCode) => void;
  onEditProduct?: (item: InventoryItem) => void;
  onDeleteProduct?: (item: InventoryItem) => void;
  onTransferProduct?: (item?: InventoryItem) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  inventory,
  ledger,
  activeUser,
  onNavigateTab,
  onOpenScanner,
  onRefreshData,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onTransferProduct,
}) => {
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryCode | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [serialSearchQuery, setSerialSearchQuery] = useState('');

  // Subcategory metrics
  const categoryStats = useMemo(() => {
    const stats: Record<SubCategoryCode, { totalQty: number; itemCount: number; lowStockCount: number }> = {
      'TCOPNC': { totalQty: 0, itemCount: 0, lowStockCount: 0 },
      'TCOPNC-R': { totalQty: 0, itemCount: 0, lowStockCount: 0 },
      'TCOPNC-C': { totalQty: 0, itemCount: 0, lowStockCount: 0 },
      'TC-OPCDR': { totalQty: 0, itemCount: 0, lowStockCount: 0 },
      'TC-OPCDR-R': { totalQty: 0, itemCount: 0, lowStockCount: 0 },
    };

    inventory.forEach((item) => {
      if (stats[item.subCategory]) {
        stats[item.subCategory].totalQty += item.quantity;
        stats[item.subCategory].itemCount += 1;
        if (item.minThreshold > 0 && item.quantity <= item.minThreshold) {
          stats[item.subCategory].lowStockCount += 1;
        }
      }
    });

    return stats;
  }, [inventory]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchCat = selectedSubCategory === 'ALL' || item.subCategory === selectedSubCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        item.materialCode.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.binLocation?.toLowerCase().includes(query) ||
        item.serialNumbers?.some((s) => s.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  }, [inventory, selectedSubCategory, searchQuery]);

  // Serial Number Search in Ledger / Stock / Customer Issuances
  const serialLookupResult = useMemo(() => {
    const q = serialSearchQuery.trim().toUpperCase();
    if (!q) return null;

    // Check currently in stock
    const inStockItem = inventory.find((i) => i.serialNumbers?.some((s) => s.toUpperCase() === q));
    // Check ledger history
    const history = ledger.filter((l) => l.serialNumber?.toUpperCase() === q);
    // Check Customer Issuance records
    const issuances = storageService.getCustomerIssuances();
    const customerIssuance = issuances.find((i) => i.serialNumber?.toUpperCase() === q);

    return {
      searchedSerial: q,
      inStockItem,
      history,
      customerIssuance,
    };
  }, [inventory, ledger, serialSearchQuery]);

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = ['Material Code', 'Description', 'Sub-Category', 'Quantity', 'Unit', 'Bin Location', 'Serialized', 'Last Updated'];
    const rows = inventory.map((i) => [
      `"${i.materialCode}"`,
      `"${i.description}"`,
      `"${i.subCategory}"`,
      i.quantity,
      `"${i.unit}"`,
      `"${i.binLocation || ''}"`,
      i.isSerialized ? 'YES' : 'NO',
      `"${i.lastUpdated}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SLT_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalLowStock = Object.values(categoryStats).reduce((sum, s) => sum + s.lowStockCount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Executive Welcome & Context Header */}
      <div className="card dashboard-hero">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
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
                EXECUTIVE COCKPIT
              </span>
              <span style={{ fontSize: '0.78rem', color: '#BAE6FD', fontWeight: 600 }}>
                Mr. Kanishka (IBT) | SLT-MOBITEL Infrastructure
              </span>
            </div>
            <h2 className="dashboard-hero-title">
              Field & Central Stock Control Center
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#E0F2FE', marginTop: 4, maxWidth: 650, lineHeight: 1.4 }}>
              Live visibility into prime and return stock ledgers across <strong>New Connection</strong> and <strong>Rehabilitation</strong>.
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <button
              onClick={handleExportCSV}
              className="dashboard-hero-btn"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="dashboard-hero-btn"
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards: 5 Sub-Categories (PRD Section 3) */}
      <div className="dashboard-kpi-grid">
        {/* TCOPNC */}
        <div
          className="card"
          onClick={() => setSelectedSubCategory(selectedSubCategory === 'TCOPNC' ? 'ALL' : 'TCOPNC')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid var(--slt-deep-blue)',
            backgroundColor: selectedSubCategory === 'TCOPNC' ? '#EFF6FF' : '#FFFFFF',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="code-tag" style={{ color: 'var(--slt-deep-blue)' }}>TCOPNC</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>New Connection</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 8, color: 'var(--text-primary)' }}>
            {categoryStats['TCOPNC'].totalQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            56 Verification Items ({categoryStats['TCOPNC'].totalQty.toLocaleString()} Units)
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slt-deep-blue)', fontWeight: 600, marginTop: 6 }}>
            Prime Stock & Serial Tracked
          </div>
        </div>

        {/* TC-OPNC-R (Workshop Returns) */}
        <div
          className="card"
          onClick={() => setSelectedSubCategory(selectedSubCategory === 'TCOPNC-R' ? 'ALL' : 'TCOPNC-R')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid #EA580C',
            backgroundColor: selectedSubCategory === 'TCOPNC-R' ? '#FFF7ED' : '#FFFFFF',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="code-tag" style={{ color: '#EA580C' }}>TC-OPNC-R</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Workshop Returns</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 8, color: 'var(--text-primary)' }}>
            {categoryStats['TCOPNC-R'].totalQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Returned from Central Workshop
          </div>
          <div style={{ fontSize: '0.7rem', color: '#EA580C', fontWeight: 600, marginTop: 6 }}>
            Inbound from Repair Center
          </div>
        </div>

        {/* TC-OPNC-C (Collective Stock - Direct from Customer) */}
        <div
          className="card"
          onClick={() => setSelectedSubCategory(selectedSubCategory === 'TCOPNC-C' ? 'ALL' : 'TCOPNC-C')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid #7E22CE',
            backgroundColor: selectedSubCategory === 'TCOPNC-C' ? '#FAF5FF' : '#FFFFFF',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="code-tag" style={{ color: '#7E22CE' }}>TC-OPNC-C</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Collective (Customer)</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 8, color: 'var(--text-primary)' }}>
            {categoryStats['TCOPNC-C'].totalQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Direct Customer Collections
          </div>
          <div style={{ fontSize: '0.7rem', color: '#7E22CE', fontWeight: 600, marginTop: 6 }}>
            Churn &amp; Premise Recovery
          </div>
        </div>

        {/* TC-OPCDR */}
        <div
          className="card"
          onClick={() => setSelectedSubCategory(selectedSubCategory === 'TC-OPCDR' ? 'ALL' : 'TC-OPCDR')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid var(--mobitel-lime)',
            backgroundColor: selectedSubCategory === 'TC-OPCDR' ? '#F0FDF4' : '#FFFFFF',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="code-tag" style={{ color: 'var(--mobitel-lime-dark)' }}>TC-OPCDR</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rehab Project</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 8, color: 'var(--text-primary)' }}>
            {categoryStats['TC-OPCDR'].totalQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            86 Verification Items ({categoryStats['TC-OPCDR'].totalQty.toLocaleString()} Units)
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slt-deep-blue)', fontWeight: 600, marginTop: 6 }}>
            Locator & Work Order Tracked
          </div>
        </div>

        {/* TC-OPCDR-R */}
        <div
          className="card"
          onClick={() => setSelectedSubCategory(selectedSubCategory === 'TC-OPCDR-R' ? 'ALL' : 'TC-OPCDR-R')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid var(--cyan-electric)',
            backgroundColor: selectedSubCategory === 'TC-OPCDR-R' ? '#F0F9FF' : '#FFFFFF',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="code-tag" style={{ color: '#0284C7' }}>TC-OPCDR-R</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rehab Return</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 8, color: 'var(--text-primary)' }}>
            {categoryStats['TC-OPCDR-R'].totalQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            10 Verification Items ({categoryStats['TC-OPCDR-R'].totalQty.toLocaleString()} Units)
          </div>
          <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 600, marginTop: 6 }}>
            Locator: USB-TC-OPCD--
          </div>
        </div>
      </div>

      {/* Serial Number Direct Traceability & Search Tool */}
      <div className="card" style={{ padding: '18px 20px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Search size={18} color="var(--slt-deep-blue)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Instant Serial Number Traceability (S/N)
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Look up any ONT, Router, or STB serial to view current location, assigned customer account, or return status.
        </p>

        <div style={{ display: 'flex', gap: 8, maxWidth: 600 }}>
          <input
            type="text"
            value={serialSearchQuery}
            onChange={(e) => setSerialSearchQuery(e.target.value)}
            placeholder="Type S/N (e.g. SLT-ONT-98205 or SLT-ONT-98200)..."
            className="input-field mono"
            style={{ fontWeight: 700 }}
          />
          {serialSearchQuery && (
            <button
              onClick={() => setSerialSearchQuery('')}
              className="btn btn-outline"
              style={{ minHeight: 44, padding: '0 12px' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Serial Lookup Result Card */}
        {serialLookupResult && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--slt-deep-blue)' }}>
                Serial: {serialLookupResult.searchedSerial}
              </div>
              {serialLookupResult.inStockItem ? (
                <span className="status-pill online">
                  <CheckCircle2 size={13} /> Currently in Stock ({serialLookupResult.inStockItem.subCategory})
                </span>
              ) : (
                <span className="status-pill queued">
                  Allocated / Deployed
                </span>
              )}
            </div>

            {serialLookupResult.inStockItem && (
              <div style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                <strong>Current Warehouse Location:</strong> {serialLookupResult.inStockItem.description} | Bin: {serialLookupResult.inStockItem.binLocation}
              </div>
            )}

            {/* Customer Ownership Traceability */}
            {serialLookupResult.customerIssuance && (
              <div 
                style={{
                  margin: '10px 0',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: serialLookupResult.customerIssuance.status === 'ACTIVE' ? '#F0FDF4' : '#FFF7ED',
                  border: `1px solid ${serialLookupResult.customerIssuance.status === 'ACTIVE' ? '#86EFAC' : '#FDBA74'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: serialLookupResult.customerIssuance.status === 'ACTIVE' ? '#15803D' : '#C2410C', textTransform: 'uppercase' }}>
                    Customer Ownership Record
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: serialLookupResult.customerIssuance.status === 'ACTIVE' ? '#DCFCE7' : '#FFEDD5',
                      color: serialLookupResult.customerIssuance.status === 'ACTIVE' ? '#15803D' : '#EA580C',
                    }}
                  >
                    {serialLookupResult.customerIssuance.status === 'ACTIVE' 
                      ? 'Currently Active with Customer' 
                      : `Returned on ${serialLookupResult.customerIssuance.returnDate || 'N/A'}`}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.82rem' }}>
                  <div>
                    <strong>Customer:</strong> {serialLookupResult.customerIssuance.customerName}
                  </div>
                  <div>
                    <strong>Account #:</strong> {serialLookupResult.customerIssuance.accountNo}
                  </div>
                  {serialLookupResult.customerIssuance.customerContact && (
                    <div>
                      <strong>Tel:</strong> {serialLookupResult.customerIssuance.customerContact}
                    </div>
                  )}
                  <div>
                    <strong>Issued Date:</strong> {serialLookupResult.customerIssuance.issueDate}
                  </div>
                  <div>
                    <strong>Issued By:</strong> {serialLookupResult.customerIssuance.issuedBy}
                  </div>
                  {serialLookupResult.customerIssuance.returnType && (
                    <div>
                      <strong>Returned To:</strong> {serialLookupResult.customerIssuance.returnType} ({serialLookupResult.customerIssuance.returnCondition || 'Good'})
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onNavigateTab('new_connection')}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '3px 10px', minHeight: 28, gap: 4 }}
                  >
                    <span>View in Customer Registry</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {serialLookupResult.history.length > 0 ? (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Ledger Trail ({serialLookupResult.history.length} events):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {serialLookupResult.history.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 4,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: 4,
                      }}
                    >
                      <span>
                        <strong>{tx.actionType}:</strong> Account #{tx.accountNo || 'N/A'} ({tx.customerName || 'N/A'})
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {tx.timestamp} by {tx.userName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No prior allocation events recorded for this serial number.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Catalog Table & Filters */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Live Stock Ledger Inventory
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Showing {filteredInventory.length} items across {selectedSubCategory === 'ALL' ? 'all sub-categories' : selectedSubCategory}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {/* Add New Product Button */}
            {onAddProduct && (
              <button
                type="button"
                onClick={() => onAddProduct(selectedSubCategory === 'ALL' ? 'TCOPNC' : selectedSubCategory)}
                className="btn btn-primary"
                style={{
                  minHeight: 38,
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  gap: 6,
                  backgroundColor: 'var(--mobitel-lime)',
                  borderColor: 'var(--mobitel-lime-dark)',
                }}
              >
                <Plus size={15} />
                <span>+ Add Product</span>
              </button>
            )}

            {/* Transfer Stock Button */}
            {onTransferProduct && (
              <button
                type="button"
                onClick={() => onTransferProduct()}
                className="btn btn-outline"
                style={{
                  minHeight: 38,
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  gap: 6,
                  color: 'var(--slt-deep-blue)',
                  borderColor: 'var(--slt-deep-blue)',
                }}
              >
                <ArrowRightLeft size={15} />
                <span>Transfer (Move Order)</span>
              </button>
            )}

            {/* Filter by Category */}
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value as any)}
              className="input-field"
              style={{ flex: '1 1 180px', minWidth: 0, minHeight: 38, fontSize: '0.8rem', fontWeight: 600 }}
            >
              <option value="ALL">All Categories (5)</option>
              <option value="TCOPNC">TCOPNC - Standard New Connection</option>
              <option value="TCOPNC-C">TC-OPNC-C - Collective Stock (Customer)</option>
              <option value="TCOPNC-R">TC-OPNC-R - Workshop Returns</option>
              <option value="TC-OPCDR">TC-OPCDR - Rehab Project Materials</option>
              <option value="TC-OPCDR-R">TC-OPCDR-R - Rehab Returned Materials</option>
            </select>

            {/* Keyword Search */}
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by SKU, description..."
                className="input-field"
                style={{ width: '100%', minHeight: 38, paddingLeft: 32, fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
              <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* Table Container for Desktop Screens (>= 768px) */}
        <div className="table-container desktop-inventory-table" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sub-Category</th>
                <th>Material SKU</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Stock Level</th>
                <th>Bin / Location</th>
                <th>Tracking</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const meta = SUB_CATEGORY_METADATA[item.subCategory];
                const isLow = item.minThreshold > 0 && item.quantity <= item.minThreshold;

                return (
                  <tr key={item.id}>
                    <td>
                      <span
                        className="code-tag"
                        style={{
                          backgroundColor: `${meta?.badgeColor}15`,
                          color: meta?.badgeColor || 'var(--slt-deep-blue)',
                          borderColor: `${meta?.badgeColor}40`,
                        }}
                      >
                        {item.subCategory}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {item.materialCode}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Updated: {item.lastUpdated}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: isLow ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                        {item.quantity} {item.unit}
                      </div>
                      {isLow && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--status-danger)', fontWeight: 700 }}>
                          Low Stock Alert
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="code-tag" style={{ fontSize: '0.75rem' }}>
                        {item.binLocation || 'BIN-01'}
                      </span>
                    </td>
                    <td>
                      {item.isSerialized ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--slt-deep-blue)',
                            backgroundColor: 'var(--slt-deep-blue-light)',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          S/N ({item.serialNumbers?.length || 0})
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Bulk Non-Serialized
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                        {onEditProduct && (
                          <button
                            type="button"
                            onClick={() => onEditProduct(item)}
                            className="btn btn-outline"
                            title="Edit Product"
                            style={{
                              minHeight: 28,
                              padding: '3px 7px',
                              fontSize: '0.72rem',
                              color: '#0056B3',
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {onTransferProduct && (
                          <button
                            type="button"
                            onClick={() => onTransferProduct(item)}
                            className="btn btn-outline"
                            title="Transfer via Move Order"
                            style={{
                              minHeight: 28,
                              padding: '3px 7px',
                              fontSize: '0.72rem',
                              color: '#0284C7',
                            }}
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                        )}
                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(item)}
                            className="btn btn-outline"
                            title="Delete Product"
                            style={{
                              minHeight: 28,
                              padding: '3px 7px',
                              fontSize: '0.72rem',
                              color: '#DC2626',
                              borderColor: '#FCA5A5',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (item.subCategory === 'TCOPNC') onNavigateTab('new_connection');
                            else if (item.subCategory === 'TC-OPCDR') onNavigateTab('rehab');
                            else if (item.subCategory === 'TCOPNC-C') onNavigateTab('collective');
                            else onNavigateTab('returns');
                          }}
                          className="btn btn-outline"
                          style={{
                            minHeight: 28,
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            gap: 3,
                          }}
                        >
                          <span>Transact</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Inventory Cards View (< 768px) */}
        <div className="mobile-inventory-cards">
          {filteredInventory.map((item) => {
            const meta = SUB_CATEGORY_METADATA[item.subCategory];
            const isLow = item.minThreshold > 0 && item.quantity <= item.minThreshold;

            return (
              <div key={`m-${item.id}`} className="mobile-item-card">
                <div className="mobile-item-header">
                  <span
                    className="code-tag"
                    style={{
                      backgroundColor: `${meta?.badgeColor}15`,
                      color: meta?.badgeColor || 'var(--slt-deep-blue)',
                      borderColor: `${meta?.badgeColor}40`,
                    }}
                  >
                    {item.subCategory}
                  </span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--slt-deep-blue)' }}>
                    {item.materialCode}
                  </strong>
                  <span className="code-tag" style={{ fontSize: '0.7rem' }}>
                    {item.binLocation || 'BIN-01'}
                  </span>
                </div>

                <div className="mobile-item-body">
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Updated: {item.lastUpdated}
                  </div>
                </div>

                <div className="mobile-item-stats">
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Stock On Hand</span>
                    <strong style={{ fontSize: '1.15rem', color: isLow ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                      {item.quantity.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.unit}</span>
                    </strong>
                    {isLow && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--status-danger)', fontWeight: 700, display: 'block' }}>
                        ⚠️ Low Stock Alert
                      </span>
                    )}
                  </div>

                  <div>
                    {item.isSerialized ? (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--slt-deep-blue)',
                          backgroundColor: 'var(--slt-deep-blue-light)',
                          padding: '3px 8px',
                          borderRadius: 4,
                        }}
                      >
                        S/N ({item.serialNumbers?.length || 0})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Bulk Non-Serialized
                      </span>
                    )}
                  </div>
                </div>

                <div className="mobile-item-actions">
                  {onEditProduct && (
                    <button
                      type="button"
                      onClick={() => onEditProduct(item)}
                      className="btn btn-outline"
                      style={{ minHeight: 30, padding: '3px 8px', fontSize: '0.75rem', gap: 4 }}
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                  {onTransferProduct && (
                    <button
                      type="button"
                      onClick={() => onTransferProduct(item)}
                      className="btn btn-outline"
                      style={{ minHeight: 30, padding: '3px 8px', fontSize: '0.75rem', gap: 4, color: '#0284C7' }}
                    >
                      <ArrowRightLeft size={12} />
                      <span>Transfer</span>
                    </button>
                  )}
                  {onDeleteProduct && (
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(item)}
                      className="btn btn-outline"
                      style={{ minHeight: 30, padding: '3px 8px', fontSize: '0.75rem', gap: 4, color: '#DC2626', borderColor: '#FCA5A5' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (item.subCategory === 'TCOPNC') onNavigateTab('new_connection');
                      else if (item.subCategory === 'TC-OPCDR') onNavigateTab('rehab');
                      else if (item.subCategory === 'TCOPNC-C') onNavigateTab('collective');
                      else onNavigateTab('returns');
                    }}
                    className="btn btn-primary"
                    style={{ minHeight: 30, padding: '3px 10px', fontSize: '0.75rem', gap: 3 }}
                  >
                    <span>Transact</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <button
          onClick={() => onNavigateTab('dispatch')}
          className="card"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderTop: '3px solid var(--slt-deep-blue)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, backgroundColor: 'var(--slt-deep-blue-light)', color: 'var(--slt-deep-blue)' }}>
              <Package size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Inbound Dispatch Parser</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Section 4 PRD Logic</div>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Parse standardized Main Branch batch tags (e.g. <code>TC-01-REH...</code>) to increment stock (+).
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('new_connection')}
          className="card"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderTop: '3px solid var(--mobitel-lime)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, backgroundColor: 'var(--mobitel-lime-light)', color: 'var(--mobitel-lime-dark)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>TC-OPNC: New Connections</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Brand New Stock Allocation</div>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Scan device serials (ONT, Router, STB) and bind to Customer Account number (-1).
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('collective')}
          className="card"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderTop: '3px solid #7E22CE',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, backgroundColor: '#FAF5FF', color: '#7E22CE' }}>
              <Layers size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>TC-OPNC-C: Customer Collect</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Direct Customer Recovery (+)</div>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Directly collect and credit stock (+) from customer premises (churn, cancellations, fault swaps).
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('returns')}
          className="card"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderTop: '3px solid #EA580C',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, backgroundColor: '#FFF7ED', color: '#EA580C' }}>
              <RotateCcw size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>TC-OPNC-R: Workshop Returns</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Central Repair Workshop (+)</div>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Stock increase (+) for units returned from Central Workshop / Repair Center post-repair.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('rehab')}
          className="card"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderTop: '3px solid var(--cyan-electric)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, backgroundColor: 'var(--cyan-electric-light)', color: '#0284C7' }}>
              <Cable size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>TC-OPCDR: Rehabilitation</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Project Work Order & Recoveries</div>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Deduct bulk cables & fittings tied to Work Order # (WO#), and credit rehab scrap/recoveries.
          </p>
        </button>
      </div>
    </div>
  );
};
