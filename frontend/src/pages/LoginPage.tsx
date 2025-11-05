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
import toast from 'react-hot-toast';
import { Server, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5829/api'
  : '/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  // Check if setup is needed first
  const { data: setupStatus, isLoading: isCheckingSetup } = useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      try {
        console.log('🔍 [LOGIN] Checking setup status...');
        const response = await axios.get(`${API_URL}/auth/setup-status`);
        console.log('✅ [LOGIN] Setup status:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ [LOGIN] Setup status failed:', error);
        return { needsSetup: true };
      }
    },
  });

  useEffect(() => {
    console.log('🔄 [LOGIN] Setup status changed:', setupStatus);
    if (setupStatus?.needsSetup) {
      console.log('↩️ [LOGIN] Redirecting to setup...');
      navigate('/setup', { replace: true });
    }
  }, [setupStatus, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('↩️ [LOGIN] User authenticated, redirecting to dashboard...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      console.log('🔐 [LOGIN] Attempting login for:', data.email);
      const response = await axios.post(`${API_URL}/auth/login`, data);
      console.log('✅ [LOGIN] Login successful');
      return response;
    },
    onSuccess: (response) => {
      const { user, accessToken } = response.data;
      setAuth(user, accessToken, null);
      toast.success('Welcome back! 🎉');
      navigate('/');
    },
    onError: (error: any) => {
      console.error('❌ [LOGIN] Failed:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 [LOGIN] Form submitted');
    loginMutation.mutate({ email, password });
  };

  console.log('🎨 [LOGIN] Rendering with setup status:', setupStatus);

  if (isCheckingSetup) {
    console.log('⏳ [LOGIN] Showing loading state...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (setupStatus?.needsSetup) {
    console.log('🚫 [LOGIN] Setup needed, should redirect...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to setup...</p>
      </div>
    );
  }

  console.log('✅ [LOGIN] Rendering login form...');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 w-4 h-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Made by{' '}
              <a
                href="https://paulify.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary"
              >
                paulify.dev
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
