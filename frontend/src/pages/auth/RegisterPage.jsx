import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, Coins, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register, authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currencyPreference: 'INR',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    clearError();
    setLocalError('');
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setLocalError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!formData.email.trim()) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password.length > 72) {
      setLocalError('Password cannot exceed 72 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      currencyPreference: formData.currencyPreference,
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/profile', { replace: true });
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-full bg-coffee-900 border border-coffee-500/40 flex items-center justify-center text-coffee-100 font-serif font-bold text-xl mb-3 shadow-warm-sm">
            SB
          </div>
          <h2 className="font-serif text-2xl font-medium text-coffee-950">Create Your Account</h2>
          <p className="text-xs text-coffee-600">Start planning and achieving your savings goals today.</p>
        </div>

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Registration Error</span>
              <span>{localError || authError}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane.doe@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Currency Preference */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Primary Currency</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Coins className="w-4 h-4" />
              </div>
              <select
                name="currencyPreference"
                value={formData.currencyPreference}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition appearance-none cursor-pointer"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Password (min. 6 characters)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-coffee-400 hover:text-coffee-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white rounded-xl font-semibold shadow-warm-sm hover:shadow-warm-md transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating your account...</span>
              </>
            ) : (
              <span>Create SaveBuddy Account</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-2 text-center text-xs text-coffee-600">
          <span>Already have an account? </span>
          <Link to="/login" className="font-semibold text-coffee-500 hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
