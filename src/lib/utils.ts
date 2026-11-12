import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isPast, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, formatStr = "dd MMM yyyy"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, formatStr);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd MMM yyyy, hh:mm a");
}

export function isFollowUpOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return false;
  return isPast(d) && !isToday(d);
}

export function isFollowUpToday(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return false;
  return isToday(d);
}

export const STATUS_LABELS: Record<string, { label: string; color: string; badge: string }> = {
  NEW_PROSPECT: { label: "New Prospect", color: "bg-blue-50 text-blue-700 border-blue-200", badge: "bg-blue-500" },
  RESEARCH_COMPLETED: { label: "Research Completed", color: "bg-sky-50 text-sky-700 border-sky-200", badge: "bg-sky-500" },
  CONTACTED: { label: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-200", badge: "bg-amber-500" },
  FOLLOW_UP: { label: "Follow-up", color: "bg-orange-50 text-orange-700 border-orange-200", badge: "bg-orange-500" },
  REPLIED: { label: "Replied", color: "bg-purple-50 text-purple-700 border-purple-200", badge: "bg-purple-500" },
  INTERESTED: { label: "Interested", color: "bg-indigo-50 text-indigo-700 border-indigo-200", badge: "bg-indigo-500" },
  MEETING_DISCUSSION: { label: "Meeting / Discussion", color: "bg-cyan-50 text-cyan-700 border-cyan-200", badge: "bg-cyan-500" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "bg-pink-50 text-pink-700 border-pink-200", badge: "bg-pink-500" },
  NEGOTIATION: { label: "Negotiation", color: "bg-yellow-50 text-yellow-800 border-yellow-200", badge: "bg-yellow-500" },
  WON: { label: "Won (Converted)", color: "bg-emerald-50 text-emerald-700 border-emerald-200", badge: "bg-emerald-500" },
  LOST: { label: "Lost", color: "bg-rose-50 text-rose-700 border-rose-200", badge: "bg-rose-500" },
  NOT_INTERESTED: { label: "Not Interested", color: "bg-slate-100 text-slate-700 border-slate-300", badge: "bg-slate-400" },
  NO_RESPONSE: { label: "No Response", color: "bg-gray-100 text-gray-600 border-gray-300", badge: "bg-gray-400" },
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  GOOGLE_MAPS: "Google Maps",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  WEBSITE: "Website",
  REFERRAL: "Referral",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  OTHER: "Other",
};

export const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  PHONE_CALL: "Phone Call",
  MEETING: "Meeting",
  OTHER: "Other",
};
