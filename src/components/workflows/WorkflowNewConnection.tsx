import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Hash, 
  Box, 
  Sparkles, 
  Search, 
  Download, 
  Printer, 
  Edit2, 
  Layers, 
  Send,
  PackageCheck,
  ShieldCheck,
  Cpu,
  Calendar,
  Phone,
  RotateCcw,
  Users,
  Filter,
  ArrowRight,
  Clock,
  Plus,
  Trash2,
  ArrowRightLeft,
  Scan,
} from 'lucide-react';
import { InventoryItem, UserPersona, CustomerIssuance, SubCategoryCode, OpenScannerFn } from '../../types/inventory';
import { storageService } from '../../services/storage';
import { CustomerReturnModal } from './CustomerReturnModal';
import { DuplicateWarningModal } from '../alerts/DuplicateWarningModal';
import { extractSerialNumber, findEquipmentByBarcode } from '../../utils/barcodeParser';
import confetti from 'canvas-confetti';
import { SearchableSelect } from '../common/SearchableSelect';

interface WorkflowNewConnectionProps {
  inventory: InventoryItem[];
  activeUser: UserPersona;
  onSuccess: (message: string) => void;
  onOpenScanner: OpenScannerFn;
  prefilledSerial?: string;
  onClearPrefill?: () => void;
  onAddProduct?: (category?: SubCategoryCode) => void;
  onEditProduct?: (item: InventoryItem) => void;
  onDeleteProduct?: (item: InventoryItem) => void;
  onTransferProduct?: (item?: InventoryItem) => void;
}

