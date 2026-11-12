'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Kanban,
  Table as TableIcon,
  Phone,
  MessageSquare,
  Globe,
  MapPin,
  ExternalLink,
  ChevronRight,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate, STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/utils';

function ProspectsContent() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('');

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (selectedSource !== 'ALL') params.set('source', selectedSource);
      if (selectedCity) params.set('city', selectedCity);

      const res = await fetch(`/api/prospects?${params.toString()}`);
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedSource, selectedCity]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((d) => setUsers(d.users || []))
      .catch(console.error);
  }, []);

  const handleExport = (format: 'csv' | 'xlsx') => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
    if (selectedSource !== 'ALL') params.set('source', selectedSource);

    window.open(`/api/prospects/export?${params.toString()}`, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedSource('ALL');
    setSelectedCity('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Prospect Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {prospects.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, track outreach, and manage client accounts with full data transparency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Link to Dedicated Pipeline Kanban */}
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
          >
            <Kanban className="w-4 h-4 text-blue-600" />
            <span>Open Pipeline Kanban</span>
          </Link>

          {/* Bulk Import (.csv) */}
          <Link
            href="/prospects/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Bulk Import (.csv)</span>
          </Link>

          {/* Export Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
              title="Export filtered records to Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>

          {/* Add Prospect Action Button */}
          <Link
            href="/prospects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Prospect
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search company, contact, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              <option value="ALL">All Stages</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              <option value="ALL">All Lead Sources</option>
              {Object.entries(LEAD_SOURCE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by city (e.g. Pune)..."
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {(searchTerm || selectedStatus !== 'ALL' || selectedSource !== 'ALL' || selectedCity) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Active filters applied</span>
            <button
              onClick={clearFilters}
              className="text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Directory Table View */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              Loading prospects from database...
            </div>
          ) : prospects.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No prospects found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your search criteria, add new prospects, or use Bulk Import (.csv) to upload your database.
              </p>
              <div className="pt-2">
                <Link
                  href="/prospects/import"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Bulk Import Prospects (.csv)
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Company Name</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4">Lead Source</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Next Follow-up</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prospects.map((p) => {
                  const statusInfo = STATUS_LABELS[p.status] || {
                    label: p.status,
                    color: 'bg-slate-100 text-slate-700',
                  };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/prospects/${p.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition flex items-center gap-1.5"
                        >
                          <span>{p.companyName}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">{p.prospectCode}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{p.contactPerson || '-'}</p>
                        {p.designation && (
                          <p className="text-[10px] text-slate-400">{p.designation}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {p.whatsappNumber && (
                            <a
                              href={`https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 font-semibold text-[10px]"
                            >
                              WhatsApp
                            </a>
                          )}
                          {p.phone && (
                            <a
                              href={`tel:${p.phone}`}
                              className="text-slate-500 hover:text-slate-700 text-[10px]"
                            >
                              Call
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.city ? `${p.city}${p.state ? `, ${p.state}` : ''}` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {LEAD_SOURCE_LABELS[p.leadSource] || p.leadSource}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {p.assignedUser?.name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.nextFollowUpDate ? (
                          <span className="flex items-center gap-1 text-slate-700 font-medium text-[11px]">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            {formatDate(p.nextFollowUpDate, 'dd MMM yyyy')}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/prospects/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          Manage &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProspectsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading prospects...</div>}>
        <ProspectsContent />
      </Suspense>
    </AppLayout>
  );
}
