import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, LogIn } from 'lucide-react';
import HealthStatusBadge from './HealthStatusBadge';

export default function Header({ systemStatus }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F7F3EE]/90 backdrop-blur-md border-b border-coffee-200/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Emblem */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-coffee-900 border border-coffee-500/40 flex items-center justify-center text-coffee-100 font-serif font-bold text-lg shadow-warm-sm group-hover:scale-105 transition">
            SB
          </div>
          <div>
            <span className="font-serif text-xl font-medium tracking-tight text-coffee-950 block">
              SaveBuddy
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-coffee-500 block -mt-1">
              Finance & Savings
            </span>
          </div>
        </Link>

        {/* Navigation & Status Badge */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 text-xs font-semibold text-coffee-700">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg hover:bg-coffee-200/50 hover:text-coffee-950 transition"
            >
              System Health
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="px-3 py-1.5 rounded-lg hover:bg-coffee-200/50 hover:text-coffee-950 transition flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-coffee-500" />
                  <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-coffee-200/40 hover:bg-coffee-200 text-coffee-800 transition flex items-center gap-1.5"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg hover:bg-coffee-200/50 hover:text-coffee-950 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-full bg-coffee-500 hover:bg-coffee-600 text-white font-semibold transition shadow-warm-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-coffee-200">
            <HealthStatusBadge
              status={systemStatus.api}
              label={systemStatus.api === 'UP' ? 'API Online' : 'API Offline'}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
