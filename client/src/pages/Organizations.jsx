import { useEffect, useState } from 'react';
import { organizationsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Organizations() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  function load() {
    organizationsApi.list().then(setOrgs).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      await organizationsApi.create(form);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Видалити організацію разом з усіма проєктами?')) return;
    await organizationsApi.remove(id);
    load();
  }

  return (
    <div>
      <h1>Організації</h1>
      {error && <div className="alert">{error}</div>}

      {user?.role === 'admin' && (
        <form className="card inline-form" onSubmit={create}>
          <input placeholder="Назва організації" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Опис" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn">Додати</button>
        </form>
      )}

      <div className="grid-3">
        {orgs.map((o) => (
          <div className="card" key={o.id}>
            <h3>{o.name}</h3>
            <p className="muted">{o.description || '—'}</p>
            <div className="meta">
              <span>👥 {o.members_count} учасників</span>
              <span>📁 {o.projects_count} проєктів</span>
            </div>
            {user?.role === 'admin' && (
              <button className="btn-link danger" onClick={() => remove(o.id)}>Видалити</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
