import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch all active users with their deals and activities to compute ranks & stats
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
        clients: {
          select: { id: true },
        },
        activities: {
          select: { id: true },
        },
        meetings: {
          select: { id: true },
        },
      },
    });

    const activeStages = ['INTERESTED', 'MEETING_DISCUSSION', 'PROPOSAL_SENT', 'REPLIED', 'FOLLOW_UP'];

    // Score and rank each user
    const leaderboard = allUsers
      .map((u) => {
        const wonCount = u.assignedProspects.filter((p) => p.status === 'WON').length + u.clients.length;
        const lostCount = u.assignedProspects.filter((p) => p.status === 'LOST').length;
        const totalClosed = wonCount + lostCount;
        const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 100;
        const activeDeals = u.assignedProspects.filter((p) => activeStages.includes(p.status)).length;
        const activitiesCount = u.activities.length;
        const meetingsCount = u.meetings.length;

        const workScore = wonCount * 15 + meetingsCount * 5 + activitiesCount * 2 + u.assignedProspects.length;

        return {
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          designation: u.designation || 'Executive',
          totalAssigned: u.assignedProspects.length,
          wonCount,
          lostCount,
          activeDeals,
          activitiesCount,
          meetingsCount,
          winRate,
          workScore,
        };
      })
      .sort((a, b) => b.workScore - a.workScore || b.wonCount - a.wonCount);

    const userIndex = leaderboard.findIndex((u) => u.id === userId);
    const userRank = userIndex >= 0 ? userIndex + 1 : 1;
    const userStats = leaderboard.find((u) => u.id === userId);

    let badge = 'Active Contributor';
    if (userRank === 1) badge = 'Top Closer';
    else if (userRank === 2) badge = 'Lead Specialist';
    else if (userRank === 3) badge = 'Deal Maker';

    return NextResponse.json({
      progress: {
        id: userId,
        rank: userRank,
        totalTeam: leaderboard.length,
        wonCount: userStats?.wonCount || 0,
        winRate: userStats?.winRate || 100,
        activeDeals: userStats?.activeDeals || 0,
        activitiesCount: userStats?.activitiesCount || 0,
        badge,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
  }
}
