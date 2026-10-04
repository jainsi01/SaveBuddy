import React from 'react';
import { Crown, User, UserX } from 'lucide-react';

/**
 * GroupMemberBadge Component (FR-07, Section 6.2 Implementation Plan)
 * Displays a group member's avatar, role, contribution statistics, and action buttons.
 */
export default function GroupMemberBadge({
  member,
  isOwnerView = false,
  currentUserId,
  onRemove,
  currency = 'INR',
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const isOwner = member.role === 'owner';
  const isSelf = member.userId === currentUserId;
  const canRemove = (isOwnerView && !isOwner) || (isSelf && !isOwner);

  // Avatar initials
  const initials = member.name
    ? member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-coffee-200/80 shadow-sm hover:border-coffee-300 transition">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${
            isOwner
              ? 'bg-gradient-to-br from-coffee-500 to-coffee-600 text-white'
              : 'bg-coffee-100 text-coffee-800'
          }`}
        >
          {initials}
        </div>

        {/* Member Details */}
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-coffee-950">{member.name}</h4>
            {isSelf && (
              <span className="text-[10px] font-semibold text-coffee-500 bg-coffee-50 px-1.5 py-0.2 rounded-md">
                (You)
              </span>
            )}
            {isOwner ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                <Crown className="w-2.5 h-2.5 text-amber-700" />
                <span>Owner</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-coffee-100 text-coffee-700">
                Member
              </span>
            )}
          </div>
          <span className="text-[11px] text-coffee-500 block">{member.email}</span>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center gap-4">
        {typeof member.totalContributed !== 'undefined' && (
          <div className="text-right">
            <span className="text-xs font-bold text-coffee-950 block">
              {formatCurrency(member.totalContributed)}
            </span>
            <span className="text-[10px] text-coffee-500 font-medium">
              {member.percentageOfTotalSaved || 0}% of pool
            </span>
          </div>
        )}

        {canRemove && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(member.userId, member.name)}
            title={isSelf ? 'Leave group' : 'Remove member'}
            className="p-1.5 rounded-lg text-coffee-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <UserX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
