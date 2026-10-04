import React from 'react';

/**
 * StatCard Component (FR-08, Section 7.2 Implementation Plan)
 * Displays primary analytical metrics with warm luxury coffee styling.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'default',
}) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'coffee':
        return 'bg-coffee-100 text-coffee-800 border-coffee-200';
      default:
        return 'bg-cream-100 text-coffee-700 border-coffee-200/70';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm hover:border-coffee-300 transition space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-coffee-500 uppercase">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-coffee-100/70 text-coffee-700 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl sm:text-3xl font-bold text-coffee-950 tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs text-coffee-600 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {badgeText && (
        <div className="pt-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeStyle()}`}
          >
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
}
