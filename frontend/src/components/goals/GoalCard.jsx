import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plane, Laptop, GraduationCap, Car, Home, Heart, Target, Calendar, Clock, CheckCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';

const CATEGORY_META = {
  emergency: { icon: Shield, label: 'Safety & Emergency', bg: 'bg-coffee-100 text-coffee-800' },
  travel: { icon: Plane, label: 'Travel & Trips', bg: 'bg-amber-50 text-amber-800' },
  gadgets: { icon: Laptop, label: 'Tech & Gadgets', bg: 'bg-blue-50 text-blue-800' },
  education: { icon: GraduationCap, label: 'Education', bg: 'bg-emerald-50 text-emerald-800' },
  vehicle: { icon: Car, label: 'Vehicle & Mobility', bg: 'bg-purple-50 text-purple-800' },
  home: { icon: Home, label: 'Home & Living', bg: 'bg-orange-50 text-orange-800' },
  lifestyle: { icon: Heart, label: 'Lifestyle', bg: 'bg-rose-50 text-rose-800' },
  other: { icon: Target, label: 'General Savings', bg: 'bg-coffee-100 text-coffee-700' },
};

export default function GoalCard({ goal, currency = 'INR' }) {
  const categoryInfo = CATEGORY_META[goal.category] || CATEGORY_META.other;
  const CategoryIcon = categoryInfo.icon;

  const isCompleted = goal.status === 'completed' || goal.currentAmount >= goal.targetAmount;
  const isArchived = goal.status === 'archived';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const deadlineFormatted = new Date(goal.deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={`/goals/${goal.id}`}
      className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm hover:shadow-warm-md hover:border-coffee-400/80 transition-all flex flex-col justify-between group block"
    >
      <div>
        {/* Top Header: Category Badge + Status */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${categoryInfo.bg}`}>
              <CategoryIcon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-coffee-700 uppercase tracking-wider">
              {categoryInfo.label}
            </span>
          </div>

          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sage-700 bg-sage-100 px-2.5 py-0.5 rounded-full border border-sage-500/20">
              <CheckCircle className="w-3 h-3" />
              <span>Completed</span>
            </span>
          ) : isArchived ? (
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              Archived
            </span>
          ) : goal.daysRemaining <= 14 ? (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              {goal.daysRemaining <= 0 ? 'Due Today' : `${goal.daysRemaining}d left`}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-coffee-600 bg-coffee-50 px-2.5 py-0.5 rounded-full border border-coffee-200/60">
              {goal.daysRemaining} days left
            </span>
          )}
        </div>

        {/* Goal Title & Description */}
        <h3 className="font-serif text-lg font-medium text-coffee-950 group-hover:text-coffee-600 transition line-clamp-1">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-xs text-coffee-600 mt-1 line-clamp-2 leading-relaxed">
            {goal.description}
          </p>
        )}
      </div>

      {/* Progress & Balances */}
      <div className="mt-5 pt-4 border-t border-coffee-100 space-y-3">
        <div className="flex items-baseline justify-between text-xs">
          <div>
            <span className="text-lg font-bold text-coffee-950">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="text-coffee-500 text-[11px] ml-1">saved</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-coffee-700">
              Target: {formatCurrency(goal.targetAmount)}
            </span>
          </div>
        </div>

        <ProgressBar percentage={goal.progressPercentage} size="md" />

        <div className="flex items-center justify-between text-[11px] text-coffee-500 pt-1">
          <span className="font-semibold text-coffee-700">
            {goal.progressPercentage}% reached
          </span>
          <div className="flex items-center gap-1 text-coffee-600">
            <Calendar className="w-3 h-3 text-coffee-400" />
            <span>{deadlineFormatted}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
