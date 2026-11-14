import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden: Inventory is restricted to CEO and MD only' },
        { status: 403 }
      );
    }

    await prisma.inventoryItem.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden: Inventory is restricted to CEO and MD only' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, category, unit, rate, description } = body;

    const updated = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category: category.trim() }),
        ...(unit && { unit: unit.trim() }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}
