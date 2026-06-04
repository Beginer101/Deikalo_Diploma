import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, organizationsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { projectStatusLabels } from '../constants/labels.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', organization_id: '', start_date: '', end_date: '',
  });

  function load() {
    projectsApi.list().then(setProjects).catch((e) => setError(e.message));
  }
  useEffect(() => {
    load();
    organizationsApi.list().then(setOrgs).catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      await projectsApi.create({
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      setShow(false);
      setForm({ title: '', description: '', organization_id: '', start_date: '', end_date: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Дозвіл рахується на бекенді (admin/head або координатор) і приходить у профілі
  const canCreate = !!user?.can_create_projects;

  return (
    <div>
      <div className="page-head">
        <h1>Проєкти</h1>
        {canCreate && <button className="btn" onClick={() => setShow(!show)}>+ Новий проєкт</button>}
      </div>
      {error && <div className="alert">{error}</div>}

      {show && (
        <form className="card" onSubmit={create}>
          <label>Назва<input value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Опис<textarea value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>Організація
            <select value={form.organization_id}
              onChange={(e) => setForm({ ...form, organization_id: e.target.value })} required>
              <option value="">— оберіть —</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <div className="form-row">
            <label>Початок<input type="date" value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label>
            <label>Завершення<input type="date" value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label>
          </div>
          <button className="btn">Створити</button>
        </form>
      )}

      <div className="grid-3">
        {projects.map((p) => (
          <Link to={`/projects/${p.id}`} className="card link-card" key={p.id}>
            <div className="card-top">
              <h3>{p.title}</h3>
              <StatusBadge value={p.status} labels={projectStatusLabels} />
            </div>
            <p className="muted">{p.description || '—'}</p>
            <div className="meta">
              <span>🏛 {p.organization_name}</span>
              <span>✅ {p.tasks_done}/{p.tasks_count} задач</span>
            </div>
          </Link>
        ))}
        {projects.length === 0 && <p className="muted">Проєктів ще немає.</p>}
      </div>
    </div>
  );
}
