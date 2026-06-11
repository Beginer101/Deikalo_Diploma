import { useEffect, useState } from 'react';
import { metricsApi } from '../api/resources.js';

// Лейбли у множині — специфічні для дашборда метрик
const docStatusLabels = {
  draft: 'Чернетки', on_review: 'На узгодженні', approved: 'Затверджені', rejected: 'Відхилені',
};

function Bars({ data, color = 'var(--primary)' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-row" key={d.label}>
          <span className="bar-label">{d.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
          <span className="bar-value">{d.value}</span>
        </div>
      ))}
      {data.length === 0 && <p className="muted">Немає даних.</p>}
    </div>
  );
}

export default function Metrics() {
  const [m, setM] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    metricsApi.get().then(setM).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!m) return <div className="muted">Завантаження…</div>;

  return (
    <div>
      <h1>Метрики та аналітика</h1>
      <p className="muted">
        {m.scope === 'organization'
          ? 'Дані вашої організації'
          : 'Дані всієї системи'}
      </p>

      <div className="stats-row">
        <div className="stat stat-accent">
          <div className="stat-value">{m.avg_approval_hours} год</div>
          <div className="stat-label">Середній час узгодження</div>
        </div>
        <div className="stat stat-accent">
          <div className="stat-value">{m.stuck_documents}</div>
          <div className="stat-label">Документів «застрягло» (&gt;3 днів)</div>
        </div>
        <div className="stat"><div className="stat-value">{m.totals.documents}</div><div className="stat-label">Документів</div></div>
        <div className="stat"><div className="stat-value">{m.totals.projects}</div><div className="stat-label">Проєктів</div></div>
        <div className="stat"><div className="stat-value">{m.totals.users}</div><div className="stat-label">Користувачів</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Документи за статусом</h3>
          <Bars data={Object.entries(m.documents_by_status).map(([k, v]) => ({ label: docStatusLabels[k] || k, value: v }))} />
        </div>
        <div className="card">
          <h3>Документи за типом</h3>
          <Bars data={m.documents_by_type.map((d) => ({ label: d.type, value: d.count }))} color="#0ea5e9" />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Найактивніші автори</h3>
          <Bars data={m.top_authors.map((a) => ({ label: a.name, value: a.docs }))} color="#8b5cf6" />
        </div>
        <div className="card">
          <h3>Навантаження (відкриті задачі)</h3>
          <Bars data={m.workload.map((w) => ({ label: w.name, value: w.open_tasks }))} color="#f59e0b" />
        </div>
      </div>

      <div className="card">
        <h3>Активність за останні 14 днів</h3>
        <Bars data={m.activity_by_day.map((d) => ({ label: d.day.slice(5), value: d.count }))} color="#10b981" />
      </div>
    </div>
  );
}
