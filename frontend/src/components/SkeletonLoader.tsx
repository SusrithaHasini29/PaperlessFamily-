import React from 'react';

export const SkeletonText: React.FC<{ className?: string; lines?: number }> = ({
  className = 'h-4 w-full',
  lines = 1,
}) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200/80 rounded-md ${className}`}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-10 h-10',
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded-full shrink-0 ${size} ${className}`}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="w-16 h-5 rounded-full bg-gray-200" />
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3.5 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200" />
          <div className="h-3.5 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-3.5 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-gray-100 rounded flex-1"
                style={{ width: `${60 + ((c * 15) % 40)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
};
