import React from 'react';
import {
  Eye,
  Download,
  Trash2,
  Calendar,
  FileText,
  Shield,
  GraduationCap,
  HeartPulse,
  Wallet,
  ShieldCheck,
  Home,
  Car,
  Receipt,
  Folder,
  LucideIcon,
  User,
} from 'lucide-react';
import { Document } from '../types';
import StatusBadge from './StatusBadge';
import {
  formatDate,
  formatFileSize,
} from '../utils/helpers';

const categoryIconMap: Record<string, LucideIcon> = {
  identity: Shield,
  education: GraduationCap,
  medical: HeartPulse,
  finance: Wallet,
  insurance: ShieldCheck,
  property: Home,
  vehicle: Car,
  bills: Receipt,
  other: Folder,
};

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  isHighlighted?: boolean;
  className?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDelete,
  onDownload,
  isHighlighted = false,
  className = '',
}) => {
  const catKey = (document.category || '').toLowerCase();
  const CategoryIcon = categoryIconMap[catKey] || FileText;

  const handleCardClick = () => {
    if (onView) {
      onView(document);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`neo-box-interactive p-4 sm:p-5 bg-white cursor-pointer flex flex-col justify-between group transition-all ${
        isHighlighted ? 'ring-4 ring-lime border-2 border-black bg-lime/10 shadow-neo-lg' : ''
      } ${className}`}
    >
      <div>
        {isHighlighted && (
          <div className="mb-2 px-2 py-0.5 bg-lime text-black border border-black rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
            <span>★</span>
            <span>JUST UPLOADED TO VAULT</span>
          </div>
        )}
        {/* Top row: Category tag, Icon, Status badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cream border-1.5 border-black flex items-center justify-center shrink-0">
              <CategoryIcon className="w-4 h-4 text-black stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black bg-cream inline-block">
                {document.category}
              </span>
              {document.subcategory && (
                <span className="text-[10px] text-gray-500 font-semibold block truncate mt-0.5">
                  {document.subcategory}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={document.status} />
        </div>

        {/* Document Title */}
        <h4
          className="text-sm sm:text-base font-black text-black group-hover:text-purple transition-colors line-clamp-1 mb-1"
          title={document.name}
        >
          {document.name}
        </h4>

        {/* Owner Info & File info */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <span className="font-semibold">Owner:</span>
          <span className="font-bold text-black px-1.5 py-0.2 rounded bg-cream border border-gray-300">
            {document.ownerName}
          </span>
        </div>

        {/* Description or file size */}
        <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem] leading-relaxed">
          {document.description || `${document.fileName || 'Document'} • ${formatFileSize(document.fileSize)}`}
        </p>
      </div>

      {/* Bottom meta & Hover Actions */}
      <div className="pt-3 border-t-1.5 border-black/10 mt-3">
        <div className="flex items-center justify-between">
          {/* Expiry / Upload Date */}
          <div className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-black" />
            <span>
              {document.expiryDate
                ? `Expiry: ${formatDate(document.expiryDate, 'dd MMM yyyy')}`
                : `Uploaded: ${formatDate(document.uploadedAt, 'dd MMM yyyy')}`}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onView && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(document);
                }}
                title="View document"
                className="p-1.5 rounded-md border border-transparent hover:border-black hover:bg-cream text-black transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}

            {onDownload && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(document);
                }}
                title="Download file"
                className="p-1.5 rounded-md border border-transparent hover:border-black hover:bg-cream text-black transition-all"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(document);
                }}
                title="Delete document"
                className="p-1.5 rounded-md border border-transparent hover:border-black hover:bg-pink text-black transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
