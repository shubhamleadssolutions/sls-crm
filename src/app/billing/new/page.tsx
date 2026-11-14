'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ReceiptText,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
  Calendar,
  CreditCard,
  FileText,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { numberToIndianWords } from '@/lib/numberToWords';

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('clientId') || '';
  const initialItemName = searchParams.get('itemName') || '';
  const initialItemRate = searchParams.get('itemRate') || '';

  const [clients, setClients] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Line Items
  const [items, setItems] = useState([
    {
      description: initialItemName || 'B2B Client Outreach & Admissions Campaign - Monthly Retainer',
      quantity: 1,
      rate: initialItemRate ? Number(initialItemRate) : 50000,
      amount: initialItemRate ? Number(initialItemRate) : 50000,
    },
  ]);

  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('Campaign deliverables and lead generation schedule as agreed in project scope.');
  const [terms, setTerms] = useState(
    '1. Payment is due within 7 days from invoice date.\n2. Services delivered as per mutual agreement scope.\n3. Subject to Pune jurisdiction.'
  );

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user.role !== 'ADMIN' && data.user.role !== 'CEO') {
          setAccessDenied(true);
        }
      })
      .catch(console.error);

    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        const clientList = data.clients || [];
        setClients(clientList);
        if (initialClientId) {
          const c = clientList.find((item: any) => item.id === initialClientId);
          if (c) {
            setSelectedClientId(c.id);
            setClientName(c.companyName || '');
            setClientEmail(c.email || '');
            setClientPhone(c.phone || '');
            setClientCity(c.city || '');
            if (!initialItemName && c.retainerAmount && Number(c.retainerAmount) > 0) {
              setItems([
                {
                  description: `${c.service || 'Outreach & Lead Acquisition'} - Retainer`,
                  quantity: 1,
                  rate: Number(c.retainerAmount),
                  amount: Number(c.retainerAmount),
                },
              ]);
            }
          }
        }
      })
      .catch(console.error);

    fetch('/api/inventory')
      .then((res) => res.json())
      .then((data) => setInventoryList(data.items || []))
      .catch(console.error);
  }, [initialClientId, initialItemName, initialItemRate]);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientCity('');
      return;
    }

    const c = clients.find((item) => item.id === clientId);
    if (c) {
      setClientName(c.companyName || '');
      setClientEmail(c.email || '');
      setClientPhone(c.phone || '');
      setClientCity(c.city || '');
      if (c.retainerAmount && Number(c.retainerAmount) > 0) {
        setItems([
          {
            description: `${c.service || 'Outreach & Lead Acquisition'} - Retainer`,
            quantity: 1,
            rate: Number(c.retainerAmount),
            amount: Number(c.retainerAmount),
          },
        ]);
      }
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    const qty = Math.max(1, Number(item.quantity) || 1);
    const rate = Math.max(0, Number(item.rate) || 0);
    item.amount = qty * rate;
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: 'Targeted Student Lead Acquisition Package',
        quantity: 1,
        rate: 25000,
        amount: 25000,
      },
    ]);
  };

  const handleSelectInventoryItem = (itemId: string) => {
    if (!itemId) return;
    const inv = inventoryList.find((i) => i.id === itemId);
    if (inv) {
      setItems([
        ...items,
        {
          description: inv.name,
          quantity: 1,
          rate: Number(inv.rate),
          amount: Number(inv.rate),
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(discount) || 0));
  const amountInWords = numberToIndianWords(totalAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Client Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId || null,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          clientAddress: clientAddress.trim(),
          clientCity: clientCity.trim(),
          clientState: clientState.trim(),
          invoiceDate,
          dueDate,
          items,
          discount: Number(discount) || 0,
          notes,
          terms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      router.push(`/billing/${data.invoice.id}`);
    } catch (err: any) {
      setError(err.message || 'Error creating invoice');
      setLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200/90 text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ReceiptText className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Invoices and Billing are restricted to CEO and MD only.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
          <span className="text-xs font-semibold text-slate-500">
            Shubham Leads Solutions &bull; Official Commercial Invoice
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Client Particulars */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Billed To (Client / Institution)
                  </h2>
                  <p className="text-[11px] text-slate-500">Select an existing active client or enter details directly</p>
                </div>
              </div>

              {clients.length > 0 && (
                <div className="w-60">
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">-- Choose Existing Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client / College / Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Symbiosis Institute of Technology"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. admissions@college.edu.in"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98220 11223"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City / State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Maharashtra"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Postal Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Campus Address, Near University Road"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Dates and Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Invoice Timeline &amp; Terms</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invoice Issue Date
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Commercial Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Line Items (Dynamic Rows & Inventory Pick) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Service Particulars &amp; Deliverables
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Select from Inventory Catalog */}
                {inventoryList.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      handleSelectInventoryItem(e.target.value);
                      e.target.value = '';
                    }}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition border border-indigo-200 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      + Add from Inventory Catalog ({inventoryList.length} items)
                    </option>
                    {inventoryList.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.itemCode}: {inv.name} (₹{Number(inv.rate).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Row</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 items-center"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Service Description #{index + 1}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Student Lead Generation Campaign"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1 text-right">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Amount
                    </label>
                    <p className="text-xs font-black text-slate-900 pt-1.5">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="col-span-1 text-center pt-3.5">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown (Clean net total, NO GST) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Amount in Words:</span>
                <p className="text-xs font-black text-blue-900 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                  {amountInWords}
                </p>
              </div>

              <div className="w-full sm:w-72 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right"
                  />
                </div>

                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Net Total Payable:</span>
                  <span className="text-blue-700 text-base">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Remarks & Official Terms */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
              Special Remarks &amp; Settlement Terms
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Special Project Remarks / Deliverables Note
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Commercial Terms &amp; Settlement Instructions
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/billing"
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              <ReceiptText className="w-4 h-4" />
              <span>{loading ? 'Generating Official Invoice...' : 'Generate Official Bill &rarr;'}</span>
            </button>
          </div>
        </form>
      </div>
  );
}

export default function NewInvoicePage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading invoice generator...</div>}>
        <NewInvoiceForm />
      </Suspense>
    </AppLayout>
  );
}
