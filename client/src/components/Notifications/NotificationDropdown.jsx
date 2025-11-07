import React, { useCallback } from 'react';
import { useNotifications } from '../../context/NotificationsProvider';
import { markAllAsRead, markNotificationAsRead, deleteNotification } from '../../api/notificationsApi';
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
    <div className="max-h-[480px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="font-medium">Notifications</div>
        <div className="flex gap-2">
          <Button
            onClick={onMarkAll}
            variant="ghost"
            size="sm"
            className="text-xs h-8"
          >
            Mark all read
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-xs h-8"
          >
            Close
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          items.map((notification) => (
            <div
              key={notification._id}
              className={`p-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors ${
                !notification.isRead ? 'bg-accent/30' : ''
              }`}
            >
              <Link
                to={notification.link || '#'}
                className="group flex items-start gap-3"
                onClick={onClose}
              >
                <TypeIcon type={notification.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              </Link>
              <div className="mt-2 flex gap-2">
                {!notification.isRead && (
                  <Button
                    onClick={() => onMarkOne(notification._id)}
                    variant="secondary"
                    size="sm"
                    className="text-xs h-7"
                  >
                    Mark read
                  </Button>
                )}
                <Button
                  onClick={() => onDelete(notification._id)}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
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