import React from 'react';
import {
  FileText,
  Mail,
  Shield,
  User as UserIcon,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { FamilyMember } from '../types';
import { formatDate } from '../utils/helpers';

interface FamilyMemberCardProps {
  member: FamilyMember;
  isAdmin: boolean;
  onEdit?: (member: FamilyMember) => void;
  onRemove?: (member: FamilyMember) => void;
  className?: string;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  isAdmin,
  onEdit,
  onRemove,
  className = '',
}) => {
  return (
    <div
      className={`neo-box p-4 sm:p-5 bg-white flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Header: Initial avatar, Name, Role badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-lime border-1.5 border-black shadow-neo-sm flex items-center justify-center text-sm font-black text-black shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-black truncate" title={member.name}>
                {member.name}
              </h3>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border border-black bg-cream text-black">
                {member.relationship || 'Member'}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 border border-black ${
              member.role === 'ADMIN'
                ? 'bg-purple text-white shadow-neo-sm'
                : 'bg-white text-gray-700'
            }`}
          >
            {member.role === 'ADMIN' && <Shield className="w-3 h-3 stroke-[2.5]" />}
            {member.role === 'ADMIN' ? 'Admin' : 'Member'}
          </span>
        </div>

        {/* Member meta */}
        <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="truncate" title={member.email}>
              {member.email}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="font-bold text-black">
              {member.documentCount ?? 0}{' '}
              {member.documentCount === 1 ? 'document' : 'documents'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-black shrink-0" />
            <span>Joined {formatDate(member.joinedAt, 'dd MMM yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Admin Action Buttons */}
      {isAdmin && (
        <div className="mt-4 pt-3 border-t-1.5 border-black/10 flex items-center justify-end gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(member)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-black bg-white hover:bg-cream rounded-md border border-black shadow-neo-sm"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(member)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-black bg-pink hover:bg-red-200 rounded-md border border-black shadow-neo-sm"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilyMemberCard;
