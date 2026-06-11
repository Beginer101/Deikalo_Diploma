import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';

// Приєднання до організації за одноразовим посиланням /join/:token
export default function JoinOrganization() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    setBusy(true);
    setError('');
    try {
      const res = await organizationsApi.join(token);
      await refresh(); // оновити організацію/роль у профілі без повторного входу
      alert(`Ви приєдналися до організації «${res.organization_name}»`);
      navigate('/organizations');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
      <h2>Запрошення до організації</h2>
      <p className="muted">
        Ви увійшли як <b>{user?.full_name}</b>. Натисніть кнопку, щоб приєднатися
        до організації за цим запрошенням. Посилання одноразове — після
        використання воно стане недійсним.
      </p>
      {error && <div className="alert">{error}</div>}
      <button className="btn" onClick={join} disabled={busy}>
        {busy ? 'Приєднання…' : 'Приєднатися до організації'}
      </button>
    </div>
  );
}
