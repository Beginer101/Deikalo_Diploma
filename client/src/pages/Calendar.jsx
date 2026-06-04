import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi, projectsApi } from '../api/resources.js';

const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

export default function Calendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    tasksApi.list().then(setTasks).catch(() => {});
    projectsApi.list().then(setProjects).catch(() => {});
  }, []);

  // Карта подій за датою (YYYY-MM-DD)
  const events = useMemo(() => {
    const map = {};
    const add = (date, ev) => {
      if (!date) return;
      const key = date.slice(0, 10);
      (map[key] = map[key] || []).push(ev);
    };
    tasks.forEach((t) => t.due_date &&
      add(t.due_date, { type: 'task', label: `📋 ${t.title}`, link: '/tasks' }));
    projects.forEach((p) => {
      if (p.start_date) add(p.start_date, { type: 'start', label: `▶ ${p.title}`, link: `/projects/${p.id}` });
      if (p.end_date) add(p.end_date, { type: 'end', label: `🏁 ${p.title}`, link: `/projects/${p.id}` });
    });
    return map;
  }, [tasks, projects]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  // Скільки клітинок-зсувів на початку (пн = 0)
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = ymd(new Date());

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div>
      <div className="page-head">
        <h1>Календар</h1>
        <div className="btn-group">
          <button className="btn small" onClick={() => setCursor(new Date(year, month - 1, 1))}>←</button>
          <strong>{MONTHS[month]} {year}</strong>
          <button className="btn small" onClick={() => setCursor(new Date(year, month + 1, 1))}>→</button>
        </div>
      </div>

      <div className="calendar">
        {WEEKDAYS.map((w) => <div className="cal-weekday" key={w}>{w}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div className="cal-cell empty" key={`e${i}`} />;
          const key = ymd(date);
          const dayEvents = events[key] || [];
          return (
            <div className={`cal-cell ${key === todayKey ? 'today' : ''}`} key={key}>
              <div className="cal-day">{date.getDate()}</div>
              {dayEvents.slice(0, 3).map((ev, j) => (
                <Link to={ev.link} key={j} className={`cal-event ev-${ev.type}`}>{ev.label}</Link>
              ))}
              {dayEvents.length > 3 && <span className="muted small">+{dayEvents.length - 3}</span>}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span><i className="ev-task" /> Дедлайн задачі</span>
        <span><i className="ev-start" /> Початок проєкту</span>
        <span><i className="ev-end" /> Завершення проєкту</span>
      </div>
    </div>
  );
}
