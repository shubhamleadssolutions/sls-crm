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
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignedUserId = searchParams.get('assignedUserId');
    const myOnly = searchParams.get('myOnly') === 'true' || user.role === 'BD_INTERN';
    const city = searchParams.get('city');
    const industry = searchParams.get('industry');

    const where: any = {
      isArchived: false,
    };

    if (myOnly) {
      where.assignedUserId = user.id;
    } else if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (source && source !== 'ALL') {
      where.leadSource = source;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { prospectCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const prospects = await prisma.prospect.findMany({
      where,
      include: {
        assignedUser: { select: { id: true, name: true, role: true } },
        _count: {
          select: { activities: true, notes: true, followUps: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ prospects });
  } catch (error: any) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json({ error: 'Failed to fetch prospects' }, { status: 500 });
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
      companyName,
      website,
      industry,
      city,
      state,
      country,
      companyLinkedInUrl,
      googleMapsUrl,
      contactPerson,
      designation,
      phone,
      whatsappNumber,
      email,
      linkedInProfileUrl,
      businessType,
      servicesOffered,
      targetAudience,
      targetLocation,
      potentialRequirement,
      leadSource,
      status,
      assignedUserId,
      nextFollowUpDate,
      followUpType,
      followUpNotes,
      initialNote,
    } = body;

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
    }

    // Generate unique prospect code
    const count = await prisma.prospect.count();
    const prospectCode = `SLS-P-${1000 + count + 1}`;

    const prospect = await prisma.prospect.create({
      data: {
        prospectCode,
        companyName: companyName.trim(),
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || 'India',
        companyLinkedInUrl: companyLinkedInUrl?.trim() || null,
        googleMapsUrl: googleMapsUrl?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        designation: designation?.trim() || null,
        phone: phone?.trim() || null,
        whatsappNumber: whatsappNumber?.trim() || null,
        email: email?.trim() || null,
        linkedInProfileUrl: linkedInProfileUrl?.trim() || null,
        businessType: businessType?.trim() || null,
        servicesOffered: servicesOffered?.trim() || null,
        targetAudience: targetAudience?.trim() || null,
        targetLocation: targetLocation?.trim() || null,
        potentialRequirement: potentialRequirement?.trim() || null,
        leadSource: leadSource || 'OTHER',
        status: status || 'NEW_PROSPECT',
        assignedUserId: assignedUserId || (user.role === 'BD_INTERN' ? user.id : null),
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        followUpType: followUpType || null,
        followUpNotes: followUpNotes?.trim() || null,
      },
    });

    // Add initial note if provided
    if (initialNote?.trim()) {
      await prisma.note.create({
        data: {
          prospectId: prospect.id,
          content: initialNote.trim(),
          userId: user.id,
        },
      });
    }

    // Add activity record
    await prisma.activity.create({
      data: {
        prospectId: prospect.id,
        channel: 'OTHER',
        activity: 'New prospect added to CRM',
        result: `Created by ${user.name}`,
        userId: user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PROSPECT_CREATED',
        entityType: 'Prospect',
        entityId: prospect.id,
        details: `${user.name} created prospect "${prospect.companyName}" (${prospectCode})`,
      },
    });

    return NextResponse.json({ success: true, prospect });
  } catch (error: any) {
    console.error('Error creating prospect:', error);
    return NextResponse.json({ error: error.message || 'Failed to create prospect' }, { status: 500 });
  }
}
