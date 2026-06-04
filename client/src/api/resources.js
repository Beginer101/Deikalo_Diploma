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
};

export const organizationsApi = {
  list: () => api.get('/organizations'),
  create: (data) => api.post('/organizations', data),
  remove: (id) => api.del(`/organizations/${id}`),
};

export const usersApi = {
  list: (params) => api.get('/users' + qs(params)),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
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
