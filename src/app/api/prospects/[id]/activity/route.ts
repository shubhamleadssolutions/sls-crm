import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channel, activity, result, notes } = await req.json();

    if (!activity?.trim()) {
      return NextResponse.json({ error: 'Activity description is required' }, { status: 400 });
    }

    const newActivity = await prisma.activity.create({
      data: {
        prospectId: params.id,
        channel: channel || 'OTHER',
        activity: activity.trim(),
        result: result?.trim() || null,
        notes: notes?.trim() || null,
        userId: user.id,
      },
    });

    // Update prospect's updatedAt timestamp
    await prisma.prospect.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }
}
