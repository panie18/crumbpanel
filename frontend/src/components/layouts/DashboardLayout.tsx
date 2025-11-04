import { Outlet, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Server, 
  Users, 
  HardDrive, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '../ui/button';
import { useState } from 'react';

const navigation = [
  { name: 'Servers', href: '/servers', icon: Server },
  { name: 'Players', href: '/players', icon: Users },
  { name: 'Backups', href: '/backups', icon: HardDrive },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-white/10 md:translate-x-0 md:relative md:z-0"
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">CrumbPanel</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </motion.aside>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </Button>

      {/* Main content */}
      <main className="flex-1 md:ml-0 p-8 relative z-10">
        <Outlet />
        
        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Made with ❤️ by{' '}
            <a
              href="https://paulify.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors"
            >
              paulify.dev
            </a>
          </p>
          <p className="mt-1">
            <a
              href="https://github.com/panie18/crumbpanel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ⭐ Star on GitHub
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
