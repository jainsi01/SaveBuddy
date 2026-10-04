import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import Logo from '../../components/common/Logo';

export default function LoginPage() {
  const { login, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const destination = location.state?.from?.pathname || '/dashboard';

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

    if (!formData.email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!formData.password) {
      setLocalError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    const result = await login(formData.email, formData.password);
    setSubmitting(false);

    if (result.success) {
      navigate(destination, { replace: true });
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-coffee-950">Welcome Back</h2>
          <p className="text-xs text-coffee-600">Enter your credentials to access your savings dashboard.</p>
        </div>

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Authentication Error</span>
              <span>{localError || authError}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Password</label>
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
                autoComplete="current-password"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white rounded-xl font-semibold shadow-warm-sm hover:shadow-warm-md transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to SaveBuddy</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-2 text-center text-xs text-coffee-600">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="font-semibold text-coffee-500 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
