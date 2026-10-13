import React from 'react';
import {
  Shield,
  GraduationCap,
  HeartPulse,
  Wallet,
  ShieldCheck,
  Home,
  Car,
  Receipt,
  Folder,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { getCategoryColor } from '../utils/helpers';

const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  graduationcap: GraduationCap,
  heartpulse: HeartPulse,
  wallet: Wallet,
  shieldcheck: ShieldCheck,
  home: Home,
  car: Car,
  receipt: Receipt,
  folder: Folder,
  filetext: FileText,
};

interface CategoryCardProps {
  name: string;
  icon?: string;
  count?: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  icon,
  count = 0,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const colorStyles = getCategoryColor(name);
  const normalizedIcon = (icon || name).toLowerCase().replace(/[^a-z]/g, '');
  const IconComponent = iconMap[normalizedIcon] || Folder;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-200 w-full ${
        isSelected
          ? 'bg-white border-[#5B4BDB] shadow-md ring-2 ring-[#5B4BDB]/20'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${colorStyles.hex}15`,
            color: colorStyles.hex,
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="truncate">
          <h4 className="text-sm font-semibold text-[#17172A] group-hover:text-[#5B4BDB] transition-colors truncate">
            {name}
          </h4>
          <span className="text-xs text-[#6B7280]">
            {count} {count === 1 ? 'document' : 'documents'}
          </span>
        </div>
      </div>
      <div
        className={`w-2 h-2 rounded-full transition-opacity ${
          isSelected ? 'bg-[#5B4BDB] opacity-100' : 'opacity-0'
        }`}
      />
    </button>
  );
};

export default CategoryCard;
