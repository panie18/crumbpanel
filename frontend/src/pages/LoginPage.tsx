import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Server } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Erfolgreich angemeldet!');
      navigate('/');
    },
    onError: () => {
      toast.error('Anmeldung fehlgeschlagen');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0e111a] to-[#1a0a2e] p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glow">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center"
            >
              <Server className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl gradient-text">
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
                className="text-cyan-400 hover:text-cyan-300"
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Default login:</p>
              <p className="font-mono text-xs">admin@mcpanel.local / admin123</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
