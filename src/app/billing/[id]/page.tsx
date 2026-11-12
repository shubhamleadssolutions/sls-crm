'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  Calendar,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invoice not found');
      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const handleToggleStatus = async () => {
    if (!invoice) return;
    const nextStatus = invoice.status === 'PAID' ? 'ISSUED' : 'PAID';
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchInvoice();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error || !invoice) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'This invoice does not exist or has been removed.'}</p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
        </div>
      </AppLayout>
    );
  }

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const whatsappMsg = encodeURIComponent(
    `Hello ${invoice.clientName},\n\nPlease find your commercial invoice *${invoice.invoiceNumber}* for *₹${Number(invoice.totalAmount).toLocaleString('en-IN')}* from Shubham Leads Solutions.\n\nInvoice Date: ${formatDate(invoice.invoiceDate, 'dd MMM yyyy')}\n\nThank you for partnering with Shubham Leads Solutions.`
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Action Header - Hidden during print */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {invoice.invoiceNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Commercial Bill
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Billed to: <strong>{invoice.clientName}</strong></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Share */}
            {invoice.clientPhone && (
              <a
                href={`https://wa.me/${invoice.clientPhone.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp Bill</span>
              </a>
            )}

            {/* Print / Save PDF Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CATALYSTK-INSPIRED COMMERCIAL INVOICE DOCUMENT                            */}
        {/* ========================================================================= */}
        <div className="bg-white border-2 border-slate-300 shadow-xl p-8 sm:p-10 space-y-6 print:border print:border-slate-400 print:shadow-none print:p-6 text-slate-900 font-sans">
          
          {/* Top Section: Header & Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-800 pb-6">
            {/* Company Profile (Left) */}
            <div className="space-y-2 max-w-md">
              <div className="relative w-52 h-16 mb-2">
                <Image
                  src="/sls-logo-full.png"
                  alt="Shubham Leads Solutions"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                SHUBHAM LEADS SOLUTIONS
              </h1>
              <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
                Delivering High-Quality Verified Leads &bull; Higher Education Partner
              </p>
              <div className="text-xs text-slate-600 leading-relaxed space-y-0.5">
                <p>Office No. 402, Supreme Center, IT Park Road, Aundh, Pune, Maharashtra - 411007</p>
                <p>Email: contact@shubhamleads.com | Phone: +91 98765 43210</p>
                <p>Website: www.shubhamleads.com</p>
              </div>
            </div>

            {/* Catalystk-Style Invoice Title & Meta Box (Right) */}
            <div className="w-full sm:w-72 text-right">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-wider mb-3">
                INVOICE
              </h2>
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <div className="grid grid-cols-2 border-b border-slate-200">
                  <span className="p-2 bg-slate-100 font-bold text-slate-700 text-left border-r border-slate-200">
                    Invoice No:
                  </span>
                  <span className="p-2 font-mono font-black text-slate-900 text-right">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-200">
                  <span className="p-2 bg-slate-100 font-bold text-slate-700 text-left border-r border-slate-200">
                    Invoice Date:
                  </span>
                  <span className="p-2 font-bold text-slate-800 text-right">
                    {formatDate(invoice.invoiceDate, 'dd MMM yyyy')}
                  </span>
                </div>
                {invoice.dueDate && (
                  <div className="grid grid-cols-2 border-b border-slate-200">
                    <span className="p-2 bg-slate-100 font-bold text-slate-700 text-left border-r border-slate-200">
                      Due Date:
                    </span>
                    <span className="p-2 font-bold text-slate-800 text-right">
                      {formatDate(invoice.dueDate, 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2">
                  <span className="p-2 bg-slate-100 font-bold text-slate-700 text-left border-r border-slate-200">
                    Payment Terms:
                  </span>
                  <span className="p-2 font-semibold text-slate-800 text-right">
                    Net 7 Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer / Billed To Section (Expanded Full Width) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden p-5 bg-slate-50/40 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              CUSTOMER / BILLED TO:
            </span>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {invoice.clientName}
                </h3>
                {invoice.clientAddress && (
                  <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                    {invoice.clientAddress}
                  </p>
                )}
              </div>
              <div className="text-xs text-slate-600 space-y-1 sm:text-right shrink-0">
                {invoice.clientCity && (
                  <p>
                    <span className="font-semibold text-slate-700">City / State:</span>{' '}
                    {invoice.clientCity}
                    {invoice.clientState ? `, ${invoice.clientState}` : ''}
                  </p>
                )}
                {invoice.clientPhone && (
                  <p>
                    <span className="font-semibold text-slate-700">Phone:</span> {invoice.clientPhone}
                  </p>
                )}
                {invoice.clientEmail && (
                  <p>
                    <span className="font-semibold text-slate-700">Email:</span> {invoice.clientEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Grid Table (Catalystk Grid Table) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-800 text-white uppercase text-[10px] font-bold tracking-wider">
                <tr className="divide-x divide-slate-700">
                  <th className="py-3 px-3 w-12 text-center">S.No.</th>
                  <th className="py-3 px-4">Description of Services / Deliverables</th>
                  <th className="py-3 px-4 w-20 text-center">Qty</th>
                  <th className="py-3 px-4 w-32 text-right">Unit Rate (₹)</th>
                  <th className="py-3 px-4 w-36 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="divide-x divide-slate-200 hover:bg-slate-50/50">
                    <td className="py-3.5 px-3 text-center text-slate-500 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      ₹{Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Catalystk Totals & Words Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
            {/* Left 7 Columns: Amount in Words + Terms */}
            <div className="sm:col-span-7 space-y-4">
              {/* Amount in Words Box */}
              <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Amount Chargeable (in words):
                </span>
                <p className="text-xs font-black text-slate-900 leading-snug">
                  {invoice.amountInWords || 'Amount confirmed'}
                </p>
              </div>

              {/* Remarks / Scope */}
              {invoice.notes && (
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-slate-700">Remarks / Deliverable Notes:</span>
                  <p className="text-slate-600 italic">{invoice.notes}</p>
                </div>
              )}

              {/* Terms & Conditions Box */}
              <div className="border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold uppercase tracking-wider text-slate-800 block text-[10px]">
                  Terms &amp; Conditions:
                </span>
                <p className="whitespace-pre-line leading-relaxed">
                  {invoice.terms ||
                    '1. Payment is due within 7 days from invoice date.\n2. Services delivered as per mutual agreement scope.\n3. Subject to Pune jurisdiction.'}
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Summary Calculations */}
            <div className="sm:col-span-5">
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <div className="flex justify-between p-3 border-b border-slate-200">
                  <span className="font-semibold text-slate-600">Sub Total:</span>
                  <span className="font-bold text-slate-900">
                    ₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {Number(invoice.discount) > 0 && (
                  <div className="flex justify-between p-3 border-b border-slate-200 text-emerald-700 bg-emerald-50/50">
                    <span className="font-semibold">Special Discount:</span>
                    <span className="font-bold">
                      -₹{Number(invoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between p-3 bg-slate-900 text-white text-sm font-black">
                  <span>Grand Total:</span>
                  <span>
                    ₹{Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Authorized Signatory Block (Catalystk Standard) */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-8 border-t-2 border-slate-800">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Thank you for partnering with Shubham Leads Solutions!</p>
              <p className="text-[11px]">This is a computer-generated commercial invoice.</p>
            </div>

            {/* Official Signature and Stamp Box */}
            <div className="text-center sm:text-right space-y-3 min-w-[200px]">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                For SHUBHAM LEADS SOLUTIONS
              </p>

              {/* Stamp and signature placeholder */}
              <div className="my-2 h-16 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 px-4">
                <BadgeCheck className="w-5 h-5 text-blue-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Digitally Authorized
                </span>
                <span className="text-[8px] text-slate-400">SLS Pune Office</span>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-900">Ansh Kumar</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Managing Director (Authorized Signatory)
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
