import axios from 'axios';

// Detect if running in Docker or localhost
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = isLocalhost 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5829/api')
  : '/api';

console.log('🔗 API URL detected:', API_URL);

// Add auth token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const serversApi = {
  getAll: () => axios.get(`${API_URL}/servers`),
  create: (data: any) => axios.post(`${API_URL}/servers`, data),
  start: (id: string) => axios.post(`${API_URL}/servers/${id}/start`),
  stop: (id: string) => axios.post(`${API_URL}/servers/${id}/stop`),
  restart: (id: string) => axios.post(`${API_URL}/servers/${id}/restart`),
  delete: (id: string) => axios.delete(`${API_URL}/servers/${id}`),
  findById: (id: string) => axios.get(`${API_URL}/servers/${id}`),
};

export const pluginsApi = {
  search: (query: string) => axios.get(`${API_URL}/plugins/search?q=${query}`),
  install: (serverId: string, pluginId: string) => axios.post(`${API_URL}/${serverId}/plugins/${pluginId}/install`),
  uninstall: (serverId: string, pluginId: string) => axios.delete(`${API_URL}/${serverId}/plugins/${pluginId}`),
  getInstalled: (serverId: string) => axios.get(`${API_URL}/${serverId}/plugins`),
};

export const backupsApi = {
  getAll: () => axios.get(`${API_URL}/backups`),
  create: (serverId: string) => axios.post(`${API_URL}/backups`, { serverId }),
  restore: (backupId: string) => axios.post(`${API_URL}/backups/${backupId}/restore`),
  download: (backupId: string) => axios.get(`${API_URL}/backups/${backupId}/download`, { responseType: 'blob' }),
  delete: (backupId: string) => axios.delete(`${API_URL}/backups/${backupId}`),
};
