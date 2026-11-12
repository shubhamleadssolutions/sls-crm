'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  User,
  Briefcase,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Save,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/utils';

export default function NewProspectPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: '',
    website: '',
    industry: '',
    city: '',
    state: '',
    country: 'India',
    companyLinkedInUrl: '',
    googleMapsUrl: '',
    contactPerson: '',
    designation: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    linkedInProfileUrl: '',
    businessType: '',
    servicesOffered: '',
    targetAudience: '',
    targetLocation: '',
    potentialRequirement: '',
    leadSource: 'GOOGLE_MAPS',
    status: 'NEW_PROSPECT',
    assignedUserId: '',
    nextFollowUpDate: '',
    followUpType: 'WHATSAPP',
    followUpNotes: '',
    initialNote: '',
  });

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((d) => setUsers(d.users || []))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const checkDuplicate = async () => {
    if (!form.companyName.trim() && !form.phone.trim()) return;
    try {
      const q = form.phone.trim() || form.companyName.trim();
      const res = await fetch(`/api/prospects?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      const existing = (data.prospects || []).find(
        (p: any) =>
          (form.companyName.trim() && p.companyName.toLowerCase() === form.companyName.trim().toLowerCase()) ||
          (form.phone.trim() && p.phone && p.phone.replace(/[^0-9]/g, '') === form.phone.replace(/[^0-9]/g, ''))
      );
      if (existing) {
        setDuplicateWarning(`Duplicate record detected: "${existing.companyName}" (${existing.prospectCode}) is already registered.`);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Ignore background check errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.companyName.trim()) {
      setError('Company Name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create prospect');
      }

      router.push(`/prospects/${data.prospect.id}`);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/prospects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Prospects Directory
          </Link>
          <span className="text-xs text-slate-400 font-mono">SLS CRM &bull; Manual Entry</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Add New Prospect</h1>
            <p className="text-xs text-slate-500 mt-1">
              Capture prospect company profile, decision maker contacts, and prospective campaign requirements.
            </p>
          </div>

          {duplicateWarning && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">1. Basic Company Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  onBlur={checkDuplicate}
                  required
                  placeholder="e.g. Mecatredz Technology"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="e.g. EdTech / Robotics Training"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Noida / Lucknow / Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State & Country</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Country"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company LinkedIn URL</label>
                <input
                  type="url"
                  name="companyLinkedInUrl"
                  value={form.companyLinkedInUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Google Maps URL</label>
                <input
                  type="url"
                  name="googleMapsUrl"
                  value={form.googleMapsUrl}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">2. Contact & Decision Maker</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="e.g. Vikram Mehta"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Founder / Director / Head of Marketing"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="vikram@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsappNumber"
                  value={form.whatsappNumber}
                  onChange={handleChange}
                  placeholder="919876543210 (digits only)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedInProfileUrl"
                  value={form.linkedInProfileUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Business Information & Lead Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">3. Business Information & Pipeline</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lead Source</label>
                <select
                  name="leadSource"
                  value={form.leadSource}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pipeline Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned User</label>
                <select
                  name="assignedUserId"
                  value={form.assignedUserId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Default (Ansh Kumar - IT Head)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Courses / Services Offered</label>
                <input
                  type="text"
                  name="servicesOffered"
                  value={form.servicesOffered}
                  onChange={handleChange}
                  placeholder="e.g. Data Science Bootcamp, Full Stack Web Dev, UPSC CSE Foundation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Potential Requirement</label>
                <textarea
                  name="potentialRequirement"
                  value={form.potentialRequirement}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Wants 120 leads/month for upcoming winter certification batch..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Next Follow-up & Initial Note */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">4. Scheduled Follow-up & Initial Note</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  name="nextFollowUpDate"
                  value={form.nextFollowUpDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Channel</label>
                <select
                  name="followUpType"
                  value={form.followUpType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="MEETING">Meeting</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Research Note</label>
                <textarea
                  name="initialNote"
                  value={form.initialNote}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Add any initial observation from Google Maps, website, or LinkedIn..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/prospects"
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm shadow-blue-500/20 active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Prospect...' : 'Create Prospect Record'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
