import { useEffect, useState } from 'react';
import { usersApi } from '../api/resources.js';
import { roleLabels } from '../constants/labels.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  function load() {
    usersApi.list().then(setUsers).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  if (!isAdmin) {
    return (
      <div>
        <h1>Користувачі</h1>
        <div className="card notice">
          🔒 Керування ролями користувачів доступне лише адміністратору.
          <p className="muted small">Зверніться до адміністратора системи, щоб змінити роль.</p>
        </div>
      </div>
    );
  }

  async function changeRole(id, role) {
    setError('');
    try {
      await usersApi.changeRole(id, role);
      setSaved(id);
      setTimeout(() => setSaved(null), 1500);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Користувачі</h1>
      <p className="muted">Призначення ролей. Роль «Керівник» дозволяє створювати проєкти.</p>
      {error && <div className="alert">{error}</div>}

      <div className="card">
        <div className="row-line table-head">
          <span>Користувач</span>
          <span>Роль</span>
        </div>
        {users.map((u) => (
          <div className="row-line" key={u.id}>
            <span>
              {u.full_name} <span className="muted small">· {u.email}</span>
              {u.organization_name && <span className="muted small"> · {u.organization_name}</span>}
            </span>
            <span className="role-cell">
              <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {saved === u.id && <span className="saved-mark">✓ збережено</span>}
            </span>
          </div>
        ))}
        {users.length === 0 && <p className="muted">Користувачів немає.</p>}
      </div>
    </div>
  );
}
