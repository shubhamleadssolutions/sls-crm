import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, subDays } from 'date-fns';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterUserId = searchParams.get('userId');
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const channel = searchParams.get('channel') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const timeframe = searchParams.get('timeframe') || 'today'; // today, overdue, upcoming, completed, all

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

    const baseWhere: any = {
      isArchived: false,
      ...assignedFilter,
    };

    if (channel !== 'ALL') {
      baseWhere.followUpType = channel;
    }

    if (status !== 'ALL') {
      baseWhere.status = status;
    }

    if (search) {
      baseWhere.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { prospectCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { whatsappNumber: { contains: search, mode: 'insensitive' } },
        { followUpNotes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const upcomingEnd = endOfDay(addDays(now, 14)); // Next 14 days

    // Aggregated KPI counts for current scope
    const kpiBaseWhere = {
      isArchived: false,
      ...assignedFilter,
    };

    const [overdueCount, todayCount, upcomingCount, completedRecentCount, totalProspectsWithFollowUp] = await Promise.all([
      prisma.prospect.count({
        where: {
          ...kpiBaseWhere,
          nextFollowUpDate: { lt: todayStart },
        },
      }),
      prisma.prospect.count({
        where: {
          ...kpiBaseWhere,
          nextFollowUpDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.prospect.count({
        where: {
          ...kpiBaseWhere,
          nextFollowUpDate: { gt: todayEnd, lte: upcomingEnd },
        },
      }),
      prisma.activity.count({
        where: {
          date: { gte: subDays(todayStart, 7) },
          activity: { contains: 'Completed follow-up' },
          ...(isExecutive && filterUserId && filterUserId !== 'ALL'
            ? filterUserId === 'UNASSIGNED'
              ? {}
              : { userId: filterUserId }
            : !isExecutive
            ? { userId: user.id }
            : {}),
        },
      }),
      prisma.prospect.count({
        where: {
          ...kpiBaseWhere,
          nextFollowUpDate: { not: null },
        },
      }),
    ]);

    // Construct specific date query based on timeframe
    let timeframeWhere: any = {};
    let orderBy: any = { nextFollowUpDate: 'asc' };

    if (timeframe === 'today') {
      timeframeWhere = {
        nextFollowUpDate: { gte: todayStart, lte: todayEnd },
      };
      orderBy = { nextFollowUpDate: 'asc' };
    } else if (timeframe === 'overdue') {
      timeframeWhere = {
        nextFollowUpDate: { lt: todayStart },
      };
      // Oldest overdue first to resolve critical backlogs
      orderBy = { nextFollowUpDate: 'asc' };
    } else if (timeframe === 'upcoming') {
      timeframeWhere = {
        nextFollowUpDate: { gt: todayEnd },
      };
      orderBy = { nextFollowUpDate: 'asc' };
    } else if (timeframe === 'all') {
      timeframeWhere = {
        nextFollowUpDate: { not: null },
      };
      orderBy = { nextFollowUpDate: 'asc' };
    }

    if (timeframe === 'completed') {
      // Fetch recent completed follow-up activities
      const completedActivities = await prisma.activity.findMany({
        where: {
          activity: { contains: 'Completed follow-up' },
          ...(isExecutive && filterUserId && filterUserId !== 'ALL'
            ? filterUserId === 'UNASSIGNED'
              ? {}
              : { userId: filterUserId }
            : !isExecutive
            ? { userId: user.id }
            : {}),
        },
        take: 50,
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, name: true, username: true, role: true, designation: true } },
          prospect: {
            select: {
              id: true,
              prospectCode: true,
              companyName: true,
              contactPerson: true,
              phone: true,
              whatsappNumber: true,
              status: true,
              nextFollowUpDate: true,
              followUpType: true,
              assignedUser: { select: { id: true, name: true, username: true, role: true, designation: true } },
            },
          },
        },
      });

      return NextResponse.json({
        timeframe: 'completed',
        isExecutive,
        metrics: {
          overdue: overdueCount,
          today: todayCount,
          upcoming: upcomingCount,
          completedPast7Days: completedRecentCount,
          totalActive: totalProspectsWithFollowUp,
        },
        items: completedActivities.map((act) => ({
          activityId: act.id,
          completedAt: act.date,
          completedBy: act.user,
          outcome: act.result,
          notes: act.activity.replace('Completed follow-up: ', ''),
          channel: act.channel,
          prospect: act.prospect,
        })),
      });
    }

    // Standard pending follow-ups query
    const followUps = await prisma.prospect.findMany({
      where: {
        ...baseWhere,
        ...timeframeWhere,
      },
      include: {
        assignedUser: { select: { id: true, name: true, username: true, role: true, designation: true } },
        activities: {
          take: 1,
          orderBy: { date: 'desc' },
          select: { activity: true, result: true, date: true },
        },
      },
      orderBy,
      take: 100,
    });

    // Decorate records with urgency calculations
    const decorated = followUps.map((p) => {
      const fDate = p.nextFollowUpDate ? new Date(p.nextFollowUpDate) : null;
      let urgency: 'CRITICAL_OVERDUE' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' = 'UPCOMING';
      let daysOverdue = 0;

      if (fDate) {
        if (fDate < todayStart) {
          const diffMs = todayStart.getTime() - fDate.getTime();
          daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          urgency = daysOverdue >= 3 ? 'CRITICAL_OVERDUE' : 'OVERDUE';
        } else if (fDate <= todayEnd) {
          urgency = 'DUE_TODAY';
        }
      }

      return {
        ...p,
        urgency,
        daysOverdue,
        lastActivity: p.activities[0] || null,
      };
    });

    return NextResponse.json({
      timeframe,
      isExecutive,
      metrics: {
        overdue: overdueCount,
        today: todayCount,
        upcoming: upcomingCount,
        completedPast7Days: completedRecentCount,
        totalActive: totalProspectsWithFollowUp,
      },
      items: decorated,
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

// POST: Professional Log & Complete touchpoint with outcome, notes, and next follow-up
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      prospectId,
      outcome, // e.g. CONNECTED_INTERESTED, BUSY_CALL_BACK, NO_ANSWER, MEETING_BOOKED, PROPOSAL_REQUESTED, NOT_INTERESTED
      notes,
      channel, // PHONE_CALL, WHATSAPP, MEETING, EMAIL
      nextScheduledDate, // ISO string or null
      nextType,
      nextNotes,
      updateStatus, // Optional pipeline stage advance (e.g. MEETING_DISCUSSION, PROPOSAL_SENT)
    } = await req.json();

    if (!prospectId) {
      return NextResponse.json({ error: 'prospectId is required' }, { status: 400 });
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: { assignedUser: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const execRoleTag = user.role === 'ADMIN' ? 'MD' : user.role;
    const outcomeLabel = outcome ? outcome.replace(/_/g, ' ') : 'Follow-up Completed';

    // 1. Log Touchpoint Activity
    await prisma.activity.create({
      data: {
        prospectId,
        channel: channel || prospect.followUpType || 'OTHER',
        activity: `Completed follow-up: ${notes?.trim() || prospect.followUpNotes || 'Touchpoint logged'}`,
        result: `${outcomeLabel} (by ${user.name} - ${execRoleTag})`,
        userId: user.id,
      },
    });

    // 2. Mark previous pending FollowUp models as COMPLETED
    await prisma.followUp.updateMany({
      where: {
        prospectId,
        status: 'PENDING',
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 3. If a next follow-up is scheduled, create FollowUp record
    if (nextScheduledDate) {
      await prisma.followUp.create({
        data: {
          prospectId,
          scheduledDate: new Date(nextScheduledDate),
          type: nextType || channel || 'WHATSAPP',
          notes: nextNotes?.trim() || `Next step after: ${outcomeLabel}`,
          userId: prospect.assignedUserId || user.id,
        },
      });
    }

    // 4. Update Prospect record with new state
    const prospectUpdateData: any = {
      followUpCount: { increment: 1 },
      nextFollowUpDate: nextScheduledDate ? new Date(nextScheduledDate) : null,
      followUpType: nextScheduledDate ? (nextType || channel || 'WHATSAPP') : null,
      followUpNotes: nextScheduledDate ? (nextNotes?.trim() || `Next step after: ${outcomeLabel}`) : null,
    };

    if (updateStatus && updateStatus !== prospect.status) {
      prospectUpdateData.status = updateStatus;
      await prisma.activity.create({
        data: {
          prospectId,
          channel: 'OTHER',
          activity: `Pipeline stage updated to ${updateStatus.replace(/_/g, ' ')}`,
          result: `Updated during follow-up by ${user.name}`,
          userId: user.id,
        },
      });
    }

    const updatedProspect = await prisma.prospect.update({
      where: { id: prospectId },
      data: prospectUpdateData,
      include: {
        assignedUser: { select: { id: true, name: true, username: true, role: true, designation: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Follow-up successfully completed and logged',
      prospect: updatedProspect,
    });
  } catch (error) {
    console.error('Error logging follow-up:', error);
    return NextResponse.json({ error: 'Failed to log follow-up' }, { status: 500 });
  }
}

// PATCH: 1-Click Quick Reschedule (+1 day, +3 days, +1 week, or custom date)
export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prospectId, daysToAdd, customDate, reason } = await req.json();

    if (!prospectId) {
      return NextResponse.json({ error: 'prospectId is required' }, { status: 400 });
    }

    let targetDate: Date;
    if (customDate) {
      targetDate = new Date(customDate);
    } else if (typeof daysToAdd === 'number') {
      targetDate = addDays(new Date(), daysToAdd);
    } else {
      return NextResponse.json({ error: 'daysToAdd or customDate must be provided' }, { status: 400 });
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const execRoleTag = user.role === 'ADMIN' ? 'MD' : user.role;

    // Log Activity for reschedule
    await prisma.activity.create({
      data: {
        prospectId,
        channel: 'OTHER',
        activity: `Follow-up rescheduled to ${targetDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`,
        result: reason?.trim() ? `Reason: ${reason.trim()} (${user.name})` : `Rescheduled by ${user.name} (${execRoleTag})`,
        userId: user.id,
      },
    });

    // Update FollowUp table
    await prisma.followUp.create({
      data: {
        prospectId,
        scheduledDate: targetDate,
        type: prospect.followUpType || 'WHATSAPP',
        notes: reason?.trim() || prospect.followUpNotes || 'Rescheduled follow-up',
        userId: prospect.assignedUserId || user.id,
      },
    });

    const updated = await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        nextFollowUpDate: targetDate,
        followUpNotes: reason?.trim() ? `${prospect.followUpNotes ? prospect.followUpNotes + ' | ' : ''}Rescheduled: ${reason.trim()}` : prospect.followUpNotes,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Follow-up successfully rescheduled',
      prospect: updated,
    });
  } catch (error) {
    console.error('Error rescheduling follow-up:', error);
    return NextResponse.json({ error: 'Failed to reschedule follow-up' }, { status: 500 });
  }
}
