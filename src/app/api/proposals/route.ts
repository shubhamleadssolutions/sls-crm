import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposals = await prisma.proposal.findMany({
      include: {
        prospect: {
          select: {
            id: true,
            companyName: true,
            prospectCode: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ proposals });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { prospectId, amount, service, validUntil, status, notes, fileUrl } = body;

    if (!prospectId) {
      return NextResponse.json({ error: 'Prospect ID is required' }, { status: 400 });
    }

    const count = await prisma.proposal.count();
    const proposalCode = `SLS-PROP-${1000 + count + 1}`;

    const proposal = await prisma.proposal.create({
      data: {
        proposalCode,
        prospectId,
        amount: amount ? parseFloat(amount) : null,
        service: service?.trim() || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        status: status || 'DRAFT',
        notes: notes?.trim() || null,
        fileUrl: fileUrl?.trim() || null,
      },
      include: {
        prospect: true,
      },
    });

    // Update prospect status to PROPOSAL_SENT if not already
    if (status === 'SENT' || !status || status === 'DRAFT') {
      await prisma.prospect.update({
        where: { id: prospectId },
        data: { status: 'PROPOSAL_SENT' },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        prospectId,
        channel: 'OTHER',
        activity: `Created Proposal (${proposalCode}) for ${proposal.service || 'services'} - ₹${proposal.amount || 'TBD'}`,
        result: `Status: ${proposal.status}`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: error.message || 'Failed to create proposal' }, { status: 500 });
  }
}