export const WorkflowNewConnection: React.FC<WorkflowNewConnectionProps> = ({
  inventory,
  activeUser,
  onSuccess,
  onOpenScanner,
  prefilledSerial,
  onClearPrefill,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onTransferProduct,
}) => {
  // Only items in TCOPNC
  const ncItems = useMemo(
    () => inventory.filter((item) => item.subCategory === 'TCOPNC'),
    [inventory]
  );
  const serializedItems = useMemo(
    () => ncItems.filter((item) => item.isSerialized && (item.serialNumbers?.length ?? 0) > 0),
    [ncItems]
  );

  const [activeTab, setActiveTab] = useState<'SHEET' | 'ALLOCATE' | 'TRACKER'>('SHEET');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SERIALIZED' | 'BULK'>('ALL');

  // Customer issuances tracking state
  const [customerIssuances, setCustomerIssuances] = useState<CustomerIssuance[]>(() => 
    storageService.getCustomerIssuances()
  );

  const refreshIssuances = () => {
    setCustomerIssuances(storageService.getCustomerIssuances());
  };

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState<boolean>(false);
  const [selectedIssuanceForReturn, setSelectedIssuanceForReturn] = useState<CustomerIssuance | null>(null);

  // Allocation Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    serializedItems[0]?.id || ncItems[0]?.id || ''
  );
  const [serialNumber, setSerialNumber] = useState<string>(prefilledSerial || '');
  const [issueQuantity, setIssueQuantity] = useState<number>(1);
  const [issueDate, setIssueDate] = useState<string>(todayStr);
  const [accountNo, setAccountNo] = useState<string>('0112789456');
  const [customerName, setCustomerName] = useState<string>('R. M. Bandara');
  const [customerContact, setCustomerContact] = useState<string>('0714589210');
  const [installationNotes, setInstallationNotes] = useState<string>(
    'Fiber ONT drop cable spliced, ONU registered to OLT Port 3/1.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    type: 'SERIAL' | 'ACCOUNT' | 'BOTH';
    value: string;
    existingRecord: CustomerIssuance;
  } | null>(null);

  // Tracker Filters
  const [trackerSearch, setTrackerSearch] = useState<string>('');
  const [trackerStatusFilter, setTrackerStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RETURNED_DIRECT' | 'RETURNED_WORKSHOP'>('ALL');
  const [trackerDateFilter, setTrackerDateFilter] = useState<'ALL' | 'TODAY' | 'CUSTOM'>('ALL');
  const [trackerCustomDate, setTrackerCustomDate] = useState<string>(todayStr);

  // Quick edit modal state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editOnHand, setEditOnHand] = useState<number>(0);
  const [editInbound, setEditInbound] = useState<number>(0);
  const [editReceiving, setEditReceiving] = useState<number>(0);

  const formSectionRef = useRef<HTMLDivElement>(null);

  // Synchronize prefilledSerial if passed (Universal Auto-Identification)
  useEffect(() => {
    if (prefilledSerial) {
      const clean = extractSerialNumber(prefilledSerial);
      setSerialNumber(clean);
      setActiveTab('ALLOCATE');
      // Auto-find matching equipment across ALL models and categories
      const match = findEquipmentByBarcode(clean, inventory);
      if (match.item) {
        setSelectedItemId(match.item.id);
      }
    }
  }, [prefilledSerial, inventory]);

  const selectedItem = inventory.find((i) => i.id === selectedItemId);

  const filteredItems = useMemo(() => {
    return ncItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.materialCode.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      let matchType = true;
      if (typeFilter === 'SERIALIZED') matchType = item.isSerialized;
      if (typeFilter === 'BULK') matchType = !item.isSerialized;

      return matchQuery && matchType;
    });
  }, [ncItems, searchQuery, typeFilter]);

  const totalOnHand = useMemo(
    () => ncItems.reduce((sum, i) => sum + i.quantity, 0),
    [ncItems]
  );
  const totalSerializedUnits = useMemo(
    () => serializedItems.reduce((sum, i) => sum + i.quantity, 0),
    [serializedItems]
  );

  // Filtered customer issuances for tracker tab
  const filteredIssuances = useMemo(() => {
    return customerIssuances.filter((iss) => {
      const q = trackerSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        (iss.serialNumber && iss.serialNumber.toLowerCase().includes(q)) ||
        iss.customerName.toLowerCase().includes(q) ||
        iss.accountNo.toLowerCase().includes(q) ||
        iss.materialCode.toLowerCase().includes(q) ||
        iss.materialDescription.toLowerCase().includes(q);

      let matchStatus = true;
      if (trackerStatusFilter !== 'ALL') {
        matchStatus = iss.status === trackerStatusFilter;
      }

      let matchDate = true;
      if (trackerDateFilter === 'TODAY') {
        matchDate = iss.issueDate === todayStr;
      } else if (trackerDateFilter === 'CUSTOM') {
        matchDate = iss.issueDate === trackerCustomDate;
      }

      return matchQuery && matchStatus && matchDate;
    });
  }, [customerIssuances, trackerSearch, trackerStatusFilter, trackerDateFilter, trackerCustomDate, todayStr]);

  const activeIssuancesCount = useMemo(
    () => customerIssuances.filter((i) => i.status === 'ACTIVE').length,
    [customerIssuances]
  );

  const returnedIssuancesCount = useMemo(
    () => customerIssuances.filter((i) => i.status !== 'ACTIVE').length,
    [customerIssuances]
  );

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditOnHand(item.quantity);
    setEditInbound(item.inbound || 0);
    setEditReceiving(item.receiving || 0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    storageService.updateItemStockStages(editingItem.id, {
      quantity: editOnHand,
      inbound: editInbound,
      receiving: editReceiving,
    });

    onSuccess(
      `Updated stock stages for ${editingItem.materialCode}: On-hand: ${editOnHand} ${editingItem.unit}, Inbound: ${editInbound}`
    );
    setEditingItem(null);
  };

  const handleSelectForAllocation = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setActiveTab('ALLOCATE');
    setValidationError(null);
    if (item.isSerialized && item.serialNumbers && item.serialNumbers.length > 0) {
      setSerialNumber(item.serialNumbers[0]);
    } else {
      setSerialNumber('');
    }
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleExportCSV = () => {
    const headers = ['Item', 'Item Description', 'Primary', 'On-hand'];
    const rows = ncItems.map((i) => [
      `"${i.materialCode}"`,
      `"${i.description}"`,
      `"${i.unit}"`,
      i.quantity,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TC_OPNC_Dostocks_Sheet_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportIssuancesCSV = () => {
    const headers = ['Issue Date', 'Serial Number', 'Material Code', 'Description', 'Quantity', 'Account #', 'Customer Name', 'Contact', 'Status', 'Issued By', 'Return Date', 'Return Type'];
    const rows = customerIssuances.map((i) => [
      `"${i.issueDate}"`,
      `"${i.serialNumber || 'N/A Bulk'}"`,
      `"${i.materialCode}"`,
      `"${i.materialDescription}"`,
      i.quantity,
      `"${i.accountNo}"`,
      `"${i.customerName}"`,
      `"${i.customerContact || ''}"`,
      `"${i.status}"`,
      `"${i.issuedBy}"`,
      `"${i.returnDate || ''}"`,
      `"${i.returnType || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SLT_Customer_Device_Registry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeAllocation = (forceBypass: boolean = false) => {
    if (!selectedItem) return;
    const trimmedSerial = serialNumber.trim();
    const hasSerial = Boolean(trimmedSerial);

    setIsSubmitting(true);
    try {
      const result = storageService.executeTransaction({
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: 'DEVICE_ALLOCATION',
        mainCategory: 'New Connection',
        subCategory: 'TCOPNC',
        materialCode: selectedItem.materialCode,
        materialDescription: selectedItem.description,
        quantityDelta: -issueQuantity,
        unit: selectedItem.unit,
        serialNumber: hasSerial ? trimmedSerial : undefined,
        accountNo: accountNo.trim(),
        customerName: customerName.trim(),
        entryDate: issueDate,
        notes: `${installationNotes.trim() || ''}${forceBypass ? ' [Admin Duplicate Bypass]' : ''}`.trim() || undefined,
      });

      // Save Customer Issuance Record
      const newIssuance: CustomerIssuance = {
        id: `ISS-${Date.now()}`,
        issueDate: issueDate,
        timestamp: `${issueDate} ${new Date().toTimeString().slice(0, 8)}`,
        materialCode: selectedItem.materialCode,
        materialDescription: selectedItem.description,
        serialNumber: hasSerial ? trimmedSerial : undefined,
        isSerialized: selectedItem.isSerialized,
        quantity: issueQuantity,
        unit: selectedItem.unit,
        accountNo: accountNo.trim(),
        customerName: customerName.trim(),
        customerContact: customerContact.trim() || undefined,
        issuedBy: activeUser.name,
        notes: `${installationNotes.trim() || ''}${forceBypass ? ' [Authorized Duplicate Override]' : ''}`.trim() || undefined,
        status: 'ACTIVE',
      };
      storageService.addCustomerIssuance(newIssuance);
      refreshIssuances();

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#0056B3', '#43B02A', '#0099FF'],
        });
      } catch {
        // Fallback
      }

      const syncMsg = result.isQueuedOffline
        ? 'Allocated & Cached Offline (Will sync when connectivity restores)'
        : 'Allocated & Deducted from TC-OPNC stock date-wise!';

      onSuccess(
        `Equipment ${hasSerial ? `(S/N: ${trimmedSerial})` : selectedItem.materialCode} successfully issued to ${customerName} (A/C: ${accountNo}) on ${issueDate}. ${syncMsg}`
      );

      // Reset form
      setSerialNumber('');
      if (onClearPrefill) onClearPrefill();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedItem) {
      setValidationError('Please select an equipment item.');
      return;
    }

    if (!issueDate) {
      setValidationError('Please select the date of issuance.');
      return;
    }

    if (issueQuantity <= 0) {
      setValidationError('Issuance quantity must be at least 1.');
      return;
    }

    if (!accountNo.trim()) {
      setValidationError('SLT Customer Account Number is required (e.g. 0112xxxxxx).');
      return;
    }

    if (!customerName.trim()) {
      setValidationError('Customer Name is required.');
      return;
    }

    const trimmedSerial = serialNumber.trim();
    const hasSerial = Boolean(trimmedSerial);

    // Duplicate Check against existing customer issuances
    const issuances = storageService.getCustomerIssuances();
    const cleanSerial = trimmedSerial.toLowerCase();
    const cleanAcc = accountNo.trim().toLowerCase();

    let matchedRecord: CustomerIssuance | undefined;
    let dupSerial = false;
    let dupAcc = false;

    if (hasSerial) {
      matchedRecord = issuances.find(
        (i) => i.serialNumber && i.serialNumber.trim().toLowerCase() === cleanSerial
      );
      if (matchedRecord) dupSerial = true;
    }

    if (!matchedRecord && cleanAcc) {
      matchedRecord = issuances.find(
        (i) => i.accountNo && i.accountNo.trim().toLowerCase() === cleanAcc
      );
      if (matchedRecord) dupAcc = true;
    } else if (matchedRecord && cleanAcc) {
      if (matchedRecord.accountNo && matchedRecord.accountNo.trim().toLowerCase() === cleanAcc) {
        dupAcc = true;
      }
    }

    if (matchedRecord) {
      const type: 'SERIAL' | 'ACCOUNT' | 'BOTH' =
        dupSerial && dupAcc ? 'BOTH' : dupSerial ? 'SERIAL' : 'ACCOUNT';
      const value = dupSerial ? trimmedSerial : accountNo.trim();

      // Log high-priority system alert for Admin Mr. Kanishka
      storageService.addSystemAlert({
        type: dupSerial ? 'DUPLICATE_SERIAL' : 'DUPLICATE_CUSTOMER',
        severity: 'CRITICAL',
        userId: activeUser.id,
        userName: activeUser.name,
        serialNumber: hasSerial ? trimmedSerial : undefined,
        accountNo: accountNo.trim(),
        customerName: customerName.trim(),
        materialCode: selectedItem.materialCode,
        existingRecord: {
          id: matchedRecord.id,
          accountNo: matchedRecord.accountNo,
          customerName: matchedRecord.customerName,
          customerContact: matchedRecord.customerContact,
          serialNumber: matchedRecord.serialNumber,
          materialCode: matchedRecord.materialCode,
          materialDescription: matchedRecord.materialDescription,
          issueDate: matchedRecord.issueDate,
          issuedBy: matchedRecord.issuedBy,
          status: matchedRecord.status,
        },
      });

      // Pop duplicate modal with existing customer details
      setDuplicateWarning({
        isOpen: true,
        type,
        value,
        existingRecord: matchedRecord,
      });
      return;
    }

    // No duplicate found, proceed normally
    executeAllocation(false);
  };

  const handleOpenReturnModal = (issuance: CustomerIssuance) => {
    setSelectedIssuanceForReturn(issuance);
    setReturnModalOpen(true);
  };

  const handleReturnSuccess = (msg: string) => {
    refreshIssuances();
    onSuccess(msg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Official Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #002D5E 0%, #0056B3 100%)',
          color: '#FFFFFF',
          padding: '22px 24px',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  backgroundColor: 'var(--mobitel-lime)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.5px',
                }}
              >
                SLT-MOBITEL
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                Category: TC-OPNC
              </span>
              <span
                style={{
                  backgroundColor: '#0099FF',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                Workflow A: New Connection
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
              Standard New Connection &amp; Customer Issuance Tracker
            </h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: '4px 0 0', maxWidth: 680 }}>
              Master inventory verification for 56 prime SKUs (26,419.1 units), date-wise device issuance to customer accounts, and end-to-end serial ownership traceability.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              onClick={handleExportCSV}
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '8px 14px',
                minHeight: 40,
                fontSize: '0.85rem',
              }}
            >
              <Download size={16} />
              <span>Export Sheet CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '8px 14px',
                minHeight: 40,
                fontSize: '0.85rem',
              }}
            >
              <Printer size={16} />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--slt-deep-blue)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Verified SKUs</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slt-deep-blue)', marginTop: 4 }}>
            {ncItems.length} Lines
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered in TC-OPNC</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total On-Hand Stock</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--status-success)', marginTop: 4 }}>
            {totalOnHand.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Units, Spools &amp; Accessories</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #0284C7' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active with Customers</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {activeIssuancesCount} Active
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{returnedIssuancesCount} Returned / Recovered</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #7C3AED' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Serialized Devices</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7C3AED', marginTop: 4 }}>
            {totalSerializedUnits} In Depot
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ONTs, Routers, STBs &amp; Phones</div>
        </div>
      </div>

      {/* Tab Switcher - 3 Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: 4,
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('SHEET')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            border: 'none',
            background: activeTab === 'SHEET' ? '#0056B3' : 'transparent',
            color: activeTab === 'SHEET' ? '#FFFFFF' : 'var(--text-secondary)',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          <Layers size={16} />
          <span>TC-OPNC Master Stock (56 Items)</span>
        </button>

        <button
          onClick={() => setActiveTab('ALLOCATE')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            border: 'none',
            background: activeTab === 'ALLOCATE' ? '#0056B3' : 'transparent',
            color: activeTab === 'ALLOCATE' ? '#FFFFFF' : 'var(--text-secondary)',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          <PackageCheck size={16} />
          <span>Issue New Connection</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('TRACKER');
            refreshIssuances();
          }}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            border: 'none',
            background: activeTab === 'TRACKER' ? '#0056B3' : 'transparent',
            color: activeTab === 'TRACKER' ? '#FFFFFF' : 'var(--text-secondary)',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={16} />
          <span>Customer Allocations &amp; Serial Tracker ({customerIssuances.length})</span>
        </button>
      </div>

      {/* VIEW 1: TC-OPNC Master Stock Table */}
      {activeTab === 'SHEET' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    backgroundColor: 'var(--slt-deep-blue)',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}
                >
                  TC-OPNC
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                  Official Stock Verification Sheet (56 Items)
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Displaying {filteredItems.length} of {ncItems.length} items. Click &ldquo;Issue&rdquo; to bind to a customer connection.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {/* Add New Product Button */}
              {onAddProduct && (
                <button
                  onClick={() => onAddProduct('TCOPNC')}
                  className="btn btn-primary"
                  style={{ minHeight: 38, fontSize: '0.8rem', padding: '0 12px', gap: 6 }}
                  title="Add new product under TC-OPNC"
                >
                  <Plus size={15} />
                  <span>+ Add Product</span>
                </button>
              )}

              {/* Transfer (Move Order) Button */}
              {onTransferProduct && (
                <button
                  onClick={() => onTransferProduct()}
                  className="btn btn-secondary"
                  style={{ minHeight: 38, fontSize: '0.8rem', padding: '0 12px', gap: 6 }}
                  title="Inter-Branch or Inter-District Transfer (Move Order)"
                >
                  <ArrowRightLeft size={15} />
                  <span>Transfer (Move Order)</span>
                </button>
              )}

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="input-field"
                style={{ width: 'auto', minHeight: 38, fontSize: '0.8rem', fontWeight: 600 }}
              >
                <option value="ALL">All Items (56)</option>
                <option value="SERIALIZED">Serialized Only (ONTs/Routers/Phones)</option>
                <option value="BULK">Bulk / Hardware Only</option>
              </select>

              {/* Keyword Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search SKU or description..."
                  className="input-field"
                  style={{ width: 240, minHeight: 38, paddingLeft: 32, fontSize: '0.8rem' }}
                />
                <Search
                  size={15}
                  style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: 600, overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ backgroundColor: '#E2E8F0' }}>
                  <th style={{ width: 36, textAlign: 'center' }}>#</th>
                  <th style={{ width: 150 }}>Item Code</th>
                  <th>Item Description</th>
                  <th style={{ width: 90, textAlign: 'center' }}>Primary</th>
                  <th style={{ width: 110, textAlign: 'center' }}>On-hand</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Tracking</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#0056B3' }}>
                        {item.materialCode}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {item.description}
                      </div>
                      {item.isSerialized && item.serialNumbers && item.serialNumbers.length > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          S/N Sample: {item.serialNumbers[0]} {item.serialNumbers.length > 1 ? `(+${item.serialNumbers.length - 1} more)` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: 3,
                          backgroundColor: '#F1F5F9',
                        }}
                      >
                        {item.unit}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: item.quantity > 0 ? '#DCFCE7' : '#FEE2E2',
                          color: item.quantity > 0 ? '#15803D' : '#B91C1C',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          minWidth: 38,
                        }}
                      >
                        {item.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.isSerialized ? (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: '#EFF6FF',
                            color: '#1E40AF',
                          }}
                        >
                          SERIALIZED
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: '#F1F5F9',
                            color: 'var(--text-muted)',
                          }}
                        >
                          BULK OSP
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleSelectForAllocation(item)}
                          className="btn btn-primary"
                          style={{
                            minHeight: 28,
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            gap: 4,
                          }}
                          title={`Issue ${item.materialCode}`}
                        >
                          <Send size={11} />
                          <span>Issue</span>
                        </button>

                        {onTransferProduct && (
                          <button
                            onClick={() => onTransferProduct(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                              color: 'var(--slt-deep-blue)',
                            }}
                            title={`Move Order Transfer for ${item.materialCode}`}
                          >
                            <ArrowRightLeft size={11} />
                          </button>
                        )}

                        {onEditProduct ? (
                          <button
                            onClick={() => onEditProduct(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                            }}
                            title={`Edit product ${item.materialCode}`}
                          >
                            <Edit2 size={11} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                            }}
                            title="Update On-hand or Inbound stage"
                          >
                            <Edit2 size={11} />
                          </button>
                        )}

                        {onDeleteProduct && (
                          <button
                            onClick={() => onDeleteProduct(item)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              gap: 4,
                              color: 'var(--slt-crimson)',
                            }}
                            title={`Delete product ${item.materialCode}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Issue New Connection Form */}
      <div ref={formSectionRef} className="card" style={{ display: activeTab === 'ALLOCATE' ? 'block' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span
                style={{
                  backgroundColor: 'var(--mobitel-lime)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 3,
                }}
              >
                WORKFLOW A
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Issue Equipment for New Connection
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Select stock item &rarr; scan/enter serial number (optional) &rarr; customer details &rarr; select issuance date.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('SHEET')}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 36 }}
          >
            &larr; Back to TC-OPNC Sheet
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {validationError && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: 'var(--radius-md)',
                color: '#991B1B',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={18} />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Select Stock Item */}
          <div className="input-group">
            <label className="input-label">
              <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}>Step 1: Select Stock Equipment / SKU</span>
              <span style={{ color: 'var(--slt-deep-blue)', fontWeight: 700 }}>
                {selectedItem ? `Category: ${selectedItem.subCategory} • Stock: ${selectedItem.quantity} ${selectedItem.unit}` : `TC-OPNC (${ncItems.length} SKUs)`}
              </span>
            </label>
            <SearchableSelect
              value={selectedItemId}
              onChange={(val) => {
                setSelectedItemId(val);
                const itm = inventory.find((i) => i.id === val);
                if (itm?.isSerialized && itm.serialNumbers && itm.serialNumbers.length > 0) {
                  setSerialNumber(itm.serialNumbers[0]);
                } else {
                  setSerialNumber('');
                }
              }}
              placeholder="Search or select equipment / SKU to issue..."
              searchPlaceholder="Type SKU code, description, router, fiber, or serial..."
              options={inventory.map((item) => ({
                value: item.id,
                label: item.materialCode,
                subLabel: item.description,
                group: item.subCategory,
                badge: `${item.quantity} ${item.unit}${item.isSerialized ? ' • SERIALIZED' : ''}`,
                badgeColor: item.quantity > 0 ? '#15803D' : '#DC2626',
              }))}
            />
          </div>

          {/* STEP 2: Serial Number (OPTIONAL) */}
          <div className="input-group">
            <label className="input-label">
              <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}>Step 2: Device Serial Number (S/N)</span>
              <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.78rem' }}>
                Scan ANY barcode to extract S/N • All equipment &amp; models supported
              </span>
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Scan or enter S/N (e.g. SLT-ONT-TD64-A01, 4857..., or leave empty)"
                className="input-field mono"
                style={{ fontWeight: 700 }}
              />
              <button
                type="button"
                onClick={() =>
                  onOpenScanner(
                    'Scan Any Barcode to Extract Serial Number',
                    (scanned, allScanned) => {
                      const clean = extractSerialNumber(scanned);
                      setSerialNumber(clean);
                      if (allScanned && allScanned.length > 1) {
                        setIssueQuantity(allScanned.length);
                      }
                      const match = findEquipmentByBarcode(clean, inventory);
                      if (match.item) {
                        setSelectedItemId(match.item.id);
                      }
                    }
                  )
                }
                className="btn btn-outline"
                style={{ padding: '0 12px', minHeight: 48 }}
                title="Scan Device Barcode to extract Serial Number"
              >
                <QrCode size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <button
                type="button"
                onClick={() =>
                  onOpenScanner(
                    'Batch Scan All Barcodes into Allocation',
                    (lastScanned, allScanned) => {
                      if (allScanned && allScanned.length > 0) {
                        setSerialNumber(allScanned[0]);
                        setIssueQuantity(allScanned.length);
                        const match = findEquipmentByBarcode(allScanned[0], inventory);
                        if (match.item) {
                          setSelectedItemId(match.item.id);
                        }
                      }
                    },
                    true
                  )
                }
                className="btn btn-outline"
                style={{
                  fontSize: '0.74rem',
                  padding: '3px 8px',
                  height: 26,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderColor: '#CBD5E1',
                }}
              >
                <Scan size={13} color="var(--slt-deep-blue)" />
                <span>Continuous Multi-Device Barcode Scanner</span>
              </button>
            </div>

            {/* Quick-pick serial pills if serialized */}
            {selectedItem?.serialNumbers && selectedItem.serialNumbers.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Available in-stock serial numbers (click to select):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 80, overflowY: 'auto' }}>
                  {selectedItem.serialNumbers.slice(0, 10).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSerialNumber(s)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        border: serialNumber === s ? '1px solid #0056B3' : '1px solid var(--border-color)',
                        backgroundColor: serialNumber === s ? '#EFF6FF' : '#FFFFFF',
                        color: serialNumber === s ? '#0056B3' : 'var(--text-primary)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 3 & 4: Customer Details, Quantity, and DATE SELECTION */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {/* Issuance Date (DATE-WISE ENTRY) */}
            <div className="input-group">
              <label className="input-label">
                <span style={{ fontWeight: 800, color: 'var(--slt-deep-blue)' }}>Step 3: Issuance Date (Date-wise)</span>
                <span style={{ color: 'var(--status-danger)' }}>* Required</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: 36, fontWeight: 700 }}
                  required
                />
                <Calendar
                  size={16}
                  style={{ position: 'absolute', left: 12, top: 16, color: '#64748B' }}
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="input-group">
              <label className="input-label">
                <span>Quantity To Issue</span>
                <span style={{ color: 'var(--text-secondary)' }}>({selectedItem?.unit || 'UNITS'})</span>
              </label>
              <input
                type="number"
                min={1}
                max={selectedItem?.quantity || 9999}
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(Math.max(1, Number(e.target.value)))}
                className="input-field mono"
                style={{ fontWeight: 700 }}
                required
              />
            </div>
          </div>

          {/* Customer Account #, Name & Contact */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <div className="input-group">
              <label className="input-label">
                <span>SLT Customer Account #</span>
                <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
              </label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="e.g. 0112789456"
                className="input-field mono"
                style={{ fontWeight: 700 }}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span>Customer Full Name</span>
                <span style={{ color: 'var(--status-danger)' }}>* Mandatory</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. R. M. Bandara"
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span>Contact Phone / Mobile</span>
                <span style={{ color: 'var(--text-secondary)' }}>Optional</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="e.g. 0714589210"
                  className="input-field"
                  style={{ paddingLeft: 34 }}
                />
                <Phone
                  size={15}
                  style={{ position: 'absolute', left: 10, top: 16, color: '#64748B' }}
                />
              </div>
            </div>
          </div>

          {/* Installation Remarks */}
          <div className="input-group">
            <label className="input-label">Installation Execution Remarks</label>
            <input
              type="text"
              value={installationNotes}
              onChange={(e) => setInstallationNotes(e.target.value)}
              placeholder="e.g. Fiber ONT drop cable spliced, ONU registered to OLT Port 3/1."
              className="input-field"
            />
          </div>

          {/* Submit */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 16,
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                Technician / Operator: <strong>{activeUser.name}</strong>
              </span>
              <span>
                Date: <strong>{issueDate}</strong> | Stock Deduction: <strong style={{ color: 'var(--status-danger)' }}>-{issueQuantity} {selectedItem?.unit}</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                minHeight: 52,
                fontSize: '1.05rem',
                fontWeight: 800,
                gap: 10,
              }}
            >
              <CheckCircle2 size={22} />
              <span>
                {isSubmitting
                  ? 'Allocating Equipment...'
                  : `Assign Equipment & Post on ${issueDate}`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* VIEW 3: Customer Allocations & Serial Tracker */}
      {activeTab === 'TRACKER' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header & Filter Bar */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="#0056B3" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Customer Equipment Registry &amp; Serial Traceability
                  </h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Track which customer is using each serial number, issuance dates, and process direct returns or workshop recoveries.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleExportIssuancesCSV}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 36, gap: 6 }}
                >
                  <Download size={14} />
                  <span>Export Registry CSV</span>
                </button>
                <button
                  onClick={() => setActiveTab('ALLOCATE')}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 36, gap: 6 }}
                >
                  <PackageCheck size={14} />
                  <span>+ New Connection</span>
                </button>
              </div>
            </div>

            {/* Live Filter Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {/* Search by serial / customer / account */}
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <input
                  type="text"
                  value={trackerSearch}
                  onChange={(e) => setTrackerSearch(e.target.value)}
                  placeholder="Search Serial Number, Customer Name, or A/C#..."
                  className="input-field"
                  style={{ paddingLeft: 34, minHeight: 38, fontSize: '0.82rem' }}
                />
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 10, top: 11, color: '#64748B' }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={trackerStatusFilter}
                onChange={(e) => setTrackerStatusFilter(e.target.value as any)}
                className="input-field"
                style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="ALL">All Statuses ({customerIssuances.length})</option>
                <option value="ACTIVE">🟢 Active with Customer ({activeIssuancesCount})</option>
                <option value="RETURNED_DIRECT">🟠 Returned Direct (TC-OPNC-R)</option>
                <option value="RETURNED_WORKSHOP">🟣 Workshop Return (TC-OPNC-C)</option>
              </select>

              {/* Date Filter */}
              <select
                value={trackerDateFilter}
                onChange={(e) => setTrackerDateFilter(e.target.value as any)}
                className="input-field"
                style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Issued Today ({todayStr})</option>
                <option value="CUSTOM">Specific Date...</option>
              </select>

              {trackerDateFilter === 'CUSTOM' && (
                <input
                  type="date"
                  value={trackerCustomDate}
                  onChange={(e) => setTrackerCustomDate(e.target.value)}
                  className="input-field"
                  style={{ width: 'auto', minHeight: 38, fontSize: '0.82rem', fontWeight: 600 }}
                />
              )}
            </div>
          </div>

          {/* Registry Table */}
          <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: 600, overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ backgroundColor: '#E2E8F0' }}>
                  <th style={{ width: 100 }}>Issue Date</th>
                  <th style={{ width: 170 }}>Serial Number (S/N)</th>
                  <th>Equipment Description</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Qty</th>
                  <th>Customer Information</th>
                  <th style={{ width: 130 }}>Issued By</th>
                  <th style={{ width: 150, textAlign: 'center' }}>Status</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssuances.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>No customer issuance records found.</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                        Try clearing your search or status filters.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIssuances.map((iss) => (
                    <tr key={iss.id}>
                      <td style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>
                        {iss.issueDate}
                      </td>
                      <td>
                        {iss.serialNumber ? (
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 4,
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.82rem',
                            }}
                          >
                            {iss.serialNumber}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                            Non-serialized Bulk
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                          {iss.materialDescription}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                          {iss.materialCode}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                        {iss.quantity} {iss.unit}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0056B3' }}>
                          {iss.customerName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                          A/C: {iss.accountNo}
                        </div>
                        {iss.customerContact && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            Tel: {iss.customerContact}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {iss.issuedBy}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {iss.status === 'ACTIVE' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#15803D' }} />
                            Active with Customer
                          </span>
                        )}
                        {iss.status === 'RETURNED_DIRECT' && (
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#FFF7ED',
                                color: '#EA580C',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                              }}
                            >
                              Returned Direct (TC-OPNC-R)
                            </span>
                            {iss.returnDate && (
                              <div style={{ fontSize: '0.68rem', color: '#9A3412', marginTop: 2 }}>
                                On {iss.returnDate}
                              </div>
                            )}
                          </div>
                        )}
                        {iss.status === 'RETURNED_WORKSHOP' && (
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#FAF5FF',
                                color: '#7E22CE',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                              }}
                            >
                              Workshop Return (TC-OPNC-C)
                            </span>
                            {iss.returnDate && (
                              <div style={{ fontSize: '0.68rem', color: '#581C87', marginTop: 2 }}>
                                On {iss.returnDate}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {iss.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleOpenReturnModal(iss)}
                            className="btn btn-outline"
                            style={{
                              minHeight: 28,
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              gap: 4,
                              color: '#EA580C',
                              borderColor: '#FDBA74',
                              backgroundColor: '#FFF7ED',
                              fontWeight: 700,
                            }}
                            title="Process customer return into TC-OPNC-R or workshop recovery into TC-OPNC-C"
                          >
                            <RotateCcw size={12} />
                            <span>Return / Recover</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                            {iss.returnCondition || 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Return & Recovery Modal */}
      <CustomerReturnModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedIssuanceForReturn(null);
        }}
        issuance={selectedIssuanceForReturn}
        activeUser={activeUser}
        onSuccess={handleReturnSuccess}
      />

      {/* Quick Edit Stock Stages Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 24 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slt-deep-blue)' }}>
                  Update Stock Stages
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {editingItem.materialCode} &mdash; {editingItem.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="input-group">
                <label className="input-label">On-hand Verified Stock ({editingItem.unit}):</label>
                <input
                  type="number"
                  value={editOnHand}
                  onChange={(e) => setEditOnHand(Number(e.target.value))}
                  min={0}
                  className="input-field mono"
                  style={{ fontWeight: 700 }}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Inbound Transit Stock:</label>
                <input
                  type="number"
                  value={editInbound}
                  onChange={(e) => setEditInbound(Number(e.target.value))}
                  min={0}
                  className="input-field mono"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Receiving Stage:</label>
                <input
                  type="number"
                  value={editReceiving}
                  onChange={(e) => setEditReceiving(Number(e.target.value))}
                  min={0}
                  className="input-field mono"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-outline"
                  style={{ minHeight: 40 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minHeight: 40 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Entry Warning Modal with Customer Details */}
      {duplicateWarning && (
        <DuplicateWarningModal
          isOpen={duplicateWarning.isOpen}
          onClose={() => setDuplicateWarning(null)}
          onProceed={() => {
            setDuplicateWarning(null);
            executeAllocation(true);
          }}
          duplicateType={duplicateWarning.type}
          duplicateValue={duplicateWarning.value}
          existingRecord={duplicateWarning.existingRecord}
          operatorName={activeUser.name}
        />
      )}
    </div>
  );
};
