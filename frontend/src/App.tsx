import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import SetupPage from './pages/SetupPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layouts/DashboardLayout';
import ServersPage from './pages/ServersPage';
import ServerDetailPage from './pages/ServerDetailPage';
import PlayersPage from './pages/PlayersPage';
import BackupsPage from './pages/BackupsPage';
import FilesPage from './pages/FilesPage';
import SettingsPage from './pages/SettingsPage';

// Fix API URL for Docker network
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5829/api'  // Development
  : '/api';  // Production (nginx proxy)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppWrapper() {
  const navigate = useNavigate();
  const { theme, customPrimary, customAccent } = useThemeStore();

  // Check setup status on app load
  const { data: setupStatus, isLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/setup-status`);
        return response.data;
      } catch (error) {
        return { needsSetup: true };
      }
    },
    retry: 1,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (customPrimary && customAccent) {
      document.documentElement.style.setProperty('--custom-primary', customPrimary);
      document.documentElement.style.setProperty('--custom-accent', customAccent);
    }
  }, [theme, customPrimary, customAccent]);

  useEffect(() => {
    // Redirect to setup if needed
    if (!isLoading && setupStatus?.needsSetup) {
      navigate('/setup', { replace: true });
    }
  }, [setupStatus, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<ServersPage />} />
        <Route path="servers" element={<ServersPage />} />
        <Route path="servers/:id" element={<ServerDetailPage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="backups" element={<BackupsPage />} />
        <Route path="files/:serverId" element={<FilesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback - redirect to setup or login */}
      <Route path="*" element={<Navigate to={setupStatus?.needsSetup ? "/setup" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return <AppWrapper />;
}

export default App;
