import React from 'react';
import { Clock, ArrowUpRight, User, AlignLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContributionHistoryList({
  contributions = [],
  loading = false,
  pagination = null,
  onPageChange = null,
  currency = 'INR',
  onAddClick = null,
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-white rounded-2xl border border-coffee-200/50 shadow-xs animate-pulse flex items-center justify-between"
          >
            <div className="space-y-2">
              <div className="w-24 h-4 bg-coffee-100 rounded" />
              <div className="w-36 h-3 bg-coffee-100 rounded" />
            </div>
            <div className="w-20 h-5 bg-coffee-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!contributions || contributions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-coffee-200/70 shadow-xs space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-coffee-100 flex items-center justify-center text-xl text-coffee-700">
          🪙
        </div>
        <h4 className="font-serif text-base font-medium text-coffee-950">No contributions yet</h4>
        <p className="text-xs text-coffee-600 max-w-xs mx-auto">
          Start building momentum toward this goal by recording your first monetary contribution.
        </p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="mt-2 px-4 py-2 bg-coffee-500 hover:bg-coffee-600 text-white rounded-full text-xs font-semibold shadow-xs transition"
          >
            + Add First Deposit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ledger Table / Items List */}
      <div className="space-y-2.5">
        {contributions.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-white rounded-2xl border border-coffee-200/70 shadow-warm-sm hover:border-coffee-300 transition flex items-center justify-between gap-4"
          >
            {/* Left: Icon & Contributor Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sage-50 text-sage-700 border border-sage-200/60 flex items-center justify-center shrink-0 shadow-xs">
                <ArrowUpRight className="w-4 h-4 text-sage-600" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-coffee-950">
                    {item.userName || 'Contributor'}
                  </span>
                  <span className="text-[10px] text-coffee-400">•</span>
                  <span className="text-[11px] text-coffee-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-coffee-400" />
                    <span>{formatDate(item.date)}</span>
                  </span>
                </div>
                {item.note && (
                  <p className="text-[11px] text-coffee-600 italic line-clamp-1">
                    "{item.note}"
                  </p>
                )}
              </div>
            </div>

            {/* Right: Positive Deposit Amount */}
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-sage-700 block">
                +{formatCurrency(item.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-coffee-200/60 text-xs text-coffee-600">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total deposits)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-coffee-200 bg-white hover:bg-coffee-50 disabled:opacity-40 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-coffee-200 bg-white hover:bg-coffee-50 disabled:opacity-40 transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
