import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string; // hex or tailwind class
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  color = '#5B4BDB',
  trend,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: color,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#17172A] tracking-tight">
            {value}
          </h3>
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {trend.value}%
          </span>
          <span className="text-[#6B7280]">
            {trend.label || 'from last month'}
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
