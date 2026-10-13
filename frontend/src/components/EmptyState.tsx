import React from 'react';
import { LucideIcon, Plus, FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileText,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus,
  className = '',
}) => {
  return (
    <div
      className={`neo-box flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white shadow-neo-md ${className}`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-2xl bg-cream border-1.5 border-black shadow-neo-sm flex items-center justify-center text-black">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-black stroke-[2]" />
      </div>
      <h3 className="text-base sm:text-lg font-black text-black mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-5 leading-relaxed font-medium">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="neo-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-lime text-black"
        >
          <ActionIcon className="w-4 h-4 stroke-[3]" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
