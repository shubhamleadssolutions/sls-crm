'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  IndianRupee,
  Users,
  Briefcase,
  GraduationCap,
  FileText,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Download,
} from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  NEW_PROSPECT: 'New Prospects',
  ATTEMPTED_CONTACT: 'Contact Attempted',
  CONNECTED_DM: 'Connected with DM',
  MEETING_SCHEDULED: 'Meeting Scheduled',
  MEETING_COMPLETED: 'Meeting Completed',
  PROPOSAL_SENT: 'Proposal Sent',
  NEGOTIATION: 'In Negotiation',
  WON: 'Won / Converted',
  LOST: 'Lost',
  COLD_NURTURE: 'Cold Nurture',
  DO_NOT_CONTACT: 'Do Not Contact',
};

export default function ReportsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const metrics = data?.metrics || {
    totalProspects: 0,
    wonProspects: 0,
    lostProspects: 0,
    prospectWinRate: 0,
    totalClients: 0,
    totalRetainerRevenue: 0,
    totalProposals: 0,
    totalProposalValue: 0,
    proposalConversionRate: 0,
    totalCampaigns: 0,
    totalStudentLeads: 0,
    totalEnrolledStudents: 0,
    studentAdmissionRate: 0,
  };

  const sources = data?.sources || [];
  const pipelineStages = data?.pipelineStages || [];
  const totalStageCount = pipelineStages.reduce((acc: number, s: any) => acc + s.count, 0) || 1;
  const totalSourceCount = sources.reduce((acc: number, s: any) => acc + s.count, 0) || 1;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Business Analytics & Executive Reports
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                Phase 1, 2 & 3 Combined
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              End-to-end commercial performance across B2B outreach, client retainers, and student enrollments.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90 text-slate-500 text-xs">
            Calculating business intelligence metrics...
          </div>
        ) : (
          <>
            {/* Top KPIs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Prospect Win Rate</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{metrics.prospectWinRate}%</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {metrics.wonProspects} won vs {metrics.lostProspects} lost
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Monthly Retainer Revenue</span>
                  <IndianRupee className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-blue-600">
                  ₹{Number(metrics.totalRetainerRevenue).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {metrics.totalClients} Active partner colleges
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Proposal Pipeline</span>
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-black text-purple-600">
                  ₹{Number(metrics.totalProposalValue).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {metrics.proposalConversionRate}% acceptance rate ({metrics.totalProposals} proposals)
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Student Admission Rate</span>
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-3xl font-black text-indigo-600">{metrics.studentAdmissionRate}%</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {metrics.totalEnrolledStudents} of {metrics.totalStudentLeads} enrolled
                </div>
              </div>
            </div>

            {/* Pipeline Stage Breakdown & Lead Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funnel Stage Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Prospect Pipeline Distribution</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{metrics.totalProspects} Prospects</span>
                </div>

                {pipelineStages.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No prospects data to display</p>
                ) : (
                  <div className="space-y-3">
                    {pipelineStages.map((st: any) => {
                      const pct = Math.round((st.count / totalStageCount) * 100);
                      return (
                        <div key={st.stage} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                            <span>{STAGE_LABELS[st.stage] || st.stage}</span>
                            <span className="font-bold text-slate-900">
                              {st.count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lead Source Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Lead Source Channels</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{sources.length} Channels</span>
                </div>

                {sources.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No sources data to display</p>
                ) : (
                  <div className="space-y-3">
                    {sources.map((src: any) => {
                      const pct = Math.round((src.count / totalSourceCount) * 100);
                      return (
                        <div key={src.source} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                            <span>{src.source || 'Direct Outreach'}</span>
                            <span className="font-bold text-slate-900">
                              {src.count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Strategic Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Phase 1: B2B Outreach
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Focus on cold outreach to decision makers (Directors, Deans, Admission Heads). Currently tracking{' '}
                  <span className="font-bold text-slate-900">{metrics.totalProspects}</span> accounts in the pipeline.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Phase 2: Client Retainers
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Converting prospects into retained institutions. Currently maintaining{' '}
                  <span className="font-bold text-slate-900">{metrics.totalClients}</span> active accounts generating{' '}
                  <span className="font-bold text-emerald-600">
                    ₹{Number(metrics.totalRetainerRevenue).toLocaleString('en-IN')}/mo
                  </span>.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Phase 3: Student Delivery
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Executing paid advertising campaigns and multi-touch student counselling to achieve verified admissions with an admission rate of{' '}
                  <span className="font-bold text-purple-600">{metrics.studentAdmissionRate}%</span>.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
