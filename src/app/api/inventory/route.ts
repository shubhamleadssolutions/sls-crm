import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = await prisma.inventoryItem.count({ where: { isActive: true } });
    const categories = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      distinct: ['category'],
      select: { category: true },
    });

    return NextResponse.json({
      items,
      totalCount,
      categories: categories.map((c) => c.category),
    });
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const { name, category = 'Retainer Partnership', unit = 'Per Month', rate, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Service / Item name is required' }, { status: 400 });
    }
    if (rate === undefined || isNaN(Number(rate)) || Number(rate) < 0) {
      return NextResponse.json({ error: 'Valid standard rate is required' }, { status: 400 });
    }

    // Auto-generate sequential item code: SLS-SRV-XXX
    const count = await prisma.inventoryItem.count();
    const itemCode = `SLS-SRV-${String(count + 1).padStart(3, '0')}`;

    const newItem = await prisma.inventoryItem.create({
      data: {
        itemCode,
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        rate: Number(rate),
        description: description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
