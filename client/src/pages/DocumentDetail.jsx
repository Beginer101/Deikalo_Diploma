import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentsApi, usersApi, attachmentsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  documentStatusLabels as statusLabels,
  approvalDecisionLabels as decisionLabels,
} from '../constants/labels.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [approvers, setApprovers] = useState([]);
  const [comment, setComment] = useState('');
  const [decisionComment, setDecisionComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [delegateTo, setDelegateTo] = useState('');

  function load() {
    documentsApi.get(id).then((d) => {
      setDoc(d);
      setEditForm({ title: d.title, content: d.content || '' });
    }).catch((e) => setError(e.message));
    attachmentsApi.listByDocument(id).then(setAttachments).catch(() => {});
  }
  useEffect(() => {
    load();
    usersApi.list().then(setUsers).catch(() => {});
  }, [id]);

  // Завантаження файлу (multipart/form-data — окремо від JSON-клієнта)
  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await attachmentsApi.upload(id, file);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function deleteAttachment(aid) {
    if (!confirm('Видалити файл?')) return;
    await attachmentsApi.remove(aid);
    load();
  }

  async function delegate() {
    if (!delegateTo) return;
    setError('');
    try {
      await documentsApi.delegate(id, Number(delegateTo));
      setDelegateTo('');
      load();
    } catch (err) { setError(err.message); }
  }

  function fmtSize(b) {
    if (!b) return '';
    return b > 1048576 ? (b / 1048576).toFixed(1) + ' МБ' : Math.ceil(b / 1024) + ' КБ';
  }

  if (error) return <div className="alert">{error}</div>;
  if (!doc) return <div className="muted">Завантаження…</div>;

  const isAuthor = doc.author_id === user.id;
  const canEdit = isAuthor && ['draft', 'rejected'].includes(doc.status);
  // Активний крок для поточного користувача
  const myPendingStep = doc.approvals.find(
    (a) => a.approver_id === user.id && a.decision === 'pending'
  );

  async function saveEdit(e) {
    e.preventDefault();
    await documentsApi.update(id, editForm);
    setEdit(false);
    load();
  }

  async function submit() {
    setError('');
    if (approvers.length === 0) return setError('Оберіть хоча б одного погоджувача');
    try {
      await documentsApi.submit(id, approvers.map(Number));
      setApprovers([]);
      load();
    } catch (err) { setError(err.message); }
  }

  async function decide(decision) {
    try {
      await documentsApi.decide(id, decision, decisionComment);
      setDecisionComment('');
      load();
    } catch (err) { setError(err.message); }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    await documentsApi.addComment(id, comment);
    setComment('');
    load();
  }

  async function remove() {
    if (!confirm('Видалити документ?')) return;
    await documentsApi.remove(id);
    navigate('/documents');
  }

  function toggleApprover(uid) {
    setApprovers((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  }

  return (
    <div>
      <Link to="/documents" className="back-link">← До документів</Link>
      <div className="page-head">
        <h1>📄 {doc.title}</h1>
        <StatusBadge value={doc.status} labels={statusLabels} />
      </div>
      <div className="meta">
        <span>Тип: {doc.doc_type}</span>
        <span>Автор: {doc.author_name}</span>
        {doc.project_title && <span>Проєкт: {doc.project_title}</span>}
      </div>

      {/* Зміст / редагування */}
      {edit ? (
        <form className="card" onSubmit={saveEdit}>
          <label>Назва<input value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></label>
          <label>Зміст<textarea rows={6} value={editForm.content}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} /></label>
          <div className="btn-group">
            <button className="btn">Зберегти</button>
            <button type="button" className="btn-link" onClick={() => setEdit(false)}>Скасувати</button>
          </div>
        </form>
      ) : (
        <div className="card">
          <h3>Зміст документа</h3>
          <p className="doc-content">{doc.content || '— порожньо —'}</p>
          {canEdit && (
            <div className="btn-group">
              <button className="btn small" onClick={() => setEdit(true)}>Редагувати</button>
              {isAuthor && <button className="btn-link danger" onClick={remove}>Видалити</button>}
            </div>
          )}
        </div>
      )}

      {/* Дія: рішення погоджувача */}
      {myPendingStep && (
        <div className="card highlight">
          <h3>🖊 Потрібне ваше рішення</h3>
          <textarea placeholder="Коментар (необов'язково)" value={decisionComment}
            onChange={(e) => setDecisionComment(e.target.value)} />
          <div className="btn-group">
            <button className="btn" onClick={() => decide('approved')}>✓ Погодити</button>
            <button className="btn danger" onClick={() => decide('rejected')}>✕ Відхилити</button>
          </div>
          <div className="delegate-row">
            <span className="muted small">або делегувати:</span>
            <select value={delegateTo} onChange={(e) => setDelegateTo(e.target.value)}>
              <option value="">— оберіть особу —</option>
              {users.filter((u) => u.id !== user.id).map((u) =>
                <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
            <button className="btn small" onClick={delegate} disabled={!delegateTo}>➡ Делегувати</button>
          </div>
        </div>
      )}

      {/* Дія: відправити на узгодження */}
      {isAuthor && ['draft', 'rejected'].includes(doc.status) && (
        <div className="card">
          <h3>Відправити на узгодження</h3>
          <p className="muted small">Оберіть погоджувачів у потрібному порядку:</p>
          <div className="approver-grid">
            {users.filter((u) => u.id !== user.id).map((u) => (
              <label key={u.id} className="checkbox">
                <input type="checkbox" checked={approvers.includes(u.id)}
                  onChange={() => toggleApprover(u.id)} />
                {u.full_name} <span className="muted small">({u.role})</span>
              </label>
            ))}
          </div>
          {approvers.length > 0 && (
            <p className="muted small">Маршрут: {approvers.map((aid, i) =>
              `${i + 1}. ${users.find((u) => u.id === aid)?.full_name}`).join(' → ')}</p>
          )}
          <button className="btn" onClick={submit}>Відправити</button>
        </div>
      )}

      {/* Прикріплені файли */}
      <div className="card">
        <h3>Прикріплені файли ({attachments.length})</h3>
        {attachments.map((a) => (
          <div className="row-line" key={a.id}>
            <span>
              📎 <a href={attachmentsApi.downloadUrl(a.id)}>{a.original_name}</a>
              <span className="muted small"> {fmtSize(a.size_bytes)} · {a.uploaded_by_name}</span>
            </span>
            <button className="btn-link danger" onClick={() => deleteAttachment(a.id)}>✕</button>
          </div>
        ))}
        {attachments.length === 0 && <p className="muted">Файлів немає.</p>}
        <label className="upload-label">
          {uploading ? 'Завантаження…' : '+ Додати файл'}
          <input type="file" hidden onChange={uploadFile} disabled={uploading} />
        </label>
      </div>

      {/* Маршрут узгодження */}
      <div className="card">
        <h3>Маршрут узгодження</h3>
        {doc.approvals.length === 0 && <p className="muted">Маршрут не задано.</p>}
        {doc.approvals.map((a) => (
          <div className="row-line" key={a.id}>
            <span>{a.step_order}. {a.approver_name}
              {a.delegated_from_name && <span className="muted small"> (делеговано від {a.delegated_from_name})</span>}
              {a.comment && <span className="muted small"> — «{a.comment}»</span>}
            </span>
            <StatusBadge value={a.decision} labels={decisionLabels} prefix="badge-decision-" />
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Історія */}
        <div className="card">
          <h3>Історія</h3>
          {doc.history.map((h) => (
            <div className="history-line" key={h.id}>
              <span className="muted small">{new Date(h.created_at).toLocaleString('uk-UA')}</span>
              <div>{h.action} <span className="muted small">— {h.user_name || 'система'}</span></div>
            </div>
          ))}
        </div>

        {/* Коментарі */}
        <div className="card">
          <h3>Коментарі</h3>
          {doc.comments.map((c) => (
            <div className="comment" key={c.id}>
              <strong>{c.author_name}</strong>
              <span className="muted small"> · {new Date(c.created_at).toLocaleString('uk-UA')}</span>
              <p>{c.body}</p>
            </div>
          ))}
          {doc.comments.length === 0 && <p className="muted">Коментарів немає.</p>}
          <form className="inline-form" onSubmit={addComment}>
            <input placeholder="Написати коментар…" value={comment}
              onChange={(e) => setComment(e.target.value)} />
            <button className="btn small">Надіслати</button>
          </form>
        </div>
      </div>
    </div>
  );
}
