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

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5829/api'
  : '/api';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '', totpToken: '' });
  const [showTotpInput, setShowTotpInput] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Check setup status only once
  const { data: setupStatus, isLoading: isCheckingSetup } = useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/auth/setup-status`);
      console.log('✅ Setup Status:', response.data);
      return response.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Redirect to setup if needed
  useEffect(() => {
    if (setupStatus?.needsSetup) {
      console.log('🔀 Redirecting to setup...');
      navigate('/setup', { replace: true });
    }
  }, [setupStatus, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string; totpToken?: string }) => {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: creds.email,
        password: creds.password,
        ...(creds.totpToken && { totpToken: creds.totpToken })
      });
      return response;
    },
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success('Login erfolgreich!');
      navigate('/', { replace: true });
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

  // Don't render login form if setup is needed
  if (setupStatus?.needsSetup) {
    return null;
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
