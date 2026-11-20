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

// ============================================================================
// AUTOMATIC CALENDAR-DAY-END AUTO PUNCH-OUT ENGINE
// If a user punches in and does not manually punch out before 12:00 AM (midnight),
// when that day ends, the system automatically marks them punched out at 11:59:59 PM IST
// of that exact same date, calculating duration up to midnight (capping multi-day spillover).
// ============================================================================
async function autoCloseExpiredShifts(targetUserId?: string) {
  try {
    const now = new Date();
    const { startUTC: todayStart, endUTC: todayEnd, istYear, istMonth, istDay } = getISTDayBounds(now);

    // 1. Find all records with punchOut === null
    const whereClause: any = { punchOut: null };
    if (targetUserId) {
      whereClause.userId = targetUserId;
    }

    const openRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: { select: { role: true, name: true } },
      },
    });

    for (const rec of openRecords) {
      const punchInDate = rec.punchIn || rec.date;
      if (!punchInDate) continue;

      const punchInIST = getISTDate(new Date(punchInDate));
      const recYear = punchInIST.getFullYear();
      const recMonth = punchInIST.getMonth() + 1;
      const recDay = punchInIST.getDate();

      const isPreviousDay =
        recYear < istYear ||
        (recYear === istYear && recMonth < istMonth) ||
        (recYear === istYear && recMonth === istMonth && recDay < istDay);

      // A shift is ONLY automatically closed when the calendar day ends (i.e. midnight / 12:00 AM hits).
      // During the day (even after scheduled shift hours like 8 PM, 9 PM, 10 PM), the user remains active and can punch out anytime.
      const isDayEnded = isPreviousDay || now.getTime() > todayEnd.getTime();

      if (isDayEnded) {
        // Punch out is set strictly to the end of that day: 11:59:59 PM IST (23:59:59.999 IST)
        const endOfDayUTC = new Date(
          Date.UTC(recYear, recMonth - 1, recDay, 23, 59, 59, 999) - 3600000 * 5.5
        );

        const punchInUTC = new Date(punchInDate);
        const autoPunchOutUTC = endOfDayUTC;

        const diffMs = Math.max(0, autoPunchOutUTC.getTime() - punchInUTC.getTime());
        let hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        // Safety ceiling: capped at 12 hours max for a single calendar day
        hours = Math.min(hours, 12);
        hours = Math.max(0.1, hours);

        const shiftConfig = getShiftConfigForRole(rec.user.role);
        let status = rec.status;
        if (hours < shiftConfig.halfDayThreshold && status !== 'LATE') {
          status = 'HALF_DAY';
        }

        await prisma.attendance.update({
          where: { id: rec.id },
          data: {
            punchOut: autoPunchOutUTC,
            workingHours: hours,
            workDone: rec.workDone || (rec.plannedTasks ? `Tasks recorded: ${rec.plannedTasks}` : 'Auto-recorded shift at day end'),
            notes: rec.notes
              ? `${rec.notes} | Auto punch-out at 11:59 PM IST (Day ended)`
              : 'Auto punch-out at 11:59 PM IST (Day ended without manual punch out)',
            status,
          },
        });
      }
    }

    // 2. Safeguard: Auto-correct any anomalous historical records where workingHours > 14
    const anomalousRecords = await prisma.attendance.findMany({
      where: {
        workingHours: { gt: 14 },
        ...(targetUserId ? { userId: targetUserId } : {}),
      },
      include: {
        user: { select: { role: true } },
      },
    });

    for (const badRec of anomalousRecords) {
      const punchInDate = badRec.punchIn || badRec.date;
      const punchInIST = getISTDate(new Date(punchInDate));
      const recYear = punchInIST.getFullYear();
      const recMonth = punchInIST.getMonth() + 1;
      const recDay = punchInIST.getDate();

      const endOfDayUTC = new Date(
        Date.UTC(recYear, recMonth - 1, recDay, 23, 59, 59, 999) - 3600000 * 5.5
      );
      const punchInUTC = new Date(punchInDate);

      const diffMs = Math.max(0, endOfDayUTC.getTime() - punchInUTC.getTime());
      let hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      hours = Math.min(hours, 12);

      await prisma.attendance.update({
        where: { id: badRec.id },
        data: {
          punchOut: endOfDayUTC,
          workingHours: hours,
          notes: badRec.notes ? `${badRec.notes} | Auto-corrected to day-end (11:59 PM)` : 'Auto-corrected to day-end (11:59 PM IST)',
        },
      });
    }
  } catch (err) {
    console.error('Error in autoCloseExpiredShifts:', err);
  }
}

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run Automatic End-of-Day Auto Punch-Out check for all users
    await autoCloseExpiredShifts();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const { startUTC: todayStart, endUTC: todayEnd, istYear, istMonth, istDay } = getISTDayBounds(now);
    const nowIST = getISTDate(now);
    const istCurrentHour = nowIST.getHours();
    const istCurrentMinute = nowIST.getMinutes();

    const shiftConfig = getShiftConfigForRole(sessionUser.role);

    // Official launch date for SLS attendance tracking: Monday, Nov 16, 2026
    const officialTrackingStartDate = new Date(2026, 10, 16); // 16 Nov 2026 IST

    // Timeframe selector: 'month' | 'year' | 'all' (default: 'month')
    const timeframeParam = searchParams.get('timeframe');
    const timeframe: 'month' | 'year' | 'all' =
      timeframeParam === 'year' || timeframeParam === 'all' ? timeframeParam : 'month';

    // Parse requested Year and Month
    let filterYear = istYear;
    let filterMonth = istMonth; // 1-12

    const monthQuery = searchParams.get('month'); // YYYY-MM
    if (monthQuery && monthQuery.includes('-')) {
      const parts = monthQuery.split('-');
      const py = parseInt(parts[0], 10);
      const pm = parseInt(parts[1], 10);
      if (!isNaN(py) && !isNaN(pm) && pm >= 1 && pm <= 12) {
        filterYear = py;
        filterMonth = pm;
      }
    }

    const yearQuery = searchParams.get('year');
    if (yearQuery) {
      const y = parseInt(yearQuery, 10);
      if (!isNaN(y) && y >= 2020 && y <= 2040) {
        filterYear = y;
      }
    }

    // Determine Period Start & End Bounds in UTC
    let periodStartUTC: Date;
    let periodEndUTC: Date;
    let periodLabel = '';
    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (timeframe === 'month') {
      periodStartUTC = new Date(Date.UTC(filterYear, filterMonth - 1, 1, 0, 0, 0, 0) - 3600000 * 5.5);
      const lastDayOfMonth = new Date(filterYear, filterMonth, 0).getDate();
      periodEndUTC = new Date(Date.UTC(filterYear, filterMonth - 1, lastDayOfMonth, 23, 59, 59, 999) - 3600000 * 5.5);
      periodLabel = `${MONTH_NAMES[filterMonth - 1]} ${filterYear}`;
    } else if (timeframe === 'year') {
      periodStartUTC = new Date(Date.UTC(filterYear, 0, 1, 0, 0, 0, 0) - 3600000 * 5.5);
      periodEndUTC = new Date(Date.UTC(filterYear, 11, 31, 23, 59, 59, 999) - 3600000 * 5.5);
      periodLabel = `Year ${filterYear}`;
    } else {
      // 'all' - all time since launch
      periodStartUTC = new Date(Date.UTC(2026, 10, 16, 0, 0, 0, 0) - 3600000 * 5.5);
      periodEndUTC = new Date(Date.UTC(istYear, istMonth - 1, istDay, 23, 59, 59, 999) - 3600000 * 5.5);
      periodLabel = `All Time (Since Nov 16, 2026)`;
    }

    // 1. Fetch Today's Shift for Current User (Strictly for Today's Date bounds in IST)
    const todayRecord = await prisma.attendance.findFirst({
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

    // 2. Fetch User's Attendance Records for the Selected Period
    const userPeriodRecords = await prisma.attendance.findMany({
      where: {
        userId: sessionUser.id,
        OR: [
          {
            punchIn: {
              gte: periodStartUTC,
              lte: periodEndUTC,
            },
          },
          {
            date: {
              gte: periodStartUTC,
              lte: periodEndUTC,
            },
          },
        ],
      },
      orderBy: { punchIn: 'asc' },
    });

    // Helper: Compute User Stats & Calendar for any user and record set
    const computeStatsForUser = (records: any[], userRole: string) => {
      const userShift = getShiftConfigForRole(userRole);
      const attendanceByDate: Record<string, any> = {};
      let totalPresent = 0;
      let totalLate = 0;
      let totalHalfDay = 0;
      let totalLeave = 0;
      let totalHoursLogged = 0;

      records.forEach((rec) => {
        const recDate = rec.punchIn || rec.date;
        const recIST = getISTDate(new Date(recDate));
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

      // Calculate working days & absents across the period
      let totalAbsent = 0;
      const todayDateKey = `${istYear}-${String(istMonth).padStart(2, '0')}-${String(istDay).padStart(2, '0')}`;

      // Check if user's shift has ended today in IST
      const shiftEndedToday =
        istCurrentHour > userShift.endHour ||
        (istCurrentHour === userShift.endHour && istCurrentMinute >= userShift.endMinute);

      // Iterate through every single day in the period range that has elapsed
      // Range: from max(periodStart, officialTrackingStartDate) to min(periodEnd, today)
      const istStart = getISTDate(periodStartUTC);
      const istEnd = getISTDate(periodEndUTC);

      const loopStart = new Date(
        Math.max(
          new Date(istStart.getFullYear(), istStart.getMonth(), istStart.getDate()).getTime(),
          officialTrackingStartDate.getTime()
        )
      );

      const todayISTMidnight = new Date(istYear, istMonth - 1, istDay);
      const periodEndISTMidnight = new Date(istEnd.getFullYear(), istEnd.getMonth(), istEnd.getDate());
      const loopEnd = new Date(Math.min(periodEndISTMidnight.getTime(), todayISTMidnight.getTime()));

      if (loopStart <= loopEnd) {
        for (let d = new Date(loopStart); d <= loopEnd; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay(); // 0 is Sunday
          if (dayOfWeek === 0) continue; // Skip Sundays (Weekly Off)

          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

          // If day is today:
          if (dateKey === todayDateKey) {
            // If shift has not ended yet or record already exists, do not mark absent
            if (!shiftEndedToday || attendanceByDate[dateKey]) {
              continue;
            }
          }

          // If no record exists for this eligible working day, count as absent
          if (!attendanceByDate[dateKey]) {
            totalAbsent++;
            attendanceByDate[dateKey] = {
              date: new Date(d),
              status: 'ABSENT',
              isAutoGenerated: true,
            };
          }
        }
      }

      const actualPresentCount = totalPresent + totalLate;
      const totalWorkingDays = actualPresentCount + totalHalfDay + totalLeave + totalAbsent;

      // Attendance % Formula: (Present + 0.5 * HalfDay) / Total Working Days * 100
      const attendancePercentage =
        totalWorkingDays > 0
          ? Number((((actualPresentCount + totalHalfDay * 0.5) / totalWorkingDays) * 100).toFixed(1))
          : 100.0;

      const completedDays = records.filter((r) => r.workingHours).length;
      const avgDailyHours =
        completedDays > 0 ? (totalHoursLogged / completedDays).toFixed(1) : `${userShift.targetHours}.0`;

      return {
        attendanceByDate,
        totalPresent: actualPresentCount,
        totalLate,
        totalHalfDay,
        totalLeave,
        totalAbsent,
        totalWorkingDays,
        attendancePercentage,
        totalHoursLogged: Number(totalHoursLogged.toFixed(1)),
        avgDailyHours,
      };
    };

    const myStats = computeStatsForUser(userPeriodRecords, sessionUser.role);

    // 3. Staff Attendance Record (Restricted to CEO & MD / ADMIN)
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
        orderBy: { name: 'asc' },
      });

      // Fetch all attendance records across all users for the entire selected period
      const allPeriodAttendances = await prisma.attendance.findMany({
        where: {
          OR: [
            {
              punchIn: {
                gte: periodStartUTC,
                lte: periodEndUTC,
              },
            },
            {
              date: {
                gte: periodStartUTC,
                lte: periodEndUTC,
              },
            },
          ],
        },
        orderBy: { punchIn: 'asc' },
      });

      // Group period records by userId
      const userRecordsMap = new Map<string, any[]>();
      allPeriodAttendances.forEach((att) => {
        if (!userRecordsMap.has(att.userId)) {
          userRecordsMap.set(att.userId, []);
        }
        userRecordsMap.get(att.userId)!.push(att);
      });

      // Fetch Today's Attendance for all users to determine today's live status (Strictly for Today)
      const todayAllAttendances = await prisma.attendance.findMany({
        where: {
          OR: [
            {
              punchIn: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
            {
              date: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
          ],
        },
        orderBy: { punchIn: 'desc' },
      });

      const todayStaffMap = new Map<string, any>();
      todayAllAttendances.forEach((att) => {
        if (!todayStaffMap.has(att.userId)) {
          todayStaffMap.set(att.userId, att);
        }
      });

      staffAttendance = allUsers.map((u) => {
        const uShift = getShiftConfigForRole(u.role);
        const uRecords = userRecordsMap.get(u.id) || [];
        const uStats = computeStatsForUser(uRecords, u.role);

        // Today's Live Status
        const todayAtt = todayStaffMap.get(u.id);
        let todayStatus = todayAtt ? todayAtt.status : 'NOT_MARKED';

        if (!todayAtt) {
          const userShiftEnded =
            istCurrentHour > uShift.endHour ||
            (istCurrentHour === uShift.endHour && istCurrentMinute >= uShift.endMinute);
          const isSunday = nowIST.getDay() === 0;
          const isAfterStart = now >= officialTrackingStartDate;

          if (userShiftEnded && !isSunday && isAfterStart) {
            todayStatus = 'ABSENT';
          }
        }

        return {
          userId: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          designation: u.designation,
          shiftTiming: `${uShift.shiftStart} – ${uShift.shiftEnd}`,
          // Today's Live Info:
          todayStatus,
          punchInToday: todayAtt?.punchIn || null,
          punchOutToday: todayAtt?.punchOut || null,
          workingHoursToday: todayAtt?.workingHours ? Number(todayAtt.workingHours) : null,
          plannedTasksToday: todayAtt?.plannedTasks || null,
          workDoneToday: todayAtt?.workDone || null,
          // Period Aggregate Stats:
          presentDays: uStats.totalPresent,
          lateDays: uStats.totalLate,
          halfDays: uStats.totalHalfDay,
          leaves: uStats.totalLeave,
          absents: uStats.totalAbsent,
          workingDays: uStats.totalWorkingDays,
          totalHours: uStats.totalHoursLogged,
          avgHours: uStats.avgDailyHours,
          attendancePercentage: uStats.attendancePercentage,
          recordsByDate: uStats.attendanceByDate,
        };
      });

      // 4. Historical / Selected Date Attendance Breakdown (Date-wise archive for CEO & MD)
      const selectedDateParam = searchParams.get('date');
      let targetDateStr = selectedDateParam;

      if (!targetDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
        targetDateStr = `${istYear}-${String(istMonth).padStart(2, '0')}-${String(istDay).padStart(2, '0')}`;
      }

      const [targetY, targetM, targetD] = targetDateStr.split('-').map(Number);
      const targetDateObj = new Date(targetY, targetM - 1, targetD);
      const targetDayStartUTC = new Date(Date.UTC(targetY, targetM - 1, targetD, 0, 0, 0, 0) - 3600000 * 5.5);
      const targetDayEndUTC = new Date(Date.UTC(targetY, targetM - 1, targetD, 23, 59, 59, 999) - 3600000 * 5.5);

      // Fetch all attendance records specifically for target date
      const dateAllAttendances = await prisma.attendance.findMany({
        where: {
          OR: [
            {
              punchIn: {
                gte: targetDayStartUTC,
                lte: targetDayEndUTC,
              },
            },
            {
              date: {
                gte: targetDayStartUTC,
                lte: targetDayEndUTC,
              },
            },
          ],
        },
        orderBy: { punchIn: 'asc' },
      });

      const dateStaffMap = new Map<string, any>();
      dateAllAttendances.forEach((att) => {
        if (!dateStaffMap.has(att.userId)) {
          dateStaffMap.set(att.userId, att);
        }
      });

      const isTargetSunday = targetDateObj.getDay() === 0;
      const isTargetBeforeStart = targetDateObj < officialTrackingStartDate;
      const isTargetToday =
        targetDateStr === `${istYear}-${String(istMonth).padStart(2, '0')}-${String(istDay).padStart(2, '0')}`;
      const isTargetFuture = targetDateObj > new Date(istYear, istMonth - 1, istDay);

      let dateTotalPresent = 0;
      let dateTotalLate = 0;
      let dateTotalHalfDay = 0;
      let dateTotalLeave = 0;
      let dateTotalAbsent = 0;
      let dateTotalHours = 0;

      const dateRecords = allUsers.map((u) => {
        const uShift = getShiftConfigForRole(u.role);
        const rec = dateStaffMap.get(u.id);

        let status = rec ? rec.status : 'NOT_MARKED';

        if (rec) {
          if (rec.status === 'PRESENT') dateTotalPresent++;
          else if (rec.status === 'LATE') {
            dateTotalPresent++;
            dateTotalLate++;
          } else if (rec.status === 'HALF_DAY') dateTotalHalfDay++;
          else if (rec.status === 'LEAVE') dateTotalLeave++;

          if (rec.workingHours) {
            dateTotalHours += Number(rec.workingHours);
          }
        } else {
          // No record exists
          if (isTargetSunday) {
            status = 'WEEKEND';
          } else if (isTargetBeforeStart) {
            status = 'PRE_LAUNCH';
          } else if (isTargetFuture) {
            status = 'UPCOMING';
          } else if (isTargetToday) {
            const userShiftEnded =
              istCurrentHour > uShift.endHour ||
              (istCurrentHour === uShift.endHour && istCurrentMinute >= uShift.endMinute);
            if (userShiftEnded) {
              status = 'ABSENT';
              dateTotalAbsent++;
            } else {
              status = 'NOT_MARKED';
            }
          } else {
            // Past working day with no record = ABSENT
            status = 'ABSENT';
            dateTotalAbsent++;
          }
        }

        return {
          userId: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          designation: u.designation,
          shiftTiming: `${uShift.shiftStart} – ${uShift.shiftEnd}`,
          status,
          punchIn: rec?.punchIn || null,
          punchOut: rec?.punchOut || null,
          workingHours: rec?.workingHours ? Number(rec.workingHours) : null,
          plannedTasks: rec?.plannedTasks || null,
          workDone: rec?.workDone || null,
          workLocation: rec?.workLocation || null,
          notes: rec?.notes || null,
          id: rec?.id || null,
        };
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${dayNames[targetDateObj.getDay()]}, ${targetD} ${monthNamesShort[targetM - 1]} ${targetY}`;

      var dateAttendance: any = {
        dateStr: targetDateStr,
        formattedDate,
        isSunday: isTargetSunday,
        isBeforeLaunch: isTargetBeforeStart,
        isToday: isTargetToday,
        isFuture: isTargetFuture,
        stats: {
          totalStaff: allUsers.length,
          totalPresent: dateTotalPresent,
          totalLate: dateTotalLate,
          totalHalfDay: dateTotalHalfDay,
          totalLeave: dateTotalLeave,
          totalAbsent: dateTotalAbsent,
          totalHours: Number(dateTotalHours.toFixed(1)),
        },
        records: dateRecords,
      };
    }

    return NextResponse.json({
      todayRecord,
      shiftConfig,
      officialStartDate: 'Monday, Nov 16, 2026',
      timeframe,
      periodLabel,
      calendar: {
        year: filterYear,
        month: filterMonth,
        attendanceByDate: myStats.attendanceByDate,
      },
      stats: {
        totalPresent: myStats.totalPresent,
        totalAbsent: myStats.totalAbsent,
        totalLeave: myStats.totalLeave,
        totalLate: myStats.totalLate,
        totalHalfDay: myStats.totalHalfDay,
        totalWorkingDays: myStats.totalWorkingDays,
        attendancePercentage: myStats.attendancePercentage,
        avgDailyHours: myStats.avgDailyHours,
      },
      history: userPeriodRecords,
      staffAttendance: isExecutive ? staffAttendance : null,
      dateAttendance: isExecutive ? dateAttendance : null,
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
      // First, auto-close any stale/expired shifts from prior days
      await autoCloseExpiredShifts(sessionUser.id);

      const activeShift = await prisma.attendance.findFirst({
        where: {
          userId: sessionUser.id,
          punchOut: null,
          punchIn: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      if (activeShift) {
        return NextResponse.json(
          { error: 'You already have an active shift in progress for today. Please punch out first before starting a new shift.' },
          { status: 400 }
        );
      }

      const completedToday = await prisma.attendance.findFirst({
        where: {
          userId: sessionUser.id,
          punchOut: { not: null },
          punchIn: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      if (completedToday) {
        return NextResponse.json(
          { error: 'You have already completed your shift for today.' },
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
      // First, auto-close any stale/expired shifts from prior days
      await autoCloseExpiredShifts(sessionUser.id);

      const activeRecord = await prisma.attendance.findFirst({
        where: {
          userId: sessionUser.id,
          punchOut: null,
          punchIn: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: { punchIn: 'desc' },
      });

      if (!activeRecord) {
        const completedToday = await prisma.attendance.findFirst({
          where: {
            userId: sessionUser.id,
            punchIn: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          orderBy: { punchIn: 'desc' },
        });

        if (completedToday && completedToday.punchOut) {
          return NextResponse.json(
            { error: 'You have already punched out of today\'s shift.' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'No active punch-in record found for today. Please punch in first.' },
          { status: 400 }
        );
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
      let hours = Math.max(0.01, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

      // Hard ceiling safeguard: Single shift cannot exceed 12 hours
      hours = Math.min(hours, 12);

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

    // ==========================================
    // ACTION: MARK_LEAVE (Executive Action for MD & CEO)
    // ==========================================
    if (action === 'MARK_LEAVE') {
      const isExecutive = sessionUser.role === 'ADMIN' || sessionUser.role === 'CEO';
      if (!isExecutive) {
        return NextResponse.json(
          { error: 'Forbidden: Only CEO and Managing Director (MD) can mark staff leaves.' },
          { status: 403 }
        );
      }

      const { targetUserId, startDate, endDate, leaveType = 'LEAVE', reason } = body;

      if (!targetUserId) {
        return NextResponse.json({ error: 'Please select a staff member.' }, { status: 400 });
      }

      if (!startDate) {
        return NextResponse.json({ error: 'Please choose the leave date.' }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, username: true, role: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
      }

      // Generate date array from startDate to endDate
      const datesToMark: Date[] = [];
      const s = new Date(startDate + 'T00:00:00Z');
      const e = endDate ? new Date(endDate + 'T00:00:00Z') : new Date(startDate + 'T00:00:00Z');

      for (let cur = new Date(s); cur <= e; cur.setUTCDate(cur.getUTCDate() + 1)) {
        // Skip Sundays if it's a multi-day range
        if (cur.getUTCDay() === 0 && s.getTime() !== e.getTime()) continue;
        datesToMark.push(new Date(cur));
      }

      if (datesToMark.length === 0) {
        datesToMark.push(new Date(s));
      }

      // CEO and MD only mark Approved Leave or Half Day (Absents are automatically logged by system)
      const normalizedLeaveType = leaveType === 'HALF_DAY' ? 'HALF_DAY' : 'LEAVE';
      const leaveLabel = normalizedLeaveType === 'HALF_DAY' ? 'Half Day Leave' : 'Approved Leave';

      const execRoleTag = sessionUser.role === 'ADMIN' ? 'MD' : sessionUser.role;
      const leaveNote = reason?.trim()
        ? `[${leaveLabel} by ${sessionUser.name} (${execRoleTag})] ${reason.trim()}`
        : `[${leaveLabel} by ${sessionUser.name} (${execRoleTag})]`;

      for (const d of datesToMark) {
        const { startUTC: dStart, endUTC: dEnd } = getISTDayBounds(d);

        const existing = await prisma.attendance.findFirst({
          where: {
            userId: targetUser.id,
            OR: [
              { date: { gte: dStart, lte: dEnd } },
              { punchIn: { gte: dStart, lte: dEnd } },
            ],
          },
        });

        if (existing) {
          await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: normalizedLeaveType,
              date: dStart,
              punchIn: dStart,
              punchOut: dEnd,
              plannedTasks: leaveNote,
              workDone: leaveNote,
              notes: leaveNote,
              workingHours: normalizedLeaveType === 'HALF_DAY' ? 4.0 : 0,
            },
          });
        } else {
          await prisma.attendance.create({
            data: {
              userId: targetUser.id,
              date: dStart,
              punchIn: dStart,
              punchOut: dEnd,
              status: normalizedLeaveType,
              plannedTasks: leaveNote,
              workDone: leaveNote,
              notes: leaveNote,
              workingHours: normalizedLeaveType === 'HALF_DAY' ? 4.0 : 0,
            },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: 'LEAVE_RECORDED',
          entityType: 'Attendance',
          entityId: targetUser.id,
          details: `${sessionUser.name} marked ${normalizedLeaveType} for ${targetUser.name} (@${targetUser.username}) for ${datesToMark.length} day(s) starting ${startDate}: ${reason || 'Executive update'}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${leaveLabel} for ${targetUser.name} (${datesToMark.length} day${datesToMark.length > 1 ? 's' : ''}).`,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing attendance action:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
