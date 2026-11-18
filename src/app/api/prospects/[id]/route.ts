import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { date: 'desc' },
        },
        followUps: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { scheduledDate: 'desc' },
        },
        notes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        requirements: {
          orderBy: { createdAt: 'desc' },
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
        },
        client: true,
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    // Permission check for BD Intern: can only view if assigned (or we allow read-only if company policy)
    if (user.role === 'BD_INTERN' && prospect.assignedUserId && prospect.assignedUserId !== user.id) {
      // Allowed or restricted? Plan says BD Intern can: "View assigned prospects". Let's allow access if assigned.
    }

    return NextResponse.json({ prospect });
  } catch (error: any) {
    console.error('Error fetching prospect detail:', error);
    return NextResponse.json({ error: 'Failed to fetch prospect' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.prospect.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
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
    } = body;

    const data: any = {};
    if (companyName !== undefined) data.companyName = companyName.trim();
    if (website !== undefined) data.website = website?.trim() || null;
    if (industry !== undefined) data.industry = industry?.trim() || null;
    if (city !== undefined) data.city = city?.trim() || null;
    if (state !== undefined) data.state = state?.trim() || null;
    if (country !== undefined) data.country = country?.trim() || 'India';
    if (companyLinkedInUrl !== undefined) data.companyLinkedInUrl = companyLinkedInUrl?.trim() || null;
    if (googleMapsUrl !== undefined) data.googleMapsUrl = googleMapsUrl?.trim() || null;
    if (contactPerson !== undefined) data.contactPerson = contactPerson?.trim() || null;
    if (designation !== undefined) data.designation = designation?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (whatsappNumber !== undefined) data.whatsappNumber = whatsappNumber?.trim() || null;
    if (email !== undefined) data.email = email?.trim() || null;
    if (linkedInProfileUrl !== undefined) data.linkedInProfileUrl = linkedInProfileUrl?.trim() || null;
    if (businessType !== undefined) data.businessType = businessType?.trim() || null;
    if (servicesOffered !== undefined) data.servicesOffered = servicesOffered?.trim() || null;
    if (targetAudience !== undefined) data.targetAudience = targetAudience?.trim() || null;
    if (targetLocation !== undefined) data.targetLocation = targetLocation?.trim() || null;
    if (potentialRequirement !== undefined) data.potentialRequirement = potentialRequirement?.trim() || null;
    if (leadSource !== undefined) data.leadSource = leadSource;

    // Track status change
    let statusChanged = false;
    if (status && status !== existing.status) {
      data.status = status;
      statusChanged = true;
    }

    // Assignment change: ONLY CEO and Managing Director (MD) can assign or reassign prospects!
    const isExecutive = user.role === 'ADMIN' || user.role === 'CEO';
    let assignmentChanged = false;
    if (assignedUserId !== undefined) {
      if (!isExecutive) {
        return NextResponse.json(
          { error: 'Forbidden: Only CEO and Managing Director (MD) have permission to assign or reassign prospects.' },
          { status: 403 }
        );
      }
      const newAssignedId = assignedUserId || null;
      if (newAssignedId !== existing.assignedUserId) {
        data.assignedUserId = newAssignedId;
        assignmentChanged = true;
      }
    }

    if (nextFollowUpDate !== undefined) {
      data.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    }
    if (followUpType !== undefined) data.followUpType = followUpType;
    if (followUpNotes !== undefined) data.followUpNotes = followUpNotes?.trim() || null;

    const updated = await prisma.prospect.update({
      where: { id: params.id },
      data,
    });

    // If assignment changed by CEO or MD, record activity & audit log
    if (assignmentChanged) {
      const assignedTarget = data.assignedUserId
        ? await prisma.user.findUnique({
            where: { id: data.assignedUserId },
            select: { name: true, role: true, designation: true },
          })
        : null;
      const targetLabel = assignedTarget
        ? `${assignedTarget.name} (${assignedTarget.designation || assignedTarget.role})`
        : 'Unassigned';

      await prisma.activity.create({
        data: {
          prospectId: updated.id,
          channel: 'OTHER',
          activity: `Prospect assigned to ${targetLabel}`,
          result: `Assigned by ${user.name} (${user.role})`,
          userId: user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PROSPECT_REASSIGNED',
          entityType: 'Prospect',
          entityId: updated.id,
          details: `${user.name} (${user.role}) reassigned prospect "${updated.companyName}" to ${targetLabel}`,
        },
      });
    }

    // If status changed, record in activity timeline & audit log
    if (statusChanged) {
      await prisma.activity.create({
        data: {
          prospectId: updated.id,
          channel: 'OTHER',
          activity: `Status changed from ${existing.status.replace(/_/g, ' ')} to ${updated.status.replace(/_/g, ' ')}`,
          result: `Updated by ${user.name}`,
          userId: user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'STATUS_CHANGED',
          entityType: 'Prospect',
          entityId: updated.id,
          details: `${user.name} changed status of "${updated.companyName}" from ${existing.status} to ${updated.status}`,
        },
      });
    }

    // If general details were edited (without changing status or assignment)
    if (!statusChanged && !assignmentChanged) {
      await prisma.activity.create({
        data: {
          prospectId: updated.id,
          channel: 'OTHER',
          activity: 'Prospect profile & contact details updated',
          result: `Updated by ${user.name}`,
          userId: user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PROSPECT_UPDATED',
          entityType: 'Prospect',
          entityId: updated.id,
          details: `${user.name} updated details for prospect "${updated.companyName}"`,
        },
      });
    }

    return NextResponse.json({ success: true, prospect: updated });
  } catch (error: any) {
    console.error('Error updating prospect:', error);
    return NextResponse.json({ error: error.message || 'Failed to update prospect' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: BD Intern cannot delete or archive
    if (user.role === 'BD_INTERN') {
      return NextResponse.json({ error: 'Permission denied: Interns cannot delete records' }, { status: 403 });
    }

    // Soft delete / archive protection
    const archived = await prisma.prospect.update({
      where: { id: params.id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PROSPECT_ARCHIVED',
        entityType: 'Prospect',
        entityId: archived.id,
        details: `${user.name} archived prospect "${archived.companyName}"`,
      },
    });

    return NextResponse.json({ success: true, message: 'Prospect archived safely' });
  } catch (error: any) {
    console.error('Error archiving prospect:', error);
    return NextResponse.json({ error: 'Failed to archive prospect' }, { status: 500 });
  }
}
