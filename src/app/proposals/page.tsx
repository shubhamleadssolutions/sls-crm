'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PROPOSAL_STATUS_STYLES: Record<string, { label: string; badge: string }> = {
  NOT_REQUIRED: { label: 'Not Required', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  DRAFT: { label: 'Draft', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  SENT: { label: 'Sent', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  VIEWED: { label: 'Viewed', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  NEGOTIATION: { label: 'Negotiation', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  ACCEPTED: { label: 'Accepted', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    prospectId: '',
    service: 'Student Lead Generation',
    amount: '',
    validUntil: '',
    status: 'DRAFT',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [propRes, prosRes] = await Promise.all([
        fetch('/api/proposals'),
        fetch('/api/prospects'),
      ]);
      const pData = await propRes.json();
      const prosData = await prosRes.json();
      setProposals(pData.proposals || []);
      setProspects(prosData.prospects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          prospectId: '',
          service: 'Student Lead Generation',
          amount: '',
          validUntil: '',
          status: 'DRAFT',
          notes: '',
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalValue = proposals.reduce((acc, p) => acc + (p.amount ? Number(p.amount) : 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Proposal Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {proposals.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Track contract proposals, quoted packages, and client negotiations.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
        </div>

        {/* Proposals Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code / Prospect</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Valid Until</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Loading proposals...</td>
                  </tr>
                ) : proposals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No proposals recorded yet. Click &quot;Create Proposal&quot; above.
                    </td>
                  </tr>
                ) : (
                  proposals.map((p) => {
                    const statusInfo = PROPOSAL_STATUS_STYLES[p.status] || {
                      label: p.status,
                      badge: 'bg-slate-100 text-slate-700',
                    };
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/prospects/${p.prospect?.id}`}
                            className="font-bold text-sm text-blue-600 hover:underline block"
                          >
                            {p.prospect?.companyName}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono">{p.proposalCode}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {p.service || 'Lead Generation'}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                          {p.amount ? `₹${Number(p.amount).toLocaleString('en-IN')}` : 'TBD'}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${statusInfo.badge} cursor-pointer`}
                          >
                            {Object.entries(PROPOSAL_STATUS_STYLES).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(p.validUntil)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {p.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Proposal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreateProposal} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Create Client Proposal</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Prospect *</label>
                  <select
                    required
                    value={form.prospectId}
                    onChange={(e) => setForm({ ...form, prospectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="">Select a prospect...</option>
                    {prospects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.companyName} ({p.contactPerson || 'Decision Maker'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Package *</label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Student Lead Generation">Student Lead Generation</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Social Media Management">Social Media Management</option>
                    <option value="LinkedIn Outreach">LinkedIn Outreach</option>
                    <option value="Website Development">Website Development</option>
                    <option value="Landing Pages">Landing Pages</option>
                    <option value="Creative & Branding">Creative & Branding</option>
                    <option value="SEO">SEO</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proposal Amount (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proposal Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="NEGOTIATION">Negotiation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Terms</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Package includes 150 student leads, creative designs & campaign optimization"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Proposal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
