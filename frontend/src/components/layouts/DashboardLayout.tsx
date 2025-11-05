import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Users,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/ThemeToggle';
import UnsplashPicker from '@/components/UnsplashPicker';
import axios from 'axios';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Server, current: true },
  { name: 'Players', href: '/players', icon: Users, current: false },
  { name: 'Backups', href: '/backups', icon: Database, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const location = useLocation();
  const { user, logout, setAuth } = useAuthStore();
  const { customPrimary } = useThemeStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.substring(0, 2).toUpperCase() || 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const updateProfilePicture = async (imageUrl: string) => {
    try {
      console.log('🖼️ Updating profile picture:', imageUrl);
      
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';
      
      const response = await axios.patch(
        `${API_URL}/auth/profile-picture`,
        { pictureUrl: imageUrl },
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          } 
        }
      );
      
      if (response.data.success) {
        // Update user in store
        const updatedUser = response.data.user;
        setAuth(updatedUser, localStorage.getItem('token'), null);
        console.log('✅ Profile picture updated successfully');
      }
    } catch (error) {
      console.error('❌ Failed to update profile picture:', error);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-card overflow-y-auto border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: customPrimary || '#000' }}
            >
              <Server className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold">CrumbPanel</span>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4">
            <div className="text-xs text-muted-foreground">
              Made with ❤️ by{' '}
              <a
                href="https://paulify.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                paulify.dev
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-background/80 backdrop-blur" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            {/* Mobile nav content same as desktop */}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-background border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <div className="max-w-lg w-full lg:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center space-x-4">
              <ThemeToggle />
              
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.picture || undefined} alt={user?.name || user?.email} />
                      <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setUnsplashOpen(true)}>
                    <Search className="mr-2 h-4 w-4" />
                    <span>Change Picture</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>

      <UnsplashPicker 
        open={unsplashOpen}
        onOpenChange={setUnsplashOpen}
        onSelect={updateProfilePicture}
      />
    </div>
  );
}
