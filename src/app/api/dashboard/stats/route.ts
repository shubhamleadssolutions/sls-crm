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

    // Role-based visibility:
    // Only CEO and MD (role ADMIN or CEO) can view the whole company's follow-ups/stats or filter by any user.
    // Non-executive staff can ONLY view their own assigned prospects and follow-ups.
    const isExecutive = user.role === 'ADMIN' || user.role === 'CEO';
    let assignedFilter: any = {};

    if (!isExecutive) {
      assignedFilter = { assignedUserId: user.id };
    } else if (filterUserId && filterUserId !== 'ALL') {
      if (filterUserId === 'UNASSIGNED') {
        assignedFilter = { assignedUserId: null };
      } else {
        assignedFilter = { assignedUserId: filterUserId };
      }
    }

    const baseWhere = {
      isArchived: false,
      ...assignedFilter,
    };

    // Calculate Dashboard Counts via single groupBy (eliminates 10 separate roundtrips)
    const [statusGroups, total] = await Promise.all([
      prisma.prospect.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.prospect.count({ where: baseWhere }),
    ]);

    const countsMap: Record<string, number> = {};
    statusGroups.forEach((g) => {
      countsMap[g.status] = g._count._all;
    });

    const newCount = countsMap['NEW_PROSPECT'] || 0;
    const contacted = countsMap['CONTACTED'] || 0;
    const followUpDue = countsMap['FOLLOW_UP'] || 0;
    const replied = countsMap['REPLIED'] || 0;
    const interested = countsMap['INTERESTED'] || 0;
    const meetings = countsMap['MEETING_DISCUSSION'] || 0;
    const proposalsSent = countsMap['PROPOSAL_SENT'] || 0;
    const won = countsMap['WON'] || 0;
    const lost = countsMap['LOST'] || 0;

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Today's Follow-ups (bounded to top 25 for fast response)
    const todaysFollowUps = await prisma.prospect.findMany({
      where: {
        ...baseWhere,
        nextFollowUpDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        assignedUser: { select: { id: true, name: true, username: true, role: true, designation: true } },
      },
      orderBy: { nextFollowUpDate: 'asc' },
      take: 25,
    });

    // Overdue Follow-ups (bounded to top 25 for fast response)
    const overdueFollowUps = await prisma.prospect.findMany({
      where: {
        ...baseWhere,
        nextFollowUpDate: {
          lt: todayStart,
        },
      },
      include: {
        assignedUser: { select: { id: true, name: true, username: true, role: true, designation: true } },
      },
      orderBy: { nextFollowUpDate: 'asc' },
      take: 25,
    });

    // Recent Activities (take 10)
    const recentActivities = await prisma.activity.findMany({
      where: !isExecutive
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
    // Employee Performance & Closed Deals Aggregation (Optimized with _count)
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
        _count: {
          select: {
            activities: true,
            meetings: true,
          },
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
        const activitiesCount = u._count.activities;
        const meetingsCount = u._count.meetings;
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
      isExecutive,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
