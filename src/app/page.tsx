'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { getClientCachedItem, setClientCachedItem } from '@/lib/clientCache';
import {
  Users,
  UserCheck,
  CalendarClock,
  MessageCircle,
  Sparkles,
  PhoneCall,
  FileText,
  Trophy,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Phone,
  UserCog,
  UserPlus,
} from 'lucide-react';
import { formatDate, STATUS_LABELS } from '@/lib/utils';

interface DashboardStats {
  currentUser?: {
    id: string;
    name: string;
    username: string;
    role: string;
    designation: string;
  };
  metrics: {
    total: number;
    newCount: number;
    contacted: number;
    followUpDue: number;
    replied: number;
    interested: number;
    meetings: number;
    proposalsSent: number;
    won: number;
    lost: number;
    dueTodayCount: number;
    overdueCount: number;
  };
  todaysFollowUps: any[];
  overdueFollowUps: any[];
  recentActivities: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(() => getClientCachedItem<DashboardStats>('dashboard_stats'));
  const [loading, setLoading] = useState<boolean>(() => !getClientCachedItem<DashboardStats>('dashboard_stats'));

  const fetchStats = () => {
    fetch('/api/dashboard/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized or failed');
        return res.json();
      })
      .then((d) => {
        if (d && d.metrics) {
          setData(d);
          setClientCachedItem('dashboard_stats', d);
        }
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

  const handleMarkFollowUpDone = async (prospectId: string) => {
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
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const {
    metrics,
    todaysFollowUps = [],
    overdueFollowUps = [],
    recentActivities = [],
    currentUser,
  } = data;

  const cards = [
    { label: 'Total Prospects', value: metrics.total, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'New Prospects', value: metrics.newCount, icon: Sparkles, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { label: 'Contacted', value: metrics.contacted, icon: MessageCircle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Follow-ups Due', value: metrics.followUpDue, icon: CalendarClock, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { label: 'Replied', value: metrics.replied, icon: MessageCircle, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'Interested', value: metrics.interested, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'Meetings', value: metrics.meetings, icon: PhoneCall, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { label: 'Proposals Sent', value: metrics.proposalsSent, icon: FileText, color: 'text-pink-600 bg-pink-50 border-pink-200' },
    { label: 'Won (Clients)', value: metrics.won, icon: Trophy, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Lost', value: metrics.lost, icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  ];

  const totalClosed = metrics.won + metrics.lost;
  const winRate = totalClosed > 0 ? Math.round((metrics.won / totalClosed) * 100) : 100;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                CRM Executive Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Welcome, <strong>{currentUser?.name || 'Abhinav'}</strong> &bull; {currentUser?.designation || 'Managing Director'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Live Pipeline Active
            </span>
          </div>
        </div>

        {/* Overdue Follow-ups Alert Banner if any */}
        {overdueFollowUps.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-rose-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  {overdueFollowUps.length} Overdue Follow-up{overdueFollowUps.length > 1 ? 's' : ''} Require Attention
                </p>
                <p className="text-[11px] text-rose-600">
                  Connect with these prospects now to maintain high conversion momentum.
                </p>
              </div>
            </div>
            <Link
              href="/follow-ups?filter=overdue"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              Resolve Overdue &rarr;
            </Link>
          </div>
        )}

        {/* 10 Dashboard Metric Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pipeline Snapshot
            </h2>
            <Link href="/pipeline" className="text-xs font-semibold text-blue-600 hover:underline">
              View Pipeline Kanban Board &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                      {card.label}
                    </span>
                    <div className={`p-1.5 rounded-xl border ${card.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{card.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3-Column Section: Today's Follow-ups & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Follow-ups Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Today&apos;s Follow-ups</h2>
                  <p className="text-[11px] text-slate-500">Prospects scheduled for contact today</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-blue-100/70 text-blue-700 rounded-full">
                {todaysFollowUps.length} Scheduled
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              {todaysFollowUps.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  🎉 No pending follow-ups due today! You are all caught up.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Company Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Channel &amp; Notes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaysFollowUps.map((p) => {
                      const statusInfo = STATUS_LABELS[p.status] || {
                        label: p.status,
                        color: 'bg-slate-100 text-slate-700',
                      };
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/prospects/${p.id}`}
                              className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {p.companyName}
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono">{p.prospectCode}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800">{p.contactPerson || '-'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
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
                                <a href={`tel:${p.phone}`} className="text-slate-500 hover:text-slate-700 text-[10px]">
                                  Call
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.followUpType || 'WhatsApp'}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.followUpNotes || 'Scheduled touch'}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleMarkFollowUpDone(p.id)}
                                title="Mark Follow-up as Completed"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Done
                              </button>
                              <Link
                                href={`/prospects/${p.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column: Pipeline Health + Recent Activities */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pipeline Health
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Win Rate</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{winRate}%</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Active Deals</p>
                  <p className="text-xl font-black text-blue-600 mt-1">
                    {metrics.interested + metrics.meetings + metrics.proposalsSent}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Activities</h3>
                </div>
              </div>

              <div className="flex-1 mt-4 space-y-3.5 overflow-y-auto max-h-[320px] pr-1">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No recent activities recorded yet.</p>
                ) : (
                  recentActivities.map((act) => (
                    <div key={act.id} className="text-xs flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{act.activity}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <Link
                            href={`/prospects/${act.prospect?.id}`}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            {act.prospect?.companyName}
                          </Link>
                          <span>&bull;</span>
                          <span>{formatDate(act.date, 'dd MMM, hh:mm a')}</span>
                        </div>
                        {act.result && (
                          <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg mt-1 border border-slate-100">
                            Result: {act.result}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
