import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number): string {
  if (score >= 0.76) return "text-emerald-400";
  if (score >= 0.63) return "text-yellow-400";
  return "text-red-400";
}

export function scoreBg(score: number): string {
  if (score >= 0.76) return "bg-emerald-950 border-emerald-800";
  if (score >= 0.63) return "bg-yellow-950 border-yellow-800";
  return "bg-red-950 border-red-800";
}

export function scoreLabel(score: number): string {
  if (score >= 0.76) return "HIGH";
  if (score >= 0.63) return "MEDIUM";
  return "LOW";
}

export function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function deptBadgeClass(dept: string): string {
  switch (dept) {
    case "shops":
      return "bg-blue-950 text-blue-300 border-blue-800";
    case "factories":
      return "bg-purple-950 text-purple-300 border-purple-800";
    case "bescom":
      return "bg-amber-950 text-amber-300 border-amber-800";
    default:
      return "bg-zinc-800 text-zinc-300 border-zinc-700";
  }
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
