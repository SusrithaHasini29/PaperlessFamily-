import React from 'react';
import { AlertTriangle, Clock, Calendar, ChevronRight } from 'lucide-react';
import { Document } from '../types';
import { getDaysUntilExpiry, formatDate } from '../utils/helpers';

interface ExpiryAlertProps {
  document: Document;
  onClick?: (document: Document) => void;
  className?: string;
}

export const ExpiryAlert: React.FC<ExpiryAlertProps> = ({
  document,
  onClick,
  className = '',
}) => {
  const daysLeft = getDaysUntilExpiry(document.expiryDate);
  const isExpired = daysLeft <= 0 || document.status === 'EXPIRED';

  return (
    <div
      onClick={() => onClick && onClick(document)}
      className={`neo-box-interactive p-3.5 bg-white cursor-pointer flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-lg border-1.5 border-black flex items-center justify-center shrink-0 ${
            isExpired ? 'bg-red-200' : 'bg-pink'
          }`}
        >
          {isExpired ? (
            <AlertTriangle className="w-4 h-4 text-black stroke-[2.2]" />
          ) : (
            <Clock className="w-4 h-4 text-black stroke-[2.2]" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-black text-black truncate">
            {document.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-gray-600">
            <span className="text-black font-bold">{document.ownerName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-black" />
              {document.expiryDate ? formatDate(document.expiryDate, 'dd MMM yyyy') : 'No date'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-black shadow-neo-sm ${
            isExpired ? 'bg-red-200 text-black' : 'bg-pink text-black'
          }`}
        >
          {isExpired
            ? 'Expired'
            : daysLeft === 0
            ? 'Expires today'
            : daysLeft === 1
            ? 'Expires tomorrow'
            : `${daysLeft} days left`}
        </span>
        {onClick && <ChevronRight className="w-4 h-4 text-black" />}
      </div>
    </div>
  );
};

export default ExpiryAlert;
