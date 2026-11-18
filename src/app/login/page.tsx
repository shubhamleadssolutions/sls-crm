'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50/40 text-slate-900">
      {/* Left Column: Visual Showcase, Growth Graphs & Brand Narrative */}
      <div className="hidden lg:flex lg:w-7/12 xl:w-3/5 p-12 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white">
        {/* Background Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Brand Tagline Badge */}
        <div className="relative z-10 flex items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Enterprise Client Acquisition Engine</span>
          </div>
        </div>

        {/* Central Graphic: Growth Graphs & Real-time Metrics Card */}
        <div className="relative z-10 my-8 space-y-6 max-w-xl">
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
              Scale Your Admissions & Sales Pipeline with Total Clarity.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Centralized prospect discovery, outreach timeline tracking, and client conversions built exclusively for Shubham Leads Solutions.
            </p>
          </div>

          {/* Interactive Visual Card: Live Growth Graph Simulation */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Outreach & Conversion Performance</p>
                  <p className="text-[11px] text-blue-300">Targeted Student & Client Acquisition</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-500/30">
                <TrendingUp className="w-3.5 h-3.5" /> +42.8%
              </span>
            </div>

            {/* SVG Growth Chart */}
            <div className="relative pt-2">
              <svg className="w-full h-32 overflow-visible" viewBox="0 0 400 120" fill="none">
                <defs>
                  <linearGradient id="gradientTrend" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 10 100 Q 100 90, 180 65 T 350 25 L 350 115 L 10 115 Z"
                  fill="url(#gradientTrend)"
                />
                <path
                  d="M 10 100 Q 100 90, 180 65 T 350 25"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="100" r="4.5" fill="#38bdf8" />
                <circle cx="100" cy="92" r="4.5" fill="#38bdf8" />
                <circle cx="180" cy="65" r="4.5" fill="#38bdf8" />
                <circle cx="270" cy="42" r="4.5" fill="#38bdf8" />
                <circle cx="350" cy="25" r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-white/5">
                <span>Discovery</span>
                <span>Outreach</span>
                <span>Follow-up</span>
                <span>Meeting</span>
                <span className="text-sky-300 font-bold">Proposal Won</span>
              </div>
            </div>

            {/* Key Value Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Prospect Pipeline</p>
                <p className="text-lg font-black text-white mt-0.5">100%</p>
                <p className="text-[10px] text-blue-300">Centralized</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Follow-up Rate</p>
                <p className="text-lg font-black text-white mt-0.5">Zero Loss</p>
                <p className="text-[10px] text-emerald-300">Agenda tracked</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Retention</p>
                <p className="text-lg font-black text-white mt-0.5">Automated</p>
                <p className="text-[10px] text-indigo-300">Lifecycle sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Features */}
        <div className="relative z-10 grid grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Eliminates multiple Google Sheets</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Integrated WhatsApp Outreach</span>
          </div>
        </div>
      </div>

      {/* Right Column: Clean, Attractive Executive Login Card */}
      <div className="w-full lg:w-5/12 xl:w-2/5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 sm:p-10 space-y-6 relative animate-scale-in">
          {/* Logo inserted right above Sign In heading */}
          <div className="flex flex-col items-start space-y-3">
            <div className="relative w-48 h-20">
              <Image
                src="/sls-logo-full.png"
                alt="Shubham Leads Solutions Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>

            {/* Form Title & Subtitle */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sign In
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your authorized credentials to access your CRM workspace.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/^@+/, ''))}
                  placeholder="Enter your username"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 lowercase placeholder:normal-case placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl shadow-md shadow-blue-500/25 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition active:scale-[0.99] cursor-pointer mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to SLS CRM'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Assurance */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Authorized Enterprise Access &bull; Role-Based Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
