import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, demoStatus, admissionStatus, followUpDate, followUpNotes, feeAmount, counsellorId } = body;

    const data: any = {};
    if (status) data.status = status;
    if (demoStatus) data.demoStatus = demoStatus;
    if (admissionStatus) data.admissionStatus = admissionStatus;
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (followUpNotes !== undefined) data.followUpNotes = followUpNotes?.trim() || null;
    if (feeAmount !== undefined) data.feeAmount = feeAmount ? parseFloat(feeAmount) : null;
    if (counsellorId !== undefined) data.counsellorId = counsellorId || null;

    const updated = await prisma.studentLead.update({
      where: { id: params.id },
      data,
      include: { client: true, campaign: true },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('Error updating student lead:', error);
    return NextResponse.json({ error: 'Failed to update student lead' }, { status: 500 });
  }
}
