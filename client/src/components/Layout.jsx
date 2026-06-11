import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationsApi } from '../api/resources.js';
import { API_BASE, getToken } from '../api/client.js';
import { roleLabels } from '../constants/labels.js';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // Лічильник непрочитаних сповіщень:
  //  - real-time через SSE (EventSource) — миттєве оновлення;
  //  - рідке фонове опитування як резерв, якщо стрім недоступний.
  useEffect(() => {
    let active = true;
    function refresh() {
      notificationsApi.count()
        .then((d) => active && setUnread(d.unread))
        .catch(() => {});
    }
    refresh();
    const t = setInterval(refresh, 60000);

    // Підписка на стрім подій (токен — через query, бо EventSource
    // не підтримує власні заголовки). Перепідключення — вбудоване.
    const token = getToken();
    let es;
    if (token && typeof EventSource !== 'undefined') {
      es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);
      es.addEventListener('notification', () => refresh());
    }

    // Миттєве оновлення лічильника після прочитання сповіщень
    // (подію кидає сторінка «Сповіщення»)
    window.addEventListener('notifications:read', refresh);

    return () => {
      active = false;
      clearInterval(t);
      es?.close();
      window.removeEventListener('notifications:read', refresh);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">📑 СтудОрг<br /><span>ДокФлоу</span></div>
        <nav>
          <NavLink to="/" end>Дашборд</NavLink>
          <NavLink to="/documents">Документи</NavLink>
          <NavLink to="/projects">Проєкти</NavLink>
          <NavLink to="/tasks">Задачі</NavLink>
          <NavLink to="/calendar">Календар</NavLink>
          <NavLink to="/notifications">
            Сповіщення {unread > 0 && <span className="nav-badge">{unread}</span>}
          </NavLink>
          {['admin', 'head'].includes(user?.role) && (
            <NavLink to="/activity">Активність</NavLink>
          )}
          {user?.role === 'admin' && <NavLink to="/organizations">Організації</NavLink>}
          {user?.role !== 'admin' && user?.organization_id && (
            <NavLink to={`/organizations/${user.organization_id}`}>Моя організація</NavLink>
          )}
          {['admin', 'head'].includes(user?.role) && <NavLink to="/metrics">Метрики</NavLink>}
          <NavLink to="/users">Користувачі</NavLink>
        </nav>
        <div className="user-box">
          <NavLink to="/profile" className="user-name">{user?.full_name}</NavLink>
          <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
          <button className="btn-link" onClick={handleLogout}>Вийти</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
