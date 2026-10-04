import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Target,
  Users,
  Sparkles,
  Shield,
  ArrowRight,
  CheckCircle2,
  PieChart,
  Coins,
  Lock,
} from 'lucide-react';
import Logo from '../components/common/Logo';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  // If already logged in, redirect straight to their personal finance dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-20 max-w-7xl mx-auto py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 pb-12 max-w-3xl mx-auto px-4">
        <div className="flex justify-center mb-3">
          <Logo size="xl" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-coffee-100/90 text-coffee-800 text-xs font-semibold border border-coffee-200 shadow-sm animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Intelligent Personal Finance & Goal Planning</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-coffee-950 leading-tight">
          Save with purpose, <br />
          <span className="italic font-normal text-coffee-600">grow with confidence.</span>
        </h1>

        <p className="text-sm sm:text-base text-coffee-700 leading-relaxed max-w-2xl mx-auto font-normal">
          SaveBuddy helps you take control of your monthly cash flow, set achievable individual and group savings goals, and harness Gemini AI to pace your wealth journey without financial stress.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-coffee-500 hover:bg-coffee-600 text-white font-semibold text-sm shadow-warm-md hover:shadow-warm-lg transition flex items-center justify-center gap-2 group"
          >
            <span>Start Saving for Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-cream-50 text-coffee-800 font-semibold text-sm border border-coffee-200/80 shadow-sm transition"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-coffee-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero hidden fees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Powered by Gemini 1.5 Flash</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Bank-grade JWT security</span>
          </div>
        </div>
      </section>

      {/* Product Mockup Preview Card */}
      <section className="px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-coffee-200/80 shadow-warm-lg max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-coffee-100 pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-coffee-500">Live Experience Preview</span>
              <h2 className="font-serif text-2xl font-medium text-coffee-950 mt-0.5">Your Financial Command Center</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Healthy Cash Flow
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-cream-50/70 p-5 rounded-2xl border border-coffee-100">
              <span className="text-xs text-coffee-600 font-medium">Monthly Inflow</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">₹50,000</div>
              <span className="text-[10px] text-coffee-500">Salary & side earnings</span>
            </div>
            <div className="bg-cream-50/70 p-5 rounded-2xl border border-coffee-100">
              <span className="text-xs text-coffee-600 font-medium">Monthly Expenses</span>
              <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1">₹32,000</div>
              <span className="text-[10px] text-coffee-500">Essentials & lifestyle</span>
            </div>
            <div className="bg-cream-50/70 p-5 rounded-2xl border border-coffee-100">
              <span className="text-xs text-coffee-600 font-medium">Available to Save</span>
              <div className="text-xl sm:text-2xl font-bold text-coffee-950 mt-1">₹18,000</div>
              <span className="text-[10px] text-emerald-700 font-semibold">36% savings potential</span>
            </div>
            <div className="bg-coffee-900 text-white p-5 rounded-2xl border border-coffee-800 shadow-sm">
              <span className="text-xs text-cream-200 font-medium">Total Saved So Far</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">₹1,12,000</div>
              <span className="text-[10px] text-amber-300 font-medium">Across 4 active goals</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="px-4 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-coffee-500">Core Capabilities</span>
          <h2 className="font-serif text-3xl font-medium text-coffee-950">Designed around your real financial life</h2>
          <p className="text-xs sm:text-sm text-coffee-600">
            No confusing spreadsheets or complex finance jargon. Just crystal-clear visual targets and effortless progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-7 rounded-3xl border border-coffee-200/80 shadow-warm-sm space-y-4 hover:shadow-warm-md transition">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-coffee-700 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-coffee-950">Personal Savings Goals</h3>
            <p className="text-xs text-coffee-600 leading-relaxed">
              Create targets for emergency funds, travel, tech, or family milestones. Set a target date and let SaveBuddy calculate your required weekly and monthly pace.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-7 rounded-3xl border border-coffee-200/80 shadow-warm-sm space-y-4 hover:shadow-warm-md transition">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-coffee-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-coffee-950">Group Savings Pools</h3>
            <p className="text-xs text-coffee-600 leading-relaxed">
              Planning a group vacation, gift, or room upgrade? Pool contributions with friends or family with transparent balances, shareable invites, and member ledgers.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-7 rounded-3xl border border-coffee-200/80 shadow-warm-sm space-y-4 hover:shadow-warm-md transition">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-coffee-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-serif text-lg font-medium text-coffee-950">Gemini AI Financial Advisor</h3>
            <p className="text-xs text-coffee-600 leading-relaxed">
              Get intelligent roadmap breakdowns, feasibility assessments based on your income, and practical recommendations to save faster without burnout.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-7 rounded-3xl border border-coffee-200/80 shadow-warm-sm space-y-4 hover:shadow-warm-md transition">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-coffee-700 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-coffee-950">Cash Flow & Activity</h3>
            <p className="text-xs text-coffee-600 leading-relaxed">
              Track your inflows, outflows, and goal deposits in a clean ledger. Filter by categories like Food, Rent, Salary, and Shopping at a glance.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-7 rounded-3xl border border-coffee-200/80 shadow-warm-sm space-y-4 hover:shadow-warm-md transition">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-coffee-700 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-coffee-950">Private & Secure</h3>
            <p className="text-xs text-coffee-600 leading-relaxed">
              Your financial records are strictly protected with encrypted credentials, sanitized payloads, and scoped permissions. We never sell your personal data.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-7 rounded-3xl border border-coffee-200/80 shadow-warm-sm space-y-4 hover:shadow-warm-md transition">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-coffee-700 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-coffee-950">Multi-Currency Ready</h3>
            <p className="text-xs text-coffee-600 leading-relaxed">
              Supports INR (₹), USD ($), EUR (€), and GBP (£) with localized formatting and calculations tailored to your currency preference.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="px-4">
        <div className="bg-gradient-to-br from-coffee-900 via-coffee-950 to-coffee-900 text-white rounded-3xl p-8 sm:p-14 text-center max-w-4xl mx-auto space-y-6 shadow-warm-lg">
          <div className="flex justify-center mb-1">
            <Logo size="lg" theme="white" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-cream-100">
            Ready to reach your next savings milestone?
          </h2>
          <p className="text-xs sm:text-sm text-cream-300 max-w-lg mx-auto leading-relaxed">
            Join SaveBuddy today. Create your first goal in under 60 seconds and experience calm, disciplined money management.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-cream-100 hover:bg-white text-coffee-950 font-semibold text-sm shadow-warm-sm transition group"
            >
              <span>Get Started Now — It's Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
