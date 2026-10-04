import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Wallet,
  Tag,
  ShoppingBag,
  Utensils,
  Home,
  Zap,
  Car,
  Tv,
  Heart,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getTransactions,
  saveTransaction,
  deleteTransaction,
  getMonthlyCashFlow,
} from '../services/transactionService';
import AddTransactionModal from '../components/transactions/AddTransactionModal';

const CATEGORY_ICONS = {
  salary: { icon: ArrowUpRight, color: 'text-emerald-700 bg-emerald-50' },
  freelance: { icon: ArrowUpRight, color: 'text-emerald-700 bg-emerald-50' },
  investment: { icon: TrendingUp, color: 'text-emerald-700 bg-emerald-50' },
  food: { icon: Utensils, color: 'text-amber-800 bg-amber-50' },
  rent: { icon: Home, color: 'text-purple-800 bg-purple-50' },
  utilities: { icon: Zap, color: 'text-blue-800 bg-blue-50' },
  shopping: { icon: ShoppingBag, color: 'text-pink-800 bg-pink-50' },
  transport: { icon: Car, color: 'text-indigo-800 bg-indigo-50' },
  entertainment: { icon: Tv, color: 'text-rose-800 bg-rose-50' },
  health: { icon: Heart, color: 'text-rose-800 bg-rose-50' },
  savings: { icon: Target, color: 'text-coffee-800 bg-coffee-100' },
  default: { icon: Tag, color: 'text-coffee-700 bg-cream-100' },
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(() => {
    if (user?.id) {
      const data = getTransactions(user.id);
      setTransactions(data);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currency = user?.currencyPreference || 'INR';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleSaveTransaction = async (data) => {
    if (user?.id) {
      saveTransaction(user.id, data);
      loadData();
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this transaction from your ledger?')) {
      if (user?.id) {
        deleteTransaction(user.id, id);
        loadData();
      }
    }
  };

  // Compute summary totals
  const summaryMetrics = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let deposits = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') inflow += amt;
      else if (tx.type === 'expense') outflow += amt;
      else if (tx.type === 'contribution') deposits += amt;
    });

    const netSavings = inflow - outflow - deposits;

    return {
      inflow,
      outflow,
      deposits,
      netSavings,
    };
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = tx.title?.toLowerCase().includes(q);
        const noteMatch = tx.note?.toLowerCase().includes(q);
        if (!titleMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-coffee-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-widest text-coffee-500 uppercase">
            Cash Flow & Activity
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-coffee-950 mt-1">
            Transactions Ledger
          </h1>
          <p className="text-xs sm:text-sm text-coffee-600 mt-1">
            Track your inflows, routine expenses, and dedicated goal deposits in one place.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-coffee-500 hover:bg-coffee-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-warm-sm hover:shadow-warm-md transition self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-white rounded-3xl p-5 border border-coffee-200/80 shadow-warm-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wider block">
              Total Inflow
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              +{formatCurrency(summaryMetrics.inflow)}
            </div>
            <span className="text-[10px] text-coffee-500">Earnings & credits</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white rounded-3xl p-5 border border-coffee-200/80 shadow-warm-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wider block">
              Total Expenses
            </span>
            <div className="text-2xl font-bold text-rose-700 mt-1">
              -{formatCurrency(summaryMetrics.outflow)}
            </div>
            <span className="text-[10px] text-coffee-500">Living costs & leisure</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Goal Deposits */}
        <div className="bg-white rounded-3xl p-5 border border-coffee-200/80 shadow-warm-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wider block">
              Goal Deposits
            </span>
            <div className="text-2xl font-bold text-coffee-800 mt-1">
              {formatCurrency(summaryMetrics.deposits)}
            </div>
            <span className="text-[10px] text-coffee-500">Dedicated savings</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cream-100 text-coffee-700 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white rounded-3xl p-5 border border-coffee-200/80 shadow-warm-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wider block">
              Unallocated Reserves
            </span>
            <div className="text-2xl font-bold text-coffee-950 mt-1">
              {formatCurrency(summaryMetrics.netSavings)}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Available for new goals</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-coffee-100 text-coffee-900 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-3xl p-4 border border-coffee-200/80 shadow-warm-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-cream-50 rounded-2xl border border-coffee-200/60 text-xs w-full md:w-auto">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'income', label: 'Income Only' },
            { id: 'expense', label: 'Expenses Only' },
            { id: 'contribution', label: 'Goal Deposits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
                typeFilter === tab.id
                  ? 'bg-coffee-500 text-white shadow-sm'
                  : 'text-coffee-700 hover:text-coffee-950 hover:bg-cream-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-2xl border border-coffee-200 text-xs text-coffee-800 bg-cream-50 focus:outline-none focus:border-coffee-500"
          >
            <option value="all">All Categories</option>
            <option value="salary">Salary & Wages</option>
            <option value="food">Food & Dining</option>
            <option value="rent">Rent & Housing</option>
            <option value="utilities">Utilities & Bills</option>
            <option value="shopping">Shopping</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="savings">Savings Deposits</option>
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-coffee-200 text-xs text-coffee-950 bg-cream-50 focus:outline-none focus:border-coffee-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table & Mobile Cards */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200/80 shadow-warm-sm space-y-3 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-cream-100 flex items-center justify-center text-2xl mx-auto">
            🧾
          </div>
          <h3 className="font-serif text-xl font-medium text-coffee-950">No transactions found</h3>
          <p className="text-xs text-coffee-600 max-w-xs mx-auto">
            {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try relaxing your filters or search terms.'
              : 'Start logging your daily income and expenditures to maintain accurate cash flow insight.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-5 py-2.5 rounded-full bg-coffee-500 text-white text-xs font-semibold shadow-warm-sm hover:bg-coffee-600 transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Transaction</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-coffee-200/80 shadow-warm-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-50 border-b border-coffee-200 text-coffee-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6 text-right">Amount</th>
                  <th className="py-3.5 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100 text-coffee-900 font-medium">
                {filteredTransactions.map((tx) => {
                  const meta = CATEGORY_ICONS[tx.category] || CATEGORY_ICONS.default;
                  const Icon = meta.icon;
                  const formattedDate = new Date(tx.date || tx.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-cream-50/50 transition">
                      <td className="py-4 px-6 text-coffee-600 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-coffee-950">{tx.title}</div>
                        {tx.note && <div className="text-[11px] text-coffee-500">{tx.note}</div>}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span className="capitalize">{tx.category?.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.type === 'expense'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-coffee-100 text-coffee-800'
                          }`}
                        >
                          {tx.type === 'contribution' ? 'Goal Deposit' : tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            tx.type === 'income'
                              ? 'text-emerald-700'
                              : tx.type === 'expense'
                              ? 'text-rose-700'
                              : 'text-coffee-800'
                          }
                        >
                          {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-coffee-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-coffee-100 p-3 space-y-3">
            {filteredTransactions.map((tx) => {
              const meta = CATEGORY_ICONS[tx.category] || CATEGORY_ICONS.default;
              const Icon = meta.icon;
              const formattedDate = new Date(tx.date || tx.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <div key={tx.id} className="pt-3 pb-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-coffee-950 text-xs">{tx.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-coffee-500 mt-0.5">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="capitalize">{tx.category}</span>
                      </div>
                      {tx.note && <p className="text-[10px] text-coffee-400 mt-0.5">{tx.note}</p>}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-xs font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-700'
                          : tx.type === 'expense'
                          ? 'text-rose-700'
                          : 'text-coffee-800'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-coffee-300 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        currency={currency}
      />
    </div>
  );
}
