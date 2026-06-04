import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';

const docLabels = {
  draft: 'Чернетки',
  on_review: 'На узгодженні',
  approved: 'Затверджені',
  rejected: 'Відхилені',
};
const projLabels = {
  planned: 'Заплановані',
  active: 'Активні',
  on_hold: 'Призупинені',
  completed: 'Завершені',
  cancelled: 'Скасовані',
};

function Stat({ label, value, accent }) {
  return (
    <div className={`stat ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.get().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <div className="muted">Завантаження…</div>;

  const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1>Вітаємо, {user?.full_name}!</h1>
      <p className="muted">Огляд стану документообігу та проєктів</p>

      <div className="stats-row">
        <Stat label="Документів на узгодженні у вас" value={data.pending_approvals_for_me} accent />
        <Stat label="Ваших відкритих задач" value={data.my_open_tasks} accent />
        <Stat label="Усього проєктів" value={sum(data.projects)} />
        <Stat label="Організацій" value={data.organizations} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Документи за статусом</h3>
          {Object.keys(docLabels).map((k) => (
            <div className="row-line" key={k}>
              <span>{docLabels[k]}</span>
              <span className={`badge badge-${k}`}>{data.documents[k] || 0}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Проєкти за статусом</h3>
          {Object.keys(projLabels).map((k) => (
            <div className="row-line" key={k}>
              <span>{projLabels[k]}</span>
              <span className="badge">{data.projects[k] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
