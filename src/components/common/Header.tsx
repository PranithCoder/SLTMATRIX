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
  onOpenScanner?: () => void;
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
          <div className="brand-text-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 className="brand-title-text" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slt-deep-blue)', margin: 0, whiteSpace: 'nowrap' }}>
                SLT MatriX
              </h1>
              <span className="brand-version-badge" style={{
                background: 'var(--mobitel-lime-light)',
                color: 'var(--mobitel-lime-dark)',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 5px',
                borderRadius: 4,
                border: '1px solid #C4E9BB',
                whiteSpace: 'nowrap',
              }}>
                v1.0 PRD
              </span>
            </div>
            <p className="brand-subtitle-text" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              Field & Warehouse Inventory Management
            </p>
          </div>
        </div>

        {/* Action Controls (Scanner removed from top nav, accessible via bottom nav) */}
        <div className="slt-header-actions">
          {/* User Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <select
              value={activeUser.id}
              onChange={(e) => {
                const selected = INITIAL_USERS.find((u) => u.id === e.target.value);
                if (selected) onSelectUser(selected);
              }}
              aria-label="Active Operator Profile"
              className="header-user-select"
              style={{
                height: 36,
                padding: '0 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: 135,
                textOverflow: 'ellipsis',
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
            className={`status-pill header-status-pill ${isOffline ? 'offline' : 'online'}`}
            style={{
              border: 'none',
              cursor: 'pointer',
              height: 34,
              padding: '0 8px',
              transition: 'all 0.15s ease',
            }}
            title={isOffline ? 'Offline Mode Active. Click to simulate reconnect.' : 'Online (Click to simulate field offline mode)'}
          >
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>
              {isOffline ? 'OFFLINE' : 'ONLINE'}
            </span>
          </button>

          {/* Pending Sync Queue Pill */}
          {queuedCount > 0 && (
            <button
              onClick={onManualSync}
              className="status-pill queued header-status-pill"
              style={{
                border: 'none',
                cursor: 'pointer',
                height: 34,
                padding: '0 8px',
                animation: 'pulse 2s infinite',
              }}
              title="Transactions cached locally. Click to sync immediately."
            >
              <RefreshCw size={12} style={{ animation: 'spin 3s linear infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                {queuedCount}
              </span>
            </button>
          )}

          {/* High Contrast / Sunlight Toggle */}
          <button
            onClick={onToggleHighContrast}
            className="btn btn-outline header-sun-btn"
            style={{
              width: 36,
              height: 36,
              minHeight: 36,
              padding: 0,
              borderRadius: 'var(--radius-md)',
              backgroundColor: isHighContrast ? '#000000' : '#FFFFFF',
              color: isHighContrast ? '#FFFFFF' : 'var(--text-secondary)',
            }}
            title={isHighContrast ? 'Disable Outdoor Sunlight Mode' : 'Enable High-Contrast Outdoor Sunlight Mode'}
          >
            <Sun size={17} />
          </button>

          {/* Secure Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="btn btn-outline header-logout-btn"
              style={{
                height: 36,
                minHeight: 36,
                padding: '0 8px',
                fontSize: '0.78rem',
                gap: 4,
                color: '#DC2626',
                borderColor: '#FCA5A5',
                backgroundColor: '#FEF2F2',
                fontWeight: 700,
              }}
              title="Sign out of SLT MatriX"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
