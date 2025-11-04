import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Server, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5829/api';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@mcpanel.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Check if setup is needed
  const { data: setupStatus } = useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/auth/setup-status`);
      return response.data;
    },
  });

  useEffect(() => {
    if (setupStatus?.needsSetup) {
      navigate('/setup');
    }
  }, [setupStatus, navigate]);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Successfully logged in!');
      navigate('/');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed - Check your credentials');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  if (setupStatus?.needsSetup) {
    return null; // Will redirect to setup
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme Toggle in top right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center"
            >
              <Server className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-3xl">
              CrumbPanel
            </CardTitle>
            <p className="text-muted-foreground">
              Sign in to continue
            </p>
            <p className="text-xs text-muted-foreground">
              Made by{' '}
              <a
                href="https://paulify.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground"
              >
                paulify.dev
              </a>
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@mcpanel.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Default login:</p>
              <p className="font-mono text-xs text-gray-400">admin@mcpanel.local / admin123</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
