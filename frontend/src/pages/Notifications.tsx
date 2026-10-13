import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Upload,
  UserPlus,
  Info,
  AlertTriangle,
  Clock,
  Check,
} from 'lucide-react';
import { Notification } from '../types';
import * as notificationService from '../services/notificationService';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const isDemo = user?.email === 'demo@paperlessfamily.com';
      const res = await notificationService.getNotifications();
      if (res && res.data && res.data.length > 0) {
        setNotifications(res.data);
      } else if (isDemo) {
        // Fallback sample notifications matching prompt for demo account only
        setNotifications([
          {
            id: 1,
            title: "Mom's passport expires in 18 days",
            message: "Priya Sharma's Passport will expire on 18 Aug 2028. Schedule renewal appointment.",
            type: 'EXPIRY',
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            title: 'Vehicle insurance expires next month',
            message: "Raj Sharma's Honda City comprehensive policy is due for renewal in 32 days.",
            type: 'EXPIRY',
            read: false,
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: 3,
            title: 'New document uploaded by Dad',
            message: "Raj Sharma uploaded 'Health Insurance Policy' to the Family Vault.",
            type: 'UPLOAD',
            read: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 4,
            title: "Grandmother's medical report was added",
            message: "Annual cardiac checkup report safely archived with high-grade encryption.",
            type: 'UPLOAD',
            read: true,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
        ]);
      } else {
        setNotifications([]);
      }
    } catch {
      if (user?.email !== 'demo@paperlessfamily.com') {
        setNotifications([]);
      }
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All marked as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'EXPIRY':
        return <AlertTriangle className="w-4 h-4 text-black stroke-[2.2]" />;
      case 'UPLOAD':
        return <Upload className="w-4 h-4 text-black stroke-[2.2]" />;
      case 'MEMBER':
        return <UserPlus className="w-4 h-4 text-black stroke-[2.2]" />;
      default:
        return <Info className="w-4 h-4 text-black stroke-[2.2]" />;
    }
  };

  const getAccent = (type: string) => {
    switch (type) {
      case 'EXPIRY':
        return 'bg-pink';
      case 'UPLOAD':
        return 'bg-lime';
      case 'MEMBER':
        return 'bg-cyan';
      default:
        return 'bg-purple text-white';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-1.5 border-black/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-lime border border-black text-[10px] font-black uppercase tracking-wider mb-1.5">
            <span>ACTIVITY LEDGER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Automated alerts for renewals, uploads, and household updates.
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="neo-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs font-black uppercase tracking-wider self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 stroke-[2.5]" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* 2. NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="neo-box p-12 text-center bg-white space-y-2">
            <Bell className="w-8 h-8 text-black mx-auto stroke-[1.8]" />
            <h3 className="text-base font-black text-black">All caught up! 🎉</h3>
            <p className="text-xs text-gray-500 font-semibold">No pending alerts right now.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              className={`neo-box-interactive p-4 cursor-pointer flex items-start justify-between gap-4 transition-all ${
                n.read ? 'bg-white opacity-80' : 'bg-cream shadow-neo-md'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg border-1.5 border-black flex items-center justify-center shrink-0 ${getAccent(
                    n.type
                  )}`}
                >
                  {getIcon(n.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-xs sm:text-sm font-black text-black truncate">
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-pink border border-black shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-gray-500 block">
                  {formatRelativeTime(n.createdAt)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-black mt-1 inline-block px-1.5 py-0.2 rounded border border-black bg-white">
                  {n.type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
