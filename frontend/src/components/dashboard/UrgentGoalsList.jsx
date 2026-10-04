import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, CheckCircle2, Users, Target } from 'lucide-react';

/**
 * UrgentGoalsList Component (FR-08, Section 7.2 Implementation Plan)
 * Highlights active goals with upcoming deadlines requiring attention.
 */
export default function UrgentGoalsList({ urgentGoals = [], currency = 'INR' }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!urgentGoals || urgentGoals.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-sm text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="font-serif text-base font-medium text-coffee-950">
          No Urgent Deadlines Approaching
        </h4>
        <p className="text-xs text-coffee-600 max-w-sm mx-auto">
          All your active savings objectives are comfortably paced with no deadlines due within the next 14 days.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-coffee-200/70">
        <div>
          <h3 className="font-serif text-lg font-medium text-coffee-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Approaching Deadlines</span>
          </h3>
          <p className="text-[11px] text-coffee-500">
            Goals requiring priority deposits within the next 14 days.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
          {urgentGoals.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {urgentGoals.map((goal) => {
          const isUrgentToday = goal.daysRemaining <= 1;
          const targetLink = goal.isGroupGoal ? `/group-goals/${goal.id}` : `/goals/${goal.id}`;

          return (
            <Link
              key={goal.id}
              to={targetLink}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-cream-50/60 hover:bg-cream-100/60 border border-coffee-200/70 transition gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-coffee-500 bg-white px-2 py-0.5 rounded border border-coffee-200/60">
                    {goal.category}
                  </span>
                  {goal.isGroupGoal && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-coffee-700 bg-coffee-100 px-1.5 py-0.2 rounded">
                      <Users className="w-2.5 h-2.5" />
                      <span>Group</span>
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-coffee-950 group-hover:text-coffee-700 transition">
                    {goal.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-coffee-600">
                  <span>
                    Saved: <strong className="text-coffee-900">{formatCurrency(goal.currentAmount)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Target: <strong className="text-coffee-900">{formatCurrency(goal.targetAmount)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                    isUrgentToday
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  {goal.daysRemaining === 0
                    ? 'Due Today!'
                    : goal.daysRemaining === 1
                    ? 'Due Tomorrow'
                    : `Due in ${goal.daysRemaining} days`}
                </span>

                <ArrowRight className="w-4 h-4 text-coffee-400 group-hover:text-coffee-700 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
