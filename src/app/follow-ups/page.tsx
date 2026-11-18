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
  Search,
  CalendarDays,
  LayoutGrid,
  List,
  Clock,
  User,
  Calendar,
  RefreshCw,
  TrendingUp,
  Building,
  Check,
} from 'lucide-react';
import { formatDate, formatDateTime, STATUS_LABELS, formatUserRole } from '@/lib/utils';

interface FollowUpItem {
  id: string;
  prospectCode: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  status: string;
  nextFollowUpDate: string | null;
  followUpType: string | null;
  followUpNotes: string | null;
  followUpCount: number;
  urgency: 'CRITICAL_OVERDUE' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
  daysOverdue: number;
  assignedUser: {
    id: string;
    name: string;
    username: string;
    role: string;
    designation: string | null;
  } | null;
  lastActivity?: {
    activity: string;
    result: string;
    date: string;
  } | null;
}

interface CompletedItem {
  activityId: string;
  completedAt: string;
  completedBy: {
    id: string;
    name: string;
    username: string;
    role: string;
    designation: string | null;
  } | null;
  outcome: string;
  notes: string;
  channel: string;
  prospect: {
    id: string;
    prospectCode: string;
    companyName: string;
    contactPerson: string | null;
    phone: string | null;
    whatsappNumber: string | null;
    status: string;
    nextFollowUpDate: string | null;
    followUpType: string | null;
    assignedUser: {
      id: string;
      name: string;
      username: string;
      role: string;
      designation: string | null;
    } | null;
  } | null;
}

