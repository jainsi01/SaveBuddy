import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Target, Plus, Search, Filter, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import GoalCard from '../../components/goals/GoalCard';
import GoalFormModal from '../../components/goals/GoalFormModal';

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      } else {
        queryParams.append('status', 'all');
      }
      if (categoryFilter !== 'all') {
        queryParams.append('category', categoryFilter);
      }

      const response = await api.get(`/goals?${queryParams.toString()}`);
      setGoals(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch savings goals.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (payload) => {
    try {
      const response = await api.post('/goals', payload);
      setGoals((prev) => [response.data, ...prev]);
      return { success: true };
    } catch (err) {
      return { error: err.message || 'Failed to create goal.' };
    }
  };

  // Filter goals by search query on title/description
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals;
    const q = searchQuery.toLowerCase();
    return goals.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }, [goals, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="border-b border-coffee-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-coffee-500 uppercase">
            Personal Wealth Objectives
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-coffee-950 mt-1">
            Savings Goals
          </h1>
          <p className="text-xs text-coffee-600 mt-1">
            Track your milestones, monitor target balances, and pace your weekly contributions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-coffee-500 hover:bg-coffee-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-warm-sm hover:shadow-warm-md transition self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-coffee-200/80 rounded-2xl shadow-sm text-xs self-start">
          {[
            { id: 'active', label: 'Active Targets' },
            { id: 'completed', label: 'Completed' },
            { id: 'archived', label: 'Archived' },
            { id: 'all', label: 'All Goals' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-coffee-500 text-white shadow-sm'
                  : 'text-coffee-700 hover:text-coffee-950 hover:bg-coffee-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-coffee-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-coffee-200/80 text-xs bg-white text-coffee-950 focus:outline-none focus:border-coffee-500 shadow-sm"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-xs text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold block">Failed to load goals</span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchGoals}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Goals Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-coffee-200/50 shadow-sm animate-pulse space-y-4"
            >
              <div className="w-24 h-4 bg-coffee-100 rounded-lg" />
              <div className="w-48 h-6 bg-coffee-100 rounded-lg" />
              <div className="w-full h-3 bg-coffee-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200/80 shadow-warm-sm space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-coffee-100 flex items-center justify-center text-3xl">
            🎯
          </div>
          <h3 className="font-serif text-xl font-medium text-coffee-950">
            {searchQuery
              ? 'No matching goals found'
              : statusFilter === 'completed'
              ? 'No completed goals yet'
              : 'No savings goals set'}
          </h3>
          <p className="text-xs text-coffee-600 leading-relaxed max-w-xs mx-auto">
            {searchQuery
              ? 'Try modifying your search query or switching filter tabs.'
              : 'Create your first savings objective to track contributions and receive automated milestones.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-5 py-2.5 bg-coffee-500 hover:bg-coffee-600 text-white rounded-full text-xs font-semibold shadow-warm-sm transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Goal</span>
            </button>
          )}
        </div>
      ) : (
        /* Grid of Goals */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} currency={user?.currencyPreference || 'INR'} />
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGoal}
      />
    </div>
  );
}
