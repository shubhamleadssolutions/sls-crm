import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Intern cannot export sensitive financial or bulk data
    if (user.role === 'BD_INTERN') {
      return NextResponse.json({ error: 'Permission denied: Interns cannot export data' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignedUserId = searchParams.get('assignedUserId');

    const where: any = { isArchived: false };
    if (status && status !== 'ALL') where.status = status;
    if (source && source !== 'ALL') where.leadSource = source;
    if (assignedUserId) where.assignedUserId = assignedUserId;

    const prospects = await prisma.prospect.findMany({
      where,
      include: {
        assignedUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportRows = prospects.map((p) => ({
      'Prospect ID': p.prospectCode,
      'Company Name': p.companyName,
      'Contact Person': p.contactPerson || '',
      'Designation': p.designation || '',
      'Phone': p.phone || '',
      'WhatsApp Number': p.whatsappNumber || '',
      'Email': p.email || '',
      'Website': p.website || '',
      'City': p.city || '',
      'State': p.state || '',
      'Lead Source': p.leadSource,
      'Status': p.status,
      'Assigned To': p.assignedUser?.name || 'Unassigned',
      'Next Follow-up Date': p.nextFollowUpDate ? p.nextFollowUpDate.toISOString().split('T')[0] : '',
      'Follow-up Count': p.followUpCount,
      'Created Date': p.createdAt.toISOString().split('T')[0],
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects');

    if (format === 'xlsx') {
      const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Disposition': `attachment; filename="SLS_Prospects_${new Date().toISOString().slice(0, 10)}.xlsx"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    }

    // Default CSV
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Disposition': `attachment; filename="SLS_Prospects_${new Date().toISOString().slice(0, 10)}.csv"`,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
