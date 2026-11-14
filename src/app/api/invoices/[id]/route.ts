import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { numberToIndianWords } from '@/lib/numberToWords';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden: Invoices and Billing are restricted to CEO and MD only' },
        { status: 403 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true, designation: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden: Invoices and Billing are restricted to CEO and MD only' },
        { status: 403 }
      );
    }

    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};

    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === 'PAID' && !existing.paidDate) {
        data.paidDate = new Date();
      }
    }

    if (body.paymentMode !== undefined) data.paymentMode = body.paymentMode;
    if (body.paidDate !== undefined) data.paidDate = body.paidDate ? new Date(body.paidDate) : null;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.terms !== undefined) data.terms = body.terms;

    // If items are modified, recalculate amounts
    if (body.items && Array.isArray(body.items)) {
      const processedItems = body.items.map((it: any) => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const rate = Math.max(0, Number(it.rate) || 0);
        return {
          description: it.description?.trim() || 'Service',
          quantity: qty,
          rate,
          amount: qty * rate,
        };
      });

      const subtotal = processedItems.reduce((acc, it) => acc + it.amount, 0);
      const discountAmount = Math.max(0, Number(body.discount ?? existing.discount) || 0);
      const totalAmount = Math.max(0, subtotal - discountAmount);

      data.items = processedItems;
      data.subtotal = subtotal;
      data.discount = discountAmount;
      data.totalAmount = totalAmount;
      data.amountInWords = numberToIndianWords(totalAmount);
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data,
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVOICE_UPDATED',
        entityType: 'Invoice',
        entityId: updated.id,
        details: `Updated invoice ${updated.invoiceNumber} status to ${updated.status}`,
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'CEO')) {
      return NextResponse.json({ error: 'Unauthorized: Only Admin or CEO can delete invoices' }, { status: 403 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVOICE_DELETED',
        entityType: 'Invoice',
        entityId: params.id,
        details: `Deleted invoice ${invoice.invoiceNumber} (${invoice.clientName})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
