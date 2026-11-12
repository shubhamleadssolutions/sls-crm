import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Shubham Leads Solutions | Enterprise CRM',
    template: '%s | Shubham Leads Solutions CRM',
  },
  description: 'Enterprise Client Acquisition, Outreach Pipeline, and Student Lead Management System for Shubham Leads Solutions',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
