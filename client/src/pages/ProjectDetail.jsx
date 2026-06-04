import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, tasksApi, documentsApi, usersApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  projectStatusLabels, taskStatusLabels, documentStatusLabels,
  MEMBER_ROLE_OPTIONS, MANAGER_LABELS,
} from '../constants/labels.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [docs, setDocs] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [newMember, setNewMember] = useState('');
  const [newRole, setNewRole] = useState('учасник');

  function load() {
    projectsApi.get(id).then(setProject).catch((e) => setError(e.message));
    tasksApi.list({ project_id: id }).then(setTasks).catch(() => {});
    documentsApi.list({ project_id: id }).then(setDocs).catch(() => {});
    usersApi.list().then(setUsers).catch(() => {});
  }
  useEffect(load, [id]);

  async function addMember(e) {
    e.preventDefault();
    if (!newMember) return;
    try {
      await projectsApi.addMember(id, newMember, newRole);
      setNewMember('');
      setNewRole('учасник');
      load();
    } catch (err) { setError(err.message); }
  }

  // Зміна ролі вже доданого учасника (upsert на бекенді)
  async function changeRole(userId, role_label) {
    try {
      await projectsApi.addMember(id, userId, role_label);
      load();
    } catch (err) { setError(err.message); }
  }

  async function removeMember(userId) {
    try {
      await projectsApi.removeMember(id, userId);
      load();
    } catch (err) { setError(err.message); }
  }

  // Право керування: admin/head або координатор/організатор саме цього проєкту
  const myMembership = project?.members?.find((m) => m.user_id === user?.id);
  const canManage =
    user?.role === 'admin' ||
    user?.role === 'head' ||
    (myMembership && MANAGER_LABELS.includes(myMembership.role_label));

  if (error) return <div className="alert">{error}</div>;
  if (!project) return <div className="muted">Завантаження…</div>;

  return (
    <div>
      <Link to="/projects" className="back-link">← До проєктів</Link>
      <div className="page-head">
        <h1>{project.title}</h1>
        <StatusBadge value={project.status} labels={projectStatusLabels} />
      </div>
      <p className="muted">{project.description}</p>
      <div className="meta">
        <span>🏛 {project.organization_name}</span>
        <span>👤 Власник: {project.owner_name || '—'}</span>
        <span>📅 {project.start_date?.slice(0, 10) || '—'} — {project.end_date?.slice(0, 10) || '—'}</span>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Учасники</h3>
          {project.members.map((m) => (
            <div className="row-line" key={m.id}>
              <span>{m.full_name}
                {canManage ? (
                  <select
                    className="role-select"
                    value={m.role_label}
                    onChange={(e) => changeRole(m.user_id, e.target.value)}
                  >
                    {MEMBER_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <span className="muted small"> ({m.role_label})</span>
                )}
              </span>
              {canManage && <button className="btn-link danger" onClick={() => removeMember(m.user_id)}>✕</button>}
            </div>
          ))}
          {project.members.length === 0 && <p className="muted">Учасників ще немає.</p>}
          {canManage && (
            <form className="inline-form" onSubmit={addMember}>
              <select value={newMember} onChange={(e) => setNewMember(e.target.value)}>
                <option value="">+ додати учасника</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {MEMBER_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn small">Додати</button>
            </form>
          )}
        </div>

        <div className="card">
          <h3>Задачі ({tasks.length})</h3>
          {tasks.map((t) => (
            <div className="row-line" key={t.id}>
              <span>{t.title}</span>
              <StatusBadge value={t.status} labels={taskStatusLabels} prefix="badge-task-" />
            </div>
          ))}
          {tasks.length === 0 && <p className="muted">Задач немає.</p>}
          <Link to="/tasks" className="btn-link">Перейти до задач →</Link>
        </div>
      </div>

      <div className="card">
        <h3>Документи проєкту ({docs.length})</h3>
        {docs.map((d) => (
          <Link to={`/documents/${d.id}`} className="row-line link-row" key={d.id}>
            <span>📄 {d.title} <span className="muted small">({d.doc_type})</span></span>
            <StatusBadge value={d.status} labels={documentStatusLabels} />
          </Link>
        ))}
        {docs.length === 0 && <p className="muted">Документів немає.</p>}
      </div>
    </div>
  );
}
