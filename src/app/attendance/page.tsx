'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Timer,
  TrendingUp,
  UserCheck,
  UserX,
  History,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Coffee,
  ListTodo,
  FileCheck2,
  MapPin,
  Building,
  Home,
  Briefcase,
  X,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  status: string;
  plannedTasks: string | null;
  workDone: string | null;
  workLocation: string | null;
  notes: string | null;
  workingHours: number | null;
}

interface TeamMemberAttendance {
  userId: string;
  name: string;
  username: string;
  role: string;
  designation: string | null;
  status: string;
  punchIn: string | null;
  punchOut: string | null;
  workingHours: number | null;
  plannedTasks: string | null;
  workDone: string | null;
  workLocation: string | null;
}

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    avgHours: '8.0',
    onTimeRate: 100,
  });
  const [teamToday, setTeamToday] = useState<TeamMemberAttendance[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');

  // Modals
  const [showPunchInModal, setShowPunchInModal] = useState(false);
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);
  const [selectedRecordForView, setSelectedRecordForView] = useState<AttendanceRecord | TeamMemberAttendance | null>(null);

  // Form State
  const [plannedTasksInput, setPlannedTasksInput] = useState('');
  const [workDoneInput, setWorkDoneInput] = useState('');
  const [locationInput, setLocationInput] = useState('Office');
  const [notesInput, setNotesInput] = useState('');
  const [formError, setFormError] = useState('');

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance');
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data.todayRecord || null);
        setHistory(data.history || []);
        if (data.stats) setStats(data.stats);
        if (data.teamToday) setTeamToday(data.teamToday);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handlePunchInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!plannedTasksInput.trim() || plannedTasksInput.trim().length < 5) {
      setFormError('Please enter your tasks / goals for today (minimum 5 characters).');
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PUNCH_IN',
          plannedTasks: plannedTasksInput.trim(),
          workLocation: locationInput,
          notes: notesInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to punch in');
      } else {
        setFeedback({ type: 'success', message: data.message });
        setShowPunchInModal(false);
        setPlannedTasksInput('');
        setNotesInput('');
        await fetchAttendance();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePunchOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!workDoneInput.trim() || workDoneInput.trim().length < 5) {
      setFormError('Please summarize your work completed today before punching out (minimum 5 characters).');
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PUNCH_OUT',
          workDone: workDoneInput.trim(),
          notes: notesInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to punch out');
      } else {
        setFeedback({ type: 'success', message: data.message });
        setShowPunchOutModal(false);
        setWorkDoneInput('');
        setNotesInput('');
        await fetchAttendance();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Format Elapsed Active Shift Time
  const getActiveDuration = () => {
    if (!todayRecord?.punchIn || todayRecord.punchOut || !currentTime) return null;
    const start = new Date(todayRecord.punchIn).getTime();
    const now = currentTime.getTime();
    const diff = Math.max(0, now - start);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  const isCheckedIn = Boolean(todayRecord && !todayRecord.punchOut);
  const isShiftCompleted = Boolean(todayRecord && todayRecord.punchOut);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              <span>Professional Workforce &amp; Shift Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Attendance &amp; Daily Task Tracking
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated timestamp logging with planned tasks on check-in and work reports on check-out.
            </p>
          </div>

          {/* Live Automatic Clock Pill */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 self-start sm:self-auto shrink-0 shadow-xs">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <p className="text-base sm:text-lg font-black font-mono text-slate-900 leading-tight">
                {currentTime ? currentTime.toLocaleTimeString('en-IN', { hour12: true }) : '--:--:--'}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {currentTime
                  ? currentTime.toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Today'}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
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

        {/* Shift Action Hero Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/10 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Today's Shift Status
                </span>

                {isCheckedIn ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active Shift In Progress
                  </span>
                ) : isShiftCompleted ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Shift Completed
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Not Punched In
                  </span>
                )}
              </div>

              {/* Working Hours Counter */}
              <div>
                <p className="text-xs text-slate-400 font-medium">Logged Shift Duration</p>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                  {isCheckedIn ? (
                    <span className="text-emerald-300">{getActiveDuration() || '00h 00m 00s'}</span>
                  ) : isShiftCompleted ? (
                    <span className="text-blue-300">{todayRecord?.workingHours} Hours Logged</span>
                  ) : (
                    <span className="text-slate-400">00h 00m 00s</span>
                  )}
                </div>
              </div>

              {/* Shift Timestamps Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Automatic In Time</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {todayRecord?.punchIn
                      ? new Date(todayRecord.punchIn).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : '--:--'}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Automatic Out Time</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {todayRecord?.punchOut
                      ? new Date(todayRecord.punchOut).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : isCheckedIn
                      ? 'In Shift'
                      : '--:--'}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Attendance Status</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {todayRecord?.status || 'Awaiting Check-in'}
                  </p>
                </div>
              </div>

              {/* Today's Tasks Display inside Shift Card if checked in or completed */}
              {todayRecord?.plannedTasks && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1 mt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-amber-400" />
                      Planned Tasks for Today
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Location: {todayRecord.workLocation || 'Office'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {todayRecord.plannedTasks}
                  </p>
                </div>
              )}

              {/* Work Done Display if completed */}
              {todayRecord?.workDone && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 space-y-1 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Work Done / Report Submitted at Checkout</span>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {todayRecord.workDone}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 mt-6 border-t border-white/10 relative z-10 flex flex-wrap items-center justify-between gap-4">
              {!todayRecord && (
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setShowPunchInModal(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <Clock className="w-4 h-4" />
                  <span>Punch In &amp; Enter Today's Tasks</span>
                </button>
              )}

              {isCheckedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setShowPunchOutModal(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Punch Out &amp; Submit Work Done</span>
                </button>
              )}

              {isShiftCompleted && (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Your shift and daily work report have been logged successfully!</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Completed
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines & Policy Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Attendance Rules</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                  SLS Guidelines
                </span>
              </div>

              <div className="space-y-3 mt-4 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Automatic Timestamps:</strong> Time is fetched directly from the official system clock. Manual editing is restricted.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Morning Tasks Required:</strong> During punch-in, enter your priority tasks to stay aligned on daily goals.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Evening Summary Required:</strong> During punch-out, submit your completed work summary for executive review.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Grace Period:</strong> Punctual punch-in before 10:15 AM IST. After 10:15 AM is logged as <span className="text-amber-700 font-semibold">Late</span>.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500">Need leave or adjustments?</p>
              <p className="text-xs font-bold text-blue-600 mt-0.5">
                Contact HR Administrator or Team Lead
              </p>
            </div>
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Days Present</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalDays}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded this month</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">On-Time Rate</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{stats.onTimeRate}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Punctuality compliance</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Avg Daily Hours</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600 mt-2">{stats.avgHours}h</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Per full shift</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Late Marks</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600 mt-2">{stats.lateCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.halfDayCount} half-day shifts</p>
          </div>
        </div>

        {/* Tab Toggle: My History vs Team Attendance (if Admin) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'my'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>My Attendance History</span>
              </button>

              {teamToday.length > 0 && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'team'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Team Status &amp; Tasks Today ({teamToday.length})</span>
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Click any row or "View Details" to see planned tasks and work reports
            </span>
          </div>

          {/* Tab 1: My Attendance History Table */}
          {activeTab === 'my' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Automatic In</th>
                    <th className="px-5 py-3">Automatic Out</th>
                    <th className="px-5 py-3">Hours Logged</th>
                    <th className="px-5 py-3">Planned Tasks</th>
                    <th className="px-5 py-3">Work Done</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        No previous attendance records found yet. Punch in above to start your shift!
                      </td>
                    </tr>
                  ) : (
                    history.map((rec) => {
                      const recDate = new Date(rec.date);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {recDate.toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                rec.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rec.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {rec.status === 'PRESENT' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono">
                            {new Date(rec.punchIn).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </td>
                          <td className="px-5 py-3.5 font-mono">
                            {rec.punchOut
                              ? new Date(rec.punchOut).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : '—'}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {rec.workingHours ? `${rec.workingHours} hrs` : 'In progress'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">
                            {rec.plannedTasks || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">
                            {rec.workDone || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedRecordForView(rec)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="View Full Task & Work Report"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Team Status Today (Executive / Admin) */}
          {activeTab === 'team' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Team Member</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Today's Status</th>
                    <th className="px-5 py-3">In Time</th>
                    <th className="px-5 py-3">Out Time</th>
                    <th className="px-5 py-3">Tasks for the Day</th>
                    <th className="px-5 py-3">Work Done</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamToday.map((member) => (
                    <tr key={member.userId} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{member.username}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800">{member.designation || member.role}</span>
                        <div className="text-[10px] text-slate-400">{member.role}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            member.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : member.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : member.status === 'HALF_DAY'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {member.status === 'NOT_MARKED' ? 'Not Checked In' : member.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {member.punchIn
                          ? new Date(member.punchIn).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {member.punchOut
                          ? new Date(member.punchOut).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : member.punchIn
                          ? 'In Shift'
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">
                        {member.plannedTasks || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">
                        {member.workDone || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {(member.plannedTasks || member.workDone) && (
                          <button
                            onClick={() => setSelectedRecordForView(member as any)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Inspect Task & Work Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PUNCH IN - ENTER TODAY'S PLANNED TASKS (AUTOMATIC TIME FETCHED)  */}
      {/* ========================================================================= */}
      {showPunchInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Shift Punch In</h3>
                  <p className="text-[11px] text-slate-500">Official time fetched automatically</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPunchInModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePunchInSubmit} className="space-y-4">
              {/* Automatic System Time Banner */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Current Server Time</p>
                  <p className="text-base font-black font-mono text-slate-900">
                    {currentTime ? currentTime.toLocaleTimeString('en-IN', { hour12: true }) : '--:--:--'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Captured
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Grace period until 10:15 AM</p>
                </div>
              </div>

              {/* Work Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Work Location
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Office', label: 'Office HQ', icon: Building },
                    { id: 'WFH', label: 'Remote / WFH', icon: Home },
                    { id: 'Client Visit', label: 'Client Visit', icon: Briefcase },
                  ].map((loc) => {
                    const LocIcon = loc.icon;
                    const isSelected = locationInput === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setLocationInput(loc.id)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <LocIcon className="w-4 h-4" />
                        <span>{loc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tasks for the Day Input (Required) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-blue-600" />
                    <span>Today's Tasks &amp; Goals</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Mandatory for Shift Start</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={plannedTasksInput}
                  onChange={(e) => setPlannedTasksInput(e.target.value)}
                  placeholder="Outline your planned tasks for today, e.g.:&#10;• Call 20 new prospects from Pune IT list&#10;• Follow up with 3 pending proposals&#10;• Conduct product demo at 3:00 PM with Apex Institute&#10;• Update CRM pipeline status"
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-2xl p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-400 leading-relaxed"
                />
              </div>

              {/* Quick Helper Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400">Quick insert:</span>
                {[
                  'Outreach & Cold Calling',
                  'Proposal Follow-ups',
                  'Client Demo Meeting',
                  'Ad Campaign Setup',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setPlannedTasksInput((prev) =>
                        prev ? `${prev}\n• ${chip}` : `• ${chip}`
                      )
                    }
                    className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPunchInModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>{submitting ? 'Recording Shift...' : 'Confirm Punch In'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PUNCH OUT - ENTER WORK DONE / SUMMARY (AUTOMATIC TIME FETCHED)   */}
      {/* ========================================================================= */}
      {showPunchOutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Shift Punch Out &amp; Work Report</h3>
                  <p className="text-[11px] text-slate-500">Official time fetched automatically</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPunchOutModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePunchOutSubmit} className="space-y-4">
              {/* Shift Summary Banner */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Current Server Time</p>
                  <p className="text-base font-black font-mono text-slate-900">
                    {currentTime ? currentTime.toLocaleTimeString('en-IN', { hour12: true }) : '--:--:--'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Calculated Shift Duration</span>
                  <p className="text-sm font-black font-mono text-blue-600">
                    {getActiveDuration() || 'Computing...'}
                  </p>
                </div>
              </div>

              {/* What were the morning planned tasks */}
              {todayRecord?.plannedTasks && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                    Morning Goals Reference:
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap">{todayRecord.plannedTasks}</p>
                </div>
              )}

              {/* Work Done Input (Required) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Summary of Work Done / Tasks Accomplished</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Mandatory for Checkout</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={workDoneInput}
                  onChange={(e) => setWorkDoneInput(e.target.value)}
                  placeholder="Summarize the work you completed today, e.g.:&#10;• Contacted 22 prospects via phone & WhatsApp&#10;• Sent proposals to 2 institutes (ABC Academy, TechSkills)&#10;• Demo completed with Apex Institute, client requested quote&#10;• Added 5 new leads in CRM"
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-2xl p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-400 leading-relaxed"
                />
              </div>

              {/* Quick Helper Chips for Work Done */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400">Quick insert:</span>
                {[
                  'Completed daily calls target',
                  'Sent proposal quotes',
                  'Client meeting conducted',
                  'Follow-up reminders resolved',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setWorkDoneInput((prev) =>
                        prev ? `${prev}\n• ${chip}` : `• ${chip}`
                      )
                    }
                    className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPunchOutModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Coffee className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Report...' : 'Confirm Punch Out & End Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW FULL TASK & WORK DETAILS FOR ANY RECORD                     */}
      {/* ========================================================================= */}
      {selectedRecordForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {'name' in selectedRecordForView
                      ? `${selectedRecordForView.name}'s Attendance Details`
                      : 'Attendance Record Details'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Status: <span className="font-bold text-slate-800">{selectedRecordForView.status}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForView(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Timing Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Punch In</span>
                  <p className="font-mono font-bold text-slate-900">
                    {selectedRecordForView.punchIn
                      ? new Date(selectedRecordForView.punchIn).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Punch Out</span>
                  <p className="font-mono font-bold text-slate-900">
                    {selectedRecordForView.punchOut
                      ? new Date(selectedRecordForView.punchOut).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'In Progress'}
                  </p>
                </div>
              </div>

              {/* Planned Tasks */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-blue-600" />
                  <span>Tasks Planned on Punch-In:</span>
                </label>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 whitespace-pre-wrap leading-relaxed text-slate-700">
                  {selectedRecordForView.plannedTasks || 'No tasks recorded.'}
                </div>
              </div>

              {/* Work Done */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Work Done Submitted on Punch-Out:</span>
                </label>
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 whitespace-pre-wrap leading-relaxed text-slate-800">
                  {selectedRecordForView.workDone || 'Pending (Shift currently active).'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecordForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