const OUTCOME_OPTIONS = [
  { value: 'CONNECTED_INTERESTED', label: 'Connected & Interested', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'BUSY_CALL_BACK', label: 'Busy / Call Back Requested', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'NO_ANSWER', label: 'Ringing / No Answer', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'WHATSAPP_PITCH_SENT', label: 'WhatsApp / Email Pitch Sent', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MEETING_BOOKED', label: 'Meeting / Demo Scheduled', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'PROPOSAL_REQUESTED', label: 'Proposal / Quotation Requested', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'NOT_INTERESTED', label: 'Not Interested / Disqualified', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

function FollowUpsContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  // Timeframe Tab: 'today' | 'overdue' | 'upcoming' | 'completed' | 'all'
  const [timeframe, setTimeframe] = useState<'today' | 'overdue' | 'upcoming' | 'completed' | 'all'>(
    filterParam === 'overdue' ? 'overdue' : filterParam === 'upcoming' ? 'upcoming' : 'today'
  );

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('ALL');

  // Filter Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Data state
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [metrics, setMetrics] = useState({
    overdue: 0,
    today: 0,
    upcoming: 0,
    completedPast7Days: 0,
    totalActive: 0,
  });

  // Modal: Log & Complete Touchpoint
  const [activeLogItem, setActiveLogItem] = useState<FollowUpItem | null>(null);
  const [logOutcome, setLogOutcome] = useState('CONNECTED_INTERESTED');
  const [logNotes, setLogNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextDate, setNextDate] = useState('');
  const [nextChannel, setNextChannel] = useState('PHONE_CALL');
  const [nextNotes, setNextNotes] = useState('');
  const [updatePipelineStage, setUpdatePipelineStage] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  // Modal: Reassignment (CEO & MD only)
  const [reassignLead, setReassignLead] = useState<FollowUpItem | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [reassigning, setReassigning] = useState(false);

  // Quick Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const isExecutive = currentUser ? (currentUser.role === 'ADMIN' || currentUser.role === 'CEO') : false;

  const fetchFollowUps = async (
    tf = timeframe,
    userFilter = selectedUser,
    search = searchQuery,
    channel = channelFilter,
    status = statusFilter
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeframe: tf,
        userId: userFilter,
        channel,
        status,
      });
      if (search) params.append('search', search);

      const res = await fetch(`/api/follow-ups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (tf === 'completed') {
          setCompletedItems(data.items || []);
          setItems([]);
        } else {
          setItems(data.items || []);
          setCompletedItems([]);
        }
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setLoading(false);
    }
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

    fetchFollowUps(timeframe, 'ALL', '', 'ALL', 'ALL');
  }, []);

  const handleTimeframeChange = (newTf: 'today' | 'overdue' | 'upcoming' | 'completed' | 'all') => {
    setTimeframe(newTf);
    fetchFollowUps(newTf, selectedUser, searchQuery, channelFilter, statusFilter);
  };

  const handleUserFilterChange = (newVal: string) => {
    setSelectedUser(newVal);
    fetchFollowUps(timeframe, newVal, searchQuery, channelFilter, statusFilter);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFollowUps(timeframe, selectedUser, searchQuery, channelFilter, statusFilter);
  };

  // Open Log Modal with intelligent defaults
  const openLogModal = (item: FollowUpItem) => {
    setActiveLogItem(item);
    setLogOutcome('CONNECTED_INTERESTED');
    setLogNotes('');
    setScheduleNext(true);
    // Default next follow-up to +3 days from now at 11:00 AM
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(11, 0, 0, 0);
    setNextDate(d.toISOString().slice(0, 16));
    setNextChannel(item.followUpType || 'PHONE_CALL');
    setNextNotes('');
    setUpdatePipelineStage(item.status);
  };

  // Preset next date buttons
  const applyPresetNextDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(11, 0, 0, 0);
    setNextDate(d.toISOString().slice(0, 16));
  };

  // Submit Completed Follow-up
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogItem) return;

    try {
      setSubmittingLog(true);
      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: activeLogItem.id,
          outcome: logOutcome,
          notes: logNotes,
          channel: activeLogItem.followUpType || 'PHONE_CALL',
          nextScheduledDate: scheduleNext && nextDate ? new Date(nextDate).toISOString() : null,
          nextType: nextChannel,
          nextNotes,
          updateStatus: updatePipelineStage,
        }),
      });

      if (res.ok) {
        setActiveLogItem(null);
        fetchFollowUps(timeframe, selectedUser, searchQuery, channelFilter, statusFilter);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to record follow-up');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving touchpoint');
    } finally {
      setSubmittingLog(false);
    }
  };

  // Quick Reschedule (+1 day, +3 days, +7 days)
  const handleQuickReschedule = async (prospectId: string, daysToAdd: number) => {
    try {
      setReschedulingId(prospectId);
      const res = await fetch('/api/follow-ups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId,
          daysToAdd,
          reason: `Pushed by ${daysToAdd} day(s) via Quick Scheduler`,
        }),
      });

      if (res.ok) {
        fetchFollowUps(timeframe, selectedUser, searchQuery, channelFilter, statusFilter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReschedulingId(null);
    }
  };

  // Execute Reassignment (CEO & MD Only)
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
        fetchFollowUps(timeframe, selectedUser, searchQuery, channelFilter, statusFilter);
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

  return (
    <div className="space-y-6 pb-12 font-sans animate-fade-in">
      {/* 1. EXECUTIVE HEADER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Follow-up Pipeline &amp; Touchpoint Tracker</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated SLA tracking, outreach cadence management, and zero-drop lead discipline across SLS operations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            {isExecutive ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Executive Command &bull; CEO &amp; MD Oversight</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-700">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Personal Assigned Touchpoints</span>
              </div>
            )}

            <button
              onClick={() => fetchFollowUps(timeframe, selectedUser, searchQuery, channelFilter, statusFilter)}
              title="Refresh follow-up pipeline"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. EXECUTIVE KPI SUMMARY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* Card 1: Critical Overdue */}
          <button
            type="button"
            onClick={() => handleTimeframeChange('overdue')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              timeframe === 'overdue'
                ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-white hover:bg-rose-50/40 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Attention Required</span>
              <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-950 font-time">
                {metrics.overdue}
              </span>
              <span className="text-[11px] font-semibold text-rose-600">Overdue Leads</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
              Missed SLA cadence; prioritize for immediate outreach
            </p>
          </button>

          {/* Card 2: Due Today */}
          <button
            type="button"
            onClick={() => handleTimeframeChange('today')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              timeframe === 'today'
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-white hover:bg-amber-50/40 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Today&apos;s Agenda</span>
              <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-950 font-time">
                {metrics.today}
              </span>
              <span className="text-[11px] font-semibold text-amber-700">Due Today</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
              Scheduled outreach commitments due before end of day
            </p>
          </button>

          {/* Card 3: Upcoming */}
          <button
            type="button"
            onClick={() => handleTimeframeChange('upcoming')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              timeframe === 'upcoming'
                ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white hover:bg-indigo-50/40 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Upcoming Cadence</span>
              <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-time">
                {metrics.upcoming}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600">Next 14 Days</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
              Scheduled client touchpoints &amp; proposal follow-ups
            </p>
          </button>

          {/* Card 4: Completed (Past 7 Days) */}
          <button
            type="button"
            onClick={() => handleTimeframeChange('completed')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              timeframe === 'completed'
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white hover:bg-emerald-50/40 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Touchpoints Logged</span>
              <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-time">
                {metrics.completedPast7Days}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">Past 7 Days</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
              Active touches converted &amp; documented by team
            </p>
          </button>
        </div>
      </div>

      {/* 3. CONTROL CONSOLE & FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Left: Timeframe Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => handleTimeframeChange('today')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                timeframe === 'today'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Due Today</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-time ${timeframe === 'today' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {metrics.today}
              </span>
            </button>

            <button
              onClick={() => handleTimeframeChange('overdue')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                timeframe === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-time ${timeframe === 'overdue' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'}`}>
                {metrics.overdue}
              </span>
            </button>

            <button
              onClick={() => handleTimeframeChange('upcoming')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                timeframe === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Upcoming</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-time ${timeframe === 'upcoming' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {metrics.upcoming}
              </span>
            </button>

            <button
              onClick={() => handleTimeframeChange('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>All Active</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-time ${timeframe === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {metrics.totalActive}
              </span>
            </button>

            <button
              onClick={() => handleTimeframeChange('completed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                timeframe === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed Log</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-time ${timeframe === 'completed' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {metrics.completedPast7Days}
              </span>
            </button>
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-2 self-end xl:self-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">View Mode</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Agenda Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-xs">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Detailed Table View"
              >
                <List className="w-4 h-4" />
                <span className="text-xs">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Rows: Search + Whose Follow-up + Channel + Stage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, contact person, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </form>

          {/* Executive Assignee Filter ("Whose Follow-up" - for CEO & MD) */}
          {isExecutive && (
            <div className="lg:col-span-3">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={selectedUser}
                  onChange={(e) => handleUserFilterChange(e.target.value)}
                  className="w-full bg-transparent py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Assignees (Entire Team)</option>
                  <option value="UNASSIGNED">Unassigned Leads</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({formatUserRole(u)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Channel Filter */}
          <div className={isExecutive ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <select
              value={channelFilter}
              onChange={(e) => {
                const val = e.target.value;
                setChannelFilter(val);
                fetchFollowUps(timeframe, selectedUser, searchQuery, val, statusFilter);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition cursor-pointer"
            >
              <option value="ALL">All Channels (Phone, WhatsApp, Meeting)</option>
              <option value="PHONE_CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="MEETING">Scheduled Meeting / Video</option>
              <option value="EMAIL">Email Outreach</option>
              <option value="LINKEDIN">LinkedIn Touchpoint</option>
              <option value="OTHER">Other Channel</option>
            </select>
          </div>

          {/* Pipeline Stage Filter */}
          <div className={isExecutive ? 'lg:col-span-2' : 'lg:col-span-4'}>
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                fetchFollowUps(timeframe, selectedUser, searchQuery, channelFilter, val);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition cursor-pointer"
            >
              <option value="ALL">All Pipeline Stages</option>
              <option value="NEW_PROSPECT">New Prospect</option>
              <option value="CONTACTED">Contacted</option>
              <option value="FOLLOW_UP">Follow-up Due</option>
              <option value="INTERESTED">Interested</option>
              <option value="MEETING_DISCUSSION">Meeting Discussion</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="WON">Won / Converted</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-3xl border border-slate-200/80 p-12">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">
            Loading follow-up pipeline...
          </p>
        </div>
      ) : timeframe === 'completed' ? (
        /* COMPLETED TOUCHPOINTS LOG */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Outreach Activity &amp; Completed Touchpoints</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of completed calls, WhatsApp messages, and meetings logged by the team.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-time">
              Showing {completedItems.length} records
            </span>
          </div>

          {completedItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-3" />
              <p className="text-sm font-bold text-slate-700">No completed touchpoints recorded in this period</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed calls, meetings, and follow-ups logged by reps will appear here with timestamps.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {completedItems.map((act) => (
                <div key={act.activityId} className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {act.prospect && (
                        <Link
                          href={`/prospects/${act.prospect.id}`}
                          className="font-bold text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.prospect.companyName}</span>
                        </Link>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                        {act.prospect?.prospectCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {act.outcome || 'Touchpoint Done'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {act.channel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      {act.notes || 'Routine follow-up touchpoint executed.'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium flex-wrap pt-0.5">
                      <span>Logged by: <strong className="text-slate-700">{act.completedBy?.name || 'Staff Member'}</strong> ({formatUserRole(act.completedBy || 'Staff')})</span>
                      <span>&bull;</span>
                      <span className="font-time flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(act.completedAt)}
                      </span>
                    </div>
                  </div>

                  {act.prospect && (
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <Link
                        href={`/prospects/${act.prospect.id}`}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <span>Open Lead</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : items.length === 0 ? (
        /* PROFESSIONAL EMPTY STATE */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <CalendarClock className="w-8 h-8 stroke-1 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {timeframe === 'today'
              ? 'No Follow-ups Scheduled for Today'
              : timeframe === 'overdue'
              ? 'Zero Overdue Leads — All SLAs Met'
              : timeframe === 'upcoming'
              ? 'No Upcoming Follow-ups in the Next 14 Days'
              : 'No Active Follow-ups Matching Current Filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
            {timeframe === 'today'
              ? 'Great job keeping cadence. Check overdue leads or review upcoming deals in the pipeline.'
              : timeframe === 'overdue'
              ? 'Outstanding performance. Your pipeline has zero dropped leads and perfect SLA compliance.'
              : 'Try broadening your search query, changing the assignee selector, or checking other timeframes.'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link
              href="/prospects"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              Browse All Prospects
            </Link>
            <button
              onClick={() => handleTimeframeChange('all')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              View All Active Follow-ups
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD / AGENDA VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((p) => {
            const isCritical = p.urgency === 'CRITICAL_OVERDUE';
            const isOverdue = p.urgency === 'OVERDUE' || isCritical;
            const isToday = p.urgency === 'DUE_TODAY';

            const cardBorder = isCritical
              ? 'border-rose-300 ring-1 ring-rose-500/20'
              : isOverdue
              ? 'border-rose-200'
              : isToday
              ? 'border-amber-200'
              : 'border-slate-200/80';

            const bannerBg = isCritical
              ? 'bg-rose-50 border-b border-rose-100 text-rose-800'
              : isOverdue
              ? 'bg-rose-50/70 border-b border-rose-100 text-rose-700'
              : isToday
              ? 'bg-amber-50/80 border-b border-amber-100 text-amber-800'
              : 'bg-slate-50/80 border-b border-slate-100 text-slate-700';

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border ${cardBorder} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group`}
              >
                <div>
                  {/* Top Urgency Banner */}
                  <div className={`px-4 py-2 flex items-center justify-between text-[11px] font-bold ${bannerBg}`}>
                    <div className="flex items-center gap-1.5">
                      {isCritical ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                          <span>CRITICAL &bull; Overdue by {p.daysOverdue} days</span>
                        </>
                      ) : isOverdue ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Overdue by {p.daysOverdue} day(s)</span>
                        </>
                      ) : isToday ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Due Today</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Due: {formatDate(p.nextFollowUpDate)}</span>
                        </>
                      )}
                    </div>

                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                      {p.followUpType || 'PHONE_CALL'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Company & Code */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/prospects/${p.id}`}
                          className="font-black text-base text-slate-900 hover:text-blue-600 transition leading-snug line-clamp-1"
                        >
                          {p.companyName}
                        </Link>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold shrink-0">
                          {p.prospectCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {STATUS_LABELS[p.status]?.label || p.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Touches: <strong className="text-slate-700">{p.followUpCount}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Contact Person & Instant Launch Buttons */}
                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{p.contactPerson || 'Decision Maker'}</span>
                        </div>
                        {p.phone && (
                          <span className="text-[11px] font-time font-semibold text-slate-500">
                            {p.phone}
                          </span>
                        )}
                      </div>

                      {/* Direct Connect Quick Action Bar */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        {p.phone ? (
                          <a
                            href={`tel:${p.phone}`}
                            className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        ) : (
                          <span className="flex-1 py-1 px-2 text-center text-[10px] text-slate-400">No Phone</span>
                        )}

                        {p.whatsappNumber ? (
                          <a
                            href={`https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${p.contactPerson || ''}, this is from Shubham Leads Solutions regarding ${p.companyName}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {/* Cadence Notes */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Scheduled Cadence &bull; Focus
                      </span>
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2 leading-relaxed">
                        {p.followUpNotes || 'No specific agenda logged. Follow up on value pitch and requirement gathering.'}
                      </p>
                    </div>

                    {/* Assigned Team Member info */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {p.assignedUser?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 text-[11px] truncate">
                            {p.assignedUser?.name || 'Unassigned'}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate font-semibold">
                            {formatUserRole(p.assignedUser || 'Staff')}
                          </p>
                        </div>
                      </div>

                      {/* CEO & MD Reassign Shortcut */}
                      {isExecutive && (
                        <button
                          type="button"
                          onClick={() => {
                            setReassignLead(p);
                            setTargetUserId(p.assignedUser?.id || '');
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                          title="Delegate lead ownership (CEO & MD Only)"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Reassign</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openLogModal(p)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Log Outcome</span>
                  </button>

                  {/* Quick Reschedule Presets */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={reschedulingId === p.id}
                      onClick={() => handleQuickReschedule(p.id, 1)}
                      className="px-2 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition disabled:opacity-50 cursor-pointer"
                      title="Quick Push +1 Day"
                    >
                      +1d
                    </button>
                    <button
                      type="button"
                      disabled={reschedulingId === p.id}
                      onClick={() => handleQuickReschedule(p.id, 3)}
                      className="px-2 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition disabled:opacity-50 cursor-pointer"
                      title="Quick Push +3 Days"
                    >
                      +3d
                    </button>
                    <Link
                      href={`/prospects/${p.id}`}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
                      title="Open 360° Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Priority / Lead</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Channel &bull; Notes</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => {
                  const isCritical = p.urgency === 'CRITICAL_OVERDUE';
                  const isOverdue = p.urgency === 'OVERDUE' || isCritical;
                  const isToday = p.urgency === 'DUE_TODAY';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isCritical
                                ? 'bg-rose-600 ring-2 ring-rose-200 animate-pulse'
                                : isOverdue
                                ? 'bg-rose-500'
                                : isToday
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <div>
                            <Link
                              href={`/prospects/${p.id}`}
                              className="font-bold text-sm text-slate-900 hover:text-blue-600 block"
                            >
                              {p.companyName}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono">{p.prospectCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{p.contactPerson || '-'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.phone && (
                            <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline text-[11px]">
                              {p.phone}
                            </a>
                          )}
                          {p.whatsappNumber && (
                            <a
                              href={`https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline text-[11px] font-bold"
                            >
                              WA
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span
                            className={`font-bold font-time ${
                              isOverdue ? 'text-rose-600' : isToday ? 'text-amber-700' : 'text-slate-800'
                            }`}
                          >
                            {formatDate(p.nextFollowUpDate)}
                          </span>
                          {isCritical ? (
                            <span className="text-[10px] font-bold text-rose-600">
                              Overdue by {p.daysOverdue}d
                            </span>
                          ) : isToday ? (
                            <span className="text-[10px] font-bold text-amber-600">Today</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-0.5">
                          {p.followUpType || 'PHONE_CALL'}
                        </span>
                        <p className="text-slate-600 text-[11px] truncate">
                          {p.followUpNotes || 'No notes'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {STATUS_LABELS[p.status]?.label || p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-slate-800">{p.assignedUser?.name || 'Unassigned'}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{formatUserRole(p.assignedUser || 'Staff')}</p>
                          </div>
                          {isExecutive && (
                            <button
                              type="button"
                              onClick={() => {
                                setReassignLead(p);
                                setTargetUserId(p.assignedUser?.id || '');
                              }}
                              className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                              title="Reassign lead"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openLogModal(p)}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Log Touch</span>
                          </button>
                          <button
                            disabled={reschedulingId === p.id}
                            onClick={() => handleQuickReschedule(p.id, 1)}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            title="Push +1 Day"
                          >
                            +1d
                          </button>
                          <Link
                            href={`/prospects/${p.id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL: LOG OUTCOME & SCHEDULE NEXT TOUCHPOINT */}
      {activeLogItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0" onClick={() => setActiveLogItem(null)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Log Touchpoint &amp; Outcome</h3>
                  <p className="text-[11px] text-slate-500">Record outreach results and set next sales cadence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveLogItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitLog} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Lead Details Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{activeLogItem.companyName}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {activeLogItem.prospectCode}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">
                  Contact: <strong className="text-slate-800">{activeLogItem.contactPerson || 'Decision Maker'}</strong> {activeLogItem.phone ? `(${activeLogItem.phone})` : ''}
                </p>
              </div>

              {/* 1. Contact Outcome Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Touchpoint Outcome <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OUTCOME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLogOutcome(opt.value)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        logOutcome === opt.value
                          ? `${opt.badge} ring-2 ring-blue-500/20 shadow-xs`
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {logOutcome === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Touchpoint Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Discussion Notes &bull; Objections &bull; Requirements
                </label>
                <textarea
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Summarize client feedback, quotation discussed, objections, or next expectations..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* 3. Pipeline Stage Advancement (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Update Pipeline Stage (Optional)
                </label>
                <select
                  value={updatePipelineStage}
                  onChange={(e) => setUpdatePipelineStage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="NEW_PROSPECT">New Prospect</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="FOLLOW_UP">Follow-Up Due</option>
                  <option value="INTERESTED">Interested (Hot Lead)</option>
                  <option value="MEETING_DISCUSSION">Meeting Discussion</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="WON">Won (Converted Client)</option>
                  <option value="LOST">Lost (Disqualified)</option>
                </select>
              </div>

              {/* 4. Schedule Next Follow-up Section */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleNext}
                      onChange={(e) => setScheduleNext(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Schedule Next Follow-up Cadence
                    </span>
                  </label>
                </div>

                {scheduleNext && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    {/* Quick Date Presets */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Quick Preset Timing
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => applyPresetNextDate(1)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          Tomorrow (1d)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetNextDate(2)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          In 2 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetNextDate(3)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          In 3 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetNextDate(7)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          In 1 Week
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Date &amp; Time
                        </label>
                        <input
                          type="datetime-local"
                          value={nextDate}
                          onChange={(e) => setNextDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Next Channel
                        </label>
                        <select
                          value={nextChannel}
                          onChange={(e) => setNextChannel(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          <option value="PHONE_CALL">Phone Call</option>
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="MEETING">Video / In-person Meeting</option>
                          <option value="EMAIL">Email Follow-up</option>
                          <option value="LINKEDIN">LinkedIn</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Next Cadence Goal / Reminder
                      </label>
                      <input
                        type="text"
                        value={nextNotes}
                        onChange={(e) => setNextNotes(e.target.value)}
                        placeholder="e.g. Check if proposal reviewed, confirm meeting agenda..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveLogItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLog}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingLog ? 'Saving...' : 'Save & Complete Touchpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: EXECUTIVE REASSIGNMENT (CEO & MD ONLY) */}
      {reassignLead && isExecutive && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0" onClick={() => setReassignLead(null)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reassign Prospect &amp; Follow-up</h3>
                  <p className="text-[11px] text-slate-500">Executive Authority &bull; CEO &amp; MD Command</p>
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
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
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
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading follow-up tracker...</div>}>
        <FollowUpsContent />
      </Suspense>
    </AppLayout>
  );
}
