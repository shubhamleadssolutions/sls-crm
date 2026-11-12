import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterUserId = searchParams.get('userId');

    // If BD_INTERN, restrict to their assigned prospects by default unless admin
    const isIntern = user.role === 'BD_INTERN';
    const assignedFilter = isIntern ? { assignedUserId: user.id } : (filterUserId ? { assignedUserId: filterUserId } : {});

    const baseWhere = {
      isArchived: false,
      ...assignedFilter,
    };

    // Calculate Dashboard Counts
    const [
      total,
      newCount,
      contacted,
      followUpDue,
      replied,
      interested,
      meetings,
      proposalsSent,
      won,
      lost,
    ] = await Promise.all([
      prisma.prospect.count({ where: baseWhere }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'NEW_PROSPECT' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'CONTACTED' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'FOLLOW_UP' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'REPLIED' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'INTERESTED' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'MEETING_DISCUSSION' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'PROPOSAL_SENT' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'WON' } }),
      prisma.prospect.count({ where: { ...baseWhere, status: 'LOST' } }),
    ]);

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Today's Follow-ups
    const todaysFollowUps = await prisma.prospect.findMany({
      where: {
        ...baseWhere,
        nextFollowUpDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { nextFollowUpDate: 'asc' },
    });

    // Overdue Follow-ups
    const overdueFollowUps = await prisma.prospect.findMany({
      where: {
        ...baseWhere,
        nextFollowUpDate: {
          lt: todayStart,
        },
      },
      include: {
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { nextFollowUpDate: 'asc' },
    });

    // Recent Activities
    const recentActivities = await prisma.activity.findMany({
      where: isIntern
        ? { prospect: { assignedUserId: user.id } }
        : {},
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        prospect: { select: { id: true, companyName: true, prospectCode: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // --------------------------------------------------------------------------
    // Employee Performance & Closed Deals Aggregation (Who worked the most)
    // --------------------------------------------------------------------------
    const allUsers = await prisma.user.findMany({
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
        activities: {
          select: { id: true },
        },
        meetings: {
          select: { id: true },
        },
        clients: {
          select: { id: true, retainerAmount: true },
        },
      },
    });

    const activeStages = ['INTERESTED', 'MEETING_DISCUSSION', 'PROPOSAL_SENT', 'REPLIED', 'FOLLOW_UP'];

    const teamLeaderboard = allUsers
      .map((u) => {
        const totalAssigned = u.assignedProspects.length;
        const wonCount = u.assignedProspects.filter((p) => p.status === 'WON').length + u.clients.length;
        const lostCount = u.assignedProspects.filter((p) => p.status === 'LOST').length;
        const activeDeals = u.assignedProspects.filter((p) => activeStages.includes(p.status)).length;
        const activitiesCount = u.activities.length;
        const meetingsCount = u.meetings.length;
        const closedCount = wonCount + lostCount;
        const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : (totalAssigned > 0 ? 0 : 100);

        // Work score: closed deals (weight: 15), meetings (weight: 5), outreach activities (weight: 2), assigned pipeline (weight: 1)
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
      .map((item, index) => {
        let badge = 'Active Contributor';
        if (index === 0 && (item.wonCount > 0 || item.workScore > 0)) {
          badge = '🏆 Top Closer (Worked Most)';
        } else if (index === 1 && item.workScore > 0) {
          badge = '🥈 Star Performer';
        } else if (index === 2 && item.workScore > 0) {
          badge = '🥉 High Achiever';
        }
        return {
          ...item,
          rank: index + 1,
          badge,
        };
      });

    // Find current user's individual progress
    const myStats = teamLeaderboard.find((u) => u.id === user.id) || {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      designation: user.designation || 'Managing Director',
      totalAssigned: 0,
      wonCount: 0,
      lostCount: 0,
      activeDeals: 0,
      activitiesCount: 0,
      meetingsCount: 0,
      winRate: 100,
      workScore: 0,
      rank: 1,
      badge: 'Active Contributor',
    };

    return NextResponse.json({
      currentUser: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        designation: user.designation || 'Managing Director',
      },
      metrics: {
        total,
        newCount,
        contacted,
        followUpDue,
        replied,
        interested,
        meetings,
        proposalsSent,
        won,
        lost,
        dueTodayCount: todaysFollowUps.length,
        overdueCount: overdueFollowUps.length,
      },
      todaysFollowUps,
      overdueFollowUps,
      recentActivities,
      teamLeaderboard,
      myProgress: myStats,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
