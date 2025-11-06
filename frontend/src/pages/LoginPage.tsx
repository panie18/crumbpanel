import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import { Server, Shield, Lock } from 'lucide-react';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '', totpToken: '' });
  const [showTotpInput, setShowTotpInput] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated, token } = useAuthStore();

  console.log('🎨 LoginPage rendering...', { 
    isAuthenticated, 
    hasToken: !!token,
    tokenPreview: token?.substring(0, 20) + '...' 
  });

  // If already authenticated, redirect immediately
  useEffect(() => {
    const hasAuth = isAuthenticated && token;
    const hasLocalToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (hasAuth || hasLocalToken) {
      console.log('✅ Already authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, token, navigate]);

  // Check setup status only once
  const { data: setupStatus, isLoading: isCheckingSetup, error } = useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      try {
        console.log('🔍 Checking setup status...');
        const response = await axios.get('/api/auth/setup-status');
        console.log('✅ Setup Status Response:', response.data);
        
        // Debug info
        const { isSetupComplete, needsSetup, userCount } = response.data;
        console.log('📊 Setup Analysis:', { 
          isSetupComplete, 
          needsSetup, 
          userCount,
          shouldRedirectToSetup: needsSetup && userCount === 0
        });
        
        return response.data;
      } catch (err: any) {
        console.error('❌ Setup check failed:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Redirect to setup if needed (only if NO users exist)
  useEffect(() => {
    if (setupStatus?.needsSetup && setupStatus?.userCount === 0) {
      console.log('🔀 No users found, redirecting to setup...');
      navigate('/setup', { replace: true });
    }
  }, [setupStatus, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string; totpToken?: string }) => {
      const response = await axios.post('/api/auth/login', {
        email: creds.email,
        password: creds.password,
        ...(creds.totpToken && { totpToken: creds.totpToken })
      });
      return response;
    },
    onSuccess: (response) => {
      console.log('✅ [LOGIN] Success:', response.data);
      const { user, token } = response.data;
      
      // Set auth FIRST
      setAuth(user, token);
      
      // Show success toast
      toast.success(`Willkommen zurück, ${user.name || user.email}!`);
      
      // Navigate after a small delay to ensure state is updated
      setTimeout(() => {
        console.log('🔀 [LOGIN] Navigating to dashboard...');
        navigate('/', { replace: true });
      }, 100);
    },
    onError: (error: any) => {
      if (error.response?.status === 403 && error.response?.data?.requiresTotp) {
        setShowTotpInput(true);
        toast.error('Bitte 2FA-Code eingeben');
      } else {
        const errorMessage = error.response?.data?.message || 'Login fehlgeschlagen';
        toast.error(errorMessage);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: credentials.email,
      password: credentials.password,
      ...(credentials.totpToken && { totpToken: credentials.totpToken })
    });
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Error in LoginPage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-500">Error loading setup status</p>
          <p className="text-sm text-muted-foreground mt-2">Check browser console for details</p>
        </div>
      </div>
    );
  }

  // Don't render login form if setup is needed
  if (setupStatus?.needsSetup && setupStatus?.userCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to setup...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center"
            >
              <Server className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-3xl">Welcome back! 👋</CardTitle>
            <CardDescription>Sign in to CrumbPanel</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@crumbpanel.local"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
              </div>

              {showTotpInput && (
                <div className="space-y-2">
                  <Label htmlFor="totpToken">2FA-Code</Label>
                  <Input
                    id="totpToken"
                    type="text"
                    placeholder="123456"
                    value={credentials.totpToken}
                    onChange={(e) => setCredentials({ ...credentials, totpToken: e.target.value })}
                    maxLength={6}
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Lock className="mr-2 h-4 w-4 animate-spin" />
                    Wird angemeldet...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Anmelden
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
