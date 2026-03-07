// path: client/src/components/Layout.tsx
// Main app shell: sidebar navigation + top bar with language switcher & logout.

import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',         label: 'dashboard',  icon: '🏠' },
  { to: '/complaints',        label: 'complaints',  icon: '📋' },
  { to: '/complaints/new',    label: 'newComplaint',icon: '➕' },
  { to: '/settings',          label: 'settings',    icon: '⚙️' },
];

const adminItems = [
  { to: '/admin',      label: 'adminPanel', icon: '🛡️' },
  { to: '/audit-logs', label: 'auditLogs',  icon: '📝' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-ashoka text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-blue-900">
          <div className="text-saffron font-bold text-xl">{t('appName')}</div>
          <div className="text-blue-300 text-xs mt-1">{t('tagline')}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-white/20 text-white font-medium' : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{t(item.label)}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-blue-900 mt-4 space-y-1">
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-white/20 text-white font-medium' : 'text-blue-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-blue-900">
          <div className="text-sm text-blue-200 mb-1">{user?.name}</div>
          <div className="text-xs text-blue-400 mb-3 capitalize">{user?.role}</div>
          <button onClick={handleLogout} className="w-full text-left text-sm text-blue-200 hover:text-white transition-colors">
            🚪 {t('logout')}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-sm text-gray-500">{t('welcome')}, <span className="font-semibold text-gray-800">{user?.name}</span></div>
          <button
            onClick={toggleLang}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            🌐 {i18n.language === 'en' ? 'हिंदी' : 'English'}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
