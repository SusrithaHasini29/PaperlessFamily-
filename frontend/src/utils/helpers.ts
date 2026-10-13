import { format, formatDistanceToNow, differenceInCalendarDays, parseISO, isValid } from 'date-fns';

/**
 * Formats an ISO date string or Date object into human-readable format (e.g., '14 Oct 2026')
 */
export const formatDate = (dateString?: string | null, formatStr: string = 'dd MMM yyyy'): string => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};

/**
 * Returns relative time string like '2 hours ago' or '3 days ago'
 */
export const formatRelativeTime = (dateString?: string | null): string => {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return '';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
};

/**
 * Extracts first letters of the first two words (e.g. 'John Doe' -> 'JD')
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * Returns a consistent, pleasant Tailwind background color class based on name hash
 */
export const getAvatarColor = (name?: string | null): string => {
  if (!name) return 'bg-lime text-black border border-black';
  const colors = [
    'bg-lime text-black border border-black',
    'bg-pink text-black border border-black',
    'bg-purple text-white border border-black',
    'bg-cyan text-black border border-black',
    'bg-cream text-black border border-black',
    'bg-white text-black border border-black',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Returns category color styles (badge background, text color, accent border)
 */
export const getCategoryColor = (category?: string | null): { bg: string; text: string; border: string; hex: string } => {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'identity':
      return { bg: 'bg-cyan', text: 'text-black', border: 'border-black', hex: '#9FE8F5' };
    case 'education':
      return { bg: 'bg-lime', text: 'text-black', border: 'border-black', hex: '#C8FF3D' };
    case 'medical':
      return { bg: 'bg-pink', text: 'text-black', border: 'border-black', hex: '#FF7FA8' };
    case 'finance':
      return { bg: 'bg-cream', text: 'text-black', border: 'border-black', hex: '#FAFAF5' };
    case 'insurance':
      return { bg: 'bg-purple', text: 'text-white', border: 'border-black', hex: '#7047F5' };
    case 'property':
      return { bg: 'bg-lime', text: 'text-black', border: 'border-black', hex: '#C8FF3D' };
    case 'vehicle':
      return { bg: 'bg-cyan', text: 'text-black', border: 'border-black', hex: '#9FE8F5' };
    case 'bills':
      return { bg: 'bg-pink', text: 'text-black', border: 'border-black', hex: '#FF7FA8' };
    default:
      return { bg: 'bg-cream', text: 'text-black', border: 'border-black', hex: '#E9E9E4' };
  }
};

/**
 * Returns a lucide icon name for a given category
 */
export const getCategoryIcon = (category?: string | null): string => {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'identity':
      return 'Shield';
    case 'education':
      return 'GraduationCap';
    case 'medical':
      return 'HeartPulse';
    case 'finance':
      return 'Wallet';
    case 'insurance':
      return 'ShieldCheck';
    case 'property':
      return 'Home';
    case 'vehicle':
      return 'Car';
    case 'bills':
      return 'Receipt';
    default:
      return 'Folder';
  }
};

/**
 * Returns lucide icon name for file types
 */
export const getFileIcon = (fileType?: string | null): string => {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf')) return 'FileText';
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return 'Image';
  if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return 'FileSpreadsheet';
  if (type.includes('doc') || type.includes('word')) return 'FileText';
  return 'File';
};

/**
 * Formats byte size into human readable string ('2.4 MB')
 */
export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Returns number of days until expiry (positive for future, negative for expired)
 */
export const getDaysUntilExpiry = (dateString?: string | null): number => {
  if (!dateString) return 9999;
  try {
    const targetDate = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(targetDate)) return 9999;
    const today = new Date();
    return differenceInCalendarDays(targetDate, today);
  } catch {
    return 9999;
  }
};

/**
 * Returns greeting based on current local hour
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Truncates text with ellipsis if length exceeds maxLength
 */
export const truncateText = (text?: string | null, maxLength: number = 30): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
