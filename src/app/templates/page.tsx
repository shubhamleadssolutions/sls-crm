'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  MessageSquare,
  Copy,
  Check,
  Plus,
  Send,
  Mail,
  Linkedin,
  X,
} from 'lucide-react';
import { CHANNEL_LABELS } from '@/lib/utils';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', channel: 'WHATSAPP', category: 'Outreach', content: '' });

  const fetchTemplates = () => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowAddModal(false);
      setForm({ title: '', channel: 'WHATSAPP', category: 'Outreach', content: '' });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Communication Templates
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Standard outreach messages for WhatsApp, Email, and LinkedIn with 1-click clipboard copy.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <span className="font-extrabold text-sm text-slate-900">{tpl.title}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {CHANNEL_LABELS[tpl.channel] || tpl.channel}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-medium">
                  {tpl.content}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Category: <strong className="text-slate-600">{tpl.category || 'Outreach'}</strong>
                </span>
                <button
                  onClick={() => handleCopy(tpl.id, tpl.content)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Template */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0" onClick={() => setShowAddModal(false)} aria-hidden="true" />
            <form onSubmit={handleCreate} className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base font-bold text-slate-900">Add Communication Template</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WhatsApp Intro for EdTech Institutes"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Channel</label>
                    <select
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="PHONE_CALL">Phone Call</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Follow-up"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Message text. Use {{contact_name}} and {{company_name}} for dynamic replacements..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
