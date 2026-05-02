import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'error':
      case 'critical': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getTimestampLabel = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now - then) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-slate-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800/50 overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white/30 dark:bg-slate-900/30">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Role-based Alerts</p>
              </div>
              <div className="flex gap-1.5">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition" title="Mark all read">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition" title="Clear all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-100/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-semibold text-sm">No notifications</p>
                  <p className="text-xs mt-1 opacity-60">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {notifications.map((notification) => (
                    <div 
                      key={notification._id || notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors cursor-pointer flex gap-3.5 ${!notification.isRead ? 'bg-indigo-50/10 dark:bg-indigo-500/[0.02]' : 'opacity-60'}`}
                    >
                      <div className="shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className={`text-sm font-bold truncate pr-4 ${!notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {getTimestampLabel(notification.createdAt)}
                          </span>
                          {notification.role && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-tighter">
                              {notification.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-white/50 dark:bg-slate-900/50 text-center border-t border-slate-100 dark:border-slate-800/50">
                <button onClick={() => setIsOpen(false)} className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">
                  Dismiss Panel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
