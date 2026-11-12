import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: {
          select: { campaigns: true, studentLeads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate revenue stats
    const totalRetainer = clients.reduce((acc, c) => acc + (c.retainerAmount ? Number(c.retainerAmount) : 0), 0);
    const activeCampaignsCount = clients.filter((c) => c.campaignStatus === 'Active').length;

    return NextResponse.json({
      clients,
      stats: {
        totalClients: clients.length,
        totalRetainer,
        activeCampaignsCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, contactPerson, phone, email, service, contractType, retainerAmount, paymentStatus, campaignStatus, managerId } = body;

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
    }

    const clientCount = await prisma.client.count();
    const clientId = `SLS-C-${1000 + clientCount + 1}`;

    const client = await prisma.client.create({
      data: {
        clientId,
        companyName: companyName.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        service: service?.trim() || 'Lead Generation',
        contractType: contractType || 'Monthly Retainer',
        retainerAmount: retainerAmount ? parseFloat(retainerAmount) : null,
        paymentStatus: paymentStatus || 'Pending',
        campaignStatus: campaignStatus || 'Active',
        managerId: managerId || user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CLIENT_CREATED',
        entityType: 'Client',
        entityId: client.id,
        details: `${user.name} created client "${client.companyName}" (${clientId})`,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}
