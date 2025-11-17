import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchNotifications } from '../api/notificationsApi';
import { io } from 'socket.io-client';
import { getEnv } from '@/helpers/getEnv';

const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

export default function NotificationsProvider({ currentUser, children }) {
  const [items, setItems] = useState([]);

  // Initial fetch
  useEffect(() => {
    if (!currentUser?._id) {
      setItems([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const data = await fetchNotifications();
        if (mounted) setItems(data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, [currentUser?._id]);

  // Socket.IO live updates
  useEffect(() => {
    if (!currentUser?._id) return;

    const apiBase = getEnv('VITE_API_BASE_URL');
    let socketUrl = apiBase;
    try {
      const parsed = new URL(apiBase);
      socketUrl = parsed.origin;
    } catch (error) {
      socketUrl = apiBase?.replace(/\/?api\/?$/, '') || window.location.origin;
    }

    let socket;
    const handleSocketError = (err) => {
      if (import.meta.env?.DEV) {
        console.warn('Notifications socket disconnected:', err?.message || err);
      }
      socket?.disconnect();
    };

    try {
      socket = io(socketUrl, {
        transports: ['websocket'],
        withCredentials: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 1500
      });
    } catch (connectionError) {
      handleSocketError(connectionError);
      return undefined;
    }

    socket.emit('auth:identify', currentUser._id);

    socket.on('notification:new', (doc) => {
      setItems((prev) => [doc, ...prev]);
    });
    socket.on('connect_error', handleSocketError);
    socket.on('error', handleSocketError);

    return () => {
      socket?.off('notification:new');
      socket?.off('connect_error', handleSocketError);
      socket?.off('error', handleSocketError);
      socket?.disconnect();
    };
  }, [currentUser?._id]);

  const unreadCount = useMemo(() => items.filter(n => !n.isRead).length, [items]);

  const value = useMemo(() => ({ items, setItems, unreadCount }), [items, unreadCount]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}