import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { numberToIndianWords } from '@/lib/numberToWords';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Access check: Restricted to CEO & MD (ADMIN) only
    if (user.role !== 'ADMIN' && user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden: Invoices and Billing are restricted to CEO and MD only' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const clientId = searchParams.get('clientId')?.trim();

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (clientId && clientId !== 'ALL') {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [invoices, totalCount, statusCounts] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        include: {
          client: { select: { id: true, clientId: true, companyName: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    // Financial calculations
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    statusCounts.forEach((s) => {
      const amount = Number(s._sum.totalAmount || 0);
      totalBilled += amount;
      if (s.status === 'PAID') {
        totalPaid += amount;
      } else if (s.status === 'ISSUED' || s.status === 'DRAFT') {
        totalPending += amount;
      } else if (s.status === 'OVERDUE') {
        totalOverdue += amount;
      }
    });

    return NextResponse.json({
      invoices,
      totalCount,
      summary: {
        totalBilled,
        totalPaid,
        totalPending,
        totalOverdue,
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Access check: Restricted to CEO & MD (ADMIN) only
    if (user.role !== 'ADMIN' && user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden: Invoices and Billing are restricted to CEO and MD only' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientCity,
      clientState,
      invoiceDate,
      dueDate,
      status = 'ISSUED',
      paymentMode = null,
      items, // Array of { description, quantity, rate, amount }
      discount = 0,
      notes,
      terms,
      bankName = null,
      accountName = null,
      accountNumber = null,
      ifscCode = null,
      branch = null,
      upiId = null,
    } = body;

    if (!clientName?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one service line item is required' }, { status: 400 });
    }

    // Calculate line item totals and clean net subtotal
    const processedItems = items.map((it: any) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const rate = Math.max(0, Number(it.rate) || 0);
      const amount = qty * rate;
      return {
        description: it.description?.trim() || 'Professional Outreach & Lead Acquisition Service',
        quantity: qty,
        rate,
        amount,
      };
    });

    const subtotal = processedItems.reduce((acc, it) => acc + it.amount, 0);
    const discountAmount = Math.max(0, Number(discount) || 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const amountInWords = numberToIndianWords(totalAmount);

    // Auto-generate invoice sequential number: SLS/INV/2026/001
    const count = await prisma.invoice.count();
    const currentYear = new Date().getFullYear();
    const seq = (count + 1).toString().padStart(3, '0');
    const invoiceNumber = `SLS/INV/${currentYear}/${seq}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: clientId || null,
        clientName: clientName.trim(),
        clientEmail: clientEmail?.trim() || null,
        clientPhone: clientPhone?.trim() || null,
        clientAddress: clientAddress?.trim() || null,
        clientCity: clientCity?.trim() || null,
        clientState: clientState?.trim() || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status,
        paymentMode,
        items: processedItems,
        subtotal,
        discount: discountAmount,
        totalAmount,
        amountInWords,
        notes: notes?.trim() || null,
        terms: terms?.trim() || '1. Payment to be made via NEFT/RTGS/UPI to Shubham Leads Solutions.\n2. Please mention the invoice number in transaction remarks.\n3. Delayed payments beyond the due date are subject to work pause.',
        bankName,
        accountName,
        accountNumber,
        ifscCode,
        branch,
        upiId,
        createdById: user.id,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVOICE_CREATED',
        entityType: 'Invoice',
        entityId: invoice.id,
        details: `Created invoice ${invoice.invoiceNumber} for ${invoice.clientName} of amount ₹${totalAmount}`,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
