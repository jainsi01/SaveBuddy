import React from 'react';

/**
 * ProgressBar Component
 * Animated progress indicator with dynamic Coffee & Cream and Sage color transitions.
 */
export default function ProgressBar({ percentage = 0, size = 'md', showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, Number(percentage) || 0));
  const isCompleted = clamped >= 100;

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size] || 'h-2.5';

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-coffee-700">Progress</span>
          <span className={isCompleted ? 'text-sage-700' : 'text-coffee-900'}>
            {clamped}%
          </span>
        </div>
      )}
      <div className={`w-full bg-[#EDE4D8] rounded-full overflow-hidden ${heightClasses}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isCompleted
              ? 'bg-[#3D8C55]' // Sage green on 100% completion
              : 'bg-gradient-to-r from-coffee-600 to-[#A76D49]' // Warm terracotta gradient
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
