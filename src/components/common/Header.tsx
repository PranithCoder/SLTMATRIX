import React from 'react';
import { Wifi, WifiOff, Sun, UserCheck, RefreshCw, QrCode, LogOut } from 'lucide-react';
import { UserPersona } from '../../types/inventory';
import { INITIAL_USERS } from '../../services/storage';

interface HeaderProps {
  activeUser: UserPersona;
  onSelectUser: (user: UserPersona) => void;
  isOffline: boolean;
  queuedCount: number;
  onToggleOfflineSim: () => void;
  onManualSync: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  onOpenScanner: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  onSelectUser,
  isOffline,
  queuedCount,
  onToggleOfflineSim,
  onManualSync,
  isHighContrast,
  onToggleHighContrast,
  onOpenScanner,
  onLogout,
}) => {
  return (
    <header className="slt-header">
      <div className="slt-header-inner">
        {/* Brand Logo Lockup */}
        <div className="brand-logo-lockup">
          <div className="slt-pill-logo">
            <span className="slt-pill-blue">SLT</span>
            <span className="slt-pill-green">MOBITEL</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slt-deep-blue)' }}>
                SLT MatriX
              </h1>
              <span style={{
                background: 'var(--mobitel-lime-light)',
                color: 'var(--mobitel-lime-dark)',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid #C4E9BB'
              }}>
                v1.0 PRD
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Field & Warehouse Inventory Management
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick Barcode Scanner Button */}
          <button
            onClick={onOpenScanner}
            className="btn btn-primary"
            style={{
              padding: '6px 14px',
              minHeight: 38,
              fontSize: '0.85rem',
              gap: 6,
            }}
            title="Open Camera Barcode & QR Scanner"
          >
            <QrCode size={18} />
            <span>Scan</span>
          </button>

          {/* User Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <select
              value={activeUser.id}
              onChange={(e) => {
                const selected = INITIAL_USERS.find((u) => u.id === e.target.value);
                if (selected) onSelectUser(selected);
              }}
              aria-label="Active Operator Profile"
              style={{
                height: 38,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {INITIAL_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role === 'ADMIN_IBT' ? '👔 ' : '🔧 '} {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Connectivity / Offline Simulator Toggle */}
          <button
            onClick={onToggleOfflineSim}
            className={`status-pill ${isOffline ? 'offline' : 'online'}`}
            style={{
              border: 'none',
              cursor: 'pointer',
              height: 34,
              padding: '0 10px',
              transition: 'all 0.15s ease',
            }}
            title={isOffline ? 'Offline Mode Active. Click to simulate reconnect.' : 'Online (Click to simulate field offline mode)'}
          >
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              {isOffline ? 'OFFLINE' : 'ONLINE'}
            </span>
          </button>

          {/* Pending Sync Queue Pill */}
          {queuedCount > 0 && (
            <button
              onClick={onManualSync}
              className="status-pill queued"
              style={{
                border: 'none',
                cursor: 'pointer',
                height: 34,
                padding: '0 10px',
                animation: 'pulse 2s infinite',
              }}
              title="Transactions cached locally. Click to sync immediately."
            >
              <RefreshCw size={13} style={{ animation: 'spin 3s linear infinite' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                {queuedCount} Queued
              </span>
            </button>
          )}

          {/* High Contrast / Sunlight Toggle */}
          <button
            onClick={onToggleHighContrast}
            className="btn btn-outline"
            style={{
              width: 38,
              height: 38,
              minHeight: 38,
              padding: 0,
              borderRadius: 'var(--radius-md)',
              backgroundColor: isHighContrast ? '#000000' : '#FFFFFF',
              color: isHighContrast ? '#FFFFFF' : 'var(--text-secondary)',
            }}
            title={isHighContrast ? 'Disable Outdoor Sunlight Mode' : 'Enable High-Contrast Outdoor Sunlight Mode'}
          >
            <Sun size={18} />
          </button>

          {/* Secure Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="btn btn-outline"
              style={{
                height: 38,
                minHeight: 38,
                padding: '0 10px',
                fontSize: '0.8rem',
                gap: 5,
                color: '#DC2626',
                borderColor: '#FCA5A5',
                backgroundColor: '#FEF2F2',
                fontWeight: 700,
              }}
              title="Sign out of SLT MatriX"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
