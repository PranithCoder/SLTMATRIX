import React, { useState } from 'react';
import { UserPersona } from '../../types/inventory';
import { storageService } from '../../services/storage';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Radio,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  Lock,
  Building,
  Mail,
  User,
  KeyRound
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserPersona;
  onUsersUpdated?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
}) => {
  const [users, setUsers] = useState<UserPersona[]>(() => storageService.getUsers());
  const [editingUser, setEditingUser] = useState<UserPersona | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('tech123');
  const [role, setRole] = useState<'FIELD_TECH' | 'OPERATOR' | 'ADMIN_IBT'>('FIELD_TECH');
  const [title, setTitle] = useState('');
  const [branch, setBranch] = useState('Metro OSP Field Unit 04');

  if (!isOpen) return null;

  const refreshUsers = () => {
    const fresh = storageService.getUsers();
    setUsers(fresh);
    if (onUsersUpdated) onUsersUpdated();
  };

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('tech123');
    setRole('FIELD_TECH');
    setTitle('');
    setBranch('Metro OSP Field Unit 04');
    setIsCreating(false);
    setEditingUser(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (u: UserPersona) => {
    setIsCreating(false);
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(u.password || 'tech123');
    setRole(u.role);
    setTitle(u.title || '');
    setBranch(u.branch || '');
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showMsg('Please provide both name and email.', 'error');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      showMsg('An account with this email address already exists.', 'error');
      return;
    }

    storageService.addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim() || 'tech123',
      role,
      title: title.trim() || (role === 'FIELD_TECH' ? 'Field Telecom Technician' : 'Depot Operations Clerk'),
      branch: branch.trim() || 'SLT Regional Depot',
    });

    showMsg(`User account "${name}" created successfully.`);
    refreshUsers();
    resetForm();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!name.trim() || !email.trim()) {
      showMsg('Please provide name and email.', 'error');
      return;
    }

    const updated: UserPersona = {
      ...editingUser,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim() || editingUser.password || 'tech123',
      role,
      title: title.trim() || editingUser.title,
      branch: branch.trim() || editingUser.branch,
    };

    storageService.updateUser(updated);
    showMsg(`User account "${updated.name}" updated successfully.`);
    refreshUsers();
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (id === 'USR-KANISHKA') {
      showMsg('Super Admin Mr. Kanishka cannot be deleted.', 'error');
      setDeleteConfirmId(null);
      return;
    }

    const success = storageService.deleteUser(id);
    if (success) {
      showMsg('User account removed successfully.');
      refreshUsers();
    } else {
      showMsg('Failed to delete account.', 'error');
    }
    setDeleteConfirmId(null);
  };

  const onlineCount = users.filter(u => u.isOnline).length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1150,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #002D5E 0%, #0056B3 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                  SLT User Access & Operator Matrix
                </h2>
                <span
                  style={{
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ShieldCheck size={12} />
                  Admin Only
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#BAE6FD' }}>
                Managed by <strong>{currentUser.name}</strong> • Real-time Active Online Telemetry
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleStartCreate}
              className="btn btn-primary"
              style={{
                backgroundColor: 'var(--mobitel-lime)',
                color: '#002D5E',
                borderColor: 'var(--mobitel-lime)',
                minHeight: 36,
                padding: '0 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                gap: 6,
              }}
            >
              <UserPlus size={15} />
              <span>+ Add User</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: statusMessage.type === 'error' ? '#FEF2F2' : '#F0FDF4',
              color: statusMessage.type === 'error' ? '#B91C1C' : '#15803D',
              borderBottom: `1px solid ${statusMessage.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {statusMessage.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Live Status Tracker Bar (Admin Exclusive) */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>
                Active Online: <strong style={{ color: '#059669' }}>{onlineCount}</strong> of {users.length} accounts
              </span>
            </div>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Radio size={14} color="#0284C7" />
              Online status telemetry visible exclusively to Super Admin Mr. Kanishka
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* Add / Edit Form Card */}
          {(isCreating || editingUser) && (
            <form
              onSubmit={isCreating ? handleSaveCreate : handleSaveEdit}
              className="card"
              style={{
                marginBottom: 20,
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--slt-deep-blue)', fontSize: '0.9rem' }}>
                  {isCreating ? <UserPlus size={18} /> : <Edit2 size={18} />}
                  <span>{isCreating ? 'Create New Operator / Tech Account' : `Edit Account: ${editingUser?.name}`}</span>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline"
                  style={{ minHeight: 28, padding: '0 10px', fontSize: '0.72rem' }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ruwan Silva"
                    className="input-field"
                    style={{ height: 38 }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} />
                    Enterprise Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. ruwan@slt.lk"
                    className="input-field"
                    style={{ height: 38 }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={13} />
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="tech123"
                    className="input-field mono"
                    style={{ height: 38 }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={13} />
                    System Role & Access Level *
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="input-field"
                    style={{ height: 38, fontWeight: 600 }}
                  >
                    <option value="FIELD_TECH">FIELD_TECH (Field Installs, Issuance, Returns)</option>
                    <option value="OPERATOR">OPERATOR (Depot / Warehouse Operations)</option>
                    <option value="ADMIN_IBT">ADMIN_IBT (Super Admin: Full Master Access)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Designation / Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Field Telecom Technician"
                    className="input-field"
                    style={{ height: 38 }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building size={13} />
                    Branch / Operational Unit
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    placeholder="e.g. Metro OSP Field Unit 04"
                    className="input-field"
                    style={{ height: 38 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline"
                  style={{ minHeight: 36 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minHeight: 36, padding: '0 20px' }}
                >
                  {isCreating ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="table-container" style={{ borderRadius: 'var(--radius-md)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Operator / Technician</th>
                  <th>Role & Level</th>
                  <th>Branch / Unit</th>
                  <th>Online Status</th>
                  <th>Login Password</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSuperAdmin = u.role === 'ADMIN_IBT' || u.id === 'USR-KANISHKA';
                  return (
                    <tr key={u.id} style={{ backgroundColor: u.isOnline ? '#F0FDF4' : 'transparent' }}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{u.name}</span>
                          {isSuperAdmin && (
                            <span
                              style={{
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: 10,
                                border: '1px solid #FCD34D',
                              }}
                            >
                              Super Admin
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#0284C7', fontFamily: 'var(--font-mono)' }}>
                          {u.email}
                        </div>
                        {u.title && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{u.title}</div>
                        )}
                      </td>

                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              u.role === 'ADMIN_IBT'
                                ? '#FEF3C7'
                                : u.role === 'FIELD_TECH'
                                ? '#E0F2FE'
                                : '#F3E8FF',
                            color:
                              u.role === 'ADMIN_IBT'
                                ? '#92400E'
                                : u.role === 'FIELD_TECH'
                                ? '#0284C7'
                                : '#7E22CE',
                            border: `1px solid ${
                              u.role === 'ADMIN_IBT'
                                ? '#FCD34D'
                                : u.role === 'FIELD_TECH'
                                ? '#7DD3FC'
                                : '#D8B4FE'
                            }`,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {u.role === 'ADMIN_IBT' ? 'Full Control' : 'Basic Operator'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                          {u.branch || '—'}
                        </div>
                      </td>

                      {/* Live Online Telemetry (Exclusive to Kanishka) */}
                      <td>
                        {u.isOnline ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 10px',
                              borderRadius: 14,
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              border: '1px solid #86EFAC',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                            ONLINE
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.74rem',
                              color: '#64748B',
                            }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#94A3B8' }} />
                            Offline ({u.lastActive || 'Inactive'})
                          </span>
                        )}
                      </td>

                      <td>
                        <code
                          style={{
                            backgroundColor: '#F1F5F9',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {u.password || 'tech123'}
                        </code>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="btn btn-outline"
                            style={{ minHeight: 32, padding: '0 8px', color: '#0284C7' }}
                            title="Edit user details"
                          >
                            <Edit2 size={14} />
                          </button>

                          {isSuperAdmin ? (
                            <button
                              disabled
                              className="btn btn-outline"
                              style={{ minHeight: 32, padding: '0 8px', opacity: 0.4, cursor: 'not-allowed' }}
                              title="Primary Admin account cannot be removed"
                            >
                              <Lock size={14} />
                            </button>
                          ) : deleteConfirmId === u.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button
                                onClick={() => handleDelete(u.id)}
                                style={{
                                  backgroundColor: '#DC2626',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                style={{
                                  backgroundColor: '#E2E8F0',
                                  color: '#475569',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 6px',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              className="btn btn-outline"
                              style={{ minHeight: 32, padding: '0 8px', color: '#DC2626' }}
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Mr. Kanishka holds master rights. Standard users restricted from deleting/altering catalog.</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 16px', fontWeight: 600 }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
