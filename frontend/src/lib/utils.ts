import { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  const clsx = (...args: ClassValue[]) => {
    return args
      .flat()
      .filter(Boolean)
      .join(' ')
  }
  return clsx(inputs)
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
    RUNNING: 'text-white',
    STOPPED: 'text-gray-500',
    STARTING: 'text-gray-300',
    STOPPING: 'text-gray-400',
    ERROR: 'text-gray-600',
  };
  return colors[status] || 'text-gray-400';
}

export function getStatusBadgeClass(status: string) {
  const classes: Record<string, string> = {
    RUNNING: 'bg-white/20 text-white border-white/50',
    STOPPED: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    STARTING: 'bg-gray-300/20 text-gray-300 border-gray-300/50',
    STOPPING: 'bg-gray-400/20 text-gray-400 border-gray-400/50',
    ERROR: 'bg-gray-600/20 text-gray-500 border-gray-600/50',
  };
  return classes[status] || classes.STOPPED;
}
