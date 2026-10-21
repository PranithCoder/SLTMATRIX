import React from 'react';
import { LayoutDashboard, Cable, RotateCcw, PackageCheck, History, QrCode, Layers } from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'new_connection' 
  | 'rehab' 
  | 'returns' 
  | 'dispatch' 
  | 'collective'
  | 'transfer'
  | 'ledger';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenScanner,
}) => {
  return (
    <nav className="bottom-nav">
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => onSelectTab('new_connection')}
        className={`nav-item ${currentTab === 'new_connection' ? 'active' : ''}`}
      >
        <PackageCheck size={18} />
        <span>New Conn</span>
      </button>

      <button
        onClick={() => onSelectTab('collective')}
        className={`nav-item ${currentTab === 'collective' ? 'active' : ''}`}
      >
        <Layers size={18} />
        <span>Collective</span>
      </button>

      {/* Center Floating Camera Scanner Action Button */}
      <button
        onClick={onOpenScanner}
        className="scanner-fab"
        title="Scan Barcode / QR / Batch Locator Tag"
        aria-label="Scan Barcode / QR Code"
      >
        <QrCode size={24} />
      </button>

      <button
        onClick={() => onSelectTab('returns')}
        className={`nav-item ${currentTab === 'returns' ? 'active' : ''}`}
      >
        <RotateCcw size={18} />
        <span>Workshop</span>
      </button>

      <button
        onClick={() => onSelectTab('ledger')}
        className={`nav-item ${currentTab === 'ledger' ? 'active' : ''}`}
      >
        <History size={18} />
        <span>Ledger</span>
      </button>
    </nav>
  );
};
