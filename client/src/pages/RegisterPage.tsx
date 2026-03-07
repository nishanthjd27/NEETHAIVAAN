// path: client/src/pages/RegisterPage.tsx
// Registration form for users and lawyers.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { t }    = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', phone: '', role: 'user' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
      toast.success('Account created!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ashoka to-blue-900">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-saffron">⚖️ {t('appName')}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('register')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'name',     label: 'name',     type: 'text',     placeholder: 'Full Name' },
              { name: 'email',    label: 'email',    type: 'email',    placeholder: 'you@example.com' },
              { name: 'password', label: 'password', type: 'password', placeholder: '••••••••' },
              { name: 'phone',    label: 'phone',    type: 'tel',      placeholder: '+91 9876543210' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t(field.label)}</label>
                <input
                  name={field.name} type={field.type} placeholder={field.placeholder}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  required={field.name !== 'phone'}
                  className="input-field"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
              <select name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="user">User (Complainant)</option>
                <option value="lawyer">Lawyer</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? t('loading') : t('register')}
            </button>
          </form>

          <p className="mt-4 text-sm text-center text-gray-500">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 hover:underline font-medium">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
