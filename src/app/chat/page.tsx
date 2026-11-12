'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  MessagesSquare,
  Hash,
  Send,
  User,
  Users,
  Search,
  Smile,
  Sparkles,
  Trophy,
  Calendar,
  CheckCircle2,
  Trash2,
  Paperclip,
  Bell,
  MoreVertical,
  Radio,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ChatMessage {
  id: string;
  channel: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  reactions?: Record<string, string[]>;
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
  label: string;
  description: string;
  badge: string;
}

interface TeamMember {
  id: string;
  name: string;
  username: string;
  role: string;
  designation?: string;
}

const COMMON_EMOJIS = ['👍', '🔥', '🎉', '👏', '🚀', '❤️', '🎯'];

export default function TeamChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeChannelId, setActiveChannelId] = useState('general');
  const [activeDmUser, setActiveDmUser] = useState<TeamMember | null>(null);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute DM channel key deterministically
  const getDmChannelKey = (user1Id: string, user2Id: string) => {
    return [user1Id, user2Id].sort().join('_dm_');
  };

  const currentChannelKey = activeDmUser && currentUser
    ? getDmChannelKey(currentUser.id, activeDmUser.id)
    : activeChannelId;

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?channel=${encodeURIComponent(currentChannelKey)}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        if (data.channels) setChannels(data.channels);
        if (data.teamMembers) setTeamMembers(data.teamMembers);
        if (data.currentUser) setCurrentUser(data.currentUser);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setLoading(false);
    }
  }, [currentChannelKey]);

  useEffect(() => {
    fetchChat();
    // Real-time polling every 4 seconds
    const interval = setInterval(fetchChat, 4000);
    return () => clearInterval(interval);
  }, [fetchChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: currentChannelKey,
          content: text,
        }),
      });
      if (res.ok) {
        fetchChat();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/chat/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      fetchChat();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch(`/api/chat/${messageId}`, { method: 'DELETE' });
      fetchChat();
    } catch (err) {
      console.error(err);
    }
  };

  const currentChannelInfo = channels.find((c) => c.id === activeChannelId);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col sm:flex-row bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR: CHANNELS & DIRECT MESSAGES                                  */}
        {/* ========================================================================= */}
        <div className={`w-full sm:w-72 bg-slate-50/80 border-r border-slate-200 flex-col shrink-0 ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <MessagesSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    SLS Team Chat
                  </h2>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Internal Workspace
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Search */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team or channels..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Channels & DMs List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {/* Team Channels */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Team Channels</span>
                <span>{channels.length}</span>
              </p>
              <div className="space-y-0.5">
                {channels
                  .filter((c) => !searchFilter || c.label.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((chan) => {
                    const isActive = !activeDmUser && activeChannelId === chan.id;
                    return (
                      <button
                        key={chan.id}
                        onClick={() => {
                          setActiveDmUser(null);
                          setActiveChannelId(chan.id);
                          setMobileView('chat');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition font-semibold cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'text-slate-700 hover:bg-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{chan.label}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {chan.badge}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Direct Messages (Team Members) */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Direct Messages</span>
                <span>{teamMembers.length}</span>
              </p>
              <div className="space-y-0.5">
                {teamMembers
                  .filter((m) => m.id !== currentUser?.id)
                  .filter((m) => !searchFilter || m.name.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((member) => {
                    const isActive = activeDmUser?.id === member.id;
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          setActiveDmUser(member);
                          setMobileView('chat');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition font-semibold cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'text-slate-700 hover:bg-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="relative shrink-0">
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                              {member.name.charAt(0)}
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-1 ring-white" />
                          </div>
                          <span className="truncate">{member.name}</span>
                        </div>
                        <span
                          className={`text-[9px] truncate max-w-[70px] ${
                            isActive ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {member.designation || member.role}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Current User Indicator */}
          {currentUser && (
            <div className="p-3 border-t border-slate-200 bg-white/80 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate text-xs">
                <p className="font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-blue-600 font-semibold truncate">{currentUser.designation || currentUser.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT AREA: ACTIVE CONVERSATION & MESSAGES FEED                           */}
        {/* ========================================================================= */}
        <div className={`flex-1 flex-col bg-white overflow-hidden ${mobileView === 'sidebar' ? 'hidden sm:flex' : 'flex'}`}>
          
          {/* Conversation Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileView('sidebar')}
                className="sm:hidden p-1.5 -ml-1 mr-1 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer font-bold text-xs"
                title="Back to Channels"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Channels</span>
              </button>
              {activeDmUser ? (
                <>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs">
                      {activeDmUser.name.charAt(0)}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{activeDmUser.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        {activeDmUser.designation || activeDmUser.role}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Direct message channel</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{currentChannelInfo?.label || activeChannelId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        #{activeChannelId}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {currentChannelInfo?.description || 'Team discussions and updates'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Quick Celebrate Shortcuts */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setInputText('🎉 Milestone Reached: Won a new college partnership! Retainer contract confirmed.')}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200 transition cursor-pointer flex items-center gap-1"
              >
                <span>🏆 Celebrate Win</span>
              </button>
              <button
                type="button"
                onClick={() => setInputText('📅 Discovery meeting successfully completed with the Admissions Committee. Proposal requested!')}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1"
              >
                <span>📅 Log Meeting</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400 font-semibold">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
                <MessagesSquare className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No messages in this channel yet.</p>
                <p className="text-[11px] text-slate-400">Be the first to share an update or start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                const reactions = (msg.reactions as Record<string, string[]>) || {};

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 group transition ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 text-white ${
                        isMe
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                          : 'bg-gradient-to-tr from-slate-700 to-slate-900'
                      }`}
                    >
                      {msg.senderName.charAt(0)}
                    </div>

                    {/* Message Box */}
                    <div className={`max-w-[75%] space-y-1 ${isMe ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-extrabold text-slate-900">{msg.senderName}</span>
                        {msg.senderRole && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                            {msg.senderRole}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed inline-block text-left shadow-xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200/60'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Emoji Reactions Bar */}
                      <div className={`flex flex-wrap items-center gap-1 pt-0.5 ${isMe ? 'justify-end' : ''}`}>
                        {Object.entries(reactions).map(([emoji, userIds]) => {
                          const hasReacted = currentUser && userIds.includes(currentUser.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                hasReacted
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </button>
                          );
                        })}

                        {/* Quick Reaction Picker on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-0.5 bg-white border border-slate-200 rounded-full px-1 shadow-xs">
                          {COMMON_EMOJIS.slice(0, 4).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="hover:scale-125 transition text-xs p-0.5 cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                          {isMe && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 transition cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Composer */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition">
                <textarea
                  rows={2}
                  placeholder={`Message ${activeDmUser ? `@${activeDmUser.name}` : `#${activeChannelId}`}... (Shift+Enter for newline)`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none font-medium px-2"
                />

                <div className="flex items-center gap-1 pr-1 shrink-0">
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-40 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
                <span>Press <strong>Enter</strong> to send &bull; <strong>Shift+Enter</strong> for newline</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
            </form>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
