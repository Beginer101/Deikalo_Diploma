// Ресурсні API-модулі — обгортки над базовим http-клієнтом (client.js).
// Згруповано за доменами, щоб сторінки не складали шляхи вручну.
import { api, getToken, API_BASE } from './client.js';

const qs = (params) => {
  const entries = Object.entries(params || {}).filter(([, v]) => v != null && v !== '');
  return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
};

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (current_password, new_password) =>
    api.put('/auth/password', { current_password, new_password }),
};

export const organizationsApi = {
  list: () => api.get('/organizations'),
  get: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  remove: (id) => api.del(`/organizations/${id}`),
  // Членство (адміністратор)
  addMember: (id, user_id) => api.post(`/organizations/${id}/members`, { user_id }),
  removeMember: (id, userId) => api.del(`/organizations/${id}/members/${userId}`),
  // Одноразові запрошення (хед своєї організації або адміністратор)
  createInvite: (id, data) => api.post(`/organizations/${id}/invites`, data || {}),
  listInvites: (id) => api.get(`/organizations/${id}/invites`),
  join: (token) => api.post(`/organizations/join/${token}`),
};

export const usersApi = {
  list: (params) => api.get('/users' + qs(params)),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  remove: (id) => api.del(`/users/${id}`),
  requestDeletion: (id, reason) => api.post(`/users/${id}/deletion-request`, { reason }),
  deletionRequests: () => api.get('/users/deletion-requests'),
  approveDeletion: (id) => api.post(`/users/deletion-requests/${id}/approve`),
  rejectDeletion: (id) => api.post(`/users/deletion-requests/${id}/reject`),
};

export const projectsApi = {
  list: (params) => api.get('/projects' + qs(params)),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  addMember: (id, user_id, role_label) => api.post(`/projects/${id}/members`, { user_id, role_label }),
  removeMember: (id, userId) => api.del(`/projects/${id}/members/${userId}`),
  remove: (id) => api.del(`/projects/${id}`),
};

export const tasksApi = {
  list: (params) => api.get('/tasks' + qs(params)),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  remove: (id) => api.del(`/tasks/${id}`),
};

export const documentsApi = {
  list: (params) => api.get('/documents' + qs(params)),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  submit: (id, approver_ids) => api.post(`/documents/${id}/submit`, { approver_ids }),
  decide: (id, decision, comment) => api.post(`/documents/${id}/decision`, { decision, comment }),
  delegate: (id, to_user_id, comment) => api.post(`/documents/${id}/delegate`, { to_user_id, comment }),
  addComment: (id, body) => api.post(`/documents/${id}/comments`, { body }),
  remove: (id) => api.del(`/documents/${id}`),
};

export const templatesApi = {
  list: () => api.get('/templates'),
};

export const attachmentsApi = {
  listByDocument: (documentId) => api.get(`/attachments/document/${documentId}`),
  remove: (id) => api.del(`/attachments/${id}`),
  downloadUrl: (id) => `${API_BASE}/attachments/${id}/download`,
  // Завантаження файлу з підстановкою JWT-токена (anchor не передає заголовок).
  // Доступне всім автентифікованим користувачам.
  download: async (id, filename) => {
    const res = await fetch(`${API_BASE}/attachments/${id}/download`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Не вдалося завантажити файл');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  // Завантаження файлу (multipart) — окремо від JSON-клієнта
  upload: async (documentId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/attachments/document/${documentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Помилка завантаження');
    }
    return res.json();
  },
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  count: () => api.get('/notifications/count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const activityApi = {
  list: (params) => api.get('/activity' + qs(params)),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const metricsApi = {
  get: () => api.get('/metrics'),
};
