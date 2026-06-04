import { useEffect, useState } from 'react';
import { tasksApi, projectsApi, usersApi } from '../api/resources.js';
import {
  TASK_COLUMNS as COLUMNS,
  taskPriorityLabels as priorityLabels,
  taskNextStatus as nextStatus,
} from '../constants/labels.js';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', project_id: '', assignee_id: '', priority: 'medium', due_date: '',
  });

  function load() {
    tasksApi.list().then(setTasks).catch((e) => setError(e.message));
  }
  useEffect(() => {
    load();
    projectsApi.list().then(setProjects).catch(() => {});
    usersApi.list().then(setUsers).catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      await tasksApi.create({
        ...form,
        assignee_id: form.assignee_id || null,
        due_date: form.due_date || null,
      });
      setShow(false);
      setForm({ title: '', description: '', project_id: '', assignee_id: '', priority: 'medium', due_date: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function advance(task) {
    await tasksApi.update(task.id, { status: nextStatus[task.status] });
    load();
  }

  async function remove(id) {
    if (!confirm('Видалити задачу?')) return;
    await tasksApi.remove(id);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Задачі</h1>
        <button className="btn" onClick={() => setShow(!show)}>+ Нова задача</button>
      </div>
      {error && <div className="alert">{error}</div>}

      {show && (
        <form className="card" onSubmit={create}>
          <label>Назва<input value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Опис<textarea value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="form-row">
            <label>Проєкт
              <select value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })} required>
                <option value="">— оберіть —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label>Виконавець
              <select value={form.assignee_id}
                onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
                <option value="">— не призначено —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>Пріоритет
              <select value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Дедлайн<input type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></label>
          </div>
          <button className="btn">Створити</button>
        </form>
      )}

      <div className="board">
        {COLUMNS.map((col) => (
          <div className="board-col" key={col.key}>
            <h4>{col.label} <span className="count">{tasks.filter((t) => t.status === col.key).length}</span></h4>
            {tasks.filter((t) => t.status === col.key).map((t) => (
              <div className="task-card" key={t.id}>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  <span className={`prio prio-${t.priority}`}>{priorityLabels[t.priority]}</span>
                  {t.due_date && <span className="muted small">⏰ {t.due_date.slice(0, 10)}</span>}
                </div>
                <div className="muted small">{t.project_title} · {t.assignee_name || 'без виконавця'}</div>
                <div className="task-actions">
                  <button className="btn-link" onClick={() => advance(t)}>↻ далі</button>
                  <button className="btn-link danger" onClick={() => remove(t.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
