import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      include: {
        client: { select: { id: true, companyName: true, clientId: true } },
        _count: {
          select: { studentLeads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, clientId, targetCourse, platform, budget, targetLeads, status, notes } = body;

    if (!name?.trim() || !clientId) {
      return NextResponse.json({ error: 'Campaign Name and Client are required' }, { status: 400 });
    }

    const count = await prisma.campaign.count();
    const campaignCode = `SLS-CMP-${1000 + count + 1}`;

    const campaign = await prisma.campaign.create({
      data: {
        campaignCode,
        name: name.trim(),
        clientId,
        targetCourse: targetCourse?.trim() || null,
        platform: platform || 'Meta Ads',
        budget: budget ? parseFloat(budget) : null,
        targetLeads: targetLeads ? parseInt(targetLeads, 10) : 100,
        status: status || 'ACTIVE',
        notes: notes?.trim() || null,
      },
      include: { client: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CAMPAIGN_CREATED',
        entityType: 'Campaign',
        entityId: campaign.id,
        details: `${user.name} created campaign "${campaign.name}" (${campaignCode}) for client "${campaign.client.companyName}"`,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 });
  }
}
