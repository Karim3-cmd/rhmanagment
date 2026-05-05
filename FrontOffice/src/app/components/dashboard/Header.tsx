import { useEffect, useState, useRef } from 'react';
import { Bell, Check, ChevronRight, Trash2, X } from 'lucide-react';
import { notificationsApi } from '../../lib/api';
import type { NotificationItem, User, ViewType } from '../../lib/types';

interface HeaderProps {
  user: User;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
}

export function Header({ user, currentView, onViewChange, onLogout }: HeaderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const result = await notificationsApi.list({ userId: user._id, filter: 'all' });
      setNotifications(result.items.slice(0, 5)); // Show last 5
      setUnreadCount(result.unread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user._id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsApi.markRead(id);
    await loadNotifications();
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsApi.markAllRead(user._id);
    await loadNotifications();
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsApi.remove(id);
    await loadNotifications();
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      notificationsApi.markRead(notification._id);
    }
    setShowDropdown(false);
    onViewChange('notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case 'warning':
      case 'alert':
        return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-500" />;
    }
  };

  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {currentView === 'home' && 'Dashboard'}
          {currentView === 'employees' && 'Employees'}
          {currentView === 'skills' && 'Skills'}
          {currentView === 'activities' && 'Activities'}
          {currentView === 'recommendations' && 'Recommendations'}
          {currentView === 'analytics' && 'Analytics'}
          {currentView === 'notifications' && 'Notifications'}
          {currentView === 'profile' && 'Profile'}
          {currentView === 'settings' && 'Settings'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-border z-50 overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-border hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium text-sm truncate ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={(e) => markAsRead(notification._id, e)}
                                  className="p-1 rounded hover:bg-gray-200 text-primary"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => deleteNotification(notification._id, e)}
                                className="p-1 rounded hover:bg-red-100 text-red-500"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.createdAt
                              ? new Date(notification.createdAt).toLocaleString()
                              : 'Just now'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-border bg-gray-50">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onViewChange('notifications');
                    }}
                    className="w-full text-center text-sm text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    View all notifications
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="font-medium text-sm text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
