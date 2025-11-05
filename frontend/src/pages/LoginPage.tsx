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
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import { Server, Eye, EyeOff, Loader2, LogIn, Shield } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5829/api'
  : '/api';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '', totpToken: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpInput, setShowTotpInput] = useState(false);
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
    mutationFn: async (creds: { email: string; password: string; totpToken?: string }) => {
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';

      const response = await axios.post(`${API_URL}/auth/login`, {
        email: creds.email,
        password: creds.password,
        ...(creds.totpToken && { totpToken: creds.totpToken })
      });

      return response;
    },
    onSuccess: (response) => {
      console.log('✅ Login successful:', response.data);
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success('Login erfolgreich!');
      navigate('/');
    },
    onError: (error: any) => {
      console.error('❌ Login failed:', error);
      
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

  const handleFIDO2Login = async () => {
    try {
      console.log('🔐 [FIDO2] Starting FIDO2 authentication...');
      
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        toast.error('FIDO2/WebAuthn not supported in this browser');
        return;
      }

      // Get challenge from server
      const challengeResponse = await axios.post(`${API_URL}/auth/fido2/challenge`, { email: credentials.email });
      const { challenge, allowCredentials } = challengeResponse.data;

      // Start WebAuthn ceremony
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(challenge),
          allowCredentials: allowCredentials.map((cred: any) => ({
            id: new Uint8Array(cred.id),
            type: 'public-key'
          })),
          timeout: 60000,
          userVerification: 'required'
        }
      }) as PublicKeyCredential;

      if (credential && credential.rawId) {
        // Send credential to server for verification
        const loginResponse = await axios.post(`${API_URL}/auth/fido2/verify`, {
          email: credentials.email,
          credentialId: Array.from(new Uint8Array(credential.rawId)),
          authenticatorData: Array.from(new Uint8Array((credential.response as any).authenticatorData)),
          signature: Array.from(new Uint8Array((credential.response as any).signature))
        });

        const { user, accessToken } = loginResponse.data;
        setAuth(user, accessToken, null);
        toast.success('FIDO2 login successful! 🎉');
        navigate('/');
      }
    } catch (error: any) {
      console.error('❌ [FIDO2] Authentication failed:', error);
      toast.error('FIDO2 authentication failed');
    }
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                    autoComplete="current-password"
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
                    required={showTotpInput}
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

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={handleFIDO2Login}
              >
                <Shield className="mr-2 w-4 h-4" />
                Sign in with FIDO2/Passkey
              </Button>
            </div>

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
