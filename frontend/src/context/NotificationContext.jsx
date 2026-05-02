import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      if (data && data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = useCallback(async (notificationData) => {
    // Prevent duplicates by title and message for the same user/role
    const isDuplicate = notifications.some(
      n => n.title === notificationData.title && n.message === notificationData.message
    );
    if (isDuplicate) return;

    try {
      // In a production app, we would POST to the backend here.
      // For now, we'll assume the backend handles generation or we just update local state
      // if the user role matches.
      const newNotif = {
        _id: Math.random().toString(36).substr(2, 9),
        ...notificationData,
        isRead: false,
        createdAt: new Date()
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      
      // Optional: Persist to backend if needed
      // await api.post('/notifications', notificationData);
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  }, [notifications]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      // If it's a local-only notification (from addNotification), just update state
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications/clear');
      setNotifications([]);
    } catch (err) {
      setNotifications([]);
    }
  };

  // Filter notifications by the current user's role
  const filteredNotifications = notifications.filter(n => {
    if (!user) return false;
    // Role matching: student, teacher, admin
    // If no role specified in notif, show it (system wide)
    return !n.role || n.role === user.role;
  });

  return (
    <NotificationContext.Provider value={{ 
      notifications: filteredNotifications, 
      allNotifications: notifications,
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      clearAll,
      loading,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
