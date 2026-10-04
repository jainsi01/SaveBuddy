import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Target,
  Users,
  Sparkles,
  Wallet,
  LayoutDashboard,
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';
import Logo from './Logo';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: Wallet },
    { label: 'Goals', path: '/goals', icon: Target },
    { label: 'Group Goals', path: '/group-goals', icon: Users },
    { label: 'AI Planner', path: '/ai-planner', icon: Sparkles },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#FBF9F6]/95 backdrop-blur-md border-b border-coffee-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Identity */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="group block"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Logo size="md" />
        </Link>

        {/* Desktop Navigation Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-cream-100/60 p-1.5 rounded-full border border-coffee-200/60 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-coffee-900 text-white shadow-sm'
                      : 'text-coffee-700 hover:text-coffee-950 hover:bg-cream-200/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification Center */}
              <NotificationBell />

              {/* User Profile Pill */}
              <Link
                to="/profile"
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                  isActive('/profile')
                    ? 'border-coffee-500 bg-cream-100 text-coffee-950'
                    : 'border-coffee-200 hover:bg-cream-100/70 text-coffee-700'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-coffee-800 text-white flex items-center justify-center text-[10px] font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.name ? user.name.split(' ')[0] : 'Profile'}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-100/80 hover:bg-cream-200/80 text-coffee-700 hover:text-coffee-950 text-xs font-semibold transition"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-coffee-700 hover:bg-cream-100 transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Link
                to="/login"
                className="px-4 py-2 rounded-full hover:bg-cream-100 text-coffee-800 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-full bg-coffee-500 hover:bg-coffee-600 text-white shadow-warm-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-coffee-200/80 mt-3 space-y-2 animate-fade-in">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition ${
                    active
                      ? 'bg-coffee-900 text-white'
                      : 'text-coffee-700 hover:bg-cream-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-coffee-200/60 flex items-center justify-between px-2">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-xs font-semibold text-coffee-800 p-2"
            >
              <User className="w-4 h-4 text-coffee-600" />
              <span>My Profile ({user?.name?.split(' ')[0]})</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
