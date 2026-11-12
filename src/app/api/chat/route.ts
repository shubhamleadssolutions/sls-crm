import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'general';

    // Fetch messages for this channel
    const messages = await prisma.chatMessage.findMany({
      where: { channel },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Fetch active team members for direct messaging & online list
    const teamMembers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        designation: true,
      },
      orderBy: { name: 'asc' },
    });

    // Preset standard team channels
    const channels = [
      {
        id: 'general',
        name: 'general',
        label: 'Company General',
        description: 'Company-wide updates, discussions, and daily communication',
        badge: 'General',
      },
      {
        id: 'leads-outreach',
        name: 'leads-outreach',
        label: 'Outreach & Calling',
        description: 'Daily calling pipelines, cold pitches, and client discussions',
        badge: 'Sales',
      },
      {
        id: 'deals-closings',
        name: 'deals-closings',
        label: 'Closed Deals & Wins 🎉',
        description: 'Celebrate converted college partners, contracts, and retainers',
        badge: 'Wins',
      },
      {
        id: 'admissions-updates',
        name: 'admissions-updates',
        label: 'Admissions & Counseling',
        description: 'Student enrollment campaigns, course queries, and counseling sync',
        badge: 'Campaigns',
      },
      {
        id: 'announcements',
        name: 'announcements',
        label: 'Executive Announcements',
        description: 'Strategic directives and announcements from MD & CEO',
        badge: 'Official',
      },
    ];

    return NextResponse.json({
      messages,
      channels,
      teamMembers,
      currentUser: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        designation: user.designation,
      },
    });
  } catch (error: any) {
    console.error('Error fetching chat data:', error);
    return NextResponse.json({ error: 'Failed to fetch chat data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { channel = 'general', content, attachments } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        channel,
        content: content.trim(),
        senderId: user.id,
        senderName: user.name,
        senderRole: user.designation || user.role,
        attachments: attachments || null,
        reactions: {},
      },
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
