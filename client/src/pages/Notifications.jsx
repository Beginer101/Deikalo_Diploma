import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/resources.js';
import { notificationIcons as typeIcons } from '../constants/labels.js';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  function load() {
    notificationsApi.list().then(setItems).catch(() => {});
  }
  useEffect(load, []);

  async function open(n) {
    if (!n.is_read) await notificationsApi.markRead(n.id);
    if (n.link) navigate(n.link);
    else load();
  }

  async function markAll() {
    await notificationsApi.markAllRead();
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Сповіщення</h1>
        <button className="btn small" onClick={markAll}>Прочитати всі</button>
      </div>

      <div className="card">
        {items.length === 0 && <p className="muted">Сповіщень немає.</p>}
        {items.map((n) => (
          <div
            key={n.id}
            className={`notif ${n.is_read ? '' : 'unread'}`}
            onClick={() => open(n)}
          >
            <span className="notif-icon">{typeIcons[n.type] || 'ℹ️'}</span>
            <div className="notif-body">
              <div>{n.message}</div>
              <span className="muted small">{new Date(n.created_at).toLocaleString('uk-UA')}</span>
            </div>
            {!n.is_read && <span className="dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}
