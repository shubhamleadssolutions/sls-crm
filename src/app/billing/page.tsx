'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  Clock,
  Printer,
  FileText,
  IndianRupee,
  ExternalLink,
  ChevronRight,
  Send,
  X,
  Building,
  Package,
  Layers,
  Sparkles,
  Trash2,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCity?: string;
  clientState?: string;
  invoiceDate: string;
  dueDate?: string;
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  discount: number;
  totalAmount: number;
  amountInWords?: string;
  createdBy?: { id: string; name: string };
  client?: { id: string; clientId: string; companyName: string };
}

interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  rate: number;
  description?: string;
  isActive: boolean;
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'inventory'>('invoices');

  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [totalInvoicedValue, setTotalInvoicedValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [invSearchTerm, setInvSearchTerm] = useState('');
  const [invCategory, setInvCategory] = useState('ALL');
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newInvItem, setNewInvItem] = useState({
    name: '',
    category: 'Retainer Partnership',
    unit: 'Per Month',
    rate: '',
    description: '',
  });
  const [invSubmitting, setInvSubmitting] = useState(false);

  // Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      const list = data.invoices || [];
      setInvoices(list);

      const totalVal = list.reduce((acc: number, curr: Invoice) => acc + Number(curr.totalAmount || 0), 0);
      setTotalInvoicedValue(totalVal);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  }, [searchTerm]);

  // Fetch Inventory
  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (invSearchTerm) params.set('search', invSearchTerm);
      if (invCategory !== 'ALL') params.set('category', invCategory);

      const res = await fetch(`/api/inventory?${params.toString()}`);
      const data = await res.json();
      setInventory(data.items || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  }, [invSearchTerm, invCategory]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleCreateInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvItem.name.trim() || !newInvItem.rate) return;

    setInvSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvItem),
      });
      if (res.ok) {
        setShowAddInventoryModal(false);
        setNewInvItem({
          name: '',
          category: 'Retainer Partnership',
          unit: 'Per Month',
          rate: '',
          description: '',
        });
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInvSubmitting(false);
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this service from inventory?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  // Distinct client count
  const uniqueClientsCount = new Set(invoices.map((inv) => inv.clientName)).size;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* ========================================================================= */}
        {/* TOP LEVEL NAVIGATION & TAB CONTROLS (INVOICES & INVENTORY CATALOG)        */}
        {/* ========================================================================= */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Commercial Billing &amp; Inventory Hub
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage commercial client bills, institutional service deliverables, and standard inventory catalog for Shubham Leads Solutions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/billing/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Commercial Invoice</span>
              </Link>
            </div>
          </div>

          {/* Top Options Bar (Tabs) */}
          <div className="flex items-center gap-2 border-b border-slate-200 pt-1">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition cursor-pointer ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Commercial Invoices</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
                {invoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition cursor-pointer ${
                activeTab === 'inventory'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory &amp; Service Catalog</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                {inventory.length}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: COMMERCIAL INVOICES                                               */}
        {/* ========================================================================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            {/* Commercial Metrics (Clean, NO Bank/Payment Items) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Invoices Generated
                </span>
                <p className="text-2xl font-black text-slate-900">{invoices.length}</p>
                <p className="text-[10px] text-slate-400">Total commercial bills issued</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Commercial Value
                </span>
                <p className="text-2xl font-black text-blue-600">
                  ₹{Number(totalInvoicedValue).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400">Total contract billing volume</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Institutions Billed
                </span>
                <p className="text-2xl font-black text-slate-900">{uniqueClientsCount}</p>
                <p className="text-[10px] text-slate-400">Active college/partner accounts</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Catalog Services Available
                </span>
                <p className="text-2xl font-black text-purple-600">{inventory.length}</p>
                <p className="text-[10px] text-purple-600 font-medium">Ready in inventory catalog</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by invoice number, client institution name, city, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                />
              </div>
            </div>

            {/* Invoices List Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                {invoicesLoading ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    Loading commercial invoices...
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                      <ReceiptText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Invoices Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {searchTerm
                        ? 'No invoices match your search query.'
                        : 'Create your first commercial bill for a college client.'}
                    </p>
                    <Link
                      href="/billing/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Invoice</span>
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Invoice #</th>
                        <th className="py-3.5 px-4">Billed Institution / Client</th>
                        <th className="py-3.5 px-4">Invoice Date</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Service Particulars</th>
                        <th className="py-3.5 px-4">Total Amount (₹)</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => {
                        const whatsappMsg = encodeURIComponent(
                          `Hello ${inv.clientName},\n\nPlease find your commercial invoice *${inv.invoiceNumber}* for *₹${Number(inv.totalAmount).toLocaleString('en-IN')}* from Shubham Leads Solutions.\n\nInvoice Date: ${formatDate(inv.invoiceDate, 'dd MMM yyyy')}\n\nThank you for partnering with Shubham Leads Solutions.`
                        );

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                              <Link href={`/billing/${inv.id}`} className="hover:underline flex items-center gap-1">
                                <span>{inv.invoiceNumber}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 text-sm">{inv.clientName}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {inv.clientCity && <span>{inv.clientCity}</span>}
                                {inv.clientPhone && <span>&bull; {inv.clientPhone}</span>}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-slate-700">
                              {formatDate(inv.invoiceDate, 'dd MMM yyyy')}
                            </td>

                            <td className="py-3.5 px-4 text-slate-600">
                              {inv.dueDate ? formatDate(inv.dueDate, 'dd MMM yyyy') : 'Net 7 Days'}
                            </td>

                            <td className="py-3.5 px-4 text-slate-700">
                              {Array.isArray(inv.items) && inv.items.length > 0 ? (
                                <span className="font-medium text-slate-800 line-clamp-1">
                                  {inv.items[0].description}
                                  {inv.items.length > 1 ? ` (+${inv.items.length - 1} more)` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Retainer Services</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                              ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* WhatsApp Share */}
                                {inv.clientPhone && (
                                  <a
                                    href={`https://wa.me/${inv.clientPhone.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Share bill via WhatsApp"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {/* View / Print Bill */}
                                <Link
                                  href={`/billing/${inv.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition text-xs"
                                >
                                  <span>View Bill</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: INVENTORY & SERVICE CATALOG                                       */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Inventory Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Catalog Services
                </span>
                <p className="text-2xl font-black text-slate-900">{inventory.length}</p>
                <p className="text-[10px] text-slate-400">Total standard packages in catalog</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Service Categories
                </span>
                <p className="text-2xl font-black text-blue-600">
                  {new Set(inventory.map((i) => i.category)).size}
                </p>
                <p className="text-[10px] text-slate-400">Retainers, Leads, Campaigns &amp; Outbound</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Standard Retainer Tier
                </span>
                <p className="text-2xl font-black text-emerald-600">₹50,000</p>
                <p className="text-[10px] text-emerald-600 font-medium">Standard monthly benchmark</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Billing Integration
                </span>
                <p className="text-2xl font-black text-indigo-600">1-Click</p>
                <p className="text-[10px] text-indigo-600 font-medium">Auto-fill invoice items</p>
              </div>
            </div>

            {/* Action & Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search inventory by item code, service name, or scope..."
                  value={invSearchTerm}
                  onChange={(e) => setInvSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              <button
                onClick={() => setShowAddInventoryModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item to Inventory</span>
              </button>
            </div>

            {/* Inventory Items Catalog Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                {inventoryLoading ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    Loading inventory catalog...
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Inventory Catalog Empty</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Add your standard higher education service packages and deliverables to the inventory catalog.
                    </p>
                    <button
                      onClick={() => setShowAddInventoryModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Service</span>
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Item Code</th>
                        <th className="py-3.5 px-4">Service / Package Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Billing Unit</th>
                        <th className="py-3.5 px-4">Standard Rate (₹)</th>
                        <th className="py-3.5 px-4">Scope &amp; Deliverables</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                              {item.itemCode}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {item.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            {item.unit}
                          </td>

                          <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                            ₹{Number(item.rate).toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                            <p className="line-clamp-2 text-[11px]">{item.description || 'Deliverables as per agreement.'}</p>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick 1-click create invoice using this inventory item */}
                              <Link
                                href={`/billing/new?itemName=${encodeURIComponent(item.name)}&itemRate=${item.rate}`}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                              >
                                <span>Create Bill</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>

                              <button
                                onClick={() => handleDeleteInventoryItem(item.id)}
                                title="Remove service"
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Item to Inventory */}
        {showAddInventoryModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Add Service to Inventory</h3>
                    <p className="text-[11px] text-slate-500">Standardize pricing and deliverables for rapid invoicing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateInventoryItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service / Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Higher Education Monthly Retainer"
                    value={newInvItem.name}
                    onChange={(e) => setNewInvItem({ ...newInvItem, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={newInvItem.category}
                      onChange={(e) => setNewInvItem({ ...newInvItem, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Retainer Partnership">Retainer Partnership</option>
                      <option value="Lead Acquisition">Lead Acquisition</option>
                      <option value="B2B Outbound">B2B Outbound</option>
                      <option value="Campaign Setup">Campaign Setup</option>
                      <option value="Consultation">Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Billing Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. Per Month, Per 1000 Leads"
                      value={newInvItem.unit}
                      onChange={(e) => setNewInvItem({ ...newInvItem, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Standard Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="e.g. 50000"
                    value={newInvItem.rate}
                    onChange={(e) => setNewInvItem({ ...newInvItem, rate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scope of Deliverables &amp; Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify the service deliverables, lead volumes, or engagement terms..."
                    value={newInvItem.description}
                    onChange={(e) => setNewInvItem({ ...newInvItem, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={invSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {invSubmitting ? 'Adding...' : 'Save to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
