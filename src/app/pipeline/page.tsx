'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Kanban,
  Table as TableIcon,
  Search,
  Filter,
  Plus,
  Upload,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Trophy,
  GripVertical,
  CheckCircle2,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { formatDate, STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/utils';

interface Prospect {
  id: string;
  prospectCode: string;
  companyName: string;
  contactPerson?: string;
  designation?: string;
  phone?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
  leadSource: string;
  status: string;
  assignedUser?: { id: string; name: string };
  nextFollowUpDate?: string;
}

const KANBAN_STAGES = [
  { key: 'NEW_PROSPECT', label: 'New Prospect', color: 'border-blue-300 bg-blue-50/40', badge: 'bg-blue-100 text-blue-700' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-amber-300 bg-amber-50/40', badge: 'bg-amber-100 text-amber-700' },
  { key: 'FOLLOW_UP', label: 'Follow-up Due', color: 'border-orange-300 bg-orange-50/40', badge: 'bg-orange-100 text-orange-700' },
  { key: 'INTERESTED', label: 'Interested', color: 'border-indigo-300 bg-indigo-50/40', badge: 'bg-indigo-100 text-indigo-700' },
  { key: 'MEETING_DISCUSSION', label: 'Client Meeting', color: 'border-cyan-300 bg-cyan-50/40', badge: 'bg-cyan-100 text-cyan-700' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-pink-300 bg-pink-50/40', badge: 'bg-pink-100 text-pink-700' },
  { key: 'WON', label: 'Won (Client)', color: 'border-emerald-300 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-800' },
  { key: 'LOST', label: 'Lost', color: 'border-rose-300 bg-rose-50/40', badge: 'bg-rose-100 text-rose-700' },
];

function PipelineKanbanContent() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag and drop state
  const [draggedProspectId, setDraggedProspectId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedUserId, setSelectedUserId] = useState('ALL');

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedSource !== 'ALL') params.set('source', selectedSource);

      const res = await fetch(`/api/prospects?${params.toString()}`);
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSource]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((d) => setUsers(d.users || []))
      .catch(console.error);
  }, []);

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    // Optimistic UI update
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update stage');
      fetchProspects();
    } catch (err) {
      console.error(err);
      fetchProspects();
    }
  };

  const filteredProspects = prospects.filter((p) => {
    if (selectedUserId !== 'ALL') {
      if (p.assignedUser?.id !== selectedUserId) return false;
    }
    return true;
  });

  const getNeighborStages = (currentStage: string) => {
    const idx = KANBAN_STAGES.findIndex((c) => c.key === currentStage);
    const prev = idx > 0 ? KANBAN_STAGES[idx - 1] : null;
    const next = idx >= 0 && idx < KANBAN_STAGES.length - 2 ? KANBAN_STAGES[idx + 1] : null;
    return { prev, next };
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Kanban className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pipeline Kanban Board
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {filteredProspects.length} Active Deals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual Deal Progression: Drag and drop cards between stages, track outreach touchpoints, and close client contracts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Switch to Table Directory */}
          <Link
            href="/prospects"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
          >
            <TableIcon className="w-4 h-4 text-slate-500" />
            <span>Table Directory</span>
          </Link>

          {/* Bulk Import Shortcut */}
          <Link
            href="/prospects/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Bulk Import (.csv)</span>
          </Link>

          {/* Add Prospect Button */}
          <Link
            href="/prospects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Prospect
          </Link>
        </div>
      </div>

      {/* Kanban Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
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

          {/* Assigned Executive Filter */}
          <div>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              <option value="ALL">All Team Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.designation || u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Lead Source Filter */}
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
        </div>

        {(searchTerm || selectedSource !== 'ALL' || selectedUserId !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Filtered results active</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSource('ALL');
                setSelectedUserId('ALL');
              }}
              className="text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Tip Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Interactive Drag &amp; Drop:</strong> Click and drag any card to advance through stages. Stage updates are instantly saved to the database.
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] font-bold text-blue-600">
          {filteredProspects.length} Total Prospects
        </span>
      </div>

      {/* 8 Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory scroll-smooth">
        {KANBAN_STAGES.map((col) => {
          const colProspects = filteredProspects.filter((p) => p.status === col.key);
          const isOver = dragOverColumn === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => setDragOverColumn(col.key)}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const droppedId = e.dataTransfer.getData('text/plain') || draggedProspectId;
                setDragOverColumn(null);
                setDraggedProspectId(null);
                if (droppedId) {
                  handleStatusChange(droppedId, col.key);
                }
              }}
              className={`w-[82vw] sm:w-80 shrink-0 snap-center sm:snap-start rounded-3xl p-3.5 border transition-all duration-200 flex flex-col max-h-[78vh] ${
                isOver
                  ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-400 scale-[1.01] shadow-lg'
                  : 'bg-slate-100/80 border-slate-200/90 shadow-xs'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-black text-slate-800">{col.label}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shadow-2xs ${col.badge}`}>
                  {colProspects.length}
                </span>
              </div>

              {/* Column Body / Cards */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {colProspects.length === 0 ? (
                  <div
                    className={`text-center py-10 rounded-2xl border-2 border-dashed transition ${
                      isOver ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200/80'
                    }`}
                  >
                    <p className="text-[11px] text-slate-400 font-semibold italic">
                      {isOver ? 'Drop card here' : 'No prospects in this stage'}
                    </p>
                  </div>
                ) : (
                  colProspects.map((p) => {
                    const isDragging = draggedProspectId === p.id;
                    const { prev, next } = getNeighborStages(p.status);

                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', p.id);
                          setDraggedProspectId(p.id);
                        }}
                        onDragEnd={() => {
                          setDraggedProspectId(null);
                          setDragOverColumn(null);
                        }}
                        className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2.5 cursor-grab active:cursor-grabbing select-none group ${
                          isDragging ? 'opacity-40 scale-95 border-dashed border-2 border-blue-400' : ''
                        }`}
                      >
                        {/* Card Header: Drag Handle + Name + Code */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                            <Link
                              href={`/prospects/${p.id}`}
                              className="font-black text-sm text-slate-900 hover:text-blue-600 transition leading-snug truncate"
                            >
                              {p.companyName}
                            </Link>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {p.prospectCode}
                          </span>
                        </div>

                        {/* Contact Person */}
                        {p.contactPerson && (
                          <p className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                            <span>👤</span>
                            <span>{p.contactPerson}</span>
                            {p.designation && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({p.designation})
                              </span>
                            )}
                          </p>
                        )}

                        {/* City & Source */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          {p.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {p.city}
                            </span>
                          )}
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">
                            {LEAD_SOURCE_LABELS[p.leadSource] || p.leadSource}
                          </span>
                        </div>

                        {/* Assigned & Next Follow-up */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                            {p.assignedUser?.name || 'Unassigned'}
                          </span>
                          {p.nextFollowUpDate && (
                            <span className="flex items-center gap-1 text-blue-600 font-bold shrink-0">
                              <Calendar className="w-3 h-3" />
                              {formatDate(p.nextFollowUpDate, 'dd MMM')}
                            </span>
                          )}
                        </div>

                        {/* Quick Stage Controls (Move Left / Right / Dropdown / Mark Won) */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                          {prev && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(p.id, prev.key)}
                              title={`Move back to: ${prev.label}`}
                              className="p-1 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                            className="flex-1 text-[10px] py-1 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-600"
                          >
                            {KANBAN_STAGES.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>

                          {next && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(p.id, next.key)}
                              title={`Advance to: ${next.label}`}
                              className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {p.status !== 'WON' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(p.id, 'WON')}
                              title="Mark as Won / Closed Client"
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Pipeline Kanban...</div>}>
        <PipelineKanbanContent />
      </Suspense>
    </AppLayout>
  );
}
