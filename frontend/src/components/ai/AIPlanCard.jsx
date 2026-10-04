import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import MilestoneTimeline from './MilestoneTimeline';

/**
 * AIPlanCard Component (FR-06, Section 5.1 ui_ux_plan.md)
 * Displays Gemini-generated pacing, achievability score, milestones, and tips.
 */
export default function AIPlanCard({
  plan,
  onRegenerate,
  regenerating = false,
  isCompleted = false,
  currency = 'INR',
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [userNotes, setUserNotes] = useState('');

  if (!plan) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getAchievabilityBadge = (score) => {
    switch (score) {
      case 'Very Realistic':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Very Realistic Pacing',
        };
      case 'Realistic':
        return {
          bg: 'bg-coffee-100 text-coffee-800 border-coffee-200',
          label: 'Realistic Pacing',
        };
      case 'Challenging':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Challenging Timeline',
        };
      case 'Very Challenging':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'High Urgency / Challenging',
        };
      default:
        return {
          bg: 'bg-coffee-100 text-coffee-800 border-coffee-200',
          label: score || 'Standard',
        };
    }
  };

  const badge = getAchievabilityBadge(plan.achievabilityScore);

  const handleRegenerateClick = () => {
    onRegenerate({
      preferredFrequency: frequency,
      additionalNotes: userNotes,
    });
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-coffee-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest text-coffee-500 uppercase">
              Gemini AI Advisor
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-coffee-100 text-coffee-700">
              <Sparkles className="w-3 h-3 text-coffee-500" />
              <span>{plan.modelUsed === 'fallback-engine' ? 'Baseline Calculator' : 'Gemini 1.5'}</span>
            </span>
          </div>
          <h3 className="font-serif text-2xl font-medium text-coffee-950 mt-1">
            Personalized Savings Roadmap
          </h3>
          <p className="text-xs text-coffee-600 mt-1">
            AI-calculated milestone cadence to achieve your target on schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="px-3 py-1.5 rounded-xl border border-coffee-200 text-coffee-700 hover:bg-coffee-50 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-coffee-500" />
                <span>Adjust</span>
              </button>
              <button
                type="button"
                onClick={handleRegenerateClick}
                disabled={regenerating}
                className="px-3.5 py-1.5 rounded-xl bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-warm-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>{regenerating ? 'Analyzing...' : 'Regenerate'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Optional Constraint Customizer */}
      {showOptions && !isCompleted && (
        <div className="bg-coffee-50/70 border border-coffee-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
          <h4 className="text-xs font-bold text-coffee-900">Customize AI Pacing Constraints</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-coffee-700 block mb-1">
                Preferred Cadence
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full text-xs rounded-xl border border-coffee-200 bg-white p-2 text-coffee-900 focus:outline-none focus:ring-1 focus:ring-coffee-500"
              >
                <option value="weekly">Weekly Contributions</option>
                <option value="monthly">Monthly Contributions</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-coffee-700 block mb-1">
                Special Context / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Expecting bonus in December, paydays on 1st"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full text-xs rounded-xl border border-coffee-200 bg-white p-2 text-coffee-900 focus:outline-none focus:ring-1 focus:ring-coffee-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleRegenerateClick}
              disabled={regenerating}
              className="px-4 py-1.5 rounded-xl bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-semibold transition shadow-sm"
            >
              Apply & Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Pacing Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weekly Pace */}
        <div className="p-5 rounded-2xl bg-cream-50 border border-coffee-200/80 shadow-sm space-y-1">
          <span className="text-[11px] text-coffee-600 font-semibold uppercase tracking-wider block">
            Recommended Weekly
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-coffee-950">
              {formatCurrency(plan.recommendedWeekly)}
            </span>
            <span className="text-xs text-coffee-600 font-medium">/ week</span>
          </div>
          <p className="text-[11px] text-coffee-500 pt-0.5">Automate every Monday</p>
        </div>

        {/* Monthly Pace */}
        <div className="p-5 rounded-2xl bg-cream-50 border border-coffee-200/80 shadow-sm space-y-1">
          <span className="text-[11px] text-coffee-600 font-semibold uppercase tracking-wider block">
            Recommended Monthly
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-coffee-950">
              {formatCurrency(plan.recommendedMonthly)}
            </span>
            <span className="text-xs text-coffee-600 font-medium">/ month</span>
          </div>
          <p className="text-[11px] text-coffee-500 pt-0.5">Scheduled on salary deposit</p>
        </div>

        {/* Achievability Metric */}
        <div className="p-5 rounded-2xl bg-cream-50 border border-coffee-200/80 shadow-sm space-y-2">
          <span className="text-[11px] text-coffee-600 font-semibold uppercase tracking-wider block">
            Feasibility Rating
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${badge.bg}`}
          >
            {badge.label}
          </span>
          <p className="text-[11px] text-coffee-500">Based on target and deadline</p>
        </div>
      </div>

      {/* Milestone Checkpoints Timeline */}
      {plan.milestones && plan.milestones.length > 0 && (
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-coffee-950 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-coffee-500" />
            <span>Milestone Checkpoints</span>
          </h4>
          <MilestoneTimeline milestones={plan.milestones} currency={currency} />
        </div>
      )}

      {/* Practical Actionable Recommendations */}
      {plan.practicalRecommendations && plan.practicalRecommendations.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-coffee-950 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-coffee-500" />
            <span>AI Practical Tips</span>
          </h4>
          <div className="space-y-2">
            {plan.practicalRecommendations.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-coffee-50/50 border border-coffee-200/60 text-xs text-coffee-800"
              >
                <div className="w-5 h-5 rounded-full bg-coffee-200 text-coffee-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  ✓
                </div>
                <p className="leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-fiduciary Legal Disclaimer (EC-5.8, SRS Section 10.3) */}
      <div className="p-3.5 rounded-2xl bg-coffee-100/50 border border-coffee-200/70 flex items-start gap-2.5 text-[11px] text-coffee-600 leading-relaxed italic">
        <ShieldAlert className="w-4 h-4 text-coffee-500 shrink-0 mt-0.5" />
        <span>{plan.disclaimer}</span>
      </div>
    </div>
  );
}
