'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  UserCheck,
  UserPlus,
  Shield,
  ShieldCheck,
  Lock,
  Phone,
  Briefcase,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Users,
  Search,
} from 'lucide-react';

const ROLE_INFO: Record<string, { label: string; badge: string; desc: string }> = {
  ADMIN: {
    label: 'Managing Director',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Full system access: all prospects, user management, settings, export, and delete protection.',
  },
  CEO: {
    label: 'Chief Executive Officer (CEO)',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Executive leadership oversight: complete visibility across all prospects, conversion pipelines, contracts, campaigns, and strategic analytics.',
  },
  BD_INTERN: {
    label: 'Business Development Intern',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Add prospects, manage assigned leads, update outreach, log activities, and notes. No settings or user management.',
  },
  SALES: {
    label: 'Sales Executive',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Manage sales pipeline, proposals, discovery meetings, and client conversions.',
  },
  MARKETING: {
    label: 'Marketing Lead',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Oversee lead generation campaigns, channels, and student inquiries.',
  },
  IT_ADMIN: {
    label: 'IT Manager',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    desc: 'Technical administration, configuration, and security management.',
  },
  ACCOUNT_MANAGER: {
    label: 'Account Manager',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Client post-conversion relationship, campaign onboarding, and retainer tracking.',
  },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmUserAction, setConfirmUserAction] = useState<{ user: any; action: 'deactivate' | 'activate' } | null>(null);
  
  // Edit Profile / Manage User State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    role: 'BD_INTERN',
    designation: '',
    phone: '',
    password: '',
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'BD_INTERN',
    designation: '',
    phone: '',
  });

  const fetchUsers = async () => {
    try {
      const [uRes, meRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/auth/me'),
      ]);
      const data = await uRes.json();
      const meData = await meRes.json();
      setUsers(data.users || []);
      if (meData.user) {
        setCurrentUser(meData.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || '',
      username: u.username || '',
      role: u.role || 'BD_INTERN',
      designation: u.designation || '',
      phone: u.phone || '',
      password: '',
      isActive: u.isActive,
    });
    setError('');
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const payload: any = {
        name: editForm.name.trim(),
        role: editForm.role,
        designation: editForm.designation.trim(),
        phone: editForm.phone.trim(),
        isActive: editForm.isActive,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user profile');
      }

      setSuccessMsg(`User profile for "${data.user.name}" (@${data.user.username}) updated successfully!`);
      setEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error updating user profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccessMsg(`User "${data.user.name}" (@${data.user.username}) created successfully!`);
      setShowAddModal(false);
      setForm({
        name: '',
        username: '',
        password: '',
        role: 'BD_INTERN',
        designation: '',
        phone: '',
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    if (user.id === currentUser?.id && user.isActive) {
      setError('Security constraint: You cannot deactivate your own admin account.');
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update user status');
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                User Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {users.length} Total Users
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-8">
              Admin Control: Create and manage system accounts across all SLS roles (Admin, BD Intern, Sales, Marketing, IT Admin, Account Manager).
            </p>
          </div>

          <button
            onClick={() => {
              setError('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-[0.99] transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">User / Full Name</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role & Access Level</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Assigned Leads</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleInfo = ROLE_INFO[u.role] || {
                      label: u.role,
                      badge: 'bg-slate-100 text-slate-700',
                      desc: '',
                    };
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                              {u.phone && <p className="text-[11px] text-slate-400">{u.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-slate-800">@{u.username}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleInfo.badge}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {u.designation || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">
                            {u._count?.assignedProspects || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                              title="Manage User Profile & Permissions"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {u.id === currentUser?.id ? (
                              <span
                                className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 cursor-not-allowed select-none"
                                title="You cannot deactivate your own account"
                              >
                                Self
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmUserAction({
                                    user: u,
                                    action: u.isActive ? 'deactivate' : 'activate',
                                  })
                                }
                                className={`text-xs font-bold transition px-2.5 py-1 rounded-lg cursor-pointer ${
                                  u.isActive
                                    ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                                }`}
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create New User */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
            <div className="my-auto max-h-[90vh] overflow-y-auto bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Create New CRM User</h3>
                    <p className="text-[11px] text-slate-500">Configure team access credentials and role</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shubham Srivastava"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. shubham.s"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Role (Access Level) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="ADMIN">Managing Director</option>
                      <option value="CEO">Chief Executive Officer (CEO)</option>
                      <option value="BD_INTERN">Business Development Intern</option>
                      <option value="SALES">Sales Executive</option>
                      <option value="MARKETING">Marketing Lead</option>
                      <option value="IT_ADMIN">IT Manager</option>
                      <option value="ACCOUNT_MANAGER">Account Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Founder / BD Intern / Sales Lead"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600 text-[11px] leading-relaxed">
                  <strong>Permission Info:</strong> {ROLE_INFO[form.role]?.desc}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Creating User...' : 'Create User Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Manage / Edit User Profile */}
        {editModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
            <div className="my-auto max-h-[90vh] overflow-y-auto bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Manage User Profile</h3>
                    <p className="text-[11px] text-slate-500">
                      Update credentials, role permissions, and profile details for <strong className="text-slate-800">@{editingUser.username}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editForm.username}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Role (Access Level) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="ADMIN">Managing Director</option>
                      <option value="CEO">Chief Executive Officer (CEO)</option>
                      <option value="BD_INTERN">Business Development Intern</option>
                      <option value="SALES">Sales Executive</option>
                      <option value="MARKETING">Marketing Lead</option>
                      <option value="IT_ADMIN">IT Manager</option>
                      <option value="ACCOUNT_MANAGER">Account Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director / Sales Executive"
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Set New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600 text-[11px] leading-relaxed">
                  <strong>Role Description:</strong> {ROLE_INFO[editForm.role]?.desc}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sensitive Action Confirmation Modal: Deactivate / Activate User */}
        {confirmUserAction && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
            <div className="my-auto max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl border ${
                    confirmUserAction.action === 'deactivate'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {confirmUserAction.action === 'deactivate' ? 'Deactivate User Account?' : 'Reactivate User Account?'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Security authorization required</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmUserAction.action === 'deactivate' ? (
                  <>
                    Are you sure you want to deactivate <strong className="text-slate-900">{confirmUserAction.user.name}</strong> (@{confirmUserAction.user.username})? This user will immediately lose access to the SLS CRM.
                  </>
                ) : (
                  <>
                    Are you sure you want to reactivate <strong className="text-slate-900">{confirmUserAction.user.name}</strong> (@{confirmUserAction.user.username})? They will regain access to their assigned leads.
                  </>
                )}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmUserAction(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const u = confirmUserAction.user;
                    setConfirmUserAction(null);
                    await handleToggleActive(u);
                  }}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition shadow-xs cursor-pointer ${
                    confirmUserAction.action === 'deactivate'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  }`}
                >
                  {confirmUserAction.action === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Reactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
