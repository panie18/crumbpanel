import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Updated Minecraft versions with 1.21.10
const MINECRAFT_VERSIONS = [
  // Latest Releases (2025)
  { value: '1.21.10', label: '1.21.10 (Newest Release)', type: 'latest', date: '2025' },
  { value: '1.21.8', label: '1.21.8', type: 'latest', date: '17 Jul 2025' },
  { value: '1.21.7', label: '1.21.7', type: 'latest', date: '30 Jun 2025' },
  { value: '1.21.6', label: '1.21.6', type: 'latest', date: '17 Jun 2025' },
  { value: '1.21.5', label: '1.21.5', type: 'latest', date: '25 Mar 2025' },
  
  // Current Releases (2024)
  { value: '1.21.4', label: '1.21.4 (Stable)', type: 'stable', date: '3 Dec 2024' },
  { value: '1.21.3', label: '1.21.3', type: 'stable', date: '23 Oct 2024' },
  { value: '1.21.2', label: '1.21.2', type: 'stable', date: '22 Oct 2024' },
  { value: '1.21.1', label: '1.21.1', type: 'stable', date: '8 Aug 2024' },
  { value: '1.21', label: '1.21 (Tricky Trials)', type: 'stable', date: '13 Jun 2024' },
  
  // Popular Legacy Versions
  { value: '1.20.6', label: '1.20.6', type: 'legacy', date: undefined },
  { value: '1.20.4', label: '1.20.4 (Popular)', type: 'popular', date: undefined },
  { value: '1.20.1', label: '1.20.1 (Popular)', type: 'popular', date: undefined },
  { value: '1.19.4', label: '1.19.4', type: 'legacy', date: undefined },
  { value: '1.19.2', label: '1.19.2 (Popular)', type: 'popular', date: undefined },
  { value: '1.18.2', label: '1.18.2', type: 'legacy', date: undefined },
  { value: '1.17.1', label: '1.17.1', type: 'legacy', date: undefined },
  { value: '1.16.5', label: '1.16.5 (Popular)', type: 'popular', date: undefined },
  { value: '1.12.2', label: '1.12.2 (Modded)', type: 'modded', date: undefined },
  { value: '1.8.9', label: '1.8.9 (PvP)', type: 'pvp', date: undefined },
  { value: '1.7.10', label: '1.7.10 (Legacy)', type: 'legacy', date: undefined },
];

const BEDROCK_VERSIONS = [
  { value: '1.21.44', label: '1.21.44 (Latest Bedrock)', type: 'bedrock', date: undefined },
  { value: '1.21.43', label: '1.21.43', type: 'bedrock', date: undefined },
  { value: '1.21.42', label: '1.21.42', type: 'bedrock', date: undefined },
  { value: '1.21.41', label: '1.21.41', type: 'bedrock', date: undefined },
  { value: '1.21.40', label: '1.21.40', type: 'bedrock', date: undefined },
  { value: '1.21.30', label: '1.21.30', type: 'bedrock', date: undefined },
  { value: '1.21.23', label: '1.21.23', type: 'bedrock', date: undefined },
  { value: '1.21.22', label: '1.21.22', type: 'bedrock', date: undefined },
  { value: '1.21.21', label: '1.21.21', type: 'bedrock', date: undefined },
  { value: '1.21.20', label: '1.21.20', type: 'bedrock', date: undefined },
];

