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
  Phone,
  CheckCircle2,
  Trophy,
  Video,
  MessagesSquare,
  Clock,
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

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

  const isExecutive = user ? (user.role === 'ADMIN' || user.role === 'CEO') : false;
  const canManageUsers = user ? (user.role === 'ADMIN' || user.role === 'CEO' || user.role === 'IT_ADMIN') : false;

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
        ...(isExecutive ? [{ label: 'Invoices & Billing', href: '/billing', icon: ReceiptText }] : []),
        { label: 'Active Clients', href: '/clients', icon: Briefcase },
      ],
    },
    {
      title: 'Collaboration & Outreach',
      items: [
        { label: 'Attendance', href: '/attendance', icon: Clock },
        { label: 'Team Chat', href: '/chat', icon: MessagesSquare },
        { label: 'Ad Campaigns', href: '/campaigns', icon: Megaphone },
        { label: 'Student Leads', href: '/student-leads', icon: GraduationCap },
      ],
    },
    {
      title: 'Analytics & Tools',
      items: [
        ...(isExecutive ? [{ label: 'Business Reports', href: '/reports', icon: BarChart3 }] : []),
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

          {/* User Management in Sidebar (CEO, MD, IT Manager) */}
          {canManageUsers && (
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
            <Link
              href="/profile"
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition cursor-pointer"
              title="View & Edit My Profile"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                {userInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.designation || user.role}</p>
              </div>
            </Link>
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
                  : pathname.startsWith('/attendance')
                  ? 'Attendance & Workforce'
                  : pathname.startsWith('/profile')
                  ? 'My Executive Profile'
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
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-3 z-50 animate-scale-in">
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
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition cursor-pointer text-left"
                    >
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      <span>My Profile</span>
                    </Link>

                    {canManageUsers && (
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

        {/* Right Main Content Area - Independent Smooth Scroll with mobile bottom padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8 max-w-7xl mx-auto w-full animate-fade-in min-w-0">
          {children}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE FULL SLIDING DRAWER (100% Identical Feature Parity to Desktop)     */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sliding Drawer Container */}
          <aside className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col z-50 animate-drawer-right">
            {/* Drawer Header: Logo + Close Button */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="relative w-36 h-12">
                <Image
                  src="/sls-logo-full.png"
                  alt="Shubham Leads Solutions"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Summary Card */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 truncate leading-tight">{user.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">@{user.username}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Navigation Sections */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
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
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-500'
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

              {/* Administration - Full parity with desktop sidebar (CEO, MD, IT Manager) */}
              {canManageUsers && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Administration
                  </p>
                  <Link
                    href="/settings/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      pathname.startsWith('/settings/users')
                        ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
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

            {/* Drawer Footer: Sign Out Button */}
            <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Instant 1-Touch Access on All Phones)         */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            pathname === '/' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Prospects */}
        <Link
          href="/prospects"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            pathname.startsWith('/prospects') && !pathname.includes('import') && !pathname.includes('new')
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Prospects</span>
        </Link>

        {/* Pipeline Kanban */}
        <Link
          href="/pipeline"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            pathname.startsWith('/pipeline') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Kanban className="w-4 h-4" />
          <span className="text-[10px]">Pipeline</span>
        </Link>

        {/* Team Chat */}
        <Link
          href="/chat"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            pathname.startsWith('/chat') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessagesSquare className="w-4 h-4" />
          <span className="text-[10px]">Chat</span>
        </Link>

        {/* More Menu (Toggles full drawer) */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
            mobileMenuOpen ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="my-auto max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-scale-in">
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
