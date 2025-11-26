import React, { useCallback } from 'react';
import { useNotifications } from '../../context/NotificationsProvider';
import { markAllAsRead, markNotificationAsRead, deleteNotification } from '../../services/notifications';
import { Button } from "../ui/button";
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, UserPlus, FileText, Bell } from 'lucide-react';

function TypeIcon({ type }) {
  const iconProps = { className: "h-4 w-4" };
  switch(type) {
    case 'like': return <Heart {...iconProps} />;
    case 'comment': return <MessageSquare {...iconProps} />;
    case 'follow': return <UserPlus {...iconProps} />;
    case 'newPost': return <FileText {...iconProps} />;
    default: return <Bell {...iconProps} />;
  }
}

export default function NotificationDropdown({ onClose }) {
  const { items, setItems } = useNotifications();

  const onMarkOne = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setItems(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [setItems]);

  const onMarkAll = useCallback(async () => {
    try {
      await markAllAsRead();
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [setItems]);

  const onDelete = useCallback(async (id) => {
    try {
      await deleteNotification(id);
      setItems(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [setItems]);

  return (
    <div className="max-h-[480px] w-[370px] bg-white rounded-xl shadow-2xl border flex flex-col overflow-hidden animate-popup">
      <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 rounded-t-xl">
        <div className="text-lg font-semibold text-gray-900">Notifications</div>
        <div className="flex gap-2">
          <Button
            onClick={onMarkAll}
            variant="secondary"
            size="sm"
            className="h-8 px-4 text-xs font-medium text-blue-700 rounded-full bg-blue-50 hover:bg-blue-100"
          >
            Mark all read
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 px-4 text-xs font-medium border border-gray-300 rounded-full hover:bg-gray-100"
          >
            Close
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-8 text-base text-center text-gray-400">
            No notifications
          </div>
        ) : (
          items.map((notification, idx) => (
            <div
              key={notification._id}
              className={`flex flex-col gap-2 px-5 py-4 transition-colors ${
                !notification.isRead ? 'bg-blue-50/60' : 'bg-white'
              } ${idx !== items.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-blue-100/40`}
            >
              <Link
                to={notification.link || '#'}
                className="flex items-start gap-4 group"
                onClick={onClose}
              >
                <span className={`rounded-full flex items-center justify-center h-9 w-9 shadow-sm ${
                  notification.type === 'like' ? 'bg-pink-100 text-pink-600' :
                  notification.type === 'comment' ? 'bg-green-100 text-green-600' :
                  notification.type === 'follow' ? 'bg-yellow-100 text-yellow-600' :
                  notification.type === 'newPost' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <TypeIcon type={notification.type} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] leading-snug text-gray-900 font-medium">
                    {notification.message}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              </Link>
              <div className="flex gap-2 mt-1">
                {!notification.isRead && (
                  <Button
                    onClick={() => onMarkOne(notification._id)}
                    variant="secondary"
                    size="sm"
                    className="px-3 text-xs text-blue-700 bg-blue-100 rounded-full h-7 hover:bg-blue-200"
                  >
                    Mark read
                  </Button>
                )}
                <Button
                  onClick={() => onDelete(notification._id)}
                  variant="ghost"
                  size="sm"
                  className="px-3 text-xs border border-gray-200 rounded-full h-7 hover:bg-gray-100"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}