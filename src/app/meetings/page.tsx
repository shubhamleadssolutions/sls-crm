'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
  Play,
  Search,
  Lock,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

const CAN_SCHEDULE_ROLES = ['ADMIN', 'CEO', 'ACCOUNT_MANAGER', 'IT_ADMIN'];

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'today'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Schedule Form
  const [form, setForm] = useState({
    prospectId: '',
    title: '',
    meetingDate: '',
    duration: '45',
    agenda: '',
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState('');

  const canSchedule = currentUser && CAN_SCHEDULE_ROLES.includes(currentUser.role);

  const fetchData = async () => {
    try {
      const [mRes, pRes, meRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/prospects'),
        fetch('/api/auth/me'),
      ]);
      const mData = await mRes.json();
      const pData = await pRes.json();
      const meData = await meRes.json();
      setMeetings(mData.meetings || []);
      setProspects(pData.prospects || []);
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
    fetchData();
  }, []);

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: form.prospectId || undefined,
          title: form.title,
          meetingDate: form.meetingDate,
          location: 'SLS Video Connect',
          agenda: form.agenda,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScheduleError(data.error || 'Failed to schedule meeting');
        return;
      }

      setShowScheduleModal(false);
      setForm({
        prospectId: '',
        title: '',
        meetingDate: '',
        duration: '45',
        agenda: '',
      });
      fetchData();
    } catch (err: any) {
      setScheduleError(err.message || 'Error scheduling meeting');
    }
  };

  const handleCopyInvitation = (m: any) => {
    const clientLabel = m.prospect?.companyName || 'Institutional Client / Partner';
    const text = `Join Shubham Leads Solutions Scheduled Meeting:\nTopic: ${m.title}\nClient / Partner: ${clientLabel}\nDate & Time: ${formatDateTime(m.meetingDate)}\nMeeting Link: ${window.location.origin}/meetings/studio?id=${m.id}&title=${encodeURIComponent(m.title)}&client=${encodeURIComponent(m.prospect?.companyName || '')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMeetings = useMemo(() => {
    const now = new Date();
    return meetings.filter((m) => {
      const mDate = new Date(m.meetingDate);
      const isToday = mDate.toDateString() === now.toDateString();
      const isUpcoming = mDate >= now;

      if (activeTab === 'today' && !isToday) return false;
      if (activeTab === 'upcoming' && !isUpcoming) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = m.title?.toLowerCase().includes(query);
        const matchClient = m.prospect?.companyName?.toLowerCase().includes(query);
        return matchTitle || matchClient;
      }
      return true;
    });
  }, [meetings, activeTab, searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        
        {/* ========================================================================= */}
        {/* HEADER: SLS Client Meetings & Strategy Consultations                      */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Video className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Scheduled Meetings
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              All team members can join scheduled client consultations and internal strategy sessions directly.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {canSchedule ? (
              <button
                type="button"
                onClick={() => {
                  setScheduleError('');
                  setShowScheduleModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Meeting</span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60 flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Scheduling reserved for Leadership (MD, CEO, Account Manager, IT Manager)</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* METRICS & OVERVIEW CARDS                                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Scheduled Meetings
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{meetings.length}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Today&apos;s Sessions
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {meetings.filter((m) => new Date(m.meetingDate).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Team Access
              </span>
              <p className="text-sm font-bold text-blue-600 mt-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                All Employees
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Encryption Bridge
              </span>
              <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                256-bit TLS
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEARCH & FILTER TABS                                                      */}
        {/* ========================================================================= */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Upcoming
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic or client..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MEETINGS LIST: DIRECT JOIN FOR ALL EMPLOYEES                              */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading scheduled meetings...</div>
          ) : filteredMeetings.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Scheduled Meetings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are no upcoming meetings scheduled right now.
                {canSchedule && ' Click "Schedule Meeting" above to plan a consultation for the team.'}
              </p>
              {canSchedule && (
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule First Meeting</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMeetings.map((m) => {
                const meetingDate = new Date(m.meetingDate);
                const isUpcoming = meetingDate >= new Date();

                return (
                  <div
                    key={m.id}
                    className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
                        <Video className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isUpcoming
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isUpcoming ? 'Scheduled' : 'Completed'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="font-semibold text-slate-700">
                            {m.prospect?.companyName || 'Institutional Client / Partner'}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDateTime(m.meetingDate)}
                          </span>
                          <span>&bull;</span>
                          <span>Host: {m.user?.name || 'Managing Director'}</span>
                        </div>

                        {m.agenda && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                            Agenda: {m.agenda}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Direct Join for all employees */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopyInvitation(m)}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Copy Invitation"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Invite</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/meetings/studio?id=${m.id}&title=${encodeURIComponent(m.title)}&client=${encodeURIComponent(m.prospect?.companyName || '')}`}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                      </Link>

                      {canSchedule && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMeeting(m.id)}
                          className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Cancel Meeting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SCHEDULE MEETING MODAL (Administrative roles only)                        */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Schedule Client Meeting</h3>
                <p className="text-[11px] text-slate-500">Authorized by Leadership (MD, CEO, Account Manager, IT Manager)</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {scheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {scheduleError}
              </div>
            )}

            <form onSubmit={handleScheduleMeeting} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Prospect / Client Institution</label>
                <select
                  value={form.prospectId}
                  onChange={(e) => setForm({ ...form, prospectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- General Team / Direct Institutional Meeting --</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.companyName} ({p.contactPerson || 'Contact'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Meeting Topic / Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q4 Admissions Outreach & Campaign Review"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.meetingDate}
                    onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration (Minutes)</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                    <option value="90">90 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Agenda &amp; Discussion Points</label>
                <textarea
                  rows={3}
                  value={form.agenda}
                  onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                  placeholder="Key points: Meta ad volume review, verified lead distribution, fee retainer agreement..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/20"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
