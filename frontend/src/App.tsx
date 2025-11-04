import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const { theme, customPrimary, customAccent } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (customPrimary && customAccent) {
      document.documentElement.style.setProperty('--custom-primary', customPrimary);
      document.documentElement.style.setProperty('--custom-accent', customAccent);
    }
  }, [theme, customPrimary, customAccent]);

  return (
    <Routes>
      {/* Setup route FIRST - wird automatisch angezeigt wenn kein User */}
      <Route path="/setup" element={<SetupPage />} />
      
      {/* Login route - redirected automatisch zu /setup wenn nötig */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
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

      {/* Fallback to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
