import axios from 'axios';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = isLocalhost
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5829/api')
  : '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.message, error.config?.url);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  me: () => api.post('/auth/me'),
};

// Servers API
export const serversApi = {
  getAll: () => api.get('/servers'),
  getOne: (id: string) => api.get(`/servers/${id}`),
  create: (data: any) => api.post('/servers', data),
  update: (id: string, data: any) => api.put(`/servers/${id}`, data),
  delete: (id: string) => api.delete(`/servers/${id}`),
  start: (id: string) => api.post(`/servers/${id}/start`),
  stop: (id: string) => api.post(`/servers/${id}/stop`),
  restart: (id: string) => api.post(`/servers/${id}/restart`),
  getStatus: (id: string) => api.get(`/servers/${id}/status`),
};

// Players API
export const playersApi = {
  getAll: (serverId: string) => api.get(`/players/server/${serverId}`),
  getOnline: (serverId: string) => api.get(`/players/server/${serverId}/online`),
  kick: (serverId: string, playerName: string, reason?: string) =>
    api.post(`/players/server/${serverId}/kick`, { playerName, reason }),
  ban: (serverId: string, playerName: string, reason?: string) =>
    api.post(`/players/server/${serverId}/ban`, { playerName, reason }),
  pardon: (serverId: string, playerName: string) =>
    api.post(`/players/server/${serverId}/pardon`, { playerName }),
  whitelistAdd: (serverId: string, playerName: string) =>
    api.post(`/players/server/${serverId}/whitelist/add`, { playerName }),
  whitelistRemove: (serverId: string, playerName: string) =>
    api.delete(`/players/server/${serverId}/whitelist/remove`, { data: { playerName } }),
};

// Backups API
export const backupsApi = {
  create: (serverId: string, uploadToCloud: boolean) =>
    api.post(`/cloud-backups/create/${serverId}?cloud=${uploadToCloud}`),
  restore: (backupId: string, fromCloud: boolean) =>
    api.post(`/cloud-backups/restore/${backupId}?cloud=${fromCloud}`),
  delete: (backupId: string, deleteFromCloud: boolean) =>
    api.delete(`/cloud-backups/${backupId}?cloud=${deleteFromCloud}`),
  listCloud: () => api.get('/cloud-backups/list'),
  sync: (serverId: string) => api.post(`/cloud-backups/sync/${serverId}`),
};

// Files API
export const filesApi = {
  list: (serverId: string, dir?: string) =>
    api.get(`/files/server/${serverId}`, { params: { dir } }),
  read: (serverId: string, path: string) =>
    api.get(`/files/server/${serverId}/read`, { params: { path } }),
  write: (serverId: string, path: string, content: string) =>
    api.post(`/files/server/${serverId}/write`, { path, content }),
  delete: (serverId: string, path: string) =>
    api.delete(`/files/server/${serverId}`, { params: { path } }),
  createDir: (serverId: string, path: string) =>
    api.post(`/files/server/${serverId}/mkdir`, { path }),
};

// Metrics API
export const metricsApi = {
  getServerMetrics: (serverId: string) => api.get(`/metrics/server/${serverId}`),
  getHistory: (serverId: string, limit?: number) =>
    api.get(`/metrics/server/${serverId}/history`, { params: { limit } }),
  getSystemMetrics: () => api.get('/metrics/system'),
};
