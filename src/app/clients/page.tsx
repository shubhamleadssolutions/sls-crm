'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Phone,
  Mail,
  IndianRupee,
  Megaphone,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Building2,
  UserCheck,
  ReceiptText,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalRetainer: 0,
    activeCampaignsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    service: 'Student Lead Generation',
    contractType: 'Monthly Retainer',
    retainerAmount: '',
    paymentStatus: 'Pending',
    campaignStatus: 'Active',
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data.clients || []);
      if (data.stats) {
        setStats(data.stats);
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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          companyName: '',
          contactPerson: '',
          phone: '',
          email: '',
          service: 'Student Lead Generation',
          contractType: 'Monthly Retainer',
          retainerAmount: '',
          paymentStatus: 'Pending',
          campaignStatus: 'Active',
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      c.clientId?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.campaignStatus === 'Active') ||
      (statusFilter === 'PAUSED' && c.campaignStatus === 'Paused') ||
      (statusFilter === 'PAID' && c.paymentStatus === 'Paid') ||
      (statusFilter === 'PENDING' && c.paymentStatus === 'Pending');
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Active Clients & Retainers
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {stats.totalClients} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phase 2 Client Portfolio: Manage retainer accounts, marketing deliverables, and performance campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Active Accounts</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalClients}</div>
            <div className="text-[11px] text-slate-500 mt-1">Partner colleges & institutes</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Monthly Retainer Revenue</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              ₹{stats.totalRetainer.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Recurring monthly revenue</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Ad Campaigns</span>
              <Megaphone className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600">
              {stats.activeCampaignsCount} Live
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Meta & Google campaigns running</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company name, contact person, or client ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'ACTIVE', 'PAUSED', 'PAID', 'PENDING'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'All Clients' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90 text-slate-500 text-xs">
            Loading active clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No client accounts found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Convert accepted proposals or click &quot;Add Client&quot; above to onboard partner institutions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {client.clientId || 'SLS-C'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {client.companyName}
                      </h3>
                      {client.contactPerson && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          {client.contactPerson}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          client.campaignStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {client.campaignStatus || 'Active'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          client.paymentStatus === 'Paid'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {client.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Financial & Contract Details */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Service</span>
                      <span className="text-slate-800 font-bold">{client.service || 'Lead Generation'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Contract Type</span>
                      <span className="text-slate-800 font-semibold">{client.contractType || 'Monthly Retainer'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Monthly Retainer</span>
                      <span className="text-emerald-700 font-black">
                        ₹{Number(client.retainerAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    {client.phone && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                          {client.phone}
                        </span>
                        <a
                          href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom stats & links */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Megaphone className="w-3.5 h-3.5 text-blue-500" />
                      {client._count?.campaigns || 0} Campaigns
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                      {client._count?.studentLeads || 0} Leads
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/billing/new?clientId=${client.id}`}
                      className="font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                    >
                      <ReceiptText className="w-3 h-3 text-blue-600" />
                      Invoice
                    </Link>
                    <Link
                      href={`/campaigns?clientId=${client.id}`}
                      className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Campaigns
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Client Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add New Retainer Client</h3>
                    <p className="text-[11px] text-slate-500">Onboard an educational institute or institution partner</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / College Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Institute of Management"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. admissions@apexinstitute.edu.in"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Service</label>
                    <select
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Student Lead Generation">Student Lead Generation</option>
                      <option value="Meta Ads Management">Meta Ads Management</option>
                      <option value="Google Search & Display">Google Search & Display</option>
                      <option value="Full Funnel Marketing">Full Funnel Marketing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contract Type</label>
                    <select
                      value={form.contractType}
                      onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Monthly Retainer">Monthly Retainer</option>
                      <option value="Performance-based">Performance-based</option>
                      <option value="Hybrid (Retainer + CPL)">Hybrid (Retainer + CPL)</option>
                      <option value="Quarterly Contract">Quarterly Contract</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Retainer (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={form.retainerAmount}
                      onChange={(e) => setForm({ ...form, retainerAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Status</label>
                    <select
                      value={form.campaignStatus}
                      onChange={(e) => setForm({ ...form, campaignStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                      <option value="Onboarding">Onboarding</option>
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
                    Save Client
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
