import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  PackageCheck, 
  Cable, 
  RotateCcw, 
  PackagePlus, 
  History, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  X,
  ArrowRightLeft,
  LogOut
} from 'lucide-react';

import { Header } from './components/common/Header';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { BarcodeScannerModal } from './components/scanner/BarcodeScannerModal';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { WorkflowNewConnection } from './components/workflows/WorkflowNewConnection';
import { WorkflowRehab } from './components/workflows/WorkflowRehab';
import { WorkflowReturns } from './components/workflows/WorkflowReturns';
import { WorkflowDispatchReceive } from './components/workflows/WorkflowDispatchReceive';
import { WorkflowCollective } from './components/workflows/WorkflowCollective';
import { WorkflowTransfer } from './components/workflows/WorkflowTransfer';
import { AuditLedgerTable } from './components/ledger/AuditLedgerTable';
import { ProductFormModal } from './components/common/ProductFormModal';
import { DeleteConfirmModal } from './components/common/DeleteConfirmModal';
import { StockTransferModal } from './components/workflows/StockTransferModal';
import { LoginPage } from './components/auth/LoginPage';
import { ScannedResultModal } from './components/scanner/ScannedResultModal';
import { UserManagementModal } from './components/users/UserManagementModal';
import { AdminAlertsModal } from './components/alerts/AdminAlertsModal';

import { storageService } from './services/storage';
import {
  subscribeToInventory,
  subscribeToLedger,
  subscribeToUsers,
  subscribeToCustomerIssuances,
  subscribeToTransfers,
} from './services/firestoreService';
import { InventoryItem, LedgerTransaction, UserPersona, SubCategoryCode, OpenScannerFn } from './types/inventory';

export type ExtendedNavTab = NavTab | 'collective' | 'transfer';

