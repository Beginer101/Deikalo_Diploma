import { useEffect, useState } from 'react';
import { usersApi } from '../api/resources.js';
import { roleLabels } from '../constants/labels.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHead = user?.role === 'head';
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [reason, setReason] = useState('');

  function load() {
    usersApi.list().then(setUsers).catch((e) => setError(e.message));
    if (user?.role === 'admin') {
      usersApi.deletionRequests().then(setRequests).catch(() => {});
    }
  }
  useEffect(load, []);

  async function changeRole(id, role) {
    setError('');
    try {
      await usersApi.changeRole(id, role);
      setSaved(id);
      setTimeout(() => setSaved(null), 1500);
      load();
    } catch (err) { setError(err.message); }
  }

  async function removeUser(u) {
    if (!confirm(`Видалити користувача «${u.full_name}»? Цю дію не можна скасувати.`)) return;
    setError('');
    try { await usersApi.remove(u.id); load(); }
    catch (err) { setError(err.message); }
  }

  function startRequest(u) {
    setRequesting(u.id);
    setReason('');
    setError('');
  }
  async function submitRequest(u) {
    try {
      await usersApi.requestDeletion(u.id, reason);
      setRequesting(null);
      setReason('');
      alert('Запит на видалення надіслано адміністратору.');
    } catch (err) { setError(err.message); }
  }

  async function approve(id) {
    if (!confirm('Підтвердити видалення користувача?')) return;
    try { await usersApi.approveDeletion(id); load(); }
    catch (err) { setError(err.message); }
  }
  async function reject(id) {
    try { await usersApi.rejectDeletion(id); load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1>Користувачі</h1>
      <p className="muted">
        {isAdmin
          ? 'Призначення ролей і видалення користувачів. Адміністратор бачить усіх користувачів.'
          : 'Користувачі вашої організації.' + (isHead ? ' Ви можете надіслати запит на видалення.' : '')}
      </p>
      {error && <div className="alert">{error}</div>}

      {isAdmin && requests.length > 0 && (
        <div className="card">
          <h3>Запити на видалення ({requests.length})</h3>
          {requests.map((r) => (
            <div className="row-line" key={r.id}>
              <span>
                🗑 {r.target_name} <span className="muted small">· {r.target_email}</span>
                <span className="muted small"> — від {r.requested_by_name || '—'}</span>
                {r.reason && <span className="muted small"> · «{r.reason}»</span>}
              </span>
              <span className="role-cell">
                <button className="btn small danger" onClick={() => approve(r.id)}>Видалити</button>
                <button className="btn-link" onClick={() => reject(r.id)}>Відхилити</button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="row-line table-head">
          <span>Користувач</span>
          <span>Роль / дії</span>
        </div>
        {users.map((u) => (
          <div key={u.id}>
            <div className="row-line">
              <span>
                {u.full_name} <span className="muted small">· {u.email}</span>
                {u.organization_name && <span className="muted small"> · {u.organization_name}</span>}
              </span>
              <span className="role-cell">
                {isAdmin ? (
                  <>
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                      {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {saved === u.id && <span className="saved-mark">✓</span>}
                    {u.id !== user.id && (
                      <button className="btn-link danger" onClick={() => removeUser(u)}>Видалити</button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="muted small">{roleLabels[u.role]}</span>
                    {isHead && u.id !== user.id && (
                      <button className="btn-link" onClick={() => startRequest(u)}>Запит на видалення</button>
                    )}
                  </>
                )}
              </span>
            </div>
            {requesting === u.id && (
              <div className="request-form">
                <input
                  placeholder="Причина запиту (необов'язково)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />
                <button className="btn small" onClick={() => submitRequest(u)}>Надіслати запит</button>
                <button className="btn-link" onClick={() => setRequesting(null)}>Скасувати</button>
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="muted">Користувачів немає.</p>}
      </div>
    </div>
  );
}
