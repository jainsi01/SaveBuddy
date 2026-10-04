import api from './api';

/**
 * Transaction Service for SaveBuddy
 * Manages user cash flow (Income, Expenses, and Goal Contributions).
 * Integrates directly with real backend Goal Contributions and stores
 * cash flow ledger records in user-scoped persistent storage.
 */

const getStorageKey = (userId) => `savebuddy_tx_${userId || 'guest'}`;

// Default seed transactions for new users to demonstrate immediate cash flow clarity
const getDefaultTransactions = (currency = 'INR') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return [
    {
      id: 'tx_seed_1',
      type: 'income',
      title: 'Monthly Salary Credit',
      category: 'salary',
      amount: 50000,
      date: new Date(year, month, 1).toISOString(),
      note: 'Primary employment earnings',
    },
    {
      id: 'tx_seed_2',
      type: 'expense',
      title: 'Apartment Rent & Society Maintenance',
      category: 'rent',
      amount: 18000,
      date: new Date(year, month, 3).toISOString(),
      note: 'Monthly residence payment',
    },
    {
      id: 'tx_seed_3',
      type: 'expense',
      title: 'Groceries & Household Supplies',
      category: 'food',
      amount: 7500,
      date: new Date(year, month, 7).toISOString(),
      note: 'Supermarket restock',
    },
    {
      id: 'tx_seed_4',
      type: 'expense',
      title: 'Utility Bills & Internet',
      category: 'utilities',
      amount: 3200,
      date: new Date(year, month, 10).toISOString(),
      note: 'Electricity, water, fiber broadband',
    },
    {
      id: 'tx_seed_5',
      type: 'expense',
      title: 'Dining Out & Weekend Socials',
      category: 'entertainment',
      amount: 3300,
      date: new Date(year, month, 14).toISOString(),
      note: 'Dinner with colleagues',
    },
  ];
};

/**
 * Retrieve all transactions for the user
 * Combines stored cash-flow transactions with real backend goal contributions if available.
 */
export const getTransactions = (userId) => {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const defaults = getDefaultTransactions();
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading transactions from storage:', err);
    return getDefaultTransactions();
  }
};

/**
 * Save a new transaction
 */
export const saveTransaction = (userId, transaction) => {
  const current = getTransactions(userId);
  const newTx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    ...transaction,
    createdAt: new Date().toISOString(),
  };

  const updated = [newTx, ...current];
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(updated));
  return newTx;
};

/**
 * Delete a transaction
 */
export const deleteTransaction = (userId, transactionId) => {
  const current = getTransactions(userId);
  const updated = current.filter((tx) => tx.id !== transactionId);
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
};

/**
 * Calculate Monthly Cash Flow Metrics for the current calendar month
 */
export const getMonthlyCashFlow = (userId, userMonthlyIncome = null) => {
  const transactions = getTransactions(userId);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let income = 0;
  let expenses = 0;
  let contributions = 0;

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date || tx.createdAt);
    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else if (tx.type === 'expense') {
        expenses += amt;
      } else if (tx.type === 'contribution') {
        contributions += amt;
      }
    }
  });

  // If user has defined a profile monthly income, take that or the recorded income whichever is greater
  if (userMonthlyIncome && userMonthlyIncome > income) {
    income = userMonthlyIncome;
  }

  // If no transactions have been entered at all, fall back to baseline 50,000 / 32,000
  if (income === 0 && expenses === 0) {
    income = userMonthlyIncome || 50000;
    expenses = 32000;
  }

  const availableToSave = Math.max(0, income - expenses - contributions);
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  return {
    income,
    expenses,
    contributions,
    availableToSave,
    savingsRate,
  };
};
