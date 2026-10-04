import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Plane,
  Laptop,
  GraduationCap,
  Car,
  Home,
  Heart,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
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

export default function GoalCard({ goal, currency = 'INR', onAddMoney }) {
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

  const deadlineFormatted = new Date(goal.deadline).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate monthly pacing
  const daysLeft = goal.daysRemaining || 30;
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const remainingAmt = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthlyPace = Math.ceil(remainingAmt / monthsLeft);

  return (
    <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm hover:shadow-warm-md hover:border-coffee-300 transition-all flex flex-col justify-between group">
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
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
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
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              On Track
            </span>
          )}
        </div>

        {/* Goal Title & Description */}
        <Link to={`/goals/${goal.id}`} className="block group-hover:text-coffee-600 transition">
          <h3 className="font-serif text-lg font-medium text-coffee-950 line-clamp-1">
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-xs text-coffee-600 mt-1 line-clamp-2 leading-relaxed">
              {goal.description}
            </p>
          )}
        </Link>
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
          {!isCompleted && !isArchived && (
            <span className="font-medium text-coffee-600 bg-cream-100/70 px-2 py-0.5 rounded-md">
              Save ~{formatCurrency(monthlyPace)}/mo
            </span>
          )}
        </div>

        {/* Action Buttons: Add Money or View Details */}
        <div className="pt-3 border-t border-coffee-100 flex items-center justify-between text-xs font-semibold">
          {!isCompleted && !isArchived && onAddMoney ? (
            <button
              onClick={() => onAddMoney(goal)}
              className="text-coffee-700 hover:text-coffee-950 inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-cream-100 transition"
            >
              <Plus className="w-3.5 h-3.5 text-coffee-600" />
              <span>Add Money</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-coffee-500">
              <Calendar className="w-3 h-3 text-coffee-400" />
              <span>Due {deadlineFormatted}</span>
            </div>
          )}

          <Link
            to={`/goals/${goal.id}`}
            className="text-coffee-600 hover:text-coffee-950 inline-flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-cream-100 transition"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
