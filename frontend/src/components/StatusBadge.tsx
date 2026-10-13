import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-lime text-black border border-black shadow-neo-sm ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />}
          <span>Active</span>
        </span>
      );
    case 'EXPIRING_SOON':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-pink text-black border border-black shadow-neo-sm ${className}`}
        >
          {showIcon && <Clock className="w-3 h-3 stroke-[2.5]" />}
          <span>Expiring Soon</span>
        </span>
      );
    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-200 text-black border border-black shadow-neo-sm ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3 h-3 stroke-[2.5]" />}
          <span>Expired</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cream text-black border border-black ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};

export default StatusBadge;
