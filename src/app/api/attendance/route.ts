import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// Helper to get start and end of day in UTC
function getDayBounds(targetDate = new Date()) {
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start: todayStart, end: todayEnd } = getDayBounds();

    // Fetch today's record for this user
    const todayRecord = await prisma.attendance.findFirst({
      where: {
        userId: sessionUser.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { punchIn: 'desc' },
    });

    // Fetch recent 30 records for this user
    const history = await prisma.attendance.findMany({
      where: {
        userId: sessionUser.id,
      },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // Compute basic statistics
    const totalDays = history.length;
    const presentCount = history.filter((h) => h.status === 'PRESENT').length;
    const lateCount = history.filter((h) => h.status === 'LATE').length;
    const halfDayCount = history.filter((h) => h.status === 'HALF_DAY').length;

    let totalHours = 0;
    let completedDays = 0;
    history.forEach((h) => {
      if (h.workingHours) {
        totalHours += Number(h.workingHours);
        completedDays++;
      }
    });

    const avgHours = completedDays > 0 ? (totalHours / completedDays).toFixed(1) : '8.0';
    const onTimeRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

    // If Admin/CEO, also return team summary for today
    let teamToday: any[] = [];
    if (sessionUser.role === 'ADMIN' || sessionUser.role === 'CEO') {
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          designation: true,
        },
      });

      const todayTeamAttendances = await prisma.attendance.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              username: true,
              role: true,
              designation: true,
            },
          },
        },
      });

      const attendanceMap = new Map();
      todayTeamAttendances.forEach((att) => {
        attendanceMap.set(att.userId, att);
      });

      teamToday = allUsers.map((u) => {
        const att = attendanceMap.get(u.id);
        return {
          userId: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          designation: u.designation,
          status: att ? att.status : 'NOT_MARKED',
          punchIn: att?.punchIn || null,
          punchOut: att?.punchOut || null,
          workingHours: att?.workingHours || null,
          plannedTasks: att?.plannedTasks || null,
          workDone: att?.workDone || null,
          workLocation: att?.workLocation || 'Office',
        };
      });
    }

    return NextResponse.json({
      todayRecord,
      history,
      stats: {
        totalDays,
        presentCount,
        lateCount,
        halfDayCount,
        avgHours,
        onTimeRate,
      },
      teamToday,
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, plannedTasks, workDone, workLocation, notes } = body; // action: 'PUNCH_IN' | 'PUNCH_OUT'
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getDayBounds(now);

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        userId: sessionUser.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (action === 'PUNCH_IN') {
      if (existingRecord) {
        return NextResponse.json(
          { error: 'You have already punched in for today.' },
          { status: 400 }
        );
      }

      if (!plannedTasks || !plannedTasks.trim() || plannedTasks.trim().length < 5) {
        return NextResponse.json(
          { error: 'Please enter your tasks / objectives for the day before punching in (minimum 5 characters).' },
          { status: 400 }
        );
      }

      // Check time in IST (UTC+5:30)
      const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
      const istMinutes = (now.getUTCMinutes() + 30) % 60;
      // Late if after 10:15 AM IST
      const isLate = istHours > 10 || (istHours === 10 && istMinutes > 15);

      const newRecord = await prisma.attendance.create({
        data: {
          userId: sessionUser.id,
          date: todayStart,
          punchIn: now,
          status: isLate ? 'LATE' : 'PRESENT',
          plannedTasks: plannedTasks.trim(),
          workLocation: workLocation || 'Office',
          notes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: isLate ? 'Punched in (Marked Late - after 10:15 AM IST). Planned tasks saved.' : 'Punched in successfully on time! Have a productive day.',
        attendance: newRecord,
      });
    }

    if (action === 'PUNCH_OUT') {
      if (!existingRecord) {
        return NextResponse.json(
          { error: 'You have not punched in today yet.' },
          { status: 400 }
        );
      }

      if (existingRecord.punchOut) {
        return NextResponse.json(
          { error: 'You have already punched out today.' },
          { status: 400 }
        );
      }

      if (!workDone || !workDone.trim() || workDone.trim().length < 5) {
        return NextResponse.json(
          { error: 'Please enter your work summary / tasks completed today before punching out (minimum 5 characters).' },
          { status: 400 }
        );
      }

      // Calculate working hours automatically from system timestamp
      const diffMs = now.getTime() - new Date(existingRecord.punchIn).getTime();
      const hours = Math.max(0.1, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

      let status = existingRecord.status;
      if (hours < 4.5 && status !== 'LATE') {
        status = 'HALF_DAY';
      }

      const updated = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          punchOut: now,
          workingHours: hours,
          workDone: workDone.trim(),
          status,
          notes: notes ? `${existingRecord.notes ? existingRecord.notes + ' | ' : ''}${notes}` : existingRecord.notes,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Punched out successfully. Total shift duration: ${hours} hours. Daily work report submitted.`,
        attendance: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing attendance action:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
