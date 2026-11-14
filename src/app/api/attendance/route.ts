import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// Helper to get IST (UTC+5:30) date object
function getISTDate(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
}

// Helper to get start and end of day in UTC for a given IST date
function getISTDayBounds(targetDate = new Date()) {
  const ist = getISTDate(targetDate);
  
  const y = ist.getFullYear();
  const m = ist.getMonth();
  const d = ist.getDate();

  const startUTC = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - 3600000 * 5.5);
  const endUTC = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - 3600000 * 5.5);

  return { startUTC, endUTC, istYear: y, istMonth: m + 1, istDay: d };
}

// Official SLS Team Shift Timings per role
function getShiftConfigForRole(role: string) {
  switch (role) {
    case 'ADMIN':
    case 'CEO':
      return {
        roleGroup: 'CEO & Managing Director',
        shiftStart: '4:00 PM',
        shiftEnd: '9:00 PM',
        startHour: 16, // 4 PM IST
        startMinute: 0,
        endHour: 21,   // 9 PM IST
        endMinute: 0,
        graceMinute: 15, // Grace period until 4:15 PM
        targetHours: 5.0,
        halfDayThreshold: 2.5,
      };
    case 'IT_ADMIN':
    case 'ACCOUNT_MANAGER':
      return {
        roleGroup: 'IT Manager & Account Manager',
        shiftStart: '2:00 PM',
        shiftEnd: '8:00 PM',
        startHour: 14, // 2 PM IST
        startMinute: 0,
        endHour: 20,   // 8 PM IST
        endMinute: 0,
        graceMinute: 15, // Grace period until 2:15 PM
        targetHours: 6.0,
        halfDayThreshold: 3.5,
      };
    default:
      return {
        roleGroup: 'Staff (BD, Sales, Marketing)',
        shiftStart: '12:00 PM',
        shiftEnd: '8:00 PM',
        startHour: 12, // 12 PM IST
        startMinute: 0,
        endHour: 20,   // 8 PM IST
        endMinute: 0,
        graceMinute: 15, // Grace period until 12:15 PM
        targetHours: 8.0,
        halfDayThreshold: 4.5,
      };
  }
}

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const { startUTC: todayStart, endUTC: todayEnd, istYear, istMonth, istDay } = getISTDayBounds(now);

    const shiftConfig = getShiftConfigForRole(sessionUser.role);

    // Optional month query: e.g. "2026-11"
    const monthQuery = searchParams.get('month'); // YYYY-MM
    let filterYear = istYear;
    let filterMonth = istMonth; // 1-12

    if (monthQuery && monthQuery.includes('-')) {
      const parts = monthQuery.split('-');
      const py = parseInt(parts[0], 10);
      const pm = parseInt(parts[1], 10);
      if (!isNaN(py) && !isNaN(pm) && pm >= 1 && pm <= 12) {
        filterYear = py;
        filterMonth = pm;
      }
    }

    const monthStartUTC = new Date(Date.UTC(filterYear, filterMonth - 1, 1, 0, 0, 0, 0) - 3600000 * 5.5);
    const lastDayOfMonth = new Date(filterYear, filterMonth, 0).getDate();
    const monthEndUTC = new Date(Date.UTC(filterYear, filterMonth - 1, lastDayOfMonth, 23, 59, 59, 999) - 3600000 * 5.5);

    // 1. Fetch Today's Shift for Current User (active open shift first)
    let todayRecord = await prisma.attendance.findFirst({
      where: {
        userId: sessionUser.id,
        punchOut: null,
      },
      orderBy: { punchIn: 'desc' },
    });

    if (!todayRecord) {
      todayRecord = await prisma.attendance.findFirst({
        where: {
          userId: sessionUser.id,
          OR: [
            {
              date: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
            {
              punchIn: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
          ],
        },
        orderBy: { punchIn: 'desc' },
      });
    }

    // 2. Fetch User's Attendance for the Selected Month
    const monthRecords = await prisma.attendance.findMany({
      where: {
        userId: sessionUser.id,
        punchIn: {
          gte: monthStartUTC,
          lte: monthEndUTC,
        },
      },
      orderBy: { punchIn: 'asc' },
    });

    // 3. Compute Calendar-Wise Attendance Map
    const attendanceByDate: Record<string, any> = {};
    let totalPresent = 0;
    let totalLate = 0;
    let totalHalfDay = 0;
    let totalLeave = 0;
    let totalHoursLogged = 0;

    monthRecords.forEach((rec) => {
      const recIST = getISTDate(new Date(rec.punchIn));
      const dateKey = `${recIST.getFullYear()}-${String(recIST.getMonth() + 1).padStart(2, '0')}-${String(recIST.getDate()).padStart(2, '0')}`;
      
      attendanceByDate[dateKey] = {
        id: rec.id,
        date: rec.date,
        punchIn: rec.punchIn,
        punchOut: rec.punchOut,
        status: rec.status,
        plannedTasks: rec.plannedTasks,
        workDone: rec.workDone,
        workLocation: rec.workLocation,
        workingHours: rec.workingHours ? Number(rec.workingHours) : null,
      };

      if (rec.status === 'PRESENT') totalPresent++;
      else if (rec.status === 'LATE') totalLate++;
      else if (rec.status === 'HALF_DAY') totalHalfDay++;
      else if (rec.status === 'LEAVE') totalLeave++;

      if (rec.workingHours) {
        totalHoursLogged += Number(rec.workingHours);
      }
    });

    // 4. Calculate Absents:
    // SLS team work officially begins on Monday, Nov 16, 2026.
    // Days prior to Monday, Nov 16, 2026 are not counted as absent.
    const officialTrackingStartDate = new Date(2026, 10, 16); // Monday, 16 Nov 2026
    let totalAbsent = 0;
    const isCurrentMonth = filterYear === istYear && filterMonth === istMonth;
    const maxDayToCheck = isCurrentMonth ? istDay : lastDayOfMonth;

    for (let day = 1; day <= maxDayToCheck; day++) {
      const checkDateIST = new Date(filterYear, filterMonth - 1, day);
      const dayOfWeek = checkDateIST.getDay(); // 0 is Sunday
      const dateKey = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Skip Sunday (SLS official weekly off)
      if (dayOfWeek === 0) continue;

      // Skip dates before official start from Monday (Nov 16, 2026)
      if (checkDateIST < officialTrackingStartDate) {
        continue;
      }

      // If today is ongoing, don't mark today as absent if shift hasn't ended
      if (isCurrentMonth && day === istDay && !attendanceByDate[dateKey]) {
        continue;
      }

      if (!attendanceByDate[dateKey]) {
        totalAbsent++;
        attendanceByDate[dateKey] = {
          date: checkDateIST,
          status: 'ABSENT',
          isAutoGenerated: true,
        };
      }
    }

    const actualPresentCount = totalPresent + totalLate + totalHalfDay;
    const completedDays = monthRecords.filter((r) => r.workingHours).length;
    const avgDailyHours = completedDays > 0 ? (totalHoursLogged / completedDays).toFixed(1) : `${shiftConfig.targetHours}.0`;

    // 5. Staff Attendance Record (Restricted to CEO & MD / ADMIN)
    let staffAttendance: any[] = [];
    const isExecutive = sessionUser.role === 'ADMIN' || sessionUser.role === 'CEO';

    if (isExecutive) {
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

      const todayAllAttendances = await prisma.attendance.findMany({
        where: {
          OR: [
            { punchOut: null },
            {
              punchIn: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
          ],
        },
        orderBy: { punchIn: 'desc' },
      });

      const staffMap = new Map();
      todayAllAttendances.forEach((att) => {
        if (!staffMap.has(att.userId)) {
          staffMap.set(att.userId, att);
        }
      });

      staffAttendance = allUsers.map((u) => {
        const att = staffMap.get(u.id);
        const userShift = getShiftConfigForRole(u.role);
        return {
          userId: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          designation: u.designation,
          shiftTiming: `${userShift.shiftStart} – ${userShift.shiftEnd}`,
          status: att ? att.status : 'NOT_MARKED',
          punchIn: att?.punchIn || null,
          punchOut: att?.punchOut || null,
          workingHours: att?.workingHours ? Number(att.workingHours) : null,
          plannedTasks: att?.plannedTasks || null,
          workDone: att?.workDone || null,
          workLocation: att?.workLocation || 'Office',
        };
      });
    }

    return NextResponse.json({
      todayRecord,
      shiftConfig,
      officialStartDate: 'Monday, Nov 16, 2026',
      calendar: {
        year: filterYear,
        month: filterMonth,
        attendanceByDate,
      },
      stats: {
        totalPresent: actualPresentCount,
        totalAbsent,
        totalLeave,
        totalLate,
        totalHalfDay,
        avgDailyHours,
      },
      history: monthRecords,
      staffAttendance: isExecutive ? staffAttendance : null,
      isExecutive,
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
    const { action, plannedTasks, workDone, workLocation, notes } = body;
    const now = new Date();
    const { startUTC: todayStart, endUTC: todayEnd } = getISTDayBounds(now);

    const shiftConfig = getShiftConfigForRole(sessionUser.role);

    // ==========================================
    // ACTION: PUNCH_IN
    // ==========================================
    if (action === 'PUNCH_IN') {
      const activeShift = await prisma.attendance.findFirst({
        where: {
          userId: sessionUser.id,
          punchOut: null,
        },
      });

      if (activeShift) {
        return NextResponse.json(
          { error: 'You already have an active shift in progress. Please punch out first before starting a new shift.' },
          { status: 400 }
        );
      }

      if (!plannedTasks || !plannedTasks.trim() || plannedTasks.trim().length < 5) {
        return NextResponse.json(
          { error: 'Please enter your planned tasks / goals for the day before punching in (minimum 5 characters).' },
          { status: 400 }
        );
      }

      // Compute punctuality in IST based on the user's specific role timings
      const istNow = getISTDate(now);
      const istHours = istNow.getHours();
      const istMinutes = istNow.getMinutes();

      const currentMinutesPastMidnight = istHours * 60 + istMinutes;
      const lateThresholdMinutes = shiftConfig.startHour * 60 + shiftConfig.graceMinute;
      const isLate = currentMinutesPastMidnight > lateThresholdMinutes;

      const newRecord = await prisma.attendance.create({
        data: {
          userId: sessionUser.id,
          date: todayStart,
          punchIn: now,
          status: isLate ? 'LATE' : 'PRESENT',
          plannedTasks: plannedTasks.trim(),
          workLocation: workLocation || 'Office',
          notes: notes?.trim() || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: isLate
          ? `Punched in (Marked Late — after ${shiftConfig.startHour % 12 || 12}:${String(shiftConfig.graceMinute).padStart(2, '0')} ${shiftConfig.startHour >= 12 ? 'PM' : 'AM'} IST). Tasks for the day recorded.`
          : `Punched in successfully on time for your shift (${shiftConfig.shiftStart} – ${shiftConfig.shiftEnd})! Have a productive day.`,
        attendance: newRecord,
      });
    }

    // ==========================================
    // ACTION: PUNCH_OUT
    // ==========================================
    if (action === 'PUNCH_OUT') {
      let activeRecord = await prisma.attendance.findFirst({
        where: {
          userId: sessionUser.id,
          punchOut: null,
        },
        orderBy: { punchIn: 'desc' },
      });

      if (!activeRecord) {
        activeRecord = await prisma.attendance.findFirst({
          where: {
            userId: sessionUser.id,
            punchIn: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          orderBy: { punchIn: 'desc' },
        });

        if (!activeRecord) {
          return NextResponse.json(
            { error: 'No active punch-in record found. Please punch in first.' },
            { status: 400 }
          );
        }

        if (activeRecord.punchOut) {
          return NextResponse.json(
            { error: 'You have already punched out of this shift.' },
            { status: 400 }
          );
        }
      }

      if (!workDone || !workDone.trim() || workDone.trim().length < 5) {
        return NextResponse.json(
          { error: 'Please enter your work done / daily report before punching out (minimum 5 characters).' },
          { status: 400 }
        );
      }

      const punchInMs = new Date(activeRecord.punchIn).getTime();
      const punchOutMs = now.getTime();
      const diffMs = Math.max(0, punchOutMs - punchInMs);
      const hours = Math.max(0.01, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

      let status = activeRecord.status;
      if (hours < shiftConfig.halfDayThreshold && status !== 'LATE') {
        status = 'HALF_DAY';
      }

      const updated = await prisma.attendance.update({
        where: { id: activeRecord.id },
        data: {
          punchOut: now,
          workingHours: hours,
          workDone: workDone.trim(),
          status,
          notes: notes?.trim()
            ? `${activeRecord.notes ? activeRecord.notes + ' | ' : ''}${notes.trim()}`
            : activeRecord.notes,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Punched out successfully! Shift Duration: ${hours} hrs. Work summary saved.`,
        attendance: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing attendance action:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
