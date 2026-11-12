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
      'MIT World Peace University,Mr. Vikram Joshi,Head of Outreach,+919922033445,+919922033445,outreach@mitwpu.edu.in,https://www.mitwpu.edu.in,Pune,Maharashtra,Engineering & Tech,REFERRAL,Student Counseling & Walk-ins,Follow up scheduled for institutional meeting\n';

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
        'Notes': 'Interested in targeted student admissions campaign',
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
        'Notes': 'MBA admissions lead acquisition 2026',
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

            {/* Educational Card on How Sync Works */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 rounded-2xl border border-blue-100 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wide">
                  How Client Data Syncs &amp; Why Bulk Import Saves Time
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instead of adding prospects one-by-one manually, download the <strong>SLS CSV Template</strong> below, copy-paste your prospect list from Google Sheets or Excel, and upload here. The CRM automatically detects duplicates (by phone, email, and website), assigns unique codes (e.g. <code className="font-mono font-bold text-blue-700">SLS-2026-0045</code>), and uploads hundreds of prospects to Supabase PostgreSQL in a single click.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs cursor-pointer transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download CSV Template (.csv)
                </button>
                <a
                  href="/templates/SLS_Prospects_Bulk_Import_Template.csv"
                  download="SLS_Prospects_Bulk_Import_Template.csv"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Direct CSV File Link &rarr;
                </a>
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
