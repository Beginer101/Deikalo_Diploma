import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { organizationsApi } from '../api/resources.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', organization_id: '' });
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Список організацій доступний без авторизації? Ні — тому покажемо текстове поле id опціонально.
  useEffect(() => {
    // Спроба завантажити організації, якщо вже є токен (необов'язково)
    organizationsApi.list().then(setOrgs).catch(() => {});
  }, []);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({
        ...form,
        organization_id: form.organization_id || null,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Реєстрація</h1>
        {error && <div className="alert">{error}</div>}
        <label>Повне ім'я
          <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </label>
        <label>Пароль
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
        </label>
        {orgs.length > 0 && (
          <label>Організація
            <select value={form.organization_id} onChange={(e) => update('organization_id', e.target.value)}>
              <option value="">— не вибрано —</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        )}
        <button className="btn" disabled={busy}>{busy ? 'Реєстрація…' : 'Зареєструватися'}</button>
        <p className="muted small">Вже є акаунт? <Link to="/login">Увійти</Link></p>
      </form>
    </div>
  );
}
