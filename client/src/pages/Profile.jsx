import { useEffect, useState } from 'react';
import { authApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';

// Особистий профіль: зміна пошти, контактів (опціонально) та пароля
export default function Profile() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ email: '', telegram: '', discord: '', phone: '' });
  const [pwd, setPwd] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        telegram: user.telegram || '',
        discord: user.discord || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  async function saveProfile(e) {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await authApi.updateProfile(form);
      await refresh();
      setMsg('Профіль збережено');
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await authApi.changePassword(pwd.current, pwd.next);
      setPwd({ current: '', next: '' });
      setMsg('Пароль змінено');
    } catch (err) {
      setError(err.message);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Мій профіль</h1>
      <p className="muted">
        {user?.full_name} · {user?.organization_name || 'без організації'}
      </p>
      {msg && <div className="card" style={{ color: 'var(--primary)' }}>{msg}</div>}
      {error && <div className="alert">{error}</div>}

      <form className="card" onSubmit={saveProfile}>
        <h3>Контактні дані</h3>
        <p className="muted">Контакти заповнюються за бажанням — вони видимі
          іншим учасникам (наприклад, на сторінці організації, якщо ви керівник).</p>
        <label>Email
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>Telegram
          <input placeholder="@username" value={form.telegram} onChange={set('telegram')} />
        </label>
        <label>Discord
          <input placeholder="username" value={form.discord} onChange={set('discord')} />
        </label>
        <label>Мобільний телефон
          <input placeholder="+380..." value={form.phone} onChange={set('phone')} />
        </label>
        <button className="btn">Зберегти</button>
      </form>

      <form className="card" onSubmit={savePassword}>
        <h3>Зміна пароля</h3>
        <label>Поточний пароль
          <input type="password" value={pwd.current}
            onChange={(e) => setPwd({ ...pwd, current: e.target.value })} required />
        </label>
        <label>Новий пароль (мінімум 6 символів)
          <input type="password" value={pwd.next} minLength={6}
            onChange={(e) => setPwd({ ...pwd, next: e.target.value })} required />
        </label>
        <button className="btn">Змінити пароль</button>
      </form>
    </div>
  );
}
