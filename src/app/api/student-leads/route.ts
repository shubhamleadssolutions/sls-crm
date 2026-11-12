import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (clientId && clientId !== 'ALL') where.clientId = clientId;
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentCode: { contains: search, mode: 'insensitive' } },
        { courseInterest: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.studentLead.findMany({
      where,
      include: {
        client: { select: { id: true, companyName: true, clientId: true } },
        campaign: { select: { id: true, name: true, campaignCode: true } },
        counsellor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error('Error fetching student leads:', error);
    return NextResponse.json({ error: 'Failed to fetch student leads' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      email,
      courseInterest,
      location,
      qualification,
      leadSource,
      consentReference,
      clientId,
      campaignId,
      status,
      followUpDate,
      followUpNotes,
      demoStatus,
      admissionStatus,
      feeAmount,
    } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Student Name and Phone Number are required' }, { status: 400 });
    }

    const count = await prisma.studentLead.count();
    const studentCode = `SLS-SL-${1000 + count + 1}`;

    const lead = await prisma.studentLead.create({
      data: {
        studentCode,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        courseInterest: courseInterest?.trim() || null,
        location: location?.trim() || null,
        qualification: qualification?.trim() || null,
        leadSource: leadSource || 'Meta Ads',
        consentReference: consentReference?.trim() || null,
        clientId: clientId || null,
        campaignId: campaignId || null,
        status: status || 'NEW_LEAD',
        counsellorId: user.id,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpNotes: followUpNotes?.trim() || null,
        demoStatus: demoStatus || 'Pending',
        admissionStatus: admissionStatus || 'Pending',
        feeAmount: feeAmount ? parseFloat(feeAmount) : null,
      },
      include: { client: true, campaign: true },
    });

    // If campaign attached, increment its lead counter
    if (campaignId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { generatedLeads: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Error creating student lead:', error);
    return NextResponse.json({ error: error.message || 'Failed to create student lead' }, { status: 500 });
  }
}
