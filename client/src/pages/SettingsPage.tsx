// path: client/src/pages/SettingsPage.tsx
// User settings: language preference + profile details display.

import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user }    = useAuth();

  const setLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('settings')}</h1>

      {/* Profile */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">{t('profile')}</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-gray-500">{t('name')}:</div>
          <div className="font-medium">{user?.name}</div>
          <div className="text-gray-500">{t('email')}:</div>
          <div className="font-medium">{user?.email}</div>
          <div className="text-gray-500">{t('role')}:</div>
          <div className="font-medium capitalize">{user?.role}</div>
        </div>
      </div>

      {/* Language */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">🌐 {t('language')}</h2>
        <div className="flex gap-3">
          {(['en', 'hi'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLang(lang)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                i18n.language === lang
                  ? 'bg-ashoka text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang === 'en' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Current language: <strong>{i18n.language === 'en' ? 'English' : 'Hindi (हिंदी)'}</strong>
        </p>
      </div>
    </div>
  );
}
