import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentsApi, projectsApi, templatesApi } from '../api/resources.js';
import { documentStatusLabels as statusLabels } from '../constants/labels.js';
import StatusBadge from '../components/StatusBadge.jsx';

const FILTERS = [
  { key: 'all', label: 'Усі' },
  { key: 'pending', label: 'Чекають мого рішення' },
  { key: 'mine', label: 'Мої документи' },
];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ title: '', doc_type: 'загальний', content: '', project_id: '' });

  function load() {
    const params = {};
    if (filter === 'pending') params.pending_for_me = 1;
    if (filter === 'mine') params.mine = 1;
    documentsApi.list(params).then(setDocs).catch((e) => setError(e.message));
  }
  useEffect(load, [filter]);
  useEffect(() => {
    projectsApi.list().then(setProjects).catch(() => {});
    templatesApi.list().then(setTemplates).catch(() => {});
  }, []);

  // Застосувати шаблон: підставити тип, зміст і запропонувати назву
  function applyTemplate(id) {
    const t = templates.find((x) => String(x.id) === String(id));
    if (!t) return;
    setForm((f) => ({
      ...f,
      doc_type: t.doc_type,
      content: t.content || '',
      title: f.title || t.name,
    }));
  }

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      await documentsApi.create({ ...form, project_id: form.project_id || null });
      setShow(false);
      setForm({ title: '', doc_type: 'загальний', content: '', project_id: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Документи</h1>
        <button className="btn" onClick={() => setShow(!show)}>+ Новий документ</button>
      </div>
      {error && <div className="alert">{error}</div>}

      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f.key}
            className={`tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {show && (
        <form className="card" onSubmit={create}>
          {templates.length > 0 && (
            <label>Шаблон (необов'язково)
              <select defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
                <option value="">— почати з порожнього —</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.doc_type})</option>)}
              </select>
            </label>
          )}
          <label>Назва<input value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <div className="form-row">
            <label>Тип
              <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
                <option value="загальний">Загальний</option>
                <option value="наказ">Наказ</option>
                <option value="кошторис">Кошторис</option>
                <option value="звіт">Звіт</option>
                <option value="заявка">Заявка</option>
                <option value="протокол">Протокол</option>
              </select>
            </label>
            <label>Проєкт
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">— без проєкту —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
          </div>
          <label>Зміст<textarea rows={5} value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
          <button className="btn">Створити чернетку</button>
        </form>
      )}

      <div className="doc-list">
        {docs.map((d) => (
          <Link to={`/documents/${d.id}`} className="card link-card doc-item" key={d.id}>
            <div className="card-top">
              <h3>📄 {d.title}</h3>
              <StatusBadge value={d.status} labels={statusLabels} />
            </div>
            <div className="meta">
              <span>Тип: {d.doc_type}</span>
              <span>Автор: {d.author_name}</span>
              {d.project_title && <span>Проєкт: {d.project_title}</span>}
            </div>
          </Link>
        ))}
        {docs.length === 0 && <p className="muted">Документів не знайдено.</p>}
      </div>
    </div>
  );
}
