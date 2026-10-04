import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  Users,
  Coins,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/api';

/**
 * NotificationBell Component (FR-09, Section 7.2 Implementation Plan, EC-7.4)
 * Dropdown popover displaying unread alert counts and notification history.
 */
export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const response = await fetchNotifications();
      setNotifications(response.data || []);
      setUnreadCount(response.meta?.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, goalId) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (goalId) {
        setIsOpen(false);
        navigate(`/goals/${goalId}`);
      }
    } catch (err) {
      console.warn('Failed to mark read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline_warning':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'goal_completed':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'group_invite':
        return <Users className="w-4 h-4 text-coffee-600" />;
      case 'contribution_logged':
        return <Coins className="w-4 h-4 text-coffee-600" />;
      default:
        return <Bell className="w-4 h-4 text-coffee-600" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-xl text-coffee-700 hover:bg-coffee-200/50 hover:text-coffee-950 transition"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-coffee-200/90 shadow-warm-lg z-50 overflow-hidden animate-in fade-in">
          {/* Header */}
          <div className="p-4 border-b border-coffee-200/70 flex items-center justify-between bg-cream-50/50">
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-sm font-medium text-coffee-950">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-coffee-600 hover:text-coffee-950 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-coffee-500" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-coffee-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-coffee-500 space-y-1">
                <Bell className="w-6 h-6 text-coffee-300 mx-auto" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.goalId)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition hover:bg-cream-50/80 ${
                    !n.isRead ? 'bg-coffee-50/40' : 'bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-coffee-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h5
                        className={`text-xs ${
                          !n.isRead ? 'font-bold text-coffee-950' : 'font-medium text-coffee-800'
                        }`}
                      >
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-coffee-400">
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-coffee-600 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
