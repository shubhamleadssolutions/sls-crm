import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emoji } = await req.json();
    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const reactions = (message.reactions as Record<string, string[]>) || {};
    const usersForEmoji = reactions[emoji] || [];

    if (usersForEmoji.includes(user.id)) {
      // Toggle off
      reactions[emoji] = usersForEmoji.filter((uid) => uid !== user.id);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji] = [...usersForEmoji, user.id];
    }

    const updated = await prisma.chatMessage.update({
      where: { id: params.id },
      data: { reactions },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    console.error('Error toggling reaction:', error);
    return NextResponse.json({ error: 'Failed to react' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only allow message sender or Admin/CEO to delete
    if (message.senderId !== user.id && !['ADMIN', 'CEO'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.chatMessage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
