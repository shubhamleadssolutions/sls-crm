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
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  status: string;
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

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [notesInput, setNotesInput] = useState('');
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

  const handlePunch = async (action: 'PUNCH_IN' | 'PUNCH_OUT') => {
    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notesInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to process punch request' });
      } else {
        setFeedback({ type: 'success', message: data.message || 'Action recorded successfully!' });
        setNotesInput('');
        await fetchAttendance();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error occurred' });
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              <span>Workforce & Shift Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Attendance &amp; Time Tracking
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record daily check-in, check-out, working hours, and shift compliance.
            </p>
          </div>

          {/* Live Clock Pill */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 self-start sm:self-auto">
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

        {/* Main Punch-In / Punch-Out Interactive Dashboard Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Action Hero Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden flex flex-col justify-between">
            {/* Background Glow Deco */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

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

              {/* Status Display */}
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

              {/* Shift Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Punch In Time</p>
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
                  <p className="text-[10px] uppercase font-bold text-slate-400">Punch Out Time</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {todayRecord?.punchOut
                      ? new Date(todayRecord.punchOut).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : isCheckedIn
                      ? 'In Progress'
                      : '--:--'}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {todayRecord?.status || 'Awaiting Check-in'}
                  </p>
                </div>
              </div>
            </div>

            {/* Shift Action Controls */}
            <div className="pt-6 mt-6 border-t border-white/10 relative z-10 space-y-3">
              {!isShiftCompleted && (
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <input
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder={
                      !todayRecord ? 'Optional note (e.g. Working from Client Office, Pune HQ)...' : 'Remarks before checkout...'
                    }
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                  />

                  {!todayRecord ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handlePunch('PUNCH_IN')}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      <span>{submitting ? 'Recording...' : 'Punch In Now'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handlePunch('PUNCH_OUT')}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>{submitting ? 'Recording...' : 'Punch Out & End Shift'}</span>
                    </button>
                  )}
                </div>
              )}

              {isShiftCompleted && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>You have finished today's shift. Have a great evening!</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Done
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics & Standard Policies Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Work Policy Rules</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                  SLS Guidelines
                </span>
              </div>

              <div className="space-y-3 mt-4 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Standard Shift:</strong> 10:00 AM – 7:00 PM IST (Mon–Sat)
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Grace Period:</strong> Punch-in before 10:15 AM is on-time; after 10:15 AM is marked <span className="text-amber-700 font-semibold">Late</span>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Half-Day Threshold:</strong> Total shift under 4.5 hours is logged as <span className="text-purple-700 font-semibold">Half-Day</span>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Attendance Sync:</strong> All records automatically sync with admin payroll &amp; activity reporting.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500">Need leave or shift adjustments?</p>
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
                  <span>Team Status Today ({teamToday.length})</span>
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Showing recent logs &bull; Instant auto-sync
            </span>
          </div>

          {/* Tab 1: My Attendance History Table */}
          {activeTab === 'my' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Punch In</th>
                    <th className="px-5 py-3">Punch Out</th>
                    <th className="px-5 py-3">Hours Logged</th>
                    <th className="px-5 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
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
                          <td className="px-5 py-3.5 text-slate-500 max-w-[160px] truncate">
                            {rec.notes || '—'}
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
              <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Team Member</th>
                    <th className="px-5 py-3">Role / Designation</th>
                    <th className="px-5 py-3">Today's Status</th>
                    <th className="px-5 py-3">Punch In</th>
                    <th className="px-5 py-3">Punch Out</th>
                    <th className="px-5 py-3">Logged Hours</th>
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
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {member.workingHours ? `${member.workingHours} hrs` : member.punchIn ? 'Active' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
