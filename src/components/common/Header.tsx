import React from 'react';
import {
  Wifi,
  WifiOff,
  Sun,
  UserCheck,
  RefreshCw,
  LogOut,
  Users,
  Bell,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { UserPersona } from '../../types/inventory';

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
  onOpenUserManagement?: () => void;
  onOpenAlerts?: () => void;
  unreadAlertsCount?: number;
  onlineUsersCount?: number;
  totalUsersCount?: number;
  usersList?: UserPersona[];
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
  onOpenUserManagement,
  onOpenAlerts,
  unreadAlertsCount = 0,
  onlineUsersCount = 1,
  totalUsersCount = 6,
  usersList = [],
}) => {
  const isAdmin = activeUser.role === 'ADMIN_IBT';

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

        {/* Action Controls */}
        <div className="slt-header-actions">
          {/* Admin Exclusive: Live Team Online Tracker & User Management Modal */}
          {isAdmin && onOpenUserManagement && (
            <button
              onClick={onOpenUserManagement}
              className="btn btn-outline"
              style={{
                height: 36,
                minHeight: 36,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                color: '#E2E8F0',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Team Matrix & Active Online Telemetry (Admin Only)"
            >
              <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                <span
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    opacity: 0.75,
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                  }}
                />
              </span>
              <Users size={14} color="#38BDF8" />
              <span>Team ({onlineUsersCount}/{totalUsersCount})</span>
            </button>
          )}

          {/* Admin Exclusive: Duplicate Warning & Security Alerts Modal */}
          {isAdmin && onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="btn btn-outline"
              style={{
                height: 36,
                minHeight: 36,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: unreadAlertsCount > 0 ? '#7F1D1D' : '#1E293B',
                borderColor: unreadAlertsCount > 0 ? '#EF4444' : '#475569',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                animation: unreadAlertsCount > 0 ? 'pulse 1.8s infinite' : 'none',
              }}
              title="Duplicate Entries & System Security Alerts (Admin Only)"
            >
              <Bell size={14} color={unreadAlertsCount > 0 ? '#FCA5A5' : '#94A3B8'} />
              <span>
                Alerts {unreadAlertsCount > 0 && `(${unreadAlertsCount})`}
              </span>
            </button>
          )}

          {/* User Profile / Switcher */}
          {isAdmin ? (
            <div style={{ position: 'relative' }}>
              <select
                value={activeUser.id}
                onChange={(e) => {
                  const selected = usersList.find((u) => u.id === e.target.value);
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
                  maxWidth: 140,
                  textOverflow: 'ellipsis',
                }}
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'ADMIN_IBT' ? '👔 Admin: ' : '🔧 Tech: '} {u.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              style={{
                height: 36,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🔧</span>
              <span>{activeUser.name}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: 4,
                  backgroundColor: '#E2E8F0',
                  color: '#475569',
                }}
              >
                {activeUser.role === 'FIELD_TECH' ? 'Field Tech' : 'Operator'}
              </span>
            </div>
          )}

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
