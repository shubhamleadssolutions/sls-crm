'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Info,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Download,
  Building2,
  Table,
} from 'lucide-react';

export default function BulkImportPage() {
  const router = useRouter();

  // Step 1: Upload, Step 2: Preview & Duplicate Check, Step 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileData, setFileData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [previewResults, setPreviewResults] = useState<any>(null);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'force'>('skip');
  const [loading, setLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  const handleCopyHeaders = () => {
    const headersText = 'Company Name\tContact Person\tDesignation\tPhone\tWhatsApp Number\tEmail\tWebsite\tCity\tState\tIndustry\tLead Source\tNotes';
    navigator.clipboard.writeText(headersText);
    setCopiedHeaders(true);
    setTimeout(() => setCopiedHeaders(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          setError('The uploaded sheet contains no data rows.');
          return;
        }

        setFileData(jsonData);
      } catch (err: any) {
        setError('Error reading file. Please upload a valid CSV or Excel (.xlsx) file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handlePreviewAndDuplicateCheck = async () => {
    if (fileData.length === 0) {
      setError('Please select your CSV or Excel file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/prospects/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          records: fileData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect records');
      }

      setPreviewResults(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Duplicate detection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/prospects/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          records: previewResults.items,
          duplicateAction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportSummary(data);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Import execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'companyName,contactPerson,designation,phone,whatsappNumber,email,website,city,state,industry,leadSource,potentialRequirement,notes\n' +
      'Symbiosis Institute of Technology,Dr. Rajesh Sharma,Director - Admissions,+919822011223,+919822011223,admissions@sitpune.edu.in,https://www.sitpune.edu.in,Pune,Maharashtra,Higher Education,GOOGLE_MAPS,B.Tech & M.Tech Admissions,Interested in targeted student lead campaigns\n' +
      'Amity Global Business School,Prof. Neha Verma,Dean of Admissions,+919811099887,+919811099887,admissions@agbs.amity.edu,https://www.amity.edu,Noida,Uttar Pradesh,Management Education,LINKEDIN,MBA & BBA Lead Acquisition,Targeting North India student inquiries\n' +
      'MIT World Peace University,Mr. Vikram Joshi,Head of Outreach,+919922033445,+919922033445,outreach@mitwpu.edu.in,https://www.mitwpu.edu.in,Pune,Maharashtra,Engineering & Tech,REFERRAL,Student Counseling & Walk-ins,Follow up scheduled for institutional meeting\n' +
      'DY Patil International University,Dr. Sunita Kulkarni,Dean - Academic Alliances,+919890123456,+919890123456,alliances@dypiu.ac.in,https://www.dypiu.ac.in,Pune,Maharashtra,Higher Education,WEBSITE,Comprehensive Retainer Campaign,Looking for 300+ confirmed admissions\n' +
      'Indira Institute of Management,Mr. Sandeep Patil,Admissions Incharge,+919850567890,+919850567890,admissions@indiraiimp.edu.in,https://www.indiraedu.com,Pune,Maharashtra,Management Education,WHATSAPP,MBA Admissions 2026-27,Wants digital outreach and student counseling support\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'SLS_Prospects_Bulk_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplate = () => {
    const sample = [
      {
        'Company Name': 'Symbiosis Institute of Technology',
        'Contact Person': 'Dr. Rajesh Sharma',
        'Designation': 'Director - Admissions',
        'Phone': '+919822011223',
        'WhatsApp Number': '+919822011223',
        'Email': 'admissions@sitpune.edu.in',
        'Website': 'https://www.sitpune.edu.in',
        'City': 'Pune',
        'State': 'Maharashtra',
        'Industry': 'Higher Education',
        'Lead Source': 'Google Maps',
        'Notes': 'Interested in targeted student lead campaigns',
      },
      {
        'Company Name': 'Amity Global Business School',
        'Contact Person': 'Prof. Neha Verma',
        'Designation': 'Dean of Admissions',
        'Phone': '+919811099887',
        'WhatsApp Number': '+919811099887',
        'Email': 'admissions@agbs.amity.edu',
        'Website': 'https://www.amity.edu',
        'City': 'Noida',
        'State': 'Uttar Pradesh',
        'Industry': 'Management Education',
        'Lead Source': 'LinkedIn',
        'Notes': 'Targeting North India student inquiries',
      },
      {
        'Company Name': 'MIT World Peace University',
        'Contact Person': 'Mr. Vikram Joshi',
        'Designation': 'Head of Outreach',
        'Phone': '+919922033445',
        'WhatsApp Number': '+919922033445',
        'Email': 'outreach@mitwpu.edu.in',
        'Website': 'https://www.mitwpu.edu.in',
        'City': 'Pune',
        'State': 'Maharashtra',
        'Industry': 'Engineering & Tech',
        'Lead Source': 'Referral',
        'Notes': 'Follow up scheduled for institutional demo',
      },
      {
        'Company Name': 'DY Patil International University',
        'Contact Person': 'Dr. Sunita Kulkarni',
        'Designation': 'Dean - Academic Alliances',
        'Phone': '+919890123456',
        'WhatsApp Number': '+919890123456',
        'Email': 'alliances@dypiu.ac.in',
        'Website': 'https://www.dypiu.ac.in',
        'City': 'Pune',
        'State': 'Maharashtra',
        'Industry': 'Higher Education',
        'Lead Source': 'Website',
        'Notes': 'Looking for 300+ confirmed admissions',
      },
      {
        'Company Name': 'Indira Institute of Management',
        'Contact Person': 'Mr. Sandeep Patil',
        'Designation': 'Admissions Incharge',
        'Phone': '+919850567890',
        'WhatsApp Number': '+919850567890',
        'Email': 'admissions@indiraiimp.edu.in',
        'Website': 'https://www.indiraedu.com',
        'City': 'Pune',
        'State': 'Maharashtra',
        'Industry': 'Management Education',
        'Lead Source': 'WhatsApp',
        'Notes': 'Wants digital outreach and student counseling support',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects_Template');
    XLSX.writeFile(workbook, 'SLS_Bulk_Import_Template.xlsx');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/prospects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Prospects
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSampleCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Download CSV Template (.csv)
            </button>
            <button
              onClick={handleDownloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              Download Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Wizard Progress Steps */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-500'}`}>
                1
              </div>
              <span>Upload Sheet</span>
            </div>
            <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-500'}`}>
                2
              </div>
              <span>Duplicate Check</span>
            </div>
            <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-500'}`}>
                3
              </div>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
            <div className="text-center max-w-md mx-auto space-y-2">
              <h1 className="text-xl font-black text-slate-900">Bulk Import Client Prospects</h1>
              <p className="text-xs text-slate-500">
                Upload your CSV or Excel (.xlsx) file containing client prospects. Columns automatically map to CRM fields.
              </p>
            </div>

            {/* Attractive SLS Official Template Showcase Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-5 border border-indigo-900/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold tracking-wide uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
                    Official SLS Prospect Format v2.0
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Standard Higher Education &amp; B2B Import Template
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Pre-configured with all CRM fields, auto-duplicate detection rules, and verified sample rows (Symbiosis, Amity, MIT WPU, DY Patil).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer transition transform hover:-translate-y-0.5"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSampleTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/20 cursor-pointer transition transform hover:-translate-y-0.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download Excel (.xlsx)
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyHeaders}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition cursor-pointer backdrop-blur-xs"
                    title="Copy standard headers to paste in Google Sheets"
                  >
                    {copiedHeaders ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Headers Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-300" />
                        <span>Copy Headers</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Live Interactive Sample Table Preview */}
              <div className="bg-slate-950/60 rounded-2xl border border-white/10 p-3 sm:p-4 backdrop-blur-md space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                    <Table className="w-3.5 h-3.5 text-blue-400" />
                    Template Live Preview (Pre-filled Sample Institutions)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Scroll horizontally to view all columns &rarr;</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/80">
                  <table className="w-full text-left text-[11px] text-slate-300 whitespace-nowrap">
                    <thead className="bg-white/5 uppercase text-[9px] font-black tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">Company / Institution <span className="text-rose-400 font-bold">*</span></th>
                        <th className="py-2.5 px-3">Contact Person <span className="text-rose-400 font-bold">*</span></th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Phone <span className="text-rose-400 font-bold">*</span></th>
                        <th className="py-2.5 px-3">WhatsApp</th>
                        <th className="py-2.5 px-3">City, State</th>
                        <th className="py-2.5 px-3">Industry</th>
                        <th className="py-2.5 px-3">Lead Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      <tr className="hover:bg-white/5 transition">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                          Symbiosis Inst. of Tech.
                        </td>
                        <td className="py-2 px-3 text-slate-200">Dr. Rajesh Sharma</td>
                        <td className="py-2 px-3 text-slate-400">Director - Admissions</td>
                        <td className="py-2 px-3 font-mono text-emerald-300">+91 98220 11223</td>
                        <td className="py-2 px-3 font-mono text-emerald-400">+91 98220 11223</td>
                        <td className="py-2 px-3">Pune, Maharashtra</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                            Higher Education
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-semibold">Google Maps</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                          Amity Global Business School
                        </td>
                        <td className="py-2 px-3 text-slate-200">Prof. Neha Verma</td>
                        <td className="py-2 px-3 text-slate-400">Dean of Admissions</td>
                        <td className="py-2 px-3 font-mono text-emerald-300">+91 98110 99887</td>
                        <td className="py-2 px-3 font-mono text-emerald-400">+91 98110 99887</td>
                        <td className="py-2 px-3">Noida, Uttar Pradesh</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                            Management Edu
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-semibold">LinkedIn</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                          MIT World Peace University
                        </td>
                        <td className="py-2 px-3 text-slate-200">Mr. Vikram Joshi</td>
                        <td className="py-2 px-3 text-slate-400">Head of Outreach</td>
                        <td className="py-2 px-3 font-mono text-emerald-300">+91 99220 33445</td>
                        <td className="py-2 px-3 font-mono text-emerald-400">+91 99220 33445</td>
                        <td className="py-2 px-3">Pune, Maharashtra</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            Engineering &amp; Tech
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-semibold">Referral</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          DY Patil Int. University
                        </td>
                        <td className="py-2 px-3 text-slate-200">Dr. Sunita Kulkarni</td>
                        <td className="py-2 px-3 text-slate-400">Dean - Alliances</td>
                        <td className="py-2 px-3 font-mono text-emerald-300">+91 98901 23456</td>
                        <td className="py-2 px-3 font-mono text-emerald-400">+91 98901 23456</td>
                        <td className="py-2 px-3">Pune, Maharashtra</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                            Higher Education
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-semibold">Website</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Column Guidelines & Rules Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                      <strong className="text-slate-300">Mandatory:</strong> Company Name, Contact Person, Phone
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      <strong className="text-slate-300">Auto-Deduplicated:</strong> Phone, WhatsApp, Website
                    </span>
                  </div>
                  <span className="text-slate-400 italic">
                    Accepts both Title Case (&quot;Company Name&quot;) and camelCase (&quot;companyName&quot;) headers.
                  </span>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-3xl p-10 text-center transition bg-slate-50/60">
              <input
                type="file"
                id="file-upload"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {fileName ? fileName : 'Click to select CSV or Excel (.xlsx) file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Google Sheets exported as .xlsx or .csv
                  </p>
                </div>
              </label>
            </div>

            {fileData.length > 0 && (
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-blue-900">
                    {fileData.length} records parsed from {fileName}
                  </p>
                  <p className="text-[11px] text-blue-700">Ready to run automatic field mapping and duplicate scan.</p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePreviewAndDuplicateCheck}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Next: Duplicate Check'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview & Duplicate Resolution */}
        {step === 2 && previewResults && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Duplicate Detection & Preview</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {previewResults.total} records parsed. {previewResults.duplicateCount} duplicate match(es) identified.
                </p>
              </div>

              {/* Duplicate Action Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Duplicate Rule:</span>
                <select
                  value={duplicateAction}
                  onChange={(e: any) => setDuplicateAction(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="skip">Skip (Do not import duplicates)</option>
                  <option value="update">Update Existing Records</option>
                  <option value="force">Import Anyway (Keep duplicate)</option>
                </select>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3">Contact Person</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewResults.items.map((item: any, idx: number) => (
                    <tr key={idx} className={item.isDuplicate ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3">
                        {item.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Duplicate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            New
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.parsed.companyName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.parsed.contactPerson || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.parsed.phone || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.parsed.city || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.parsed.leadSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteImport}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {loading ? 'Importing Records...' : `Confirm & Import ${previewResults.total} Records`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Result */}
        {step === 3 && importSummary && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs text-center space-y-6">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Bulk Import Complete!</h2>
              <p className="text-xs text-slate-500">Your prospect records have been successfully added to the database.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xl font-extrabold text-emerald-600">{importSummary.createdCount}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Created</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xl font-extrabold text-blue-600">{importSummary.updatedCount}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Updated</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xl font-extrabold text-slate-600">{importSummary.skippedCount}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Skipped</p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Link
                href="/prospects"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                View Prospects Directory
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
