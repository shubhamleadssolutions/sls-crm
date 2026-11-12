'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Building2,
  DollarSign,
  UserCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STUDENT_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  NEW_LEAD: { label: 'New Lead', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONTACTED: { label: 'Contacted', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  COUNSELLING_SCHEDULED: { label: 'Counselling Set', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  COUNSELLED: { label: 'Counselled', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPLICATION_SUBMITTED: { label: 'Applied', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ADMISSION_CONFIRMED: { label: 'Enrolled / Won', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DROPPED: { label: 'Dropped', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function StudentLeadsContent() {
  const searchParams = useSearchParams();
  const preselectedCampaignId = searchParams.get('campaignId');

  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState(preselectedCampaignId || 'ALL');
  const [showModal, setShowModal] = useState(false);
  const [updatingLead, setUpdatingLead] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    courseInterest: '',
    location: '',
    qualification: '',
    leadSource: 'Meta Ads',
    clientId: '',
    campaignId: preselectedCampaignId || '',
    status: 'NEW_LEAD',
    admissionStatus: 'Pending',
    feeAmount: '',
    followUpNotes: '',
  });

  const fetchData = async () => {
    try {
      const [leadsRes, clientRes, campRes] = await Promise.all([
        fetch('/api/student-leads'),
        fetch('/api/clients'),
        fetch('/api/campaigns'),
      ]);
      const leadsData = await leadsRes.json();
      const clientData = await clientRes.json();
      const campData = await campRes.json();
      setLeads(leadsData.leads || []);
      setClients(clientData.clients || []);
      setCampaigns(campData.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    try {
      const res = await fetch('/api/student-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          name: '',
          phone: '',
          email: '',
          courseInterest: '',
          location: '',
          qualification: '',
          leadSource: 'Meta Ads',
          clientId: '',
          campaignId: preselectedCampaignId || '',
          status: 'NEW_LEAD',
          admissionStatus: 'Pending',
          feeAmount: '',
          followUpNotes: '',
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string, admissionStatus?: string) => {
    try {
      const body: any = { status: newStatus };
      if (admissionStatus) body.admissionStatus = admissionStatus;
      await fetch(`/api/student-leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      fetchData();
      setUpdatingLead(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search) ||
      l.studentCode?.toLowerCase().includes(search.toLowerCase()) ||
      l.courseInterest?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    const matchesCampaign = selectedCampaign === 'ALL' || l.campaignId === selectedCampaign;
    return matchesSearch && matchesStatus && matchesCampaign;
  });

  const enrolledCount = leads.filter(
    (l) => l.status === 'ADMISSION_CONFIRMED' || l.admissionStatus === 'Enrolled'
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Student Leads Pipeline
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {leads.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phase 3 Education Inquiries: Track student applications, counselling sessions, and enrolled admissions.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Student Lead
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Inquiries</span>
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{leads.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Acquired student leads</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Counselling Stage</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {leads.filter((l) => l.status === 'COUNSELLING_SCHEDULED' || l.status === 'COUNSELLED').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Active consultations</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Admissions Confirmed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{enrolledCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Successfully enrolled</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Admission Rate</span>
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600">
              {leads.length > 0 ? Math.round((enrolledCount / leads.length) * 100) : 0}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Inquiry to admission</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, phone, course, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Stages</option>
              {Object.entries(STUDENT_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90 text-slate-500 text-xs">
            Loading student leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No student leads found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Student inquiries generated from active ad campaigns or manual counselling entries will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    <th className="py-3.5 px-4">Student Details</th>
                    <th className="py-3.5 px-4">Target Course</th>
                    <th className="py-3.5 px-4">Assigned Client / Campaign</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4">Admission Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLeads.map((lead) => {
                    const statusConfig = STUDENT_STATUS_CONFIG[lead.status] || {
                      label: lead.status,
                      badge: 'bg-slate-100 text-slate-600 border-slate-200',
                    };
                    const waText = encodeURIComponent(
                      `Hello ${lead.name}, this is regarding your admission inquiry for ${lead.courseInterest || 'higher education'}. When would be a good time to speak?`
                    );

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {lead.studentCode}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 mt-1">{lead.name}</div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {lead.phone}
                            </span>
                            {lead.location && <span>• {lead.location}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">
                            {lead.courseInterest || 'General Inquiry'}
                          </span>
                          {lead.qualification && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Prev: {lead.qualification}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {lead.client?.companyName || 'Not Assigned'}
                          </div>
                          {lead.campaign?.name && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Campaign: {lead.campaign.name}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badge}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              lead.admissionStatus === 'Enrolled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lead.admissionStatus === 'Applied'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {lead.admissionStatus || 'Pending'}
                          </span>
                          {lead.feeAmount && (
                            <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                              ₹{Number(lead.feeAmount).toLocaleString('en-IN')}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition inline-flex items-center gap-1 border border-emerald-200"
                            >
                              WhatsApp
                            </a>

                            <button
                              onClick={() => setUpdatingLead(lead)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition cursor-pointer"
                            >
                              Update Status
                            </button>
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

        {/* Update Status Modal */}
        {updatingLead && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Update {updatingLead.name}
                </h3>
                <button
                  onClick={() => setUpdatingLead(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Counselling Stage</label>
                  <select
                    defaultValue={updatingLead.status}
                    id="newStatusSelect"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STUDENT_STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admission Status</label>
                  <select
                    defaultValue={updatingLead.admissionStatus || 'Pending'}
                    id="newAdmissionSelect"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Applied">Application Submitted</option>
                    <option value="Enrolled">Admission Confirmed (Enrolled)</option>
                    <option value="Dropped">Dropped / Ineligible</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setUpdatingLead(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const st = (document.getElementById('newStatusSelect') as HTMLSelectElement).value;
                      const adm = (document.getElementById('newAdmissionSelect') as HTMLSelectElement).value;
                      handleUpdateStatus(updatingLead.id, st, adm);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Lead Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add New Student Lead</h3>
                    <p className="text-[11px] text-slate-500">Record a new student admission inquiry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohan Verma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="e.g. rohan@gmail.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
                    <input
                      type="text"
                      placeholder="e.g. MBA Marketing"
                      value={form.courseInterest}
                      onChange={(e) => setForm({ ...form, courseInterest: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location / City</label>
                    <input
                      type="text"
                      placeholder="e.g. Pune, Maharashtra"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Com Graduate"
                      value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Partner College / Client</label>
                    <select
                      value={form.clientId}
                      onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Associated Campaign</label>
                    <select
                      value={form.campaignId}
                      onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Direct / None</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Student Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function StudentLeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-bold">
          Loading Student Leads...
        </div>
      }
    >
      <StudentLeadsContent />
    </Suspense>
  );
}
