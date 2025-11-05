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
import PluginLibraryPage from './pages/PluginLibraryPage';
import { Button } from './components/ui/button';

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
  const { isAuthenticated, logout } = useAuthStore();

  // Check setup status on app load
  const { data: setupStatus, isLoading: isCheckingSetup, error } = useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      try {
        console.log('🔍 [APP] Checking setup status...');
        const response = await axios.get(`${API_URL}/auth/setup-status`);
        console.log('✅ [APP] Setup status received:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ [APP] Setup status check failed:', error);
        return { needsSetup: true };
      }
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false, // Prevent infinite refetch loops
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    if (customPrimary) {
      // Convert hex to HSL for CSS variables
      const primaryHsl = hexToHsl(customPrimary);
      document.documentElement.style.setProperty('--primary', primaryHsl);
      
      if (customAccent) {
        const accentHsl = hexToHsl(customAccent);
        document.documentElement.style.setProperty('--primary-foreground', accentHsl);
        document.documentElement.style.setProperty('--accent', accentHsl);
      }
    }
  }, [theme, customPrimary, customAccent]);

  useEffect(() => {
    console.log('🔄 [APP] Navigation effect triggered:', {
      isCheckingSetup,
      setupStatus,
      isAuthenticated,
      pathname: window.location.pathname
    });

    if (isCheckingSetup) return; // Wait for setup check

    if (setupStatus?.needsSetup && window.location.pathname !== '/setup') {
      console.log('🔄 [APP] Redirecting to setup page');
      navigate('/setup', { replace: true });
    } else if (setupStatus?.isSetupComplete && !isAuthenticated && window.location.pathname !== '/login') {
      console.log('🔄 [APP] Redirecting to login page');
      navigate('/login', { replace: true });
    } else if (isAuthenticated && ['/login', '/setup'].includes(window.location.pathname)) {
      console.log('🔄 [APP] Redirecting authenticated user to dashboard');
      navigate('/', { replace: true });
    }
  }, [setupStatus, isCheckingSetup, isAuthenticated, navigate]);

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing CrumbPanel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to connect to backend</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
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
        <Route path="plugins" element={<PluginLibraryPage />} />
        <Route path="files/:serverId" element={<FilesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback - redirect to setup or login */}
      <Route path="*" element={
        <Navigate to={setupStatus?.needsSetup ? "/setup" : "/login"} replace />
      } />
    </Routes>
  );
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function App() {
  return <AppWrapper />;
}

export default App;
