import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import SetupPage from '@/pages/SetupPage';
import ServersPage from '@/pages/ServersPage';
import ServerDetailPage from '@/pages/ServerDetailPage';
import PlayersPage from '@/pages/PlayersPage';
import PluginLibraryPage from '@/pages/PluginLibraryPage';
import BackupsPage from '@/pages/BackupsPage';
import SettingsPage from '@/pages/SettingsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AutomationPage from '@/pages/AutomationPage';
import BasesMapPage from '@/pages/BasesMapPage';
import LeaderboardsPage from '@/pages/LeaderboardsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const hasToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
  const isAuth = isAuthenticated && hasToken;
  
  console.log('🔒 ProtectedRoute check:', { isAuthenticated, hasToken: !!hasToken, isAuth });
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ServersPage />} />
            <Route path="servers" element={<ServersPage />} />
            <Route path="servers/:id" element={<ServerDetailPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="bases" element={<BasesMapPage />} />
            <Route path="leaderboards" element={<LeaderboardsPage />} />
            <Route path="plugins" element={<PluginLibraryPage />} />
            <Route path="backups" element={<BackupsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="automation" element={<AutomationPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
