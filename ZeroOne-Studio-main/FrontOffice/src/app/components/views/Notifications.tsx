import { useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCircle, Filter, Info, Trash2 } from 'lucide-react';
import { notificationsApi } from '../../lib/api';
import type { NotificationItem, User } from '../../lib/types';

interface NotificationsProps {
  user: User;
}

export function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const loadNotifications = async () => {
    const result = await notificationsApi.list({ userId: user._id, filter, category: categoryFilter });
    if (!result.items.length) {
      await notificationsApi.seed(user._id);
      const seeded = await notificationsApi.list({ userId: user._id, filter, category: categoryFilter });
      setNotifications(seeded.items);
      return;
    }
    setNotifications(result.items);
  };

  useEffect(() => {
    loadNotifications().catch(console.error);
  }, [user._id, filter, categoryFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const categories = ['All', 'Recommendation', 'Activity', 'Skill', 'System'];

  const markAsRead = async (id: string) => {
    await notificationsApi.markRead(id);
    await loadNotifications();
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllRead(user._id);
    await loadNotifications();
  };

  const deleteNotification = async (id: string) => {
    await notificationsApi.remove(id);
    await loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Notifications</h1>
          <p className="text-muted-foreground">Live notification center for the signed-in user.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary"><Bell className="w-4 h-4" />{unreadCount} unread</div>
          <button onClick={markAllAsRead} className="px-4 py-2 rounded-lg bg-primary text-white">Mark all read</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-border flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-muted-foreground" /><select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'unread')} className="px-4 py-2 border border-input rounded-lg"><option value="all">All</option><option value="unread">Unread</option></select></div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 border border-input rounded-lg">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 border border-border text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              When you are assigned to an activity, you will receive a notification here.
              Check the Activities page to see your current assignments.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
          <div key={notification._id} className={`bg-white rounded-lg shadow-sm p-5 border ${notification.read ? 'border-border' : 'border-primary/40'}`}>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-secondary">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-secondary text-gray-700">{notification.category}</span>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-muted-foreground">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'just now'}</span>
                  <div className="flex items-center gap-4">
                    {!notification.read && <button onClick={() => markAsRead(notification._id)} className="text-primary hover:underline">Mark as read</button>}
                    <button onClick={() => deleteNotification(notification._id)} className="text-destructive hover:underline flex items-center gap-1"><Trash2 className="w-4 h-4" />Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}
