'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Kanban,
  Upload,
  MessageSquare,
  LogOut,
  Menu,
  X,
  PlusCircle,
  UserCog,
  ChevronRight,
  Briefcase,
  FileText,
  ReceiptText,
  Calendar,
  Megaphone,
  GraduationCap,
  BarChart3,
  ChevronDown,
  User as UserIcon,
  Shield,
  Mail,
  Phone,
  CheckCircle2,
  Trophy,
  Video,
  MessagesSquare,
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  phone?: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userProgress, setUserProgress] = useState<{
    rank: number;
    totalTeam: number;
    wonCount: number;
    winRate: number;
    activeDeals: number;
    activitiesCount: number;
    badge: string;
  } | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showProfileModal && !userProgress) {
      fetch('/api/user/progress')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.progress) {
            setUserProgress(data.progress);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [showProfileModal, userProgress]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/login';
  };

  const navSections = [
    {
      title: 'Prospect & Sales Funnel',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'All Prospects', href: '/prospects', icon: Users },
        { label: 'Pipeline Kanban', href: '/pipeline', icon: Kanban },
        { label: 'Bulk Import (.csv)', href: '/prospects/import', icon: Upload },
        { label: 'Follow-up Tracker', href: '/follow-ups', icon: CalendarClock },
        { label: 'Meetings', href: '/meetings', icon: Video },
        { label: 'Proposals', href: '/proposals', icon: FileText },
        { label: 'Invoices & Billing', href: '/billing', icon: ReceiptText },
        { label: 'Active Clients', href: '/clients', icon: Briefcase },
      ],
    },
    {
      title: 'Collaboration & Outreach',
      items: [
        { label: 'Team Chat', href: '/chat', icon: MessagesSquare },
        { label: 'Ad Campaigns', href: '/campaigns', icon: Megaphone },
        { label: 'Student Leads', href: '/student-leads', icon: GraduationCap },
      ],
    },
    {
      title: 'Analytics & Tools',
      items: [
        { label: 'Business Reports', href: '/reports', icon: BarChart3 },
        { label: 'Outreach Templates', href: '/templates', icon: MessageSquare },
      ],
    },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-48 h-18">
            <Image
              src="/sls-logo-full.png"
              alt="Shubham Leads Solutions"
              fill
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {loading ? 'Loading SLS CRM...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  const isExecutive = user.role === 'ADMIN' || user.role === 'CEO';
  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AK';

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden">
      {/* Sidebar - Desktop (Fixed Height, Independent scroll, Sidebar stays locked on scroll) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 h-screen bg-white border-r border-slate-200/90 shrink-0 shadow-xs z-30">
        {/* Brand Header with Logo - Logo only */}
        <div className="py-4 px-4 border-b border-slate-100 flex items-center justify-center shrink-0">
          <div className="relative w-full h-16">
            <Image
              src="/sls-logo-full.png"
              alt="Shubham Leads Solutions"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Navigation Sections (Scrolls internally if viewport is small, never scrolls page) */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === '/prospects' &&
                    pathname.startsWith('/prospects') &&
                    !pathname.includes('import') &&
                    !pathname.includes('new'));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Admin User Management in Sidebar */}
          {isExecutive && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administration
              </p>
              <Link
                href="/settings/users"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  pathname.startsWith('/settings/users')
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCog className="w-4 h-4 text-blue-600" />
                  <span>User Management</span>
                </div>
                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                  {user.role}
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Footer with quick profile indicator */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                {userInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.designation || user.role}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container - Full height with independent smooth scrolling on right side */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200/80 shrink-0 z-20 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Logo Branding */}
            <div className="lg:hidden flex items-center">
              <div className="relative w-28 h-10">
                <Image
                  src="/sls-logo-full.png"
                  alt="Shubham Leads Solutions"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>

            {/* Desktop Current Location Title */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Shubham Leads Solutions
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-800">
                {pathname === '/'
                  ? 'Dashboard'
                  : pathname.startsWith('/prospects')
                  ? 'Prospects & Sales Pipeline'
                  : pathname.startsWith('/follow-ups')
                  ? 'Follow-up Tracker'
                  : pathname.startsWith('/meetings')
                  ? 'Meetings'
                  : pathname.startsWith('/chat')
                  ? 'Team Chat'
                  : pathname.startsWith('/proposals')
                  ? 'Proposals'
                  : pathname.startsWith('/clients')
                  ? 'Active Clients'
                  : pathname.startsWith('/campaigns')
                  ? 'Ad Campaigns'
                  : pathname.startsWith('/student-leads')
                  ? 'Student Leads'
                  : pathname.startsWith('/reports')
                  ? 'Business Reports'
                  : pathname.startsWith('/templates')
                  ? 'Outreach Templates'
                  : pathname.startsWith('/settings/users')
                  ? 'User Management'
                  : 'CRM Portal'}
              </span>
            </div>
          </div>

          {/* Right Header: Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Profile Dropdown Component */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-2.5 sm:py-1 rounded-2xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-blue-600 font-semibold truncate leading-tight">
                    {user.role}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header Card */}
                  <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100/70 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        {userInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">@{user.username}</p>
                        <span className="inline-block text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-md mt-1">
                          {user.designation || user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition cursor-pointer text-left"
                    >
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      <span>My Profile</span>
                    </button>

                    {isExecutive && (
                      <Link
                        href="/settings/users"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                      >
                        <UserCog className="w-4 h-4 text-indigo-600" />
                        <span>Manage Users</span>
                      </Link>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-3 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[10px] text-slate-500">{user.designation || user.role}</p>
              </div>
            </div>

            <nav className="space-y-4">
              {navSections.map((sec) => (
                <div key={sec.title} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </p>
                  {sec.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <item.icon className="w-4 h-4 text-slate-500" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Right Main Content Area - Independent Smooth Scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* My Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">User Profile</h3>
                  <p className="text-[11px] text-slate-500">Authorized CRM account credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                {userInitials}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">{user.name}</h4>
                <p className="text-xs text-blue-600 font-semibold">{user.designation || 'Executive'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Role: {user.role}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Field Details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Username</span>
                <span className="font-mono font-bold text-slate-900">@{user.username}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Email Address</span>
                <span className="font-semibold text-slate-900">{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Contact Phone</span>
                  <span className="font-semibold text-slate-900">{user.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Access Level</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  {isExecutive ? 'Full Executive Administrator' : user.role}
                </span>
              </div>
            </div>

            {/* Individual Employee Performance & Progress (visible only here in Profile) */}
            {userProgress && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-bold text-white">My CRM Progress</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {userProgress.badge}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                      Rank #{userProgress.rank}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Deals Won</p>
                    <p className="text-lg font-black text-emerald-400">{userProgress.wonCount}</p>
                    <p className="text-[9px] text-slate-400">Closed clients</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Win Rate</p>
                    <p className="text-lg font-black text-sky-400">{userProgress.winRate}%</p>
                    <p className="text-[9px] text-slate-400">Conversion</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Active Deals</p>
                    <p className="text-lg font-black text-blue-400">{userProgress.activeDeals}</p>
                    <p className="text-[9px] text-slate-400">In negotiation</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Actions</p>
                    <p className="text-lg font-black text-purple-400">{userProgress.activitiesCount}</p>
                    <p className="text-[9px] text-slate-400">Outreach &amp; touchpoints</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Sign Out of SLS CRM?</h3>
                <p className="text-[11px] text-slate-500">Confirm session termination</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to sign out, <strong className="text-slate-900">{user.name}</strong>? You will need your credentials to sign in again.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs shadow-rose-500/20 cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
