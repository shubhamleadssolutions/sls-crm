import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
      include: { client: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    if (prospect.client) {
      return NextResponse.json({ error: 'Prospect is already converted to a client', client: prospect.client }, { status: 400 });
    }

    const body = await req.json();
    const {
      service,
      contractType,
      retainerAmount,
      paymentStatus,
      campaignStatus,
      assignedManagerId,
    } = body;

    const clientCount = await prisma.client.count();
    const clientId = `SLS-C-${1000 + clientCount + 1}`;

    const client = await prisma.client.create({
      data: {
        clientId,
        prospectId: prospect.id,
        companyName: prospect.companyName,
        contactPerson: prospect.contactPerson || null,
        service: service || prospect.servicesOffered || 'Lead Generation',
        contractType: contractType || 'Monthly Retainer',
        retainerAmount: retainerAmount ? parseFloat(retainerAmount) : null,
        paymentStatus: paymentStatus || 'Pending',
        campaignStatus: campaignStatus || 'Active',
        managerId: assignedManagerId || user.id,
      },
    });

    // Update prospect status to WON
    await prisma.prospect.update({
      where: { id: params.id },
      data: { status: 'WON' },
    });

    // Add activity timeline record
    await prisma.activity.create({
      data: {
        prospectId: prospect.id,
        channel: 'OTHER',
        activity: `🎉 Converted to Active Client (${clientId})`,
        result: `Converted by ${user.name}`,
        userId: user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PROSPECT_CONVERTED_TO_CLIENT',
        entityType: 'Client',
        entityId: client.id,
        details: `${user.name} converted prospect "${prospect.companyName}" to client ${clientId}`,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Error converting prospect to client:', error);
    return NextResponse.json({ error: error.message || 'Failed to convert prospect' }, { status: 500 });
  }
}
