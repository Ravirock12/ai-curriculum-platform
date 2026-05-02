import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, BookOpen, BarChart3, LogOut, Menu, Moon, Sun, Trophy, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const allNavItems = [
    { name: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
    { name: 'Curriculum',  href: '/curriculum',  icon: BookOpen,         roles: ['student', 'teacher', 'admin'] },
    { name: 'Analytics',   href: '/analytics',   icon: BarChart3,        roles: ['teacher', 'admin'] },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy,           roles: ['student'] },
  ];

  const navigation = allNavItems.filter(item => item.roles.includes(user?.role));
  const closeSidebar = () => setIsSidebarOpen(false);

  // Role badge colors
  const roleBadge = {
    admin:   'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    teacher: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    student: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0">
        <span className="text-xl font-extrabold gradient-text tracking-tight">SkillSync</span>
        <button onClick={closeSidebar} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User card */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40">
          <div className="min-w-0 mr-2">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-0.5">Signed in as</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{user?.name}</p>
            <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${roleBadge[user?.role] || roleBadge.student}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all shrink-0"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
        <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 mt-1">Navigation</p>
        {navigation.map((item, i) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <motion.div key={item.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}>
              <Link
                to={item.href}
                onClick={closeSidebar}
                className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white'}`} />
                {item.name}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="shrink-0 p-3 border-t border-slate-200/60 dark:border-slate-700/60">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-60 md:flex-shrink-0 flex-col bg-white/90 dark:bg-slate-900/90 border-r border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar overlay ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-72 max-w-[85vw] flex flex-col bg-white dark:bg-slate-900 shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 bg-slate-900/60 backdrop-blur-sm"
              onClick={closeSidebar}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0 shadow-sm">
          <span className="text-lg font-extrabold gradient-text">SkillSync</span>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
