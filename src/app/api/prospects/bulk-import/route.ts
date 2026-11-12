import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, records, duplicateAction = 'skip' } = await req.json();

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided for import' }, { status: 400 });
    }

    // Step 3 & 4: Preview and Duplicate Detection
    if (action === 'preview') {
      const previewList = [];

      for (const row of records) {
        const companyName = (row.companyName || row['Company Name'] || row.Company || '').toString().trim();
        const contactPerson = (row.contactPerson || row['Contact Person'] || row.Contact || row.Name || '').toString().trim();
        const phone = (row.phone || row['Phone'] || row['Phone Number'] || row.Mobile || '').toString().trim();
        const whatsapp = (row.whatsappNumber || row['WhatsApp'] || row['WhatsApp Number'] || phone).toString().trim();
        const email = (row.email || row['Email'] || row['Email Address'] || '').toString().trim();
        const website = (row.website || row['Website'] || row.URL || '').toString().trim();
        const city = (row.city || row['City'] || '').toString().trim();
        const industry = (row.industry || row['Industry'] || '').toString().trim();
        const leadSource = (row.leadSource || row['Lead Source'] || row.Source || 'OTHER').toString().trim().toUpperCase().replace(/\s+/g, '_');

        if (!companyName) continue;

        // Check duplicates across companyName, phone, email, website
        const duplicateConditions: any[] = [];
        if (companyName) duplicateConditions.push({ companyName: { equals: companyName, mode: 'insensitive' } });
        if (phone) duplicateConditions.push({ phone: { equals: phone } });
        if (email) duplicateConditions.push({ email: { equals: email, mode: 'insensitive' } });
        if (website) duplicateConditions.push({ website: { equals: website, mode: 'insensitive' } });

        const existing = await prisma.prospect.findFirst({
          where: {
            isArchived: false,
            OR: duplicateConditions,
          },
          select: {
            id: true,
            prospectCode: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            email: true,
            status: true,
          },
        });

        previewList.push({
          raw: row,
          parsed: {
            companyName,
            contactPerson,
            phone,
            whatsappNumber: whatsapp,
            email,
            website,
            city,
            industry,
            leadSource: ['GOOGLE_MAPS', 'LINKEDIN', 'FACEBOOK', 'WEBSITE', 'REFERRAL', 'WHATSAPP', 'EMAIL'].includes(leadSource)
              ? leadSource
              : 'OTHER',
          },
          isDuplicate: !!existing,
          duplicateMatch: existing || null,
        });
      }

      return NextResponse.json({
        success: true,
        total: previewList.length,
        duplicateCount: previewList.filter((p) => p.isDuplicate).length,
        items: previewList,
      });
    }

    // Step 5 & 6: Confirm and Execute Import
    if (action === 'execute') {
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      let currentProspectCount = await prisma.prospect.count();

      for (const item of records) {
        const data = item.parsed || item;
        const companyName = data.companyName?.trim();
        if (!companyName) continue;

        // Check existing
        const duplicateConditions: any[] = [];
        if (companyName) duplicateConditions.push({ companyName: { equals: companyName, mode: 'insensitive' } });
        if (data.phone) duplicateConditions.push({ phone: { equals: data.phone } });
        if (data.email) duplicateConditions.push({ email: { equals: data.email, mode: 'insensitive' } });

        const existing = await prisma.prospect.findFirst({
          where: {
            isArchived: false,
            OR: duplicateConditions,
          },
        });

        if (existing) {
          if (duplicateAction === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateAction === 'update') {
            await prisma.prospect.update({
              where: { id: existing.id },
              data: {
                contactPerson: data.contactPerson || existing.contactPerson,
                phone: data.phone || existing.phone,
                whatsappNumber: data.whatsappNumber || existing.whatsappNumber,
                email: data.email || existing.email,
                website: data.website || existing.website,
                city: data.city || existing.city,
                industry: data.industry || existing.industry,
              },
            });
            updatedCount++;
            continue;
          }
          // If 'force', fall through and create new duplicate
        }

        currentProspectCount++;
        const prospectCode = `SLS-P-${1000 + currentProspectCount}`;

        await prisma.prospect.create({
          data: {
            prospectCode,
            companyName: data.companyName,
            contactPerson: data.contactPerson || null,
            phone: data.phone || null,
            whatsappNumber: data.whatsappNumber || null,
            email: data.email || null,
            website: data.website || null,
            city: data.city || null,
            industry: data.industry || null,
            leadSource: data.leadSource || 'OTHER',
            status: 'NEW_PROSPECT',
            assignedUserId: user.role === 'BD_INTERN' ? user.id : null,
          },
        });
        createdCount++;
      }

      // Log import activity
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'BULK_IMPORT',
          entityType: 'Prospect',
          details: `${user.name} bulk imported prospects: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`,
        },
      });

      return NextResponse.json({
        success: true,
        createdCount,
        updatedCount,
        skippedCount,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error during bulk import:', error);
    return NextResponse.json({ error: error.message || 'Bulk import failed' }, { status: 500 });
  }
}
