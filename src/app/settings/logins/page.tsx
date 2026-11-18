'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Info,
  Calendar,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';

interface LoginRecordItem {
  id: string;
  userId: string | null;
  username: string;
  name: string;
  role: string;
  platform: 'Computer' | 'Mobile' | 'Tablet' | string;
  device: string;
  os: string;
  browser: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILED' | string;
  failureReason: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
    role: string;
    designation: string | null;
    isActive: boolean;
  } | null;
}

interface StatsSummary {
  total: number;
  today: number;
  computer: number;
  mobile: number;
  failed: number;
}

const ROLE_DISPLAY: Record<string, { label: string; badge: string }> = {
  ADMIN: { label: 'Managing Director (MD)', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  CEO: { label: 'CEO', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  IT_ADMIN: { label: 'IT Manager', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  ACCOUNT_MANAGER: { label: 'Account Manager', badge: 'bg-teal-100 text-teal-700 border-teal-200' },
  COUNSELLOR: { label: 'Counsellor', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  FIELD_AGENT: { label: 'Field Agent', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  MARKETING: { label: 'Digital Marketer', badge: 'bg-rose-100 text-rose-700 border-rose-200' },
  GUEST: { label: 'Guest / Unknown', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function LoginActivityPage() {
  const [records, setRecords] = useState<LoginRecordItem[]>([]);
  const [stats, setStats] = useState<StatsSummary>({
    total: 0,
    today: 0,
    computer: 0,
    mobile: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<LoginRecordItem | null>(null);

  const fetchRecords = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (platformFilter !== 'ALL') params.set('platform', platformFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('limit', '150');

      const res = await fetch(`/api/logins?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load login activities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, platformFilter, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Live Auto-Refresh every 12 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchRecords(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchRecords]);

  // CSV Export
  const exportToCSV = () => {
    if (!records.length) return;
    const headers = [
      'Timestamp (IST)',
      'User Name',
      'Username',
      'Role',
      'Platform',
      'Device',
      'OS',
      'Browser',
      'IP Address',
      'Status',
      'Failure Reason',
    ];

    const rows = records.map((r) => [
      `"${new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
      `"${r.name}"`,
      `"@${r.username}"`,
      `"${r.role}"`,
      `"${r.platform}"`,
      `"${r.device}"`,
      `"${r.os}"`,
      `"${r.browser}"`,
      `"${r.ipAddress}"`,
      `"${r.status}"`,
      `"${r.failureReason || 'N/A'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sls-crm-login-activity-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Computer':
        return <Laptop className="w-4 h-4 text-blue-600" />;
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-purple-600" />;
      default:
        return <Globe className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                User Login Activity
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                Administration
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Real-time audit log tracking team sign-in sessions, exact timestamp, client platform (Computer vs Mobile), device details, operating system, and IP address.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={autoRefresh ? 'Live refresh active every 12s' : 'Live refresh paused'}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{autoRefresh ? 'Live Polling' : 'Polling Off'}</span>
            </button>

            <button
              onClick={() => fetchRecords(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Logins</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Historical CRM sessions</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Today</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{stats.today}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sessions logged today</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Computers</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.computer}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Desktop & Laptop PCs</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mobile Devices</span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.mobile}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Phones & Tablets</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed Attempts</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600 mt-2">{stats.failed}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Bad password or blocked</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, @username, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-bold">Platform:</span>
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Platforms</option>
              <option value="Computer">💻 Computer (Desktop/Laptop)</option>
              <option value="Mobile">📱 Mobile (Smartphones)</option>
              <option value="Tablet">📟 Tablet</option>
            </select>
          </div>
        </div>

        {/* Login Activity Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Audit Records</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {records.length} shown
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">Click any row for complete technical details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Team Member</th>
                  <th className="py-3.5 px-4">Platform</th>
                  <th className="py-3.5 px-4">Client IP</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Login Time (IST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                      <p className="font-semibold text-xs">Loading login activity log...</p>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700 text-sm">No login records found</p>
                      <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const roleInfo = ROLE_DISPLAY[r.role] || { label: r.role, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedRecord(r)}
                        className="hover:bg-purple-50/40 transition cursor-pointer group"
                      >
                        {/* User & Role */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 group-hover:bg-purple-100 group-hover:text-purple-700 transition">
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{r.name}</span>
                                <span className="text-[11px] font-mono text-slate-400">@{r.username}</span>
                              </p>
                              <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold border ${roleInfo.badge}`}>
                                {roleInfo.label}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Platform Badge */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs">
                            {getPlatformIcon(r.platform)}
                            <span>{r.platform}</span>
                          </div>
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                            {r.ipAddress}
                          </span>
                        </td>

                        {/* IST Timestamp in SF Pro font */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <p className="font-time font-bold text-slate-800 text-xs">
                            {new Date(r.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Kolkata',
                            })}
                          </p>
                          <p className="text-[10px] text-slate-400 font-time">
                            {formatDate(r.createdAt)}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Full Technical Details View (Responsive & Scroll-Safe) */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setSelectedRecord(null)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Session Technical Details</h3>
                    <p className="text-[11px] text-slate-500">Security audit verification log</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* User Info Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Authenticated User</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedRecord.name}</p>
                    <p className="text-xs font-mono text-purple-600 font-semibold">@{selectedRecord.username}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Role</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedRecord.role}</p>
                  </div>
                </div>

                {/* Device & Client Specs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Platform Type</span>
                    <p className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      {getPlatformIcon(selectedRecord.platform)}
                      <span>{selectedRecord.platform}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Device Hardware</span>
                    <p className="font-bold text-slate-900 mt-1">{selectedRecord.device}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Operating System</span>
                    <p className="font-bold text-slate-900 mt-1">{selectedRecord.os}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Web Browser</span>
                    <p className="font-bold text-slate-900 mt-1">{selectedRecord.browser}</p>
                  </div>
                </div>

                {/* Network & IP */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Client IP Address</span>
                    <span className="text-[10px] text-slate-500 font-medium">Logged by proxy headers</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 text-sm">{selectedRecord.ipAddress}</p>
                </div>

                {/* Status & Failure Reason if any */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Attempt Status</span>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedRecord.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authentication Succeeded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Authentication Failed</span>
                      </span>
                    )}
                  </div>
                  {selectedRecord.failureReason && (
                    <p className="text-xs text-rose-600 mt-2 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <strong>Failure Reason:</strong> {selectedRecord.failureReason}
                    </p>
                  )}
                </div>

                {/* Exact Raw User Agent */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Raw User Agent String</span>
                  <div className="mt-1 p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] leading-relaxed break-all select-all">
                    {selectedRecord.userAgent}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Exact Time (IST):</span>
                  <span className="font-time font-bold text-slate-800">
                    {new Date(selectedRecord.createdAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
              </div>

              <div className="p-4 pt-3 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