const getVersionBadgeColor = (type: string) => {
  switch (type) {
    case 'latest': return 'bg-green-600 text-white';
    case 'stable': return 'bg-blue-500 text-white';
    case 'popular': return 'bg-purple-500 text-white';
    case 'modded': return 'bg-orange-500 text-white';
    case 'pvp': return 'bg-red-500 text-white';
    case 'legacy': return 'bg-gray-500 text-white';
    case 'bedrock': return 'bg-cyan-500 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

export default function CreateServerDialog({
  open,
  onOpenChange,
}: CreateServerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    serverType: 'java',
    version: '1.21.10', // Latest version
    port: 25565,
    rconPort: 25575,
    rconPassword: '',
    maxRam: 2
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🔨 [FRONTEND] Creating server with auth check:', data);
      
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';
      
      // Get fresh token from localStorage
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('🔐 [FRONTEND] Using token for server creation');
      
      return axios.post(`${API_URL}/servers`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
      });
    },
    onSuccess: () => {
      console.log('✅ [FRONTEND] Server created successfully');
      toast.success('🎉 Server created successfully!');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      onOpenChange(false);
      setFormData({
        name: '',
        serverType: 'java',
        version: '1.21.10',
        port: 25565,
        rconPort: 25575,
        rconPassword: '',
        maxRam: 2
      });
    },
    onError: (error: any) => {
      console.error('❌ [FRONTEND] Server creation failed:', error);
      
      if (error.response?.status === 401) {
        toast.error('🚫 Authentication failed. Please log in again.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create server';
      toast.error(`❌ ${errorMessage}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a server name');
      return;
    }

    if (!formData.rconPassword.trim()) {
      toast.error('Please enter a RCON password');
      return;
    }

    createMutation.mutate(formData);
  };

  const getAvailableVersions = () => {
    return formData.serverType === 'bedrock' ? BEDROCK_VERSIONS : MINECRAFT_VERSIONS;
  };

  const handleServerTypeChange = (type: string) => {
    setFormData({
      ...formData,
      serverType: type,
      version: type === 'bedrock' ? '1.21.44' : '1.21.10',
      port: type === 'bedrock' ? 19132 : 25565, // Bedrock uses different default port
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Server</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              placeholder="My Minecraft Server"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-type">Server Type</Label>
            <Select 
              value={formData.serverType} 
              onValueChange={handleServerTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select server type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="java">
                  <div className="flex items-center gap-2">
                    <span>☕</span>
                    <div>
                      <div className="font-medium">Minecraft Java Edition</div>
                      <div className="text-xs text-muted-foreground">PC, Mac, Linux - Supports mods & plugins</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="bedrock">
                  <div className="flex items-center gap-2">
                    <span>🧱</span>
                    <div>
                      <div className="font-medium">Minecraft Bedrock Edition</div>
                      <div className="text-xs text-muted-foreground">Mobile, Console, Windows 10 - Cross-platform</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.serverType === 'bedrock' 
                ? 'Bedrock servers support cross-platform play (Mobile, Xbox, PlayStation, Switch)'
                : 'Java servers support plugins, mods, and advanced customization'
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Minecraft Version</Label>
            <Select 
              value={formData.version} 
              onValueChange={(value) => setFormData({ ...formData, version: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {getAvailableVersions().map((version) => (
                  <SelectItem key={version.value} value={version.value}>
                    <div className="flex items-center gap-2 w-full">
                      <span className="flex-1">{version.label}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getVersionBadgeColor(version.type)}`}>
                        {version.type}
                      </span>
                      {version.date && (
                        <span className="text-xs text-muted-foreground">
                          {version.date}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.serverType === 'bedrock' 
                ? 'Bedrock versions support cross-platform play'
                : 'Latest: 1.21.8 (July 2025) - includes all Tricky Trials updates'
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Server Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                min={1024}
                max={65535}
                required
              />
              <p className="text-xs text-muted-foreground">
                Default: {formData.serverType === 'bedrock' ? '19132 (Bedrock)' : '25565 (Java)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRam">RAM (GB)</Label>
              <Select 
                value={formData.maxRam.toString()} 
                onValueChange={(value) => setFormData({ ...formData, maxRam: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 GB {formData.serverType === 'bedrock' && '(Recommended for Bedrock)'}</SelectItem>
                  <SelectItem value="2">2 GB {formData.serverType === 'java' && '(Minimum for Java)'}</SelectItem>
                  <SelectItem value="4">4 GB (Recommended)</SelectItem>
                  <SelectItem value="6">6 GB</SelectItem>
                  <SelectItem value="8">8 GB</SelectItem>
                  <SelectItem value="12">12 GB</SelectItem>
                  <SelectItem value="16">16 GB</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.serverType === 'bedrock' 
                  ? 'Bedrock servers typically use less RAM'
                  : 'Java servers need more RAM for plugins/mods'
                }
              </p>
            </div>
          </div>

          {formData.serverType === 'java' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rconPort">RCON Port</Label>
                <Input
                  id="rconPort"
                  type="number"
                  value={formData.rconPort}
                  onChange={(e) => setFormData({ ...formData, rconPort: parseInt(e.target.value) })}
                  min={1024}
                  max={65535}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  RCON allows remote console access
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rconPassword">RCON Password</Label>
                <Input
                  id="rconPassword"
                  type="password"
                  placeholder="Strong password"
                  value={formData.rconPassword}
                  onChange={(e) => setFormData({ ...formData, rconPassword: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {formData.serverType === 'bedrock' && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Bedrock Server Features</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                    <li>• Cross-platform play with mobile, console, and PC players</li>
                    <li>• Built-in anti-cheat protection</li>
                    <li>• No RCON support (uses different management methods)</li>
                    <li>• Uses UDP protocol instead of TCP</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Server'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
