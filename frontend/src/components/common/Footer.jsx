import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Shield, Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#F7F3EE] border-t border-coffee-200/80 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-coffee-200/60">
          {/* Logo & Tagline */}
          <div className="space-y-2">
            <Logo size="md" />
            <p className="text-xs text-coffee-600 max-w-sm leading-relaxed">
              Personal finance & collaborative savings tracker powered by Google Gemini AI. Purpose-driven money management for your life milestones.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-coffee-700">
            <Link to="/dashboard" className="hover:text-coffee-950 transition">
              Dashboard
            </Link>
            <Link to="/transactions" className="hover:text-coffee-950 transition">
              Transactions
            </Link>
            <Link to="/goals" className="hover:text-coffee-950 transition">
              Savings Goals
            </Link>
            <Link to="/group-goals" className="hover:text-coffee-950 transition">
              Group Pools
            </Link>
            <Link to="/ai-planner" className="hover:text-coffee-950 transition">
              AI Planner
            </Link>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-coffee-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} SaveBuddy Finance. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Shield className="w-3.5 h-3.5" />
              <span>Bank-grade JWT Encryption</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-coffee-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gemini 1.5 Flash</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
