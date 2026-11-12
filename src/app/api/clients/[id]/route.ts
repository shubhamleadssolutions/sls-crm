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
    const { contactPerson, phone, email, service, contractType, retainerAmount, paymentStatus, campaignStatus, managerId } = body;

    const data: any = {};
    if (contactPerson !== undefined) data.contactPerson = contactPerson?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (email !== undefined) data.email = email?.trim() || null;
    if (service !== undefined) data.service = service?.trim() || null;
    if (contractType !== undefined) data.contractType = contractType;
    if (retainerAmount !== undefined) data.retainerAmount = retainerAmount ? parseFloat(retainerAmount) : null;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (campaignStatus !== undefined) data.campaignStatus = campaignStatus;
    if (managerId !== undefined) data.managerId = managerId || null;

    const updated = await prisma.client.update({
      where: { id: params.id },
      data,
      include: { manager: true },
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
