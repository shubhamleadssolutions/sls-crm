import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetings = await prisma.meeting.findMany({
      include: {
        prospect: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        },
        user: { select: { id: true, name: true } },
      },
      orderBy: { meetingDate: 'asc' },
    });

    return NextResponse.json({ meetings });
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

const CAN_SCHEDULE_ROLES = ['ADMIN', 'CEO', 'ACCOUNT_MANAGER', 'IT_ADMIN'];

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only CEO, MD (ADMIN), Account Manager, and IT Manager (IT_ADMIN) can schedule meetings
    if (!CAN_SCHEDULE_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'Permission denied: Only administrative leadership (CEO, Managing Director, Account Manager, IT Manager) can schedule meetings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { prospectId, title, meetingDate, location, meetingUrl, agenda } = body;

    if (!title?.trim() || !meetingDate) {
      return NextResponse.json({ error: 'Meeting Title and Date/Time are required' }, { status: 400 });
    }

    const meetingData: any = {
      title: title.trim(),
      meetingDate: new Date(meetingDate),
      location: location?.trim() || 'SLS Video Connect',
      meetingUrl: meetingUrl?.trim() || null,
      agenda: agenda?.trim() || null,
      status: 'Scheduled',
      userId: user.id,
    };

    if (prospectId) {
      meetingData.prospectId = prospectId;
    }

    const meeting = await prisma.meeting.create({
      data: meetingData,
      include: {
        prospect: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        },
        user: { select: { id: true, name: true } },
      },
    });

    // If linked to prospect, update status and log activity
    if (prospectId) {
      await prisma.prospect.update({
        where: { id: prospectId },
        data: { status: 'MEETING_DISCUSSION' },
      }).catch(() => {});

      await prisma.activity.create({
        data: {
          prospectId,
          channel: 'MEETING',
          activity: `Scheduled Meeting: ${meeting.title}`,
          result: `Date: ${new Date(meetingDate).toLocaleString()}`,
          userId: user.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error('Error scheduling meeting:', error);
    return NextResponse.json({ error: error.message || 'Failed to schedule meeting' }, { status: 500 });
  }
}
