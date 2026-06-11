import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organizationsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { projectStatusLabels } from '../constants/labels.js';
import StatusBadge from '../components/StatusBadge.jsx';

// Сторінка організації, доступна всім користувачам:
// назва, опис, керівники з контактами, перелік проєктів.
// Хед своєї організації (та адмін) може створити одноразове запрошення.
export default function OrganizationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    organizationsApi.get(id).then(setOrg).catch((e) => setError(e.message));
  }, [id]);

  const canInvite =
    user?.role === 'admin' ||
    (user?.role === 'head' && user?.organization_id === Number(id));

  async function createInvite() {
    setError('');
    try {
      const invite = await organizationsApi.createInvite(id, { expires_in_hours: 72 });
      setInviteUrl(`${window.location.origin}/join/${invite.token}`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert('Посилання скопійовано');
    } catch {
      /* буфер недоступний — користувач скопіює вручну */
    }
  }

  if (error && !org) return <div className="alert">{error}</div>;
  if (!org) return <div className="muted">Завантаження…</div>;

  return (
    <div>
      {user?.role === 'admin' && (
        <Link to="/organizations" className="back-link">← До організацій</Link>
      )}
      <h1>{org.name}</h1>
      <p className="muted">{org.description || 'Без опису'}</p>
      {error && <div className="alert">{error}</div>}

      {canInvite && (
        <div className="card">
          <button className="btn-link" type="button" onClick={createInvite}>
            🔗 Створити одноразове запрошення (діє 72 год)
          </button>
          {inviteUrl && (
            <div className="muted" style={{ marginTop: 4, wordBreak: 'break-all' }}>
              <code>{inviteUrl}</code>{' '}
              <button className="btn-link" type="button" onClick={copyInvite}>Копіювати</button>
            </div>
          )}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Керівництво</h3>
          {org.heads.length === 0 && <p className="muted">Керівника ще не призначено.</p>}
          {org.heads.map((h) => (
            <div key={h.id} style={{ marginBottom: 10 }}>
              <b>{h.full_name}</b>
              <div className="muted">
                ✉️ {h.email}
                {h.telegram && <> · ✈️ Telegram: {h.telegram}</>}
                {h.discord && <> · 🎮 Discord: {h.discord}</>}
                {h.phone && <> · 📞 {h.phone}</>}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Проєкти ({org.projects.length})</h3>
          {org.projects.length === 0 && <p className="muted">Проєктів поки немає.</p>}
          {org.projects.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Link to={`/projects/${p.id}`}>{p.title}</Link>
              <StatusBadge value={p.status} labels={projectStatusLabels} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
