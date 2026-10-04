import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#FAF7F2] border-t border-coffee-200/80 py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-coffee-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-coffee-500"></span>
          <span>SaveBuddy (FIN-10) — Built with MERN Stack + Google Gemini AI</span>
        </div>
        <div className="flex items-center gap-4 text-coffee-500 font-medium">
          <span>Module 1: Foundation & Setup</span>
          <span>•</span>
          <span className="text-coffee-700 font-serif italic">October 2026 Baseline</span>
        </div>
      </div>
    </footer>
  );
}
