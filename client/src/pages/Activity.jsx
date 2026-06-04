import { useEffect, useState } from 'react';
import { activityApi } from '../api/resources.js';
import { activityActionIcons as actionIcons } from '../constants/labels.js';

const FILTERS = [
  { key: '', label: 'Усе' },
  { key: 'document', label: 'Документи' },
  { key: 'project', label: 'Проєкти' },
  { key: 'task', label: 'Задачі' },
];

export default function Activity() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    activityApi.list(filter ? { entity_type: filter } : {}).then(setItems).catch(() => {});
  }, [filter]);

  return (
    <div>
      <h1>Стрічка активності</h1>
      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f.key}
            className={`tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      <div className="card">
        {items.length === 0 && <p className="muted">Подій немає.</p>}
        <div className="timeline">
          {items.map((a) => (
            <div className="timeline-item" key={a.id}>
              <span className="timeline-icon">{actionIcons[a.action] || '•'}</span>
              <div>
                <div>{a.summary}</div>
                <span className="muted small">
                  {new Date(a.created_at).toLocaleString('uk-UA')}
                  {a.user_name ? ` · ${a.user_name}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
