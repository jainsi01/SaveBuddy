import React from 'react';

/**
 * HealthStatusBadge Component
 * Renders status pills (UP / CONNECTED / DEGRADED / OFFLINE) with matching aesthetic colors.
 */
export default function HealthStatusBadge({ status, label }) {
  const isHealthy = status === 'UP' || status === 'CONNECTED';
  const isDegraded = status === 'DEGRADED';

  let badgeClasses = 'bg-rose-100 text-rose-800 border-rose-200';
  let dotClasses = 'bg-rose-500 animate-pulse';

  if (isHealthy) {
    badgeClasses = 'bg-sage-100 text-sage-700 border-sage-500/20';
    dotClasses = 'bg-sage-500';
  } else if (isDegraded) {
    badgeClasses = 'bg-amber-100 text-amber-800 border-amber-300';
    dotClasses = 'bg-amber-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${dotClasses}`}></span>
      <span>{label || status}</span>
    </span>
  );
}
