import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// Lazy load pages
import LoginPage from '@/pages/LoginPage';
import SetupPage from '@/pages/SetupPage';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ServersPage from '@/pages/ServersPage';
import ServerDetailPage from '@/pages/ServerDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  
  // Check both zustand state and localStorage
  const hasToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
  const isAuth = isAuthenticated && hasToken;
  
  console.log('🔒 ProtectedRoute check:', { isAuthenticated, hasToken: !!hasToken, isAuth });
  
  if (!isAuth) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  console.log('🎨 App rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ServersPage />} />
            <Route path="servers" element={<ServersPage />} />
            <Route path="servers/:id" element={<ServerDetailPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
