import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/auth/Auth0Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, LogIn } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <CardTitle className="text-3xl">Welcome to CrumbPanel</CardTitle>
            <p className="text-muted-foreground">
              Secure login with Auth0
            </p>
          </CardHeader>

          <CardContent>
            <Button onClick={() => login()} className="w-full" size="lg">
              <LogIn className="w-5 h-5 mr-2" />
              Sign In with Auth0
            </Button>
            
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
