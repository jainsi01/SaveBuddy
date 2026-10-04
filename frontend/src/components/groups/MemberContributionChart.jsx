import React from 'react';
import { Award, Users } from 'lucide-react';

/**
 * MemberContributionChart Component (FR-07, Section 6.2, EC-6.6, EC-6.7)
 * Visual leaderboard and proportional breakdown of member deposits.
 */
export default function MemberContributionChart({
  breakdown,
  currency = 'INR',
}) {
  if (!breakdown || !breakdown.members || breakdown.members.length === 0) {
    return (
      <div className="py-8 text-center text-coffee-500 text-xs">
        No member contribution data available yet.
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const members = breakdown.members;
  const currentAmount = breakdown.currentAmount || 0;
  const targetAmount = breakdown.targetAmount || 1;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {members.map((member, index) => {
          const isTopContributor = index === 0 && member.totalContributed > 0;
          return (
            <div
              key={member.userId || index}
              className="p-4 rounded-2xl bg-cream-50/60 border border-coffee-200/70 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isTopContributor ? (
                    <Award className="w-4 h-4 text-amber-600" />
                  ) : (
                    <span className="w-4 text-center text-[11px] font-bold text-coffee-400">
                      #{index + 1}
                    </span>
                  )}
                  <span className="font-bold text-coffee-950">{member.name}</span>
                  {member.role === 'owner' && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md border border-amber-200">
                      Owner
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-bold text-coffee-950">
                    {formatCurrency(member.totalContributed)}
                  </span>
                  <span className="text-[11px] text-coffee-500 font-medium ml-1.5">
                    ({member.percentageOfTarget}%)
                  </span>
                </div>
              </div>

              {/* Proportional Contribution Bar */}
              <div className="w-full bg-coffee-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTopContributor
                      ? 'bg-gradient-to-r from-coffee-500 to-coffee-600'
                      : 'bg-coffee-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, member.percentageOfTarget))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-coffee-500 pt-0.5">
                <span>{member.contributionCount || 0} deposits logged</span>
                <span>
                  {currentAmount > 0
                    ? `${member.percentageOfTotalSaved}% of total pool`
                    : '0% of pool'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
