// services/api.js
// Capa de comunicación con el backend — patrón Service Layer
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: agrega el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: manejo global de errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pf_token');
      localStorage.removeItem('pf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me')
};

// ─── PROYECTOS ────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userId) => api.post(`/projects/${id}/members`, { userId })
};

// ─── TAREAS ───────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status })
};

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export default api;
