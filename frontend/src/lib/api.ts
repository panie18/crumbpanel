import axios from 'axios';

// Detect if running in Docker or localhost
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = isLocalhost 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5829/api')
  : '/api';

console.log('🔗 API URL detected:', API_URL);

// Enhanced auth interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Adding auth token to request:', config.url);
    } else {
      console.warn('⚠️ No auth token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🚫 Unauthorized - clearing tokens and redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const serversApi = {
  getAll: () => axios.get(`${API_URL}/servers`),
  getOne: (id: string) => axios.get(`${API_URL}/servers/${id}`),
  findById: (id: string) => axios.get(`${API_URL}/servers/${id}`),
  create: (data: any) => axios.post(`${API_URL}/servers`, data),
  start: (id: string) => axios.post(`${API_URL}/servers/${id}/start`),
  stop: (id: string) => axios.post(`${API_URL}/servers/${id}/stop`),
  restart: (id: string) => axios.post(`${API_URL}/servers/${id}/restart`),
  delete: (id: string) => axios.delete(`${API_URL}/servers/${id}`),
  sendCommand: (id: string, command: string) => axios.post(`${API_URL}/servers/${id}/command`, { command }),
  getLogs: (id: string) => axios.get(`${API_URL}/servers/${id}/logs`),
};

export const pluginsApi = {
  search: (query: string) => axios.get(`${API_URL}/plugins/search?q=${query}`),
  install: (serverId: string, pluginId: string) => 
    axios.post(`${API_URL}/${serverId}/plugins/${pluginId}/install`),
  uninstall: (serverId: string, pluginId: string) => 
    axios.delete(`${API_URL}/${serverId}/plugins/${pluginId}`),
  getInstalled: (serverId: string) => axios.get(`${API_URL}/${serverId}/plugins`),
};

export const playersApi = {
  getAll: () => axios.get(`${API_URL}/players`),
  getByServer: (serverId: string) => axios.get(`${API_URL}/servers/${serverId}/players`),
  ban: (playerId: string) => axios.post(`${API_URL}/players/${playerId}/ban`),
  unban: (playerId: string) => axios.post(`${API_URL}/players/${playerId}/unban`),
  kick: (playerId: string) => axios.post(`${API_URL}/players/${playerId}/kick`),
  message: (playerId: string, message: string) => 
    axios.post(`${API_URL}/players/${playerId}/message`, { message }),
};

export const filesApi = {
  getServerFiles: (serverId: string, path?: string) => 
    axios.get(`${API_URL}/servers/${serverId}/files${path ? `?path=${path}` : ''}`),
  downloadFile: (serverId: string, filePath: string) => 
    axios.get(`${API_URL}/servers/${serverId}/files/download?path=${filePath}`, {
      responseType: 'blob'
    }),
  uploadFile: (serverId: string, file: File, path?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (path) formData.append('path', path);
    return axios.post(`${API_URL}/servers/${serverId}/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteFile: (serverId: string, filePath: string) => 
    axios.delete(`${API_URL}/servers/${serverId}/files?path=${filePath}`),
  createFolder: (serverId: string, folderPath: string) => 
    axios.post(`${API_URL}/servers/${serverId}/files/folder`, { path: folderPath }),
};

export const backupsApi = {
  getAll: () => axios.get(`${API_URL}/backups`),
  create: (serverId: string) => axios.post(`${API_URL}/backups`, { serverId }),
  restore: (backupId: string) => axios.post(`${API_URL}/backups/${backupId}/restore`),
  download: (backupId: string) => 
    axios.get(`${API_URL}/backups/${backupId}/download`, { responseType: 'blob' }),
  delete: (backupId: string) => axios.delete(`${API_URL}/backups/${backupId}`),
};

export const metricsApi = {
  getServerMetrics: (serverId: string, timeRange?: string) => 
    axios.get(`${API_URL}/servers/${serverId}/metrics${timeRange ? `?range=${timeRange}` : ''}`),
  getOverallMetrics: (timeRange?: string) => 
    axios.get(`${API_URL}/metrics${timeRange ? `?range=${timeRange}` : ''}`),
};
