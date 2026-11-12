const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding fresh SLS CRM with only Abhinav (ADMIN) and standard templates...');

  const passwordHash = await bcrypt.hash('ABHINAV@123', 10);

  // 1. Wipe all tables clean for fresh start
  await prisma.auditLog.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.requirement.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.studentLead.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.prospect.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create the Sole Initial Administrator: Abhinav
  const abhinav = await prisma.user.create({
    data: {
      name: 'Abhinav',
      username: 'abhinav',
      email: 'abhinav@shubhamleadssolutions.com',
      passwordHash: passwordHash,
      role: 'ADMIN',
      designation: 'Managing Director',
      phone: '+91 9876543210',
    },
  });

  console.log('Created fresh administrator:', {
    name: abhinav.name,
    username: abhinav.username,
    role: abhinav.role,
  });

  // 3. Create Standard Communication Templates (Section 19 of PDF)
  const templates = [
    {
      title: 'WhatsApp Introduction',
      channel: 'WHATSAPP',
      category: 'Outreach',
      content:
        'Hi {{contact_name}}, greetings from Shubham Leads Solutions! We specialize in generating high-intent student enrollments & digital leads for institutes like {{company_name}}. Are you open to a brief 5-minute chat this week on how we can scale your admissions?',
    },
    {
      title: 'WhatsApp Follow-up 1',
      channel: 'WHATSAPP',
      category: 'Follow-up',
      content:
        'Hi {{contact_name}}, following up on my previous message. We recently helped a similar training center boost their qualified student inquiries by 40%. Would Thursday at 3 PM work for a quick demo?',
    },
    {
      title: 'WhatsApp Final Follow-up',
      channel: 'WHATSAPP',
      category: 'Follow-up',
      content:
        'Hi {{contact_name}}, I know you are busy running {{company_name}}. Just wanted to check if student lead generation is a priority for you this quarter, or should I reconnect next month?',
    },
    {
      title: 'Email Introduction',
      channel: 'EMAIL',
      category: 'Outreach',
      content:
        'Subject: Scaling Admissions & Inquiries for {{company_name}}\n\nDear {{contact_name}},\n\nI hope you are doing well.\n\nAt Shubham Leads Solutions, we partner with premier institutes and educational companies to generate verified, high-converting leads through targeted Meta & Google campaigns.\n\nWould you be open to a 10-minute discovery call this week?\n\nBest regards,\nAbhinav\nManaging Director, Shubham Leads Solutions',
    },
    {
      title: 'LinkedIn Connection Message',
      channel: 'LINKEDIN',
      category: 'Outreach',
      content:
        'Hi {{contact_name}}, I noticed your work leading {{company_name}}. We help education brands and service firms scale their student and client acquisition pipelines. Would love to connect!',
    },
    {
      title: 'LinkedIn Follow-up',
      channel: 'LINKEDIN',
      category: 'Follow-up',
      content:
        'Hi {{contact_name}}, thanks for connecting! I would love to share a 2-minute overview of how we generate verified inquiries for education programs like yours. Would you be open to a quick chat this week?',
    },
  ];

  for (const t of templates) {
    await prisma.template.create({ data: t });
  }

  console.log('CRM Database is fresh, clean, and initialized without any dummy prospects.');
}

main()
  .catch((e) => {
    console.error('Error during fresh seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
