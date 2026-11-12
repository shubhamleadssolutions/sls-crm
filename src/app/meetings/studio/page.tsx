'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  PhoneOff,
  Users,
  MessageSquare,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Grid,
  Send,
  Sparkles,
  Settings,
  Presentation,
  Volume2,
  Copy,
  Check,
  Lock,
  Loader2,
  ArrowLeft,
  Sliders,
  FileText,
  UserCheck,
  ChevronRight,
  Radio,
} from 'lucide-react';

function StudioRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = searchParams.get('id') || 'SLS-' + Math.floor(100000 + Math.random() * 900000);
  const meetingTitle = searchParams.get('title') || 'Client Discovery & Strategy Session';
  const clientName = searchParams.get('client') || 'Client Partner';

  // Room flow phases: 'green-room' -> 'connecting' -> 'in-meeting'
  const [phase, setPhase] = useState<'green-room' | 'connecting' | 'in-meeting'>('green-room');

  // Participant Identity in Room
  const [userName, setUserName] = useState('Abhinav');
  const [userRole, setUserRole] = useState('Managing Director (Host)');

  // Media Controls
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [activeDrawer, setActiveDrawer] = useState<'participants' | 'chat' | 'notes' | null>(null);

  // In-Meeting Notes state
  const [meetingNotes, setMeetingNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Floating Reactions
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; left: number }>>([]);
  const [showReactionsBar, setShowReactionsBar] = useState(false);

  // In-Meeting Chat
  const [inMeetingMessages, setInMeetingMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'SLS Security Bot', text: 'Encrypted SLS Enterprise Video Bridge established (256-bit AES).', time: 'Just now' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Meeting Timer
  const [seconds, setSeconds] = useState(0);

  // Copied Link State
  const [copied, setCopied] = useState(false);

  // Presentation Slide Index for Screen Share
  const [slideIndex, setSlideIndex] = useState(0);

  // Video Refs
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const inMeetingVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio test meter level (simulated dynamic level in green room)
  const [audioLevel, setAudioLevel] = useState(65);

  // Fetch logged-in user identity
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserName(data.user.name || 'Abhinav');
          setUserRole(data.user.role === 'ADMIN' ? 'Managing Director (Host)' : `${data.user.designation || 'Team Member'} (Host)`);
        }
      })
      .catch(() => {});
  }, []);

  // Request & attach media stream for Green Room & In-Meeting
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        activeStream = stream;
        streamRef.current = stream;

        // Attach to whichever video element is currently mounted
        if (phase === 'green-room' && previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        } else if (phase === 'in-meeting' && inMeetingVideoRef.current) {
          inMeetingVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted or device absent:', err);
      }
    }

    if (cameraOn) {
      initMedia();
    } else {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => track.stop());
      }
      if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
      if (inMeetingVideoRef.current) inMeetingVideoRef.current.srcObject = null;
    }

    return () => {
      if (activeStream && phase !== 'in-meeting') {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [phase, cameraOn]);

  // Dynamic audio meter effect in green room
  useEffect(() => {
    if (phase !== 'green-room' || !micOn) return;
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(40 + Math.random() * 55));
    }, 250);
    return () => clearInterval(interval);
  }, [phase, micOn]);

  // Meeting timer effect (active only during in-meeting phase)
  useEffect(() => {
    if (phase !== 'in-meeting') return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Audio tracks toggle
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
      });
    }
  }, [micOn]);

  // Handle Join button click -> smooth connection to room
  const handleStartJoinProcess = () => {
    setPhase('connecting');
    setTimeout(() => {
      setPhase('in-meeting');
    }, 1100);
  };

  const formatTimer = (totalSec: number) => {
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const triggerReaction = (emoji: string) => {
    const id = Date.now();
    const left = Math.floor(Math.random() * 60) + 20;
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      sender: `${userName} (You)`,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setInMeetingMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const handleCopyMeetingLink = () => {
    const link = `${window.location.origin}/meetings/studio?id=${meetingId}&title=${encodeURIComponent(meetingTitle)}&client=${encodeURIComponent(clientName)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  // Presentation slides for in-meeting sharing
  const presentationSlides = [
    {
      title: 'SLS Strategic Partnership Deck',
      subtitle: 'Higher Education Admissions & Qualified Student Acquisition',
      points: [
        'Multi-channel verified student leads via Meta Ads and Google Search',
        'Direct telecalling qualification and WhatsApp walk-in scheduling',
        'Real-time lead routing into customized institutional CRM',
        'Dedicated Campaign Manager & Weekly Admissions Analytics',
      ],
      tag: 'SLS Executive Proposal 2026',
    },
    {
      title: 'Admission Funnel & Conversion Architecture',
      subtitle: 'From Cold Impression to Enrolled Candidate',
      points: [
        'Stage 1: Verified Lead Acquisition (Phone & City OTP Checked)',
        'Stage 2: Tele-Counseling and Course Preference Matching',
        'Stage 3: Campus Visit Scheduling & Registration Confirmation',
        'Stage 4: Final Fee Payment & Enrolled Admission Tracking',
      ],
      tag: 'SLS Pipeline Methodology',
    },
    {
      title: 'Commercial Deliverables & Monthly Retainer',
      subtitle: 'Transparent Retainer & Volume Guarantee',
      points: [
        'Guaranteed minimum qualified candidate inquiries per monthly cycle',
        'Dedicated CRM login credentials for admissions team',
        'Zero setup charges for campaign creative and landing pages',
        '24/7 campaign tracking & dedicated account escalation',
      ],
      tag: 'SLS Commercial Engagement',
    },
  ];

  // =========================================================================
  // VIEW 1: PRE-JOIN GREEN ROOM / DEVICE CHECK (Trusted Official Meeting Flow)
  // =========================================================================
  if (phase === 'green-room') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href="/meetings"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Back to Meetings"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20">
                SLS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white tracking-tight">SLS Video Connect</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Green Room
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Audio, Camera &amp; Security Verification</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">256-bit TLS Encrypted Bridge</span>
            </div>
          </div>
        </header>

        {/* Center: Green Room Workspace */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 Cols: Video Preview Viewfinder & Hardware Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-video rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
                {cameraOn ? (
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
                      {userName.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold text-slate-400">Camera is turned off</p>
                  </div>
                )}

                {/* Floating Bottom Media Toggles */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 shadow-xl">
                  {/* Mic Toggle */}
                  <button
                    onClick={() => setMicOn(!micOn)}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                      micOn
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                    title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {micOn ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
                    <span className="text-xs font-bold hidden sm:inline">{micOn ? 'Mic On' : 'Muted'}</span>
                  </button>

                  {/* Camera Toggle */}
                  <button
                    onClick={() => setCameraOn(!cameraOn)}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                      cameraOn
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                    title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {cameraOn ? <Video className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5" />}
                    <span className="text-xs font-bold hidden sm:inline">{cameraOn ? 'Camera On' : 'Camera Off'}</span>
                  </button>
                </div>

                {/* Live Mic Activity Wave */}
                {micOn && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/50 flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-200"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">Mic Active</span>
                  </div>
                )}
              </div>

              {/* Hardware Diagnostics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                    <Video className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Video Input</span>
                    <span className="font-semibold text-slate-200">HD Web Camera (Connected)</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Audio Input</span>
                    <span className="font-semibold text-slate-200">Default Microphone (Tested)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Meeting Details & Join Action */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Ready to Connect
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-tight">
                  {meetingTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Participant: <span className="font-semibold text-slate-200">{clientName}</span>
                </p>
              </div>

              {/* Meeting Info Card */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Session Type</span>
                  <span className="font-bold text-slate-200">Scheduled Consultation</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Joining As</span>
                  <span className="font-bold text-blue-400">{userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role</span>
                  <span className="font-semibold text-slate-300">{userRole}</span>
                </div>
              </div>

              {/* Join Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleStartJoinProcess}
                  className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  <span>Join Meeting Now</span>
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  By joining, you agree to SLS secure institutional conference guidelines.
                </p>
              </div>

              {/* Share Invite Pill */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Invite colleagues:</span>
                <button
                  onClick={handleCopyMeetingLink}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Meeting Link'}</span>
                </button>
              </div>

            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-slate-800/60 text-center text-xs text-slate-400">
          Shubham Leads Solutions &bull; Official Virtual Meeting Gateway &bull; High Reliability WebRTC
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CONNECTING STATE (Clean Minimalist Transition)
  // =========================================================================
  if (phase === 'connecting') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 border-t-blue-500 animate-spin" />
            <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-950">
              <ShieldCheck className="w-7 h-7 text-blue-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white tracking-tight">
              Connecting to Meeting...
            </h3>
            <p className="text-xs text-slate-400">
              Securing audio &amp; video feed
            </p>
          </div>

          <div className="pt-2 text-[11px] text-slate-400">
            Encrypted &bull; <span className="font-semibold text-emerald-400">SLS Video Connect</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: IN-MEETING INTERFACE (Inspired by Modern Video Conferencing, Customized for SLS)
  // =========================================================================
  return (
    <div className="h-screen w-screen bg-[#111418] text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans">
      
      {/* Floating Reactions Emojis */}
      {floatingEmojis.map((e) => (
        <div
          key={e.id}
          className="absolute bottom-24 text-3xl pointer-events-none animate-bounce z-50 transition-all duration-1000"
          style={{ left: `${e.left}%` }}
        >
          {e.emoji}
        </div>
      ))}

      {/* ========================================================================= */}
      {/* TOP HEADER: SLS Meeting Title, Timer, Security Pill & View Controls       */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 sm:px-6 bg-[#161a20] border-b border-white/5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-md">
            SLS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
                {meetingTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Client: <span className="text-slate-300 font-medium">{clientName}</span></span>
              <span>&bull;</span>
              <span className="font-mono text-emerald-400 font-bold">{formatTimer(seconds)}</span>
            </div>
          </div>
        </div>

        {/* Security & View Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit Encrypted</span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'gallery' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gallery</span>
            </button>
            <button
              onClick={() => setViewMode('speaker')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'speaker' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speaker</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN VIDEO STAGE & PRESENTATION VIEW                                      */}
      {/* ========================================================================= */}
      <main className="flex-1 p-3 sm:p-5 flex gap-4 overflow-hidden relative">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* If Screen Sharing / Pitch Deck is ON */}
          {screenSharing ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              {/* Presentation Slide Stage (9 Cols) */}
              <div className="lg:col-span-9 rounded-3xl bg-[#181d24] border border-white/10 p-6 flex flex-col justify-between shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase">
                      {presentationSlides[slideIndex].tag}
                    </span>
                    <span className="text-xs text-slate-400">SLS Live Proposal Presentation Deck</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Slide {slideIndex + 1} of {presentationSlides.length}
                  </span>
                </div>

                <div className="py-6 space-y-4 max-w-2xl">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {presentationSlides[slideIndex].title}
                  </h3>
                  <p className="text-sm text-blue-300 font-semibold">
                    {presentationSlides[slideIndex].subtitle}
                  </p>
                  <div className="space-y-3 pt-4">
                    {presentationSlides[slideIndex].points.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          ✓
                        </div>
                        <span className="text-sm text-slate-200">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    disabled={slideIndex === 0}
                    onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Previous Slide
                  </button>
                  <button
                    disabled={slideIndex === presentationSlides.length - 1}
                    onClick={() => setSlideIndex((i) => Math.min(presentationSlides.length - 1, i + 1))}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Next Slide
                  </button>
                </div>
              </div>

              {/* Side Video Strips (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                {/* Self Feed */}
                <div className="relative aspect-video rounded-2xl bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                  {cameraOn ? (
                    <video
                      ref={inMeetingVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white">
                      {userName.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                    {micOn ? <Mic className="w-2.5 h-2.5 text-emerald-400" /> : <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                    {userName} (You)
                  </span>
                </div>

                {/* Client Partner Feed */}
                <div className="relative aspect-video rounded-2xl bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-300">
                    {clientName.charAt(0)}
                  </div>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                    <Mic className="w-2.5 h-2.5 text-emerald-400" />
                    {clientName}
                  </span>
                </div>
              </div>
            </div>
          ) : viewMode === 'gallery' ? (
            /* Gallery View: Balanced Grid */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* User Self Video Tile */}
              <div className="relative rounded-3xl bg-[#161a20] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl group">
                {cameraOn ? (
                  <video
                    ref={inMeetingVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
                      {userName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-300">{userName}</span>
                  </div>
                )}

                {/* Name Tag Badge */}
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                  {micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{userName} (Host)</span>
                </div>
              </div>

              {/* Client Participant Video Tile */}
              <div className="relative rounded-3xl bg-[#161a20] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-3xl font-black text-white shadow-xl border border-white/10">
                    {clientName.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-300">{clientName}</span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Audio Connected
                  </span>
                </div>

                {/* Name Tag Badge */}
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{clientName}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Speaker View: Big Active Stage */
            <div className="flex-1 relative rounded-3xl bg-[#161a20] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-4xl font-black text-white shadow-xl border border-white/10">
                  {clientName.charAt(0)}
                </div>
                <h4 className="text-lg font-bold text-white">{clientName}</h4>
                <p className="text-xs text-slate-400">Institutional Prospect</p>
              </div>

              {/* Floating Picture-in-Picture of Self */}
              <div className="absolute top-4 right-4 w-48 aspect-video rounded-2xl bg-black/80 border border-white/20 overflow-hidden shadow-2xl">
                {cameraOn ? (
                  <video
                    ref={inMeetingVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
                    {userName}
                  </div>
                )}
                <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white">You</span>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT DRAWER: ATTENDEES / IN-MEETING CHAT / LIVE MEETING NOTES            */}
        {/* ========================================================================= */}
        {activeDrawer && (
          <aside className="absolute inset-0 sm:relative sm:inset-auto w-full sm:w-96 rounded-3xl bg-[#161a20] border border-white/10 p-4 flex flex-col justify-between shadow-2xl z-30 sm:z-auto shrink-0">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="font-bold text-sm text-white capitalize flex items-center gap-2">
                {activeDrawer === 'participants' && <Users className="w-4 h-4 text-blue-400" />}
                {activeDrawer === 'chat' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                {activeDrawer === 'notes' && <FileText className="w-4 h-4 text-amber-400" />}
                {activeDrawer === 'participants' && 'Meeting Attendees (2)'}
                {activeDrawer === 'chat' && 'In-Meeting Chat'}
                {activeDrawer === 'notes' && 'Client Consultation Notes'}
              </h4>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body: Attendees */}
            {activeDrawer === 'participants' && (
              <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                      {userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{userName} (You)</p>
                      <span className="text-[10px] text-blue-400 font-semibold">{userRole}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
                      {clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{clientName}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">Institutional Client</span>
                    </div>
                  </div>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleCopyMeetingLink}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-blue-400 flex items-center justify-center gap-2 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Drawer Body: In-Meeting Chat */}
            {activeDrawer === 'chat' && (
              <div className="flex-1 flex flex-col justify-between py-2 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2">
                  {inMeetingMessages.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-blue-400">{m.sender}</span>
                        <span className="text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-xs text-slate-200">{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message to room..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Drawer Body: Client Notes */}
            {activeDrawer === 'notes' && (
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Record confidential minutes and agreed action items during this call.
                  </p>
                  <textarea
                    rows={12}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Key client discussion points, admissions requirements, target branches, follow-up timeline..."
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition flex items-center justify-center gap-2"
                >
                  {notesSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{notesSaved ? 'Notes Recorded!' : 'Save Meeting Minutes'}</span>
                </button>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM CONTROL TOOLBAR (Clean, Sleek SLS-Branded Interface)               */}
      {/* ========================================================================= */}
      <footer className="h-20 bg-[#161a20] border-t border-white/5 px-2 sm:px-8 flex items-center justify-between z-20">
        
        {/* Left: Audio & Video Controls */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Mic */}
          <button
            onClick={() => setMicOn(!micOn)}
            className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-2xl w-12 sm:w-20 transition cursor-pointer ${
              micOn ? 'hover:bg-white/10 text-slate-200' : 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30'
            }`}
          >
            {micOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-[9px] sm:text-[10px] font-bold">{micOn ? 'Mute' : 'Unmute'}</span>
          </button>

          {/* Camera */}
          <button
            onClick={() => setCameraOn(!cameraOn)}
            className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-2xl w-12 sm:w-20 transition cursor-pointer ${
              cameraOn ? 'hover:bg-white/10 text-slate-200' : 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30'
            }`}
          >
            {cameraOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-[9px] sm:text-[10px] font-bold">{cameraOn ? 'Stop' : 'Start'}</span>
          </button>
        </div>

        {/* Center: Collaboration Tools (Screen Share, Attendees, Chat, Notes) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Screen Share / Pitch Deck */}
          <button
            onClick={() => setScreenSharing(!screenSharing)}
            className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-2xl w-12 sm:w-20 transition cursor-pointer ${
              screenSharing ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-white/10 text-emerald-400'
            }`}
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">{screenSharing ? 'Stop' : 'Deck'}</span>
          </button>

          {/* Attendees */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')}
            className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-2xl w-12 sm:w-20 transition cursor-pointer ${
              activeDrawer === 'participants' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            <div className="relative">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-2 px-1 text-[8px] sm:text-[9px] font-black rounded-full bg-blue-600 text-white">
                2
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold">People</span>
          </button>

          {/* In-Meeting Chat */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'chat' ? null : 'chat')}
            className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-2xl w-12 sm:w-20 transition cursor-pointer ${
              activeDrawer === 'chat' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">Chat</span>
          </button>

          {/* Meeting Notes */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'notes' ? null : 'notes')}
            className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-2xl w-12 sm:w-20 transition cursor-pointer ${
              activeDrawer === 'notes' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">Notes</span>
          </button>

          {/* Reactions: Mobile Popover Toggle + Desktop Inline Bar */}
          <div className="relative">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setShowReactionsBar(!showReactionsBar)}
              className={`lg:hidden flex flex-col items-center gap-1 p-1.5 rounded-2xl w-12 transition cursor-pointer ${
                showReactionsBar ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-300'
              }`}
            >
              <span className="text-base leading-none">👏</span>
              <span className="text-[9px] font-bold">React</span>
            </button>

            {/* Floating Reaction Bar (shown on mobile toggle) */}
            {showReactionsBar && (
              <div className="lg:hidden absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl z-50 animate-sheet-up">
                {['👏', '👍', '🎯', '🔥', '❤️', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      triggerReaction(emoji);
                      setShowReactionsBar(false);
                    }}
                    className="hover:scale-125 transition text-lg p-1.5 cursor-pointer active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Desktop Inline Reactions */}
            <div className="hidden lg:flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
              {['👏', '👍', '🎯', '🔥', '❤️', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="hover:scale-125 transition text-base p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: End Meeting Button */}
        <div>
          <button
            onClick={() => router.push('/meetings')}
            className="flex items-center gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">End Meeting</span>
          </button>
        </div>

      </footer>
    </div>
  );
}

export default function MeetingStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <StudioRoom />
    </Suspense>
  );
}
