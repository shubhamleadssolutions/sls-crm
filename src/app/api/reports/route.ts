import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Access check: Restricted to CEO & MD (ADMIN) only
    if (user.role !== 'ADMIN' && user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden: Business reports are restricted to CEO and MD only' },
        { status: 403 }
      );
    }

    const [
      totalProspects,
      wonProspects,
      lostProspects,
      proposals,
      clients,
      campaigns,
      studentLeads,
      sourceGroup,
      statusGroup,
      allUsers,
    ] = await Promise.all([
      prisma.prospect.count({ where: { isArchived: false } }),
      prisma.prospect.count({ where: { status: 'WON', isArchived: false } }),
      prisma.prospect.count({ where: { status: 'LOST', isArchived: false } }),
      prisma.proposal.findMany({ select: { id: true, amount: true, status: true } }),
      prisma.client.findMany({ select: { id: true, retainerAmount: true, campaignStatus: true } }),
      prisma.campaign.findMany({ select: { id: true, budget: true, generatedLeads: true } }),
      prisma.studentLead.findMany({ select: { id: true, status: true, admissionStatus: true } }),
      prisma.prospect.groupBy({
        by: ['leadSource'],
        where: { isArchived: false },
        _count: { id: true },
      }),
      prisma.prospect.groupBy({
        by: ['status'],
        where: { isArchived: false },
        _count: { id: true },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          designation: true,
          assignedProspects: {
            where: { isArchived: false },
            select: { id: true, status: true },
          },
          activities: { select: { id: true } },
          meetings: { select: { id: true } },
          clients: { select: { id: true, retainerAmount: true } },
        },
      }),
    ]);

    // Financial calculations
    const totalRetainerRevenue = clients.reduce(
      (acc, c) => acc + (c.retainerAmount ? Number(c.retainerAmount) : 0),
      0
    );

    const totalProposalValue = proposals.reduce(
      (acc, p) => acc + (p.amount ? Number(p.amount) : 0),
      0
    );

    const acceptedProposals = proposals.filter((p) => p.status === 'ACCEPTED').length;
    const proposalConversionRate = proposals.length > 0 ? Math.round((acceptedProposals / proposals.length) * 100) : 0;

    const totalClosed = wonProspects + lostProspects;
    const prospectWinRate = totalClosed > 0 ? Math.round((wonProspects / totalClosed) * 100) : 0;

    // Student conversion
    const totalEnrolled = studentLeads.filter((s) => s.admissionStatus === 'Enrolled' || s.status === 'ADMISSION_CONFIRMED').length;
    const studentAdmissionRate = studentLeads.length > 0 ? Math.round((totalEnrolled / studentLeads.length) * 100) : 0;

    // Employee Performance Breakdown
    const activeStages = ['INTERESTED', 'MEETING_DISCUSSION', 'PROPOSAL_SENT', 'REPLIED', 'FOLLOW_UP'];
    const employeeLeaderboard = allUsers
      .map((u) => {
        const totalAssigned = u.assignedProspects.length;
        const wonCount = u.assignedProspects.filter((p) => p.status === 'WON').length + u.clients.length;
        const lostCount = u.assignedProspects.filter((p) => p.status === 'LOST').length;
        const activeDeals = u.assignedProspects.filter((p) => activeStages.includes(p.status)).length;
        const activitiesCount = u.activities.length;
        const meetingsCount = u.meetings.length;
        const closedCount = wonCount + lostCount;
        const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : (totalAssigned > 0 ? 0 : 100);
        const workScore = wonCount * 15 + meetingsCount * 5 + activitiesCount * 2 + totalAssigned;

        return {
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          designation: u.designation || 'Team Member',
          totalAssigned,
          wonCount,
          lostCount,
          activeDeals,
          activitiesCount,
          meetingsCount,
          winRate,
          workScore,
        };
      })
      .sort((a, b) => {
        if (b.wonCount !== a.wonCount) return b.wonCount - a.wonCount;
        return b.workScore - a.workScore;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        badge: index === 0 && (item.wonCount > 0 || item.workScore > 0)
          ? '🏆 Top Closer (Worked Most)'
          : index === 1 && item.workScore > 0
          ? '🥈 Star Performer'
          : index === 2 && item.workScore > 0
          ? '🥉 High Achiever'
          : 'Active Contributor',
      }));

    return NextResponse.json({
      metrics: {
        totalProspects,
        wonProspects,
        lostProspects,
        prospectWinRate,
        totalClients: clients.length,
        totalRetainerRevenue,
        totalProposals: proposals.length,
        totalProposalValue,
        proposalConversionRate,
        totalCampaigns: campaigns.length,
        totalStudentLeads: studentLeads.length,
        totalEnrolledStudents: totalEnrolled,
        studentAdmissionRate,
      },
      sources: sourceGroup.map((s) => ({
        source: s.leadSource,
        count: s._count.id,
      })),
      pipelineStages: statusGroup.map((st) => ({
        stage: st.status,
        count: st._count.id,
      })),
      employeeLeaderboard,
    });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
