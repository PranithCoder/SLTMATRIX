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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  SLT User Access & Operator Matrix
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Managed by <strong className="text-white">{currentUser.name}</strong> • Real-time Active Online Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCreate}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add User</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-sm flex items-center gap-2 border-b ${
              statusMessage.type === 'error'
                ? 'bg-red-500/10 text-red-300 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Live Status Tracker Bar (Admin Exclusive) */}
        <div className="px-6 py-3 bg-slate-800/70 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">
                Active Online: <strong className="text-emerald-400">{onlineCount}</strong> / {users.length}
              </span>
            </div>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              Live Online telemetry visible only to Super Admin ({currentUser.name})
            </span>
          </div>
          <button
            onClick={handleStartCreate}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Add / Edit Inline Form */}
          {(isCreating || editingUser) && (
            <form
              onSubmit={isCreating ? handleSaveCreate : handleSaveEdit}
              className="p-4 sm:p-5 bg-slate-800/90 border border-blue-500/40 rounded-xl space-y-4 animate-slideDown shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  {isCreating ? <UserPlus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  <span>{isCreating ? 'Create New Operator Account' : `Edit Account: ${editingUser?.name}`}</span>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700/60"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ruwan Silva"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    SLT Email / Login Username *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. ruwan@slt.lk"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="tech123"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    System Role & Access Level *
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="FIELD_TECH">FIELD_TECH (Basic: Installs, Issues, Returns)</option>
                    <option value="OPERATOR">OPERATOR (Basic: Depot & Warehouse Ops)</option>
                    <option value="ADMIN_IBT">ADMIN_IBT (Super Admin: Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Field Technician Grade II"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Branch / Operational Unit
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    placeholder="e.g. Metro OSP Field Unit 04"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                >
                  {isCreating ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700">
                    <th className="py-3 px-4">Operator / Technician</th>
                    <th className="py-3 px-4">Role & Level</th>
                    <th className="py-3 px-4">Branch / Unit</th>
                    <th className="py-3 px-4">Online Status</th>
                    <th className="py-3 px-4">Login Password</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.map(u => {
                    const isSuperAdmin = u.role === 'ADMIN_IBT' || u.id === 'USR-KANISHKA';
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          u.isOnline ? 'bg-emerald-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {u.name}
                            {isSuperAdmin && (
                              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-normal">
                                Super Admin
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                          {u.title && <div className="text-slate-500 text-[10px]">{u.title}</div>}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              u.role === 'ADMIN_IBT'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : u.role === 'FIELD_TECH'
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {u.role === 'ADMIN_IBT' ? 'Full Control' : 'Basic Operator'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          <div>{u.branch || '—'}</div>
                        </td>

                        {/* Live Online Telemetry (Exclusive to Kanishka) */}
                        <td className="py-3 px-4">
                          {u.isOnline ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px]">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              ONLINE
                            </div>
                          ) : (
                            <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                              <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                              <span>Offline ({u.lastActive || 'Inactive'})</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <code className="text-slate-400 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">
                            {u.password || 'tech123'}
                          </code>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(u)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                              title="Edit user details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button (Super admin cannot be deleted) */}
                            {isSuperAdmin ? (
                              <button
                                disabled
                                className="p-1.5 text-slate-600 cursor-not-allowed"
                                title="Primary Admin account cannot be removed"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            ) : deleteConfirmId === u.id ? (
                              <div className="flex items-center gap-1 bg-red-950/60 p-1 rounded border border-red-500/40">
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(u.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kanishka holds master rights. Standard users restricted from deleting/altering catalog.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
