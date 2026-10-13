import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Upload,
  UserPlus,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Notification } from '../types';
import * as notificationService from '../services/notificationService';
import { formatRelativeTime } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

export const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isDemo = user?.email === 'demo@paperlessfamily.com';
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      if (listRes.data && listRes.data.length > 0) {
        setNotifications(listRes.data.slice(0, 5));
      } else if (isDemo) {
        // Fallback sample for demo account only
        setNotifications([
          {
            id: 1,
            title: "Mom's passport expires in 18 days",
            message: 'Priya Sharma • Renewal due soon',
            type: 'EXPIRY',
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            title: 'Vehicle insurance expires next month',
            message: 'Raj Sharma • Honda City',
            type: 'EXPIRY',
            read: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 3,
            title: 'New document uploaded by Dad',
            message: 'Health Insurance policy added',
            type: 'UPLOAD',
            read: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      } else {
        setNotifications([]);
      }
      if (countRes.data) {
        setUnreadCount(countRes.data.count || 0);
      } else if (isDemo) {
        setUnreadCount(2);
      } else {
        setUnreadCount(0);
      }
    } catch {
      if (user?.email === 'demo@paperlessfamily.com') {
        setUnreadCount(2);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Soft fail
      }
    }
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border-1.5 border-black bg-cream shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition text-black"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 stroke-[2.2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-pink text-black text-[10px] font-black rounded-full border border-black flex items-center justify-center shadow-neo-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-neo-xl border-1.5 border-black z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b-1.5 border-black bg-cream flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-pink text-black border border-black text-[10px] font-black">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-purple hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-gray-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 cursor-pointer hover:bg-cream transition-colors flex items-start gap-2.5 ${
                    !n.read ? 'bg-cream/50' : 'bg-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-md border border-black flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === 'EXPIRY' ? 'bg-pink' : 'bg-lime'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-black stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-black truncate">{n.title}</p>
                    <p className="text-[11px] text-gray-600 line-clamp-1">{n.message}</p>
                    <span className="text-[9px] font-bold text-gray-500 mt-0.5 block">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-pink border border-black shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t-1.5 border-black bg-cream text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-extrabold text-black hover:text-purple uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span>View All Activity</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
