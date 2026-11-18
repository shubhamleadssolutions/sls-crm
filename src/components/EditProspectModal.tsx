'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Linkedin,
} from 'lucide-react';
import { STATUS_LABELS, LEAD_SOURCE_LABELS, formatUserRole } from '@/lib/utils';

interface EditProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: any;
  onSuccess: (updatedProspect: any) => void;
  isExecutive: boolean;
  usersList?: any[];
}

export default function EditProspectModal({
  isOpen,
  onClose,
  prospect,
  onSuccess,
  isExecutive,
  usersList = [],
}: EditProspectModalProps) {
  const [activeTab, setActiveTab] = useState<'company' | 'contact' | 'offering' | 'pipeline'>('company');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    industry: '',
    businessType: '',
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
    servicesOffered: '',
    targetAudience: '',
    targetLocation: '',
    potentialRequirement: '',
    status: 'NEW_PROSPECT',
    leadSource: 'OTHER',
    assignedUserId: '',
    nextFollowUpDate: '',
    followUpType: 'WHATSAPP',
    followUpNotes: '',
  });

  useEffect(() => {
    if (prospect) {
      setFormData({
        companyName: prospect.companyName || '',
        website: prospect.website || '',
        industry: prospect.industry || '',
        businessType: prospect.businessType || '',
        city: prospect.city || '',
        state: prospect.state || '',
        country: prospect.country || 'India',
        companyLinkedInUrl: prospect.companyLinkedInUrl || '',
        googleMapsUrl: prospect.googleMapsUrl || '',
        contactPerson: prospect.contactPerson || '',
        designation: prospect.designation || '',
        phone: prospect.phone || '',
        whatsappNumber: prospect.whatsappNumber || '',
        email: prospect.email || '',
        linkedInProfileUrl: prospect.linkedInProfileUrl || '',
        servicesOffered: prospect.servicesOffered || '',
        targetAudience: prospect.targetAudience || '',
        targetLocation: prospect.targetLocation || '',
        potentialRequirement: prospect.potentialRequirement || '',
        status: prospect.status || 'NEW_PROSPECT',
        leadSource: prospect.leadSource || 'OTHER',
        assignedUserId: prospect.assignedUserId || '',
        nextFollowUpDate: prospect.nextFollowUpDate
          ? new Date(prospect.nextFollowUpDate).toISOString().slice(0, 16)
          : '',
        followUpType: prospect.followUpType || 'WHATSAPP',
        followUpNotes: prospect.followUpNotes || '',
      });
      setError('');
    }
  }, [prospect]);

  if (!isOpen || !prospect) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError('Company / Institute name is required');
      setActiveTab('company');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload: any = {
        companyName: formData.companyName.trim(),
        website: formData.website.trim() || null,
        industry: formData.industry.trim() || null,
        businessType: formData.businessType.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        country: formData.country.trim() || 'India',
        companyLinkedInUrl: formData.companyLinkedInUrl.trim() || null,
        googleMapsUrl: formData.googleMapsUrl.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
        designation: formData.designation.trim() || null,
        phone: formData.phone.trim() || null,
        whatsappNumber: formData.whatsappNumber.trim() || null,
        email: formData.email.trim() || null,
        linkedInProfileUrl: formData.linkedInProfileUrl.trim() || null,
        servicesOffered: formData.servicesOffered.trim() || null,
        targetAudience: formData.targetAudience.trim() || null,
        targetLocation: formData.targetLocation.trim() || null,
        potentialRequirement: formData.potentialRequirement.trim() || null,
        status: formData.status,
        leadSource: formData.leadSource,
        nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : null,
        followUpType: formData.followUpType,
        followUpNotes: formData.followUpNotes.trim() || null,
      };

      // Only include assignment if user is CEO or MD
      if (isExecutive) {
        payload.assignedUserId = formData.assignedUserId || null;
      }

      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update prospect details');
      }

      onSuccess(data.prospect);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error updating prospect details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl text-left my-auto max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Edit Prospect Details</h3>
                <span className="text-[11px] font-mono text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  {prospect.prospectCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Update company info, key decision maker, offering, and CRM status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-5 pt-2 gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'company'
                ? 'bg-white text-purple-700 border-t-2 border-purple-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Company Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-white text-purple-700 border-t-2 border-purple-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>2. Key Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offering')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'offering'
                ? 'bg-white text-purple-700 border-t-2 border-purple-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Offering &amp; Target</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-white text-purple-700 border-t-2 border-purple-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4. Pipeline &amp; Status</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* TAB 1: COMPANY PROFILE */}
            {activeTab === 'company' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Institute Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Apex Academy, Global EdTech Pvt Ltd"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Industry / Sector
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g. Coaching Institute, Study Abroad, EdTech"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Type
                    </label>
                    <input
                      type="text"
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      placeholder="e.g. Private Limited, Partnership, LLP"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Website
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company LinkedIn URL
                    </label>
                    <div className="relative">
                      <Linkedin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={formData.companyLinkedInUrl}
                        onChange={(e) => setFormData({ ...formData, companyLinkedInUrl: e.target.value })}
                        placeholder="https://linkedin.com/company/..."
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Pune, Delhi, Mumbai"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State / Region
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Maharashtra, Karnataka"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="India"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Google Maps Link
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={formData.googleMapsUrl}
                        onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KEY CONTACT */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Person / Decision Maker
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Director, Managing Trustee, Founder"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Calling Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98220 12345"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="+91 98220 12345"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admissions@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Personal LinkedIn URL
                    </label>
                    <div className="relative">
                      <Linkedin className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={formData.linkedInProfileUrl}
                        onChange={(e) => setFormData({ ...formData, linkedInProfileUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: OFFERING & TARGETING */}
            {activeTab === 'offering' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Services / Programs Offered
                  </label>
                  <textarea
                    rows={2}
                    value={formData.servicesOffered}
                    onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
                    placeholder="e.g. JEE/NEET Coaching, IELTS & GRE Training, MBA Preparation"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      placeholder="e.g. 11th-12th Science students, Study abroad aspirants"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Location / Catchment Area
                    </label>
                    <input
                      type="text"
                      value={formData.targetLocation}
                      onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
                      placeholder="e.g. Pune, PCMC, Western Maharashtra"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Potential Requirement / Ad Spend Budget
                  </label>
                  <textarea
                    rows={3}
                    value={formData.potentialRequirement}
                    onChange={(e) => setFormData({ ...formData, potentialRequirement: e.target.value })}
                    placeholder="e.g. Looking for 150+ verified NEET inquiries for upcoming batch. Monthly Meta ad budget ~₹60,000."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: PIPELINE & STATUS */}
            {activeTab === 'pipeline' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lead Pipeline Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lead Discovery Source
                    </label>
                    <select
                      value={formData.leadSource}
                      onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      {Object.entries(LEAD_SOURCE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned User - Restricted authority check */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Assigned Team Member</span>
                      </span>
                      {!isExecutive && (
                        <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Reassignment restricted to CEO &amp; MD
                        </span>
                      )}
                    </label>
                    {isExecutive ? (
                      <select
                        value={formData.assignedUserId}
                        onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      >
                        <option value="">-- Unassigned (Available in Pool) --</option>
                        {usersList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} (@{u.username}) — {formatUserRole(u)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={
                          prospect.assignedUser
                            ? `${prospect.assignedUser.name} (${formatUserRole(prospect.assignedUser)})`
                            : 'Unassigned'
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Next Follow-up Scheduled Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.nextFollowUpDate}
                      onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Scheduled Follow-up Channel
                    </label>
                    <select
                      value={formData.followUpType}
                      onChange={(e) => setFormData({ ...formData, followUpType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="WHATSAPP">WhatsApp Message</option>
                      <option value="PHONE">Phone Call</option>
                      <option value="EMAIL">Email Follow-up</option>
                      <option value="LINKEDIN">LinkedIn InMail</option>
                      <option value="MEETING">Scheduled Meeting</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Follow-up Objective / Agenda Notes
                    </label>
                    <textarea
                      rows={2}
                      value={formData.followUpNotes}
                      onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                      placeholder="e.g. Call director to confirm student enrollment targets for January batch."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60">
            <div className="text-[11px] text-slate-400">
              Editing: <strong className="text-slate-700 font-semibold">{formData.companyName || 'Prospect'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Prospect Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
