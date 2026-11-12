'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Search,
  IndianRupee,
  Users,
  Target,
  BarChart,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

function CampaignsContent() {
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState(preselectedClientId || 'ALL');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    clientId: preselectedClientId || '',
    targetCourse: 'B.Tech / MBA',
    platform: 'Meta Ads',
    budget: '',
    targetLeads: '100',
    status: 'ACTIVE',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [campRes, clientRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/clients'),
      ]);
      const campData = await campRes.json();
      const clientData = await clientRes.json();
      setCampaigns(campData.campaigns || []);
      setClients(clientData.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.clientId) return;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          name: '',
          clientId: preselectedClientId || '',
          targetCourse: 'B.Tech / MBA',
          platform: 'Meta Ads',
          budget: '',
          targetLeads: '100',
          status: 'ACTIVE',
          notes: '',
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.campaignCode?.toLowerCase().includes(search.toLowerCase()) ||
      c.targetCourse?.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesClient =
      selectedClientFilter === 'ALL' || c.clientId === selectedClientFilter;
    const matchesPlatform =
      selectedPlatformFilter === 'ALL' || c.platform === selectedPlatformFilter;
    return matchesSearch && matchesClient && matchesPlatform;
  });

  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget ? Number(c.budget) : 0), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.generatedLeads || 0), 0);
  const avgCpl = totalLeads > 0 ? Math.round(totalBudget / totalLeads) : 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ad Campaigns & Lead Acquisition
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {campaigns.length} Campaigns
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phase 3 Paid Media Management: Track Meta & Google Ads performance for partner colleges.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Launch Campaign
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Campaigns</span>
              <Megaphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {campaigns.filter((c) => c.status === 'ACTIVE').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Currently live ads</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Ad Spend</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              ₹{totalBudget.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Combined campaign budgets</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Generated Leads</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600">{totalLeads}</div>
            <div className="text-[11px] text-slate-500 mt-1">Direct student inquiries</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Cost Per Lead (CPL)</span>
              <BarChart className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600">₹{avgCpl}</div>
            <div className="text-[11px] text-slate-500 mt-1">Efficiency metric</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by campaign name, code, course, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>

            <select
              value={selectedPlatformFilter}
              onChange={(e) => setSelectedPlatformFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Platforms</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90 text-slate-500 text-xs">
            Loading campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No campaigns found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Launch paid marketing campaigns for your partner institutions to start capturing verified student leads.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((camp) => {
              const target = camp.targetLeads || 100;
              const generated = camp.generatedLeads || 0;
              const progressPct = Math.min(100, Math.round((generated / target) * 100));
              const cpl = generated > 0 && camp.budget ? Math.round(Number(camp.budget) / generated) : 0;

              return (
                <div
                  key={camp.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {camp.campaignCode}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {camp.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {camp.client?.companyName || 'Unassigned Client'}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : camp.status === 'PAUSED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    {/* Target & Platform Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        {camp.platform}
                      </span>
                      {camp.targetCourse && (
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {camp.targetCourse}
                        </span>
                      )}
                    </div>

                    {/* Performance Progress */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Lead Target</span>
                        <span className="text-slate-900 font-bold">
                          {generated} / {target} leads ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Budget: ₹{Number(camp.budget || 0).toLocaleString('en-IN')}</span>
                        <span className="text-emerald-700 font-black">
                          {cpl > 0 ? `CPL: ₹${cpl}` : 'CPL: -'}
                        </span>
                      </div>
                    </div>

                    {camp.notes && (
                      <p className="text-xs text-slate-500 italic line-clamp-2 mb-3">
                        &quot;{camp.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {camp._count?.studentLeads || 0} registered leads
                    </span>

                    <Link
                      href={`/student-leads?campaignId=${camp.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View Student Leads
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Launch New Ad Campaign</h3>
                    <p className="text-[11px] text-slate-500">Configure paid ads acquisition pipeline</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune MBA Admission Drive 2026"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Client Institution *</label>
                  <select
                    required
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Partner College / Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.clientId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ad Platform</label>
                    <select
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Meta Ads">Meta Ads (Facebook/Instagram)</option>
                      <option value="Google Ads">Google Ads (Search & Display)</option>
                      <option value="Instagram">Instagram Direct</option>
                      <option value="LinkedIn">LinkedIn Sponsored</option>
                      <option value="WhatsApp Funnel">WhatsApp Ads</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
                    <input
                      type="text"
                      placeholder="e.g. MBA, B.Tech, BCA"
                      value={form.targetCourse}
                      onChange={(e) => setForm({ ...form, targetCourse: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Budget (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Leads</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={form.targetLeads}
                      onChange={(e) => setForm({ ...form, targetLeads: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Strategy / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Ad creative angle, target age bracket, city targeting..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
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
                    Launch Campaign
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

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-bold">
          Loading Campaigns...
        </div>
      }
    >
      <CampaignsContent />
    </Suspense>
  );
}
