import React from 'react';

/**
 * SaveBuddy Official Brand Logo
 * Features a custom-crafted geometric vector emblem combining:
 * - A luxury espresso squircle badge
 * - Warm bronze & champagne gold gradient contours
 * - An intertwined ribbon monogram of 'S' and 'B'
 * - A radiant upward wealth diamond / star
 * 
 * Supports sizes: 'xs', 'sm', 'md', 'lg', 'xl'
 * Supports variants: 'full' (emblem + wordmark), 'icon' (emblem only), 'horizontal'
 * Supports themes: 'default' (dark emblem, dark text), 'white' (for dark backgrounds)
 */
export default function Logo({
  size = 'md',
  variant = 'full',
  theme = 'default',
  className = '',
  showTagline = true,
}) {
  const sizeMap = {
    xs: { icon: 28, text: 'text-sm', tag: 'text-[8px]', gap: 'gap-2' },
    sm: { icon: 34, text: 'text-base', tag: 'text-[9px]', gap: 'gap-2.5' },
    md: { icon: 42, text: 'text-xl', tag: 'text-[10px]', gap: 'gap-3' },
    lg: { icon: 52, text: 'text-2xl', tag: 'text-xs', gap: 'gap-3.5' },
    xl: { icon: 68, text: 'text-3xl', tag: 'text-sm', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isWhite = theme === 'white';

  const emblem = (
    <div
      style={{ width: currentSize.icon, height: currentSize.icon }}
      className="relative shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ease-out"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Badge Background Gradients */}
          <linearGradient id="sbBadgeBg" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2A1B14" />
            <stop offset="50%" stopColor="#1E130D" />
            <stop offset="100%" stopColor="#120A06" />
          </linearGradient>

          {/* Premium Gold Ribbon Gradient */}
          <linearGradient id="sbGoldSheen" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F9E8CE" />
            <stop offset="25%" stopColor="#E2BA84" />
            <stop offset="60%" stopColor="#C49A6C" />
            <stop offset="100%" stopColor="#8C5C35" />
          </linearGradient>

          {/* Inner Accent Glow */}
          <linearGradient id="sbEmeraldGlow" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#52B788" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D8F3DC" stopOpacity="0" />
          </linearGradient>

          {/* Border Stroke Gradient */}
          <linearGradient id="sbBorderStroke" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#8C5C35" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
          </linearGradient>

          {/* Subtle Drop Shadow */}
          <filter id="sbShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Squircle Container */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          fill="url(#sbBadgeBg)"
          stroke="url(#sbBorderStroke)"
          strokeWidth="2"
        />

        {/* Decorative Inner Accent Arc */}
        <path
          d="M 22 78 C 30 84, 70 84, 78 78"
          stroke="url(#sbGoldSheen)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Dynamic 'S' Crest Wave */}
        <path
          d="M 64 30 C 58 24, 42 22, 34 30 C 26 38, 30 48, 48 52 C 68 56, 72 66, 64 74 C 54 84, 34 80, 28 72"
          stroke="url(#sbGoldSheen)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#sbShadow)"
        />

        {/* Counter-balanced 'B' Flow Loop */}
        <path
          d="M 44 26 L 44 74 C 56 74, 68 68, 68 59 C 68 52, 60 49, 52 49 C 64 49, 66 38, 64 34 C 61 28, 54 26, 44 26 Z"
          stroke="url(#sbGoldSheen)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
        />

        {/* Radiant Wealth Sparkle / Star (Top Right) */}
        <path
          d="M 72 20 Q 75 25, 80 28 Q 75 31, 72 36 Q 69 31, 64 28 Q 69 25, 72 20 Z"
          fill="#FDE68A"
        />
        <circle cx="72" cy="28" r="1.5" fill="#FFFFFF" />

        {/* Seed of Growth Coin Center Accent */}
        <circle cx="48" cy="52" r="3.5" fill="#FCE7F3" opacity="0.9" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{emblem}</div>;
  }

  return (
    <div className={`inline-flex items-center ${currentSize.gap} select-none ${className}`}>
      {emblem}

      <div className="flex flex-col justify-center">
        <span
          className={`font-serif ${currentSize.text} font-semibold tracking-tight leading-none ${
            isWhite ? 'text-cream-100' : 'text-coffee-950'
          }`}
        >
          SaveBuddy
        </span>

        {showTagline && (
          <span
            className={`font-sans ${currentSize.tag} uppercase font-bold tracking-widest leading-tight mt-0.5 ${
              isWhite ? 'text-amber-300/90' : 'text-coffee-600'
            }`}
          >
            Finance & Savings
          </span>
        )}
      </div>
    </div>
  );
}
