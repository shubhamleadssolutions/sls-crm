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
    const { status, amount, service, validUntil, notes, fileUrl } = body;

    const data: any = {};
    if (status) data.status = status;
    if (amount !== undefined) data.amount = amount ? parseFloat(amount) : null;
    if (service !== undefined) data.service = service?.trim() || null;
    if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;
    if (notes !== undefined) data.notes = notes?.trim() || null;
    if (fileUrl !== undefined) data.fileUrl = fileUrl?.trim() || null;

    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data,
      include: { prospect: true },
    });

    // If accepted, update prospect status to WON or NEGOTIATION
    if (status === 'ACCEPTED') {
      await prisma.prospect.update({
        where: { id: proposal.prospectId },
        data: { status: 'WON' },
      });
    } else if (status === 'NEGOTIATION') {
      await prisma.prospect.update({
        where: { id: proposal.prospectId },
        data: { status: 'NEGOTIATION' },
      });
    }

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}
