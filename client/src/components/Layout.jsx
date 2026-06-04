import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationsApi } from '../api/resources.js';
import { roleLabels } from '../constants/labels.js';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // Періодичне оновлення лічильника непрочитаних сповіщень
  useEffect(() => {
    let active = true;
    function poll() {
      notificationsApi.count()
        .then((d) => active && setUnread(d.unread))
        .catch(() => {});
    }
    poll();
    const t = setInterval(poll, 20000);
    return () => { active = false; clearInterval(t); };
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
          <NavLink to="/activity">Активність</NavLink>
          <NavLink to="/organizations">Організації</NavLink>
          {user?.role === 'admin' && <NavLink to="/metrics">Метрики</NavLink>}
          <NavLink to="/users">Користувачі</NavLink>
        </nav>
        <div className="user-box">
          <div className="user-name">{user?.full_name}</div>
          <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
          <button className="btn-link" onClick={handleLogout}>Вийти</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
