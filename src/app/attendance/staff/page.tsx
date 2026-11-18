'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  Palmtree,
  UserCheck,
  UserX,
  Eye,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  Percent,
  Timer,
  FileText,
  Briefcase,
  Building,
  Home,
  RotateCcw,
  CalendarDays,
  ListTodo,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface DayRecord {
  id?: string;
  userId: string;
  name: string;
  username: string;
  role: string;
  designation: string | null;
  shiftTiming: string;
  status: string;
  punchIn: string | null;
  punchOut: string | null;
  workingHours: number | null;
  plannedTasks: string | null;
  workDone: string | null;
  workLocation: string | null;
  notes: string | null;
}

interface DateAttendanceData {
  dateStr: string;
  formattedDate: string;
  isSunday: boolean;
  isBeforeLaunch: boolean;
  isToday: boolean;
  isFuture: boolean;
  stats: {
    totalStaff: number;
    totalPresent: number;
    totalLate: number;
    totalHalfDay: number;
    totalLeave: number;
    totalAbsent: number;
    totalHours: number;
  };
  records: DayRecord[];
}

export default function StaffAttendancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active sub-section tab: 'today' = Today's Live Attendance | 'date' = Date-wise Records
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'date'>('today');

  // Today's staff attendance list from API
  const [todayStaff, setTodayStaff] = useState<any[]>([]);

  // Selected Date state for Historical / Date-wise attendance
  // Default to today's or yesterday's date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [dateAttendance, setDateAttendance] = useState<DateAttendanceData | null>(null);
  const [loadingDateData, setLoadingDateData] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [inspectRecord, setInspectRecord] = useState<DayRecord | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    targetUserId: '',
    isRange: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    leaveType: 'LEAVE',
    reason: '',
  });

  const isExecutive = currentUser ? currentUser.role === 'ADMIN' || currentUser.role === 'CEO' : false;

  // 1. Initial auth check
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (d?.user) {
          setCurrentUser(d.user);
          if (d.user.role !== 'ADMIN' && d.user.role !== 'CEO') {
            router.push('/attendance');
          }
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // 2. Fetch staff attendance data
  const fetchStaffData = async (targetDate: string = selectedDate) => {
    try {
      setLoadingDateData(true);
      const res = await fetch(`/api/attendance?date=${targetDate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.staffAttendance) {
          setTodayStaff(data.staffAttendance);
        }
        if (data.dateAttendance) {
          setDateAttendance(data.dateAttendance);
        }
      }
    } catch (err) {
      console.error('Failed to load staff attendance:', err);
    } finally {
      setLoading(false);
      setLoadingDateData(false);
    }
  };

  useEffect(() => {
    if (isExecutive) {
      fetchStaffData(selectedDate);
    }
  }, [isExecutive, selectedDate]);

  // Quick date jump handlers
  const setQuickDate = (daysAgo: number) => {
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    setSelectedDate(target.toISOString().split('T')[0]);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  // Mark Leave / Half-day handler
  const handleMarkLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.targetUserId) {
      setFeedback({ type: 'error', message: 'Please select an employee.' });
      return;
    }
    if (!leaveForm.startDate) {
      setFeedback({ type: 'error', message: 'Please choose the leave date.' });
      return;
    }

    setLeaveSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MARK_LEAVE',
          targetUserId: leaveForm.targetUserId,
          startDate: leaveForm.startDate,
          endDate: leaveForm.isRange ? leaveForm.endDate : leaveForm.startDate,
          leaveType: leaveForm.leaveType,
          reason: leaveForm.reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record leave');
      }

      setFeedback({ type: 'success', message: data.message || 'Leave successfully recorded!' });
      setShowLeaveModal(false);
      setLeaveForm({
        targetUserId: '',
        isRange: false,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        leaveType: 'LEAVE',
        reason: '',
      });
      await fetchStaffData(selectedDate);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error recording leave.' });
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Present
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Late
          </span>
        );
      case 'HALF_DAY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Percent className="w-3 h-3 text-sky-600" />
            Half Day
          </span>
        );
      case 'LEAVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Palmtree className="w-3 h-3 text-purple-600" />
            Leave
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <UserX className="w-3 h-3 text-rose-600" />
            Absent
          </span>
        );
      case 'WEEKEND':
      case 'WEEKLY_OFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Weekly Off
          </span>
        );
      case 'PRE_LAUNCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200">
            Pre-launch
          </span>
        );
      case 'YET_TO_ARRIVE':
      case 'NOT_MARKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Yet to Arrive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Format time (e.g. "12:04 PM")
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '-';
    }
  };

  // Filtered Date Records
  const filteredDateRecords = useMemo(() => {
    if (!dateAttendance?.records) return [];
    return dateAttendance.records.filter((rec) => {
      const matchSearch =
        !searchTerm ||
        rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [dateAttendance, searchTerm, statusFilter]);

  // Filtered Today Records
  const filteredTodayRecords = useMemo(() => {
    return todayStaff.filter((rec) => {
      const matchSearch =
        !searchTerm ||
        rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || rec.todayStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [todayStaff, searchTerm, statusFilter]);

  if (loading && !currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isExecutive) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <UserX className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Staff Attendance is restricted exclusively to the Chief Executive Officer (CEO) and Managing Director (MD).
          </p>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Go to My Attendance &rarr;
          </Link>
        </div>
      </AppLayout>
    );
  }

  const todayCountPresent = todayStaff.filter(
    (m) => m.todayStatus === 'PRESENT' || m.todayStatus === 'LATE' || m.punchInToday
  ).length;
  const todayCountLate = todayStaff.filter((m) => m.todayStatus === 'LATE').length;
  const todayCountHalfDay = todayStaff.filter((m) => m.todayStatus === 'HALF_DAY').length;
  const todayCountLeave = todayStaff.filter((m) => m.todayStatus === 'LEAVE').length;
  const todayCountAbsent = todayStaff.filter((m) => m.todayStatus === 'ABSENT').length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
        {/* Navigation Breadcrumb & Executive Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-700" />
                CEO &amp; MD Access Only
              </span>
              <span className="text-xs text-slate-400 font-mono">SLS Workforce Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Staff Attendance &amp; Daily Oversight
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live staff presence today, punch-in/out timestamps, daily task submissions, and historical date records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Quick Action: Mark Leave */}
            <button
              type="button"
              onClick={() => {
                setLeaveForm({
                  targetUserId: todayStaff[0]?.userId || '',
                  isRange: false,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  leaveType: 'LEAVE',
                  reason: '',
                });
                setShowLeaveModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Staff Leave / Half-Day</span>
            </button>

            {/* Link to Personal Attendance */}
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>My Attendance &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-scale-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2 Primary Sub-sections / Tabs: 'today' vs 'date' */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/60 max-w-md">
          <button
            type="button"
            onClick={() => setActiveSubTab('today')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'today'
                ? 'bg-white text-indigo-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Today&apos;s Attendance</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-mono">
              Live
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('date')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'date'
                ? 'bg-white text-indigo-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span>Date-wise Records</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
              Archive
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-SECTION 1: TODAY'S LIVE ATTENDANCE                                   */}
        {/* ========================================================================= */}
        {activeSubTab === 'today' && (
          <div className="space-y-5 animate-fade-in">
            {/* Live Today KPI Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Workforce</span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{todayStaff.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Active team members</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Present Today</span>
                <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                  {todayCountPresent}{' '}
                  <span className="text-xs font-semibold text-emerald-600 font-sans">
                    ({todayCountLate} late)
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Checked in</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-sky-200/80 bg-sky-50/20 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-sky-800">Half Day</span>
                <p className="text-2xl font-black text-sky-700 mt-1 font-mono">{todayCountHalfDay}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Half shift</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-purple-200/80 bg-purple-50/20 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-purple-800">Approved Leave</span>
                <p className="text-2xl font-black text-purple-700 mt-1 font-mono">{todayCountLeave}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Scheduled off</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-rose-800">Absent</span>
                <p className="text-2xl font-black text-rose-700 mt-1 font-mono">{todayCountAbsent}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Shift ended without punch</p>
              </div>
            </div>

            {/* Filter bar for Today */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter team member name, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">Leave</option>
                  <option value="ABSENT">Absent</option>
                </select>
                <button
                  onClick={() => fetchStaffData(selectedDate)}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Refresh Live Data"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Today's Live Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Live Today Shift Progress ({new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Showing {filteredTodayRecords.length} staff members
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Staff Member</th>
                      <th className="px-4 py-3.5">Shift Assigned</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Punch In</th>
                      <th className="px-4 py-3.5 text-center">Punch Out</th>
                      <th className="px-4 py-3.5 text-center">Active / Total Hours</th>
                      <th className="px-5 py-3.5">Today&apos;s Planned Goals &amp; Completed Work</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTodayRecords.map((m) => (
                      <tr key={m.userId} className="hover:bg-slate-50/70 transition">
                        {/* Member */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{m.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">@{m.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Shift */}
                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-800">{m.designation || m.role}</span>
                          <div className="text-[10px] text-slate-400 font-time">{m.shiftTiming}</div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">{getStatusBadge(m.todayStatus)}</td>

                        {/* Punch In */}
                        <td className="px-4 py-4 text-center font-time font-bold text-slate-800">
                          {formatTime(m.punchInToday)}
                        </td>

                        {/* Punch Out */}
                        <td className="px-4 py-4 text-center font-time font-bold text-slate-800">
                          {m.punchOutToday ? (
                            formatTime(m.punchOutToday)
                          ) : m.punchInToday ? (
                            <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1 font-time">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active In Shift
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Hours */}
                        <td className="px-4 py-4 text-center font-time font-bold text-indigo-700">
                          {m.workingHoursToday ? `${m.workingHoursToday} hrs` : m.punchInToday ? 'In Progress' : '-'}
                        </td>

                        {/* Planned tasks & work done */}
                        <td className="px-5 py-4 max-w-xs">
                          {m.plannedTasksToday ? (
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold text-slate-800 line-clamp-1">
                                <span className="text-slate-400 font-normal">Goals:</span> {m.plannedTasksToday}
                              </p>
                              {m.workDoneToday && (
                                <p className="text-[11px] text-emerald-700 line-clamp-1">
                                  <span className="text-slate-400 font-normal">Done:</span> {m.workDoneToday}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No task update logged yet</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setInspectRecord({
                                userId: m.userId,
                                name: m.name,
                                username: m.username,
                                role: m.role,
                                designation: m.designation,
                                shiftTiming: m.shiftTiming,
                                status: m.todayStatus,
                                punchIn: m.punchInToday,
                                punchOut: m.punchOutToday,
                                workingHours: m.workingHoursToday,
                                plannedTasks: m.plannedTasksToday,
                                workDone: m.workDoneToday,
                                workLocation: null,
                                notes: null,
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-SECTION 2: DATE-WISE ATTENDANCE ARCHIVE                               */}
        {/* ========================================================================= */}
        {activeSubTab === 'date' && (
          <div className="space-y-5 animate-fade-in">
            {/* Interactive Date Selector Controls Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Historical Date Selection</h2>
                    <p className="text-[11px] text-slate-500">
                      Choose any date to audit exact punch timings, hours, and daily task achievements.
                    </p>
                  </div>
                </div>

                {/* Primary Date Input */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <label className="text-xs font-bold text-slate-700">Choose Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="px-3.5 py-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  />
                  <button
                    onClick={() => fetchStaffData(selectedDate)}
                    disabled={loadingDateData}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer disabled:opacity-50"
                    title="Reload date"
                  >
                    <RotateCcw className={`w-4 h-4 ${loadingDateData ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Shortcuts:</span>
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    selectedDate === new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  2 Days Ago
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate('2026-11-17')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    selectedDate === '2026-11-17'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tue, 17 Nov 2026
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate('2026-11-16')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    selectedDate === '2026-11-16'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Mon, 16 Nov 2026 (Launch)
                </button>
              </div>
            </div>

            {/* Selected Date Summary Card & Daily Counters */}
            {dateAttendance && (
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-2xl">
                      <Calendar className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                        Workforce Attendance Record
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white">{dateAttendance.formattedDate}</h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {dateAttendance.isSunday && (
                      <span className="px-3 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Sunday &bull; Weekly Off
                      </span>
                    )}
                    {dateAttendance.isBeforeLaunch && (
                      <span className="px-3 py-1 rounded-full font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                        Pre-Launch Period
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full font-bold bg-white/10 text-white border border-white/15">
                      Total Staff: {dateAttendance.stats.totalStaff}
                    </span>
                  </div>
                </div>

                {/* Date Specific KPI Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Present</span>
                    <p className="text-xl font-black mt-0.5 font-mono text-emerald-300">
                      {dateAttendance.stats.totalPresent}
                    </p>
                    <span className="text-[10px] text-slate-400">On time: {dateAttendance.stats.totalPresent - dateAttendance.stats.totalLate}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Late</span>
                    <p className="text-xl font-black mt-0.5 font-mono text-amber-300">
                      {dateAttendance.stats.totalLate}
                    </p>
                    <span className="text-[10px] text-slate-400">Grace exceeded</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-sky-400 font-bold uppercase">Half Day</span>
                    <p className="text-xl font-black mt-0.5 font-mono text-sky-300">
                      {dateAttendance.stats.totalHalfDay}
                    </p>
                    <span className="text-[10px] text-slate-400">Half day log</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-purple-400 font-bold uppercase">Leave</span>
                    <p className="text-xl font-black mt-0.5 font-mono text-purple-300">
                      {dateAttendance.stats.totalLeave}
                    </p>
                    <span className="text-[10px] text-slate-400">Approved leave</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-rose-400 font-bold uppercase">Absent</span>
                    <p className="text-xl font-black mt-0.5 font-mono text-rose-300">
                      {dateAttendance.stats.totalAbsent}
                    </p>
                    <span className="text-[10px] text-slate-400">No shift record</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase">Team Hours</span>
                    <p className="text-xl font-black mt-0.5 font-mono text-white">
                      {dateAttendance.stats.totalHours} <span className="text-xs font-normal text-slate-400">hrs</span>
                    </p>
                    <span className="text-[10px] text-slate-400">Logged on date</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filter controls */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter name, username, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">Leave</option>
                  <option value="ABSENT">Absent</option>
                  <option value="WEEKEND">Weekend</option>
                </select>
              </div>
            </div>

            {/* Comprehensive Date Attendance Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Full Staff Attendance for {dateAttendance?.formattedDate || selectedDate}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {filteredDateRecords.length} records found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[950px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Staff Member</th>
                      <th className="px-4 py-3.5">Assigned Shift</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Punch In</th>
                      <th className="px-4 py-3.5 text-center">Punch Out</th>
                      <th className="px-4 py-3.5 text-center">Duration</th>
                      <th className="px-5 py-3.5">Morning Planned Tasks</th>
                      <th className="px-5 py-3.5">Evening Work Done Report</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDateRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                          No matching records found for this date.
                        </td>
                      </tr>
                    ) : (
                      filteredDateRecords.map((rec) => (
                        <tr key={rec.userId} className="hover:bg-slate-50/70 transition">
                          {/* Member */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                                {rec.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{rec.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">@{rec.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Shift */}
                          <td className="px-4 py-4">
                            <span className="font-semibold text-slate-800">{rec.designation || rec.role}</span>
                            <div className="text-[10px] text-slate-400 font-time">{rec.shiftTiming}</div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">{getStatusBadge(rec.status)}</td>

                          {/* Punch In */}
                          <td className="px-4 py-4 text-center font-time font-bold text-slate-800">
                            {formatTime(rec.punchIn)}
                          </td>

                          {/* Punch Out */}
                          <td className="px-4 py-4 text-center font-time font-bold text-slate-800">
                            {formatTime(rec.punchOut)}
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-4 text-center font-time font-bold text-indigo-700">
                            {rec.workingHours ? `${rec.workingHours} hrs` : rec.punchIn ? 'Open Shift' : '-'}
                          </td>

                          {/* Morning Planned Tasks */}
                          <td className="px-5 py-4 max-w-xs">
                            {rec.plannedTasks ? (
                              <p className="text-[11px] text-slate-800 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                                {rec.plannedTasks}
                              </p>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">-</span>
                            )}
                          </td>

                          {/* Evening Work Done */}
                          <td className="px-5 py-4 max-w-xs">
                            {rec.workDone ? (
                              <p className="text-[11px] text-emerald-800 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                                {rec.workDone}
                              </p>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">-</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectRecord(rec)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                              title="Inspect full work details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Work</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: VIEW FULL WORK REPORT & TASK DETAILS                            */}
        {/* ========================================================================= */}
        {inspectRecord && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="fixed inset-0" onClick={() => setInspectRecord(null)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-700">
                    {inspectRecord.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{inspectRecord.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      @{inspectRecord.username} &bull; {inspectRecord.designation || inspectRecord.role}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectRecord(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                    <div className="mt-0.5">{getStatusBadge(inspectRecord.status)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Shift Hours</span>
                    <p className="font-time font-bold text-slate-800 mt-0.5">{inspectRecord.shiftTiming}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Punch In</span>
                    <p className="font-time font-bold text-slate-800 mt-0.5">{formatTime(inspectRecord.punchIn)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Punch Out</span>
                    <p className="font-time font-bold text-slate-800 mt-0.5">{formatTime(inspectRecord.punchOut)}</p>
                  </div>
                </div>

                {/* Working hours & location */}
                <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="font-bold text-indigo-900">Total Duration:</span>
                  <span className="font-time font-extrabold text-indigo-700 text-sm">
                    {inspectRecord.workingHours ? `${inspectRecord.workingHours} hours` : inspectRecord.punchIn ? 'Currently in shift' : '-'}
                  </span>
                </div>

                {/* Morning Planned Tasks */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ListTodo className="w-4 h-4 text-blue-600" />
                    <span>Morning Planned Tasks / Goals:</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {inspectRecord.plannedTasks || 'No morning tasks entered for this shift.'}
                  </div>
                </div>

                {/* Evening Completed Work */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Evening Work Summary / Completed Tasks:</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-950 leading-relaxed whitespace-pre-wrap">
                    {inspectRecord.workDone || 'Work done summary not submitted yet (shift in progress or absent).'}
                  </div>
                </div>

                {/* Notes if any */}
                {inspectRecord.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Notes:</span>
                    <p className="p-2.5 bg-slate-50 rounded-xl text-slate-600 text-[11px]">
                      {inspectRecord.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setInspectRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: MARK STAFF LEAVE / HALF-DAY (CEO & MD)                           */}
        {/* ========================================================================= */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowLeaveModal(false)} />
            <form
              onSubmit={handleMarkLeave}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Mark Staff Leave / Half-Day</h3>
                    <p className="text-[11px] text-slate-500">Executive Authority (CEO &amp; MD)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 overflow-y-auto pr-1 text-xs">
                {/* Employee select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee</label>
                  <select
                    value={leaveForm.targetUserId}
                    onChange={(e) => setLeaveForm({ ...leaveForm, targetUserId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {todayStaff.map((s) => (
                      <option key={s.userId} value={s.userId}>
                        {s.name} (@{s.username}) &bull; {s.designation || s.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leave Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="LEAVE">Full Day Leave</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>

                {/* Single or Range toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRange"
                    checked={leaveForm.isRange}
                    onChange={(e) => setLeaveForm({ ...leaveForm, isRange: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="isRange" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Apply for multiple dates / date range
                  </label>
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {leaveForm.isRange ? 'Start Date' : 'Leave Date'}
                    </label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      required
                    />
                  </div>

                  {leaveForm.isRange && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={leaveForm.endDate}
                        min={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Note (Required)</label>
                  <textarea
                    rows={2}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="e.g. Approved medical leave / exam preparation..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {leaveSubmitting ? 'Recording...' : 'Record Leave'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
