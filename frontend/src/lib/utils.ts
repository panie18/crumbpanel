import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    RUNNING: 'text-green-400',
    STOPPED: 'text-gray-400',
    STARTING: 'text-yellow-400',
    STOPPING: 'text-orange-400',
    ERROR: 'text-red-400',
  };
  return colors[status] || 'text-gray-400';
}

export function getStatusBadgeClass(status: string) {
  const classes: Record<string, string> = {
    RUNNING: 'bg-green-500/20 text-green-400 border-green-500/50',
    STOPPED: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    STARTING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    STOPPING: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    ERROR: 'bg-red-500/20 text-red-400 border-red-500/50',
  };
  return classes[status] || classes.STOPPED;
}