export const App: React.FC = () => {
  // Compulsory authentication on every page reload / refresh
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<ExtendedNavTab>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [activeUser, setActiveUser] = useState<UserPersona>(storageService.getActiveUser());
  const [usersList, setUsersList] = useState<UserPersona[]>(() => storageService.getUsers());
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(() => storageService.getUnreadAlertsCount());
  const [isOffline, setIsOffline] = useState<boolean>(storageService.isOffline());
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(storageService.getHighContrast());

  // Admin Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerTargetHint, setScannerTargetHint] = useState<string>('Scan Barcode or QR Code');
  const [scannerCallback, setScannerCallback] = useState<((scannedText: string, allScanned?: string[]) => void) | null>(null);
  const [scannerBatchMode, setScannerBatchMode] = useState<boolean>(false);
  const [scannedResultCode, setScannedResultCode] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);

  // Prefilled states from scanner routing
  const [prefilledSerial, setPrefilledSerial] = useState<string>('');
  const [prefilledBatchString, setPrefilledBatchString] = useState<string>('');
  const [prefilledWorkOrder, setPrefilledWorkOrder] = useState<string>('');

  // Product CRUD Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProductItem, setEditingProductItem] = useState<InventoryItem | null>(null);
  const [defaultProductCategory, setDefaultProductCategory] = useState<SubCategoryCode | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Transfer (Move Order) Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [itemToTransfer, setItemToTransfer] = useState<InventoryItem | undefined>(undefined);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const refreshData = useCallback(() => {
    setInventory(storageService.getInventory());
    setLedger(storageService.getLedger());
    setQueuedCount(storageService.getOfflineQueue().length);
    setIsOffline(storageService.isOffline());
    setUsersList(storageService.getUsers());
    setUnreadAlertsCount(storageService.getUnreadAlertsCount());
  }, []);

  // Initialize data and clear previous sessions on mount/refresh
  useEffect(() => {
    storageService.logout();
    setIsAuthenticated(false);
    refreshData();

    // Listen to online/offline network events
    const handleOnline = () => {
      setIsOffline(storageService.isOffline());
      // Trigger auto sync
      handleManualSync();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Apply high-contrast mode class to body if saved
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshData, isHighContrast]);

  // Real-time bidirectional Firestore database sync across all operators
  useEffect(() => {
    const unsubInventory = subscribeToInventory((liveItems) => {
      if (liveItems && liveItems.length > 0) {
        storageService.setLiveInventory(liveItems);
        setInventory(liveItems);
      }
    });

    const unsubLedger = subscribeToLedger((liveTx) => {
      if (liveTx) {
        storageService.setLiveLedger(liveTx);
        setLedger(liveTx);
      }
    });

    const unsubUsers = subscribeToUsers((liveUsers) => {
      if (liveUsers && liveUsers.length > 0) {
        storageService.setLiveUsers(liveUsers);
        setUsersList(liveUsers);
      }
    });

    const unsubIssuances = subscribeToCustomerIssuances((liveIssuances) => {
      if (liveIssuances) {
        storageService.setLiveCustomerIssuances(liveIssuances);
      }
    });

    const unsubTransfers = subscribeToTransfers((liveTransfers) => {
      if (liveTransfers) {
        storageService.setLiveTransfers(liveTransfers);
      }
    });

    return () => {
      unsubInventory();
      unsubLedger();
      unsubUsers();
      unsubIssuances();
      unsubTransfers();
    };
  }, []);

  // High contrast mode toggle
  const handleToggleHighContrast = () => {
    const next = !isHighContrast;
    setIsHighContrast(next);
    storageService.setHighContrast(next);
    if (next) {
      document.body.classList.add('high-contrast');
      showToast('Outdoor Sunlight Mode Activated', 'info');
    } else {
      document.body.classList.remove('high-contrast');
      showToast('Standard Display Mode Restored', 'info');
    }
  };

  // Offline simulator toggle
  const handleToggleOfflineSim = () => {
    const next = !isOffline;
    storageService.setSimulatedOffline(next);
    setIsOffline(next);
    if (next) {
      showToast('Offline Mode Simulated: Transactions will queue locally in IndexedDB/Storage', 'info');
    } else {
      // Reconnected -> sync queue!
      handleManualSync();
    }
  };

  // Sync offline queue
  const handleManualSync = () => {
    const { syncedCount } = storageService.syncOfflineQueue();
    refreshData();
    if (syncedCount > 0) {
      showToast(`Network Synchronized! ${syncedCount} queued transactions posted to central ledger.`, 'success');
    } else {
      showToast('All local transactions are already synchronized.', 'info');
    }
  };

  const handleSelectUser = (user: UserPersona) => {
    setActiveUser(user);
    storageService.setActiveUser(user);
    showToast(`Switched active operator profile to ${user.name} (${user.role})`, 'info');
  };

  const handleOpenScanner: OpenScannerFn = (
    hint: string = 'Scan Any Barcode, QR Code, or Serial Tag',
    callback?: (scannedText: string, allScanned?: string[]) => void,
    batchMode: boolean = false
  ) => {
    setScannerTargetHint(hint);
    setScannerCallback(callback ? () => callback : null);
    setScannerBatchMode(batchMode);
    setIsScannerOpen(true);
  };

  // Smart Universal Scanner Result Dispatcher
  const handleScanComplete = (scannedText: string, suggestedAction?: string, allScanned?: string[]) => {
    refreshData();

    // 1. Direct targeted field/modal callback
    if (scannerCallback) {
      scannerCallback(scannedText, allScanned);
      setScannerCallback(null);
      showToast(`Captured Serial: "${scannedText}"`, 'success');
      return;
    }

    // 2. Batch Locator Tag
    if (suggestedAction === 'DISPATCH' || scannedText.includes('|') || scannedText.includes('TC-01')) {
      setPrefilledBatchString(scannedText);
      setCurrentTab('dispatch');
      showToast(`Batch Locator Tag Detected! Loaded into Dispatch Parser.`, 'info');
      return;
    }

    // 3. Rehab Work Order
    if (suggestedAction === 'REHAB' || scannedText.startsWith('WO-')) {
      setPrefilledWorkOrder(scannedText);
      setCurrentTab('rehab');
      showToast(`Work Order "${scannedText}" scanned! Loaded into Rehab Allocation.`, 'info');
      return;
    }

    // 4. Global Scan (Header / BottomNav): Open ScannedResultModal for full visibility and intelligent action routing!
    setScannedResultCode(scannedText);
    setIsResultModalOpen(true);
  };

  const handleResultAction = (
    action: 'ALLOCATE' | 'DISPATCH' | 'COLLECTIVE' | 'RETURNS' | 'TRANSFER',
    serial: string,
    item?: InventoryItem
  ) => {
    setIsResultModalOpen(false);
    if (action === 'ALLOCATE') {
      setPrefilledSerial(serial);
      setCurrentTab('new_connection');
      showToast(`Device Serial "${serial}" ready for customer allocation.`, 'info');
    } else if (action === 'DISPATCH') {
      setPrefilledSerial(serial);
      setCurrentTab('dispatch');
      showToast(`Serial "${serial}" ready for dispatch intake.`, 'info');
    } else if (action === 'COLLECTIVE') {
      setPrefilledSerial(serial);
      setCurrentTab('collective');
      showToast(`Serial "${serial}" loaded into Collective Stock Recovery.`, 'info');
    } else if (action === 'RETURNS') {
      setPrefilledSerial(serial);
      setCurrentTab('returns');
      showToast(`Serial "${serial}" loaded into Returns Ledger.`, 'info');
    } else if (action === 'TRANSFER') {
      setItemToTransfer(item);
      setIsTransferModalOpen(true);
    }
  };

  const handleWorkflowSuccess = (msg: string) => {
    refreshData();
    showToast(msg, 'success');
  };

  const handleOpenAddProduct = (category?: SubCategoryCode) => {
    if (activeUser.role !== 'ADMIN_IBT') {
      showToast('Permission Denied: Only Super Admin Mr. Kanishka can add new items to the master catalog.', 'error');
      return;
    }
    setEditingProductItem(null);
    setDefaultProductCategory(category || 'TCOPNC');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: InventoryItem) => {
    if (activeUser.role !== 'ADMIN_IBT') {
      showToast('Permission Denied: Only Super Admin Mr. Kanishka has authority to edit master catalog items.', 'error');
      return;
    }
    setEditingProductItem(item);
    setDefaultProductCategory(item.subCategory);
    setIsProductModalOpen(true);
  };

  const handleOpenDeleteProduct = (item: InventoryItem) => {
    if (activeUser.role !== 'ADMIN_IBT') {
      showToast('Permission Denied: Only Super Admin Mr. Kanishka has authority to delete catalog records.', 'error');
      return;
    }
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleOpenTransfer = (item?: InventoryItem) => {
    setItemToTransfer(item);
    setIsTransferModalOpen(true);
  };

  const handleLoginSuccess = (user: UserPersona) => {
    setActiveUser(user);
    setIsAuthenticated(true);
    refreshData();
    showToast(`Welcome back, ${user.name}! Connected to SLT MatriX.`, 'success');
  };

  const handleLogout = () => {
    storageService.logout();
    setIsAuthenticated(false);
    showToast('Securely signed out. Session closed.', 'info');
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
        isOffline={isOffline}
        queuedCount={queuedCount}
        onToggleOfflineSim={handleToggleOfflineSim}
        onManualSync={handleManualSync}
        isHighContrast={isHighContrast}
        onToggleHighContrast={handleToggleHighContrast}
        onOpenScanner={() => handleOpenScanner()}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserModalOpen(true)}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        onlineUsersCount={usersList.filter(u => u.isOnline).length}
        totalUsersCount={usersList.length}
        usersList={usersList}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Desktop Tab Navigation Bar */}
        <div className="desktop-nav" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`desktop-nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('dispatch')}
            className={`desktop-nav-btn ${currentTab === 'dispatch' ? 'active' : ''}`}
          >
            <PackagePlus size={17} />
            <span>Dispatch Intake</span>
          </button>

          <button
            onClick={() => setCurrentTab('new_connection')}
            className={`desktop-nav-btn ${currentTab === 'new_connection' ? 'active' : ''}`}
          >
            <PackageCheck size={17} />
            <span>TC-OPNC New Conn</span>
          </button>

          <button
            onClick={() => setCurrentTab('collective')}
            className={`desktop-nav-btn ${currentTab === 'collective' ? 'active' : ''}`}
          >
            <Layers size={17} />
            <span>TC-OPNC-C Customer Collect</span>
          </button>

          <button
            onClick={() => setCurrentTab('returns')}
            className={`desktop-nav-btn ${currentTab === 'returns' ? 'active' : ''}`}
          >
            <RotateCcw size={17} />
            <span>TC-OPNC-R Workshop Returns</span>
          </button>

          <button
            onClick={() => setCurrentTab('rehab')}
            className={`desktop-nav-btn ${currentTab === 'rehab' ? 'active' : ''}`}
          >
            <Cable size={17} />
            <span>TC-OPCDR Rehab</span>
          </button>

          <button
            onClick={() => setCurrentTab('transfer')}
            className={`desktop-nav-btn ${currentTab === 'transfer' ? 'active' : ''}`}
          >
            <ArrowRightLeft size={17} />
            <span>Move Orders (Transfers)</span>
          </button>

          <button
            onClick={() => setCurrentTab('ledger')}
            className={`desktop-nav-btn ${currentTab === 'ledger' ? 'active' : ''}`}
          >
            <History size={17} />
            <span>Audit Ledger</span>
          </button>

          {/* Desktop Nav Direct Logout */}
          <button
            onClick={handleLogout}
            className="desktop-nav-btn desktop-nav-logout"
            title="Sign out of SLT MatriX"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Dynamic Tab Views */}
        {currentTab === 'dashboard' && (
          <ExecutiveDashboard
            inventory={inventory}
            ledger={ledger}
            activeUser={activeUser}
            onNavigateTab={(tab) => setCurrentTab(tab as ExtendedNavTab)}
            onOpenScanner={handleOpenScanner}
            onRefreshData={refreshData}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleOpenDeleteProduct}
            onTransferProduct={handleOpenTransfer}
          />
        )}

        {currentTab === 'new_connection' && (
          <WorkflowNewConnection
            inventory={inventory}
            activeUser={activeUser}
            onSuccess={handleWorkflowSuccess}
            onOpenScanner={handleOpenScanner}
            prefilledSerial={prefilledSerial}
            onClearPrefill={() => setPrefilledSerial('')}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleOpenDeleteProduct}
            onTransferProduct={handleOpenTransfer}
          />
        )}

        {currentTab === 'rehab' && (
          <WorkflowRehab
            inventory={inventory}
            activeUser={activeUser}
            onSuccess={handleWorkflowSuccess}
            onOpenScanner={handleOpenScanner}
            prefilledWorkOrder={prefilledWorkOrder}
            onClearPrefill={() => setPrefilledWorkOrder('')}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleOpenDeleteProduct}
            onTransferProduct={handleOpenTransfer}
          />
        )}

        {currentTab === 'returns' && (
          <WorkflowReturns
            inventory={inventory}
            activeUser={activeUser}
            onSuccess={handleWorkflowSuccess}
            onOpenScanner={handleOpenScanner}
            prefilledSerial={prefilledSerial}
            onClearPrefill={() => setPrefilledSerial('')}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleOpenDeleteProduct}
            onTransferProduct={handleOpenTransfer}
          />
        )}

        {currentTab === 'dispatch' && (
          <WorkflowDispatchReceive
            inventory={inventory}
            activeUser={activeUser}
            onSuccess={handleWorkflowSuccess}
            onOpenScanner={handleOpenScanner}
            prefilledBatchString={prefilledBatchString}
            onClearPrefill={() => setPrefilledBatchString('')}
            prefilledSerial={prefilledSerial}
          />
        )}

        {currentTab === 'collective' && (
          <WorkflowCollective
            inventory={inventory}
            activeUser={activeUser}
            onSuccess={handleWorkflowSuccess}
            onOpenScanner={handleOpenScanner}
            prefilledSerial={prefilledSerial}
            onClearPrefill={() => setPrefilledSerial('')}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleOpenDeleteProduct}
            onTransferProduct={handleOpenTransfer}
          />
        )}

        {currentTab === 'transfer' && (
          <WorkflowTransfer
            inventory={inventory}
            activeUser={activeUser}
            onSuccess={handleWorkflowSuccess}
            onOpenTransferModal={handleOpenTransfer}
          />
        )}

        {currentTab === 'ledger' && (
          <AuditLedgerTable
            ledger={ledger}
            onRefresh={refreshData}
          />
        )}

        {/* System Development Credits Footer */}
        <footer
          className="slt-app-footer"
          style={{
            marginTop: 40,
            marginBottom: 24,
            padding: '16px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ color: 'var(--slt-deep-blue)' }}>Developed by</span>
            <strong style={{ color: 'var(--text-primary)' }}>Pranith S</strong>
            <a
              href="tel:0774726136"
              style={{
                color: 'var(--slt-deep-blue)',
                fontWeight: 700,
                textDecoration: 'none',
                backgroundColor: 'rgba(0, 86, 179, 0.08)',
                padding: '3px 8px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              📞 0774726136
            </a>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                color: 'var(--mobitel-lime-dark)',
                fontWeight: 700,
                backgroundColor: 'var(--mobitel-lime-light)',
                padding: '3px 9px',
                borderRadius: 4,
                border: '1px solid #C4E9BB',
              }}
            >
              Contact for System Development
            </span>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab as NavTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenScanner={() => handleOpenScanner()}
      />

      {/* Global Camera Barcode/QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setScannerCallback(null);
        }}
        onScanComplete={handleScanComplete}
        targetHint={scannerTargetHint}
        inventory={inventory}
        initialBatchMode={scannerBatchMode}
      />

      {/* Scanned Barcode Result & Disambiguation Modal */}
      <ScannedResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        scannedCode={scannedResultCode || ''}
        inventory={inventory}
        onAction={handleResultAction}
      />

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProductItem(null);
        }}
        onSuccess={(msg) => {
          refreshData();
          showToast(msg, 'success');
        }}
        activeUser={activeUser}
        editingItem={editingProductItem}
        defaultSubCategory={defaultProductCategory}
        onOpenScanner={handleOpenScanner}
      />

      {/* Product Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onSuccess={(msg) => {
          refreshData();
          showToast(msg, 'success');
        }}
        activeUser={activeUser}
        item={itemToDelete}
      />

      {/* Stock Transfer (Move Order) Modal */}
      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setItemToTransfer(undefined);
        }}
        onSuccess={(msg) => {
          refreshData();
          showToast(msg, 'success');
        }}
        activeUser={activeUser}
        inventory={inventory}
        preselectedItem={itemToTransfer}
        onOpenScanner={handleOpenScanner}
      />

      {/* Kanishka Super Admin User Matrix & Live Online Status Modal */}
      {isUserModalOpen && (
        <UserManagementModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          currentUser={activeUser}
          onUsersUpdated={refreshData}
        />
      )}

      {/* Kanishka Super Admin Duplicate & Security Alerts Modal */}
      {isAlertsModalOpen && (
        <AdminAlertsModal
          isOpen={isAlertsModalOpen}
          onClose={() => setIsAlertsModalOpen(false)}
          currentUser={activeUser}
          onAlertsUpdated={refreshData}
        />
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(var(--bottom-nav-height) + 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            maxWidth: '90%',
            width: 440,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor:
              toast.type === 'success'
                ? '#15803D'
                : toast.type === 'error'
                ? '#DC2626'
                : '#0056B3',
            color: '#FFFFFF',
            boxShadow: 'var(--shadow-floating)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: '0.85rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {toast.type === 'success' && <CheckCircle2 size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              padding: 2,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
export default App;
