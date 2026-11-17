'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  MessageCircle,
  Clock,
  Plus,
  CheckCircle,
  FileText,
  Trophy,
  Trash2,
  Edit,
  ExternalLink,
  Send,
  AlertCircle,
  ArrowLeft,
  Copy,
  ChevronRight,
  X,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { formatDate, formatDateTime, STATUS_LABELS, LEAD_SOURCE_LABELS, CHANNEL_LABELS } from '@/lib/utils';

export default function ProspectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [prospect, setProspect] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Modals state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [pendingStatusConfirm, setPendingStatusConfirm] = useState<string | null>(null);

  // Forms state
  const [activityForm, setActivityForm] = useState({ channel: 'WHATSAPP', activity: '', result: '', notes: '' });
  const [followUpForm, setFollowUpForm] = useState({ scheduledDate: '', type: 'WHATSAPP', notes: '', targetUserId: '' });
  const [noteContent, setNoteContent] = useState('');
  const [convertForm, setConvertForm] = useState({ service: '', contractType: 'Monthly Retainer', retainerAmount: '', campaignStatus: 'Active' });
  const [selectedTemplateText, setSelectedTemplateText] = useState('');

  const isExecutive = currentUser?.role === 'ADMIN' || currentUser?.role === 'CEO';

  const fetchProspect = useCallback(async () => {
    try {
      const res = await fetch(`/api/prospects/${params.id}`);
      if (!res.ok) {
        throw new Error('Not found');
      }
      const data = await res.json();
      setProspect(data.prospect);
    } catch (err) {
      console.error(err);
      router.push('/prospects');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchProspect();
    fetch('/api/templates')
      .then((res) => res.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(console.error);

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(console.error);

    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.users) setUsers(d.users);
      })
      .catch(console.error);
  }, [fetchProspect]);

  const handleExecuteReassign = async () => {
    if (!prospect) return;
    setReassigning(true);
    try {
      const res = await fetch(`/api/prospects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedUserId: selectedAssigneeId || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Failed to reassign prospect');
        return;
      }
      setShowReassignModal(false);
      fetchProspect();
    } catch (err) {
      console.error(err);
      alert('Error reassigning prospect');
    } finally {
      setReassigning(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (['LOST', 'NOT_INTERESTED', 'NO_RESPONSE'].includes(newStatus)) {
      setPendingStatusConfirm(newStatus);
      return;
    }
    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/prospects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchProspect();
    } catch (err) {
      console.error(err);
    }
  };

  const executeArchive = async () => {
    try {
      const res = await fetch(`/api/prospects/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/prospects');
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to archive');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = () => {
    setShowArchiveConfirm(true);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/prospects/${params.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm),
      });
      setShowActivityModal(false);
      setActivityForm({ channel: 'WHATSAPP', activity: '', result: '', notes: '' });
      fetchProspect();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/prospects/${params.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpForm),
      });
      setShowFollowUpModal(false);
      setFollowUpForm({ scheduledDate: '', type: 'WHATSAPP', notes: '', targetUserId: '' });
      fetchProspect();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      await fetch(`/api/prospects/${params.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });
      setShowNoteModal(false);
      setNoteContent('');
      fetchProspect();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/prospects/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertForm),
      });
      if (res.ok) {
        setShowConvertModal(false);
        fetchProspect();
      }
    } catch (err) {
      console.error(err);
    }
  };



  const openWhatsAppWithTemplate = (text: string) => {
    if (!prospect?.whatsappNumber && !prospect?.phone) {
      alert('No phone/WhatsApp number available for this prospect.');
      return;
    }
    const cleanNumber = (prospect.whatsappNumber || prospect.phone).replace(/[^0-9]/g, '');
    const filledText = text
      .replace(/{{contact_name}}/g, prospect.contactPerson || 'there')
      .replace(/{{company_name}}/g, prospect.companyName || 'your institute');

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(filledText)}`;
    window.open(url, '_blank');
    setShowWhatsAppModal(false);

    // Auto-record interaction in activity history
    fetch(`/api/prospects/${params.id}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'WHATSAPP',
        activity: 'WhatsApp outreach initiated from template',
        result: 'Message opened in WhatsApp',
      }),
    }).then(() => fetchProspect());
  };

  if (loading || !prospect) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const statusInfo = STATUS_LABELS[prospect.status] || {
    label: prospect.status,
    color: 'bg-slate-100 text-slate-700',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/prospects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Prospects Directory
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">{prospect.prospectCode}</span>
            <button
              onClick={handleArchive}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Soft-delete / Archive Prospect (Protected)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prospect Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {prospect.companyName}
                </h1>
                <select
                  value={prospect.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.color} cursor-pointer focus:outline-none`}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>

                {prospect.client && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                    Client #{prospect.client.clientId}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span>Assigned to:</span>
                  <strong className="text-slate-800 font-bold">
                    {prospect.assignedUser?.name || <span className="text-amber-600 font-normal italic">Unassigned</span>}
                  </strong>
                  {prospect.assignedUser?.role && (
                    <span className="text-[10px] text-slate-400 font-medium">({prospect.assignedUser.role})</span>
                  )}
                  {isExecutive && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssigneeId(prospect.assignedUserId || '');
                        setShowReassignModal(true);
                      }}
                      className="ml-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition border border-indigo-200 cursor-pointer shadow-2xs"
                      title="Assign or reassign this prospect (CEO & MD only)"
                    >
                      <UserCheck className="w-3 h-3" />
                      Reassign
                    </button>
                  )}
                </span>
                <span>&bull;</span>
                <span>
                  Source: <strong className="text-slate-700">{LEAD_SOURCE_LABELS[prospect.leadSource] || prospect.leadSource}</strong>
                </span>
                {prospect.city && (
                  <>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {prospect.city}, {prospect.state || prospect.country}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions (Section 23 of PDF) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-[0.99] cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Send WhatsApp</span>
              </button>

              <button
                onClick={() => setShowActivityModal(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Add Activity</span>
              </button>

              <button
                onClick={() => setShowFollowUpModal(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Follow-up</span>
              </button>

              <button
                onClick={() => setShowNoteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Add Note</span>
              </button>

              {!prospect.client && (
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Convert to Client</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3-Column Layout: Left (Info), Middle (Timeline & History), Right (Notes & Follow-up) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Contact & Business Details */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Details</h3>
                <User className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Contact Person</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{prospect.contactPerson || '-'}</p>
                  {prospect.designation && <p className="text-slate-500 text-[11px]">{prospect.designation}</p>}
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Phone</p>
                  {prospect.phone ? (
                    <a href={`tel:${prospect.phone}`} className="font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {prospect.phone}
                    </a>
                  ) : (
                    <p className="text-slate-500 mt-0.5">-</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">WhatsApp Number</p>
                  {prospect.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${prospect.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <MessageCircle className="w-3 h-3" /> {prospect.whatsappNumber}
                    </a>
                  ) : (
                    <p className="text-slate-500 mt-0.5">-</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Email Address</p>
                  {prospect.email ? (
                    <a href={`mailto:${prospect.email}`} className="font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {prospect.email}
                    </a>
                  ) : (
                    <p className="text-slate-500 mt-0.5">-</p>
                  )}
                </div>

                {prospect.linkedInProfileUrl && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">LinkedIn Profile</p>
                    <a
                      href={prospect.linkedInProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      View Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Information Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Details</h3>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Website</p>
                  {prospect.website ? (
                    <a
                      href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="w-3 h-3" /> {prospect.website}
                    </a>
                  ) : (
                    <p className="text-slate-500 mt-0.5">-</p>
                  )}
                </div>

                {prospect.googleMapsUrl && (
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Google Maps</p>
                    <a
                      href={prospect.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <MapPin className="w-3 h-3" /> View on Google Maps
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Industry</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{prospect.industry || prospect.businessType || '-'}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Courses / Services Offered</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{prospect.servicesOffered || '-'}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Potential Requirement</p>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-1 leading-relaxed">
                    {prospect.potentialRequirement || 'No requirements captured yet.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Activity Timeline (Section 8 of PDF) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Outreach History & Timeline</h3>
              </div>
              <button
                onClick={() => setShowActivityModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Touch
              </button>
            </div>

            <div className="flex-1 mt-4 space-y-4 overflow-y-auto max-h-[550px] pr-1">
              {prospect.activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No interactions recorded yet.</p>
              ) : (
                prospect.activities.map((act: any) => (
                  <div key={act.id} className="relative pl-6 pb-4 border-l border-slate-200 last:border-0 last:pb-0">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{act.activity}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(act.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                          {CHANNEL_LABELS[act.channel] || act.channel}
                        </span>
                        {act.user?.name && <span className="text-slate-400">by {act.user.name}</span>}
                      </div>
                      {act.result && (
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 text-[11px]">
                          <strong>Result:</strong> {act.result}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Scheduled Follow-up & Notes */}
          <div className="space-y-6">
            {/* Next Follow-up Tracker */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Scheduled Follow-up</h3>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  Reschedule
                </button>
              </div>

              {prospect.nextFollowUpDate ? (
                <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-900">
                      {formatDate(prospect.nextFollowUpDate, 'EEEE, dd MMMM yyyy')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800">
                      via {prospect.followUpType || 'WhatsApp'}
                    </span>
                  </div>
                  {prospect.followUpNotes && (
                    <p className="text-xs text-blue-700">{prospect.followUpNotes}</p>
                  )}
                  <p className="text-[10px] text-slate-500 pt-1">
                    Follow-up count: <strong>{prospect.followUpCount}</strong> completed
                  </p>
                </div>
              ) : (
                <div className="p-5 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-2.5">No follow-up currently scheduled.</p>
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Schedule Touch
                  </button>
                </div>
              )}
            </div>

            {/* Notes Section (Section 9 of PDF) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Internal Notes</h3>
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New Note
                </button>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {prospect.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No internal notes added yet.</p>
                ) : (
                  prospect.notes.map((n: any) => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span>{n.user?.name || 'Abhinav'}</span>
                        <span>{formatDateTime(n.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: WhatsApp Direct Message with Template Selection */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowWhatsAppModal(false)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  Direct WhatsApp Outreach
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <p className="text-xs text-slate-600">
                  Choose a pre-defined communication template. Variables like <code>{"{{contact_name}}"}</code> and <code>{"{{company_name}}"}</code> are automatically merged:
                </p>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateText(tpl.content)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition ${
                        selectedTemplateText === tpl.content
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <p className="font-bold text-slate-900">{tpl.title}</p>
                      <p className="text-slate-600 mt-1 line-clamp-2">{tpl.content}</p>
                    </div>
                  ))}
                </div>

                {selectedTemplateText && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Preview & Edit Message:</label>
                    <textarea
                      value={selectedTemplateText}
                      onChange={(e) => setSelectedTemplateText(e.target.value)}
                      rows={4}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-4 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedTemplateText}
                  onClick={() => openWhatsAppWithTemplate(selectedTemplateText)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Launch WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Log Activity */}
        {showActivityModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowActivityModal(false)} aria-hidden="true" />
            <form onSubmit={handleAddActivity} className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base font-bold text-slate-900">Log Outreach Activity</h3>
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Outreach Channel</label>
                  <select
                    value={activityForm.channel}
                    onChange={(e) => setActivityForm({ ...activityForm, channel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Activity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discussed lead requirements on WhatsApp"
                    value={activityForm.activity}
                    onChange={(e) => setActivityForm({ ...activityForm, activity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Outcome / Result</label>
                  <input
                    type="text"
                    placeholder="e.g. Requested proposal draft for 150 student leads"
                    value={activityForm.result}
                    onChange={(e) => setActivityForm({ ...activityForm, result: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Record Activity
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Schedule Follow-up */}
        {showFollowUpModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowFollowUpModal(false)} aria-hidden="true" />
            <form onSubmit={handleScheduleFollowUp} className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base font-bold text-slate-900">Schedule Follow-up</h3>
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    required
                    value={followUpForm.scheduledDate}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Channel</label>
                  <select
                    value={followUpForm.type}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PHONE_CALL">Phone Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="MEETING">Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agenda / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Present customized campaign proposal & pricing"
                    value={followUpForm.notes}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                {isExecutive && (
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Whose Follow-up? (Assign Follow-up &amp; Lead)
                    </label>
                    <select
                      value={followUpForm.targetUserId}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, targetUserId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    >
                      <option value="">Keep current assignee ({prospect.assignedUser?.name || 'Unassigned'})</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          Assign to: {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      As CEO/MD, delegating this follow-up also updates the prospect&apos;s assignee.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-4 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add Note */}
        {showNoteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowNoteModal(false)} aria-hidden="true" />
            <form onSubmit={handleAddNote} className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base font-bold text-slate-900">Add Internal Note</h3>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <textarea
                  rows={4}
                  required
                  placeholder="Record insights, conversation summaries, or decision context..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 p-4 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Convert to Client (Section 12 of PDF) */}
        {showConvertModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowConvertModal(false)} aria-hidden="true" />
            <form onSubmit={handleConvertToClient} className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-indigo-600" />
                  Convert Prospect &rarr; Client
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3">
                <p className="text-xs text-slate-600">
                  Converting <strong>{prospect.companyName}</strong> automatically sets status to Won and generates an active Client ID without re-typing.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service</label>
                  <input
                    type="text"
                    value={convertForm.service}
                    onChange={(e) => setConvertForm({ ...convertForm, service: e.target.value })}
                    placeholder="e.g. Student Lead Generation / Meta Ads"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contract Type</label>
                  <select
                    value={convertForm.contractType}
                    onChange={(e) => setConvertForm({ ...convertForm, contractType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Monthly Retainer">Monthly Retainer</option>
                    <option value="One-time Project">One-time Project</option>
                    <option value="Pay Per Lead / Admission">Pay Per Lead / Admission</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly / Retainer Amount (INR)</label>
                  <input
                    type="number"
                    value={convertForm.retainerAmount}
                    onChange={(e) => setConvertForm({ ...convertForm, retainerAmount: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Confirm Conversion
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sensitive Action: Archive Confirmation Modal */}
        {showArchiveConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowArchiveConfirm(false)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 space-y-4 text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Archive Prospect Record?</h3>
                  <p className="text-[11px] text-slate-500">Sales pipeline protection</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to archive <strong className="text-slate-900">{prospect.companyName}</strong> ({prospect.prospectCode})? This removes the prospect from your active pipeline while safely preserving all historical interactions in the audit log.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowArchiveConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowArchiveConfirm(false);
                    await executeArchive();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs shadow-rose-500/20 cursor-pointer"
                >
                  Yes, Archive Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sensitive Action: Mark as Lost / Not Interested Confirmation Modal */}
        {pendingStatusConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setPendingStatusConfirm(null)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 space-y-4 text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Update Funnel Status?</h3>
                  <p className="text-[11px] text-slate-500">Confirm pipeline stage change</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to mark <strong className="text-slate-900">{prospect.companyName}</strong> as <strong className="text-amber-800">{STATUS_LABELS[pendingStatusConfirm]?.label || pendingStatusConfirm}</strong>. This will stop regular outreach reminders for this lead.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingStatusConfirm(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const st = pendingStatusConfirm;
                    setPendingStatusConfirm(null);
                    await executeStatusChange(st);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Executive Reassign Lead Modal (CEO & MD Only) */}
        {showReassignModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowReassignModal(false)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 space-y-4 text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Assign / Reassign Lead</h3>
                    <p className="text-[11px] text-slate-500">Executive authority (CEO &amp; MD)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Prospect</p>
                  <p className="font-bold text-slate-800 text-sm">{prospect.companyName}</p>
                  <p className="text-slate-500">
                    Contact: <span className="font-medium text-slate-700">{prospect.contactPerson || '-'}</span> | Status: <span className="font-medium text-slate-700">{prospect.status}</span>
                  </p>
                  <p className="text-slate-500">
                    Current Assignee: <span className="font-semibold text-indigo-700">{prospect.assignedUser?.name || 'Unassigned'}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select New Staff Member / Assignee
                  </label>
                  <select
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  >
                    <option value="">Leave Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) — {u.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Assigning transfers this lead, scheduled follow-ups, and pipeline ownership to the selected team member.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  disabled={reassigning}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReassign}
                  disabled={reassigning}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {reassigning ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
