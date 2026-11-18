'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Users,
  UserCheck,
  X,
  ShieldCheck,
} from 'lucide-react';
import { formatDate, STATUS_LABELS, formatUserRole } from '@/lib/utils';

function FollowUpsContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'all'>(
    filterParam === 'overdue' ? 'overdue' : 'today'
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('ALL');

  // Reassignment Modal State (CEO & MD only)
  const [reassignLead, setReassignLead] = useState<any | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [reassigning, setReassigning] = useState(false);

  const isExecutive = currentUser?.role === 'ADMIN' || currentUser?.role === 'CEO' || data?.isExecutive;

  const fetchStats = (userFilter = selectedUser) => {
    setLoading(true);
    const url =
      userFilter && userFilter !== 'ALL'
        ? `/api/dashboard/stats?userId=${userFilter}`
        : '/api/dashboard/stats';

    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          if (d.user.role === 'ADMIN' || d.user.role === 'CEO') {
            fetch('/api/users')
              .then((r) => r.json())
              .then((u) => setUsers(u.users || []))
              .catch(console.error);
          }
        }
      })
      .catch(console.error);

    fetchStats('ALL');
  }, []);

  const handleMarkComplete = async (prospectId: string) => {
    try {
      await fetch(`/api/prospects/${prospectId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markCompleted: true }),
      });
      fetchStats(selectedUser);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteReassign = async () => {
    if (!reassignLead) return;
    try {
      setReassigning(true);
      const res = await fetch(`/api/prospects/${reassignLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedUserId: targetUserId === 'UNASSIGNED' ? null : targetUserId,
        }),
      });

      if (res.ok) {
        setReassignLead(null);
        fetchStats(selectedUser);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to reassign prospect');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while reassigning lead');
    } finally {
      setReassigning(false);
    }
  };

  if (loading || !data || !data.metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { todaysFollowUps, overdueFollowUps } = data;
  const currentList = activeTab === 'today' ? todaysFollowUps : overdueFollowUps;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Follow-up Management
            </h1>
            {isExecutive ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                CEO &amp; MD Access
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Personal Follow-ups
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ensure zero dropped leads by staying on top of scheduled and overdue prospect touches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Executive Filter: "Whose Follow-up?" for CEO & MD */}
          {isExecutive && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Whose Follow-up:</span>
              </span>
              <select
                value={selectedUser}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedUser(val);
                  fetchStats(val);
                }}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">Entire Workforce (All Staff)</option>
                <option value="UNASSIGNED">Unassigned Leads</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({formatUserRole(u)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Tabs (Due Today vs Overdue) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'today' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Due Today ({todaysFollowUps.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'overdue' ? 'bg-white text-rose-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Overdue ({overdueFollowUps.length})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Prospect / Company</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Follow-up Date</th>
                <th className="py-3.5 px-4">Channel / Notes</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {activeTab === 'today'
                      ? '🎉 No follow-ups scheduled for today.'
                      : '🎉 Great job! No overdue follow-ups.'}
                  </td>
                </tr>
              ) : (
                currentList.map((p: any) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/prospects/${p.id}`}
                          className="font-bold text-sm text-blue-600 hover:underline block"
                        >
                          {p.companyName}
                        </Link>
                        <span className="text-[11px] text-slate-400 font-mono">{p.prospectCode}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{p.contactPerson || '-'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.whatsappNumber && (
                            <a
                              href={`https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 font-medium text-[11px]"
                            >
                              WhatsApp
                            </a>
                          )}
                          {p.phone && (
                            <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline text-[11px]">
                              Call: {p.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            activeTab === 'overdue' ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {formatDate(p.nextFollowUpDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-1">
                          {p.followUpType || 'Outreach'}
                        </span>
                        <p className="text-slate-600 text-[11px] line-clamp-1">
                          {p.followUpNotes || 'No notes'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {p.assignedUser?.name || 'Unassigned'}
                          </span>
                          {isExecutive && (
                            <button
                              type="button"
                              onClick={() => {
                                setReassignLead(p);
                                setTargetUserId(p.assignedUser?.id || '');
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Reassign lead (CEO & MD Only)"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleMarkComplete(p.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done
                          </button>
                          <Link
                            href={`/prospects/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                          >
                            Open
                          </Link>
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

      {/* Modal: Reassign Lead / Follow-Up (CEO & MD Only) */}
      {reassignLead && isExecutive && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0" onClick={() => setReassignLead(null)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reassign Prospect &amp; Follow-up</h3>
                  <p className="text-[11px] text-slate-500">Executive Authority (CEO &amp; MD Only)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignLead(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Details</span>
                <p className="font-bold text-slate-900">{reassignLead.companyName}</p>
                <p className="text-slate-500 font-mono text-[10px]">Code: {reassignLead.prospectCode}</p>
                <p className="text-slate-600 text-[11px] mt-1">
                  Current Assignee: <strong className="text-slate-800">{reassignLead.assignedUser?.name || 'Unassigned'}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select New Staff Member <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Choose assignee --</option>
                  <option value="UNASSIGNED">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username}) — {formatUserRole(u)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 p-4 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setReassignLead(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reassigning}
                onClick={handleExecuteReassign}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {reassigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FollowUpsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading follow-ups...</div>}>
        <FollowUpsContent />
      </Suspense>
    </AppLayout>
  );
}
