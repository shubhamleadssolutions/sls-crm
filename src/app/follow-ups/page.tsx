'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { formatDate, STATUS_LABELS } from '@/lib/utils';

function FollowUpsContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'all'>(
    filterParam === 'overdue' ? 'overdue' : 'today'
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleMarkComplete = async (prospectId: string) => {
    try {
      await fetch(`/api/prospects/${prospectId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markCompleted: true }),
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data || !data.metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { todaysFollowUps, overdueFollowUps } = data;
  const currentList = activeTab === 'today' ? todaysFollowUps : overdueFollowUps;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Follow-up Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ensure zero dropped leads by staying on top of scheduled and overdue prospect touches.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Due Today ({todaysFollowUps.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'overdue' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue ({overdueFollowUps.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Prospect / Company</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Follow-up Date</th>
                <th className="py-3.5 px-4">Channel / Notes</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {activeTab === 'today'
                      ? '🎉 No follow-ups scheduled for today.'
                      : '🎉 Great job! No overdue follow-ups.'}
                  </td>
                </tr>
              ) : (
                currentList.map((p: any) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/prospects/${p.id}`}
                          className="font-bold text-sm text-blue-600 hover:underline block"
                        >
                          {p.companyName}
                        </Link>
                        <span className="text-[11px] text-slate-400 font-mono">{p.prospectCode}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{p.contactPerson || '-'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.whatsappNumber && (
                            <a
                              href={`https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 font-medium text-[11px]"
                            >
                              WhatsApp
                            </a>
                          )}
                          {p.phone && (
                            <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline text-[11px]">
                              Call: {p.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            activeTab === 'overdue' ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {formatDate(p.nextFollowUpDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-1">
                          {p.followUpType || 'Outreach'}
                        </span>
                        <p className="text-slate-600 text-[11px] line-clamp-1">
                          {p.followUpNotes || 'No notes'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {p.assignedUser?.name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleMarkComplete(p.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done
                          </button>
                          <Link
                            href={`/prospects/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition"
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function FollowUpsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading follow-ups...</div>}>
        <FollowUpsContent />
      </Suspense>
    </AppLayout>
  );
}
