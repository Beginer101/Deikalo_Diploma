import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationsApi, usersApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Organizations() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  // Стан для додавання учасника (admin): { [orgId]: userId }
  const [memberPick, setMemberPick] = useState({});
  // Останнє створене запрошення: { [orgId]: url }
  const [inviteUrl, setInviteUrl] = useState({});

  const isAdmin = user?.role === 'admin';

  function load() {
    organizationsApi.list().then(setOrgs).catch((e) => setError(e.message));
    if (user?.role === 'admin' || user?.role === 'head') {
      usersApi.list().then(setUsers).catch(() => {});
    }
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

  async function addMember(orgId) {
    const userId = memberPick[orgId];
    if (!userId) return;
    setError('');
    try {
      await organizationsApi.addMember(orgId, Number(userId));
      setMemberPick({ ...memberPick, [orgId]: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createInvite(orgId) {
    setError('');
    try {
      const invite = await organizationsApi.createInvite(orgId, { expires_in_hours: 72 });
      const url = `${window.location.origin}/join/${invite.token}`;
      setInviteUrl({ ...inviteUrl, [orgId]: url });
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyInvite(orgId) {
    try {
      await navigator.clipboard.writeText(inviteUrl[orgId]);
      alert('Посилання скопійовано');
    } catch {
      /* буфер недоступний — користувач скопіює вручну */
    }
  }

  // Кандидати на членство: користувачі поза цією організацією
  const candidates = (orgId) => users.filter((u) => u.organization_id !== orgId);

  return (
    <div>
      <h1>Організації</h1>
      {error && <div className="alert">{error}</div>}

      {isAdmin && (
        <form className="card inline-form" onSubmit={create}>
          <input placeholder="Назва організації" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Опис" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn">Додати</button>
        </form>
      )}

      <div className="grid-3">
        {orgs.map((o) => {
          const canInvite = isAdmin || (user?.role === 'head' && user?.organization_id === o.id);
          return (
            <div className="card" key={o.id}>
              <h3><Link to={`/organizations/${o.id}`}>{o.name}</Link></h3>
              <p className="muted">{o.description || '—'}</p>
              <div className="meta">
                <span>👥 {o.members_count} учасників</span>
                <span>📁 {o.projects_count} проєктів</span>
              </div>

              {/* Членство: надає адміністратор системи */}
              {isAdmin && (
                <div className="inline-form" style={{ marginTop: 8 }}>
                  <select value={memberPick[o.id] || ''}
                    onChange={(e) => setMemberPick({ ...memberPick, [o.id]: e.target.value })}>
                    <option value="">Додати учасника…</option>
                    {candidates(o.id).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}{u.organization_name ? ` (${u.organization_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <button className="btn" type="button" onClick={() => addMember(o.id)}>OK</button>
                </div>
              )}

              {/* Одноразове запрошення: хед своєї організації або адміністратор */}
              {canInvite && (
                <div style={{ marginTop: 8 }}>
                  <button className="btn-link" type="button" onClick={() => createInvite(o.id)}>
                    🔗 Створити запрошення (діє 72 год)
                  </button>
                  {inviteUrl[o.id] && (
                    <div className="muted" style={{ marginTop: 4, wordBreak: 'break-all' }}>
                      <code>{inviteUrl[o.id]}</code>{' '}
                      <button className="btn-link" type="button" onClick={() => copyInvite(o.id)}>
                        Копіювати
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isAdmin && (
                <button className="btn-link danger" onClick={() => remove(o.id)}>Видалити</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
