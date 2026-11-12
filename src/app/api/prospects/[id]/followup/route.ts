import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduledDate, type, notes, markCompleted } = await req.json();

    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    if (markCompleted) {
      // Mark current follow-up as completed and log activity
      await prisma.activity.create({
        data: {
          prospectId: params.id,
          channel: prospect.followUpType || 'OTHER',
          activity: `Completed follow-up: ${prospect.followUpNotes || 'Scheduled follow-up'}`,
          result: 'Follow-up done',
          userId: user.id,
        },
      });

      // Clear or update next follow-up date
      const updated = await prisma.prospect.update({
        where: { id: params.id },
        data: {
          nextFollowUpDate: scheduledDate ? new Date(scheduledDate) : null,
          followUpType: type || null,
          followUpNotes: notes?.trim() || null,
          followUpCount: { increment: 1 },
        },
      });

      return NextResponse.json({ success: true, prospect: updated });
    }

    if (!scheduledDate) {
      return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 });
    }

    // Schedule new follow-up
    const followUp = await prisma.followUp.create({
      data: {
        prospectId: params.id,
        scheduledDate: new Date(scheduledDate),
        type: type || 'WHATSAPP',
        notes: notes?.trim() || null,
        userId: user.id,
      },
    });

    // Also update current on prospect
    const updated = await prisma.prospect.update({
      where: { id: params.id },
      data: {
        nextFollowUpDate: new Date(scheduledDate),
        followUpType: type || 'WHATSAPP',
        followUpNotes: notes?.trim() || null,
        followUpCount: { increment: 1 },
      },
    });

    // Add activity timeline item
    await prisma.activity.create({
      data: {
        prospectId: params.id,
        channel: type || 'WHATSAPP',
        activity: `Follow-up scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
        result: notes?.trim() || 'Pending',
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, followUp, prospect: updated });
  } catch (error: any) {
    console.error('Error scheduling follow-up:', error);
    return NextResponse.json({ error: 'Failed to schedule follow-up' }, { status: 500 });
  }
}
