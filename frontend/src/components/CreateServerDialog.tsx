import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { serversApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateServerDialog({
  open,
  onOpenChange,
}: CreateServerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    serverType: 'java',
    version: '', // Will be set to latest
    port: 25565,
    rconPort: 25575,
    rconPassword: '',
    maxRam: 2,
    maxPlayers: 20
  });
  
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [minecraftVersions, setMinecraftVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const queryClient = useQueryClient();

  // Fetch latest Minecraft version from Mojang API
  useEffect(() => {
    if (open) {
      fetchMinecraftVersions();
    }
  }, [open]);

  const fetchMinecraftVersions = async () => {
    setLoadingVersions(true);
    try {
      const response = await axios.get('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
      const versions = response.data.versions;
      
      // Filter only release versions
      const releaseVersions = versions
        .filter((v: any) => v.type === 'release')
        .slice(0, 15); // Get latest 15 releases
      
      const latest = releaseVersions[0]?.id || '1.21.4';
      
      console.log('📋 [VERSIONS] Latest Minecraft version from Mojang:', latest);
      
      setLatestVersion(latest);
      setMinecraftVersions(releaseVersions);
      setFormData(prev => ({ ...prev, version: latest }));
      
    } catch (error) {
      console.error('❌ [VERSIONS] Failed to fetch versions:', error);
      // Fallback versions if API fails
      const fallbackLatest = '1.21.4';
      setLatestVersion(fallbackLatest);
      setFormData(prev => ({ ...prev, version: fallbackLatest }));
      
      setMinecraftVersions([
        { id: '1.21.4', type: 'release' },
        { id: '1.21.3', type: 'release' },
        { id: '1.21.1', type: 'release' },
        { id: '1.21', type: 'release' },
        { id: '1.20.6', type: 'release' },
        { id: '1.20.4', type: 'release' },
        { id: '1.20.1', type: 'release' },
        { id: '1.19.4', type: 'release' },
        { id: '1.19.2', type: 'release' },
        { id: '1.18.2', type: 'release' },
        { id: '1.16.5', type: 'release' },
        { id: '1.12.2', type: 'release' },
        { id: '1.8.9', type: 'release' },
      ]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const getAvailableVersions = () => {
    if (formData.serverType === 'bedrock') {
      return [
        { id: '1.21.44', type: 'bedrock' },
        { id: '1.21.43', type: 'bedrock' },
        { id: '1.21.42', type: 'bedrock' },
        { id: '1.21.41', type: 'bedrock' },
        { id: '1.21.40', type: 'bedrock' },
      ];
    }
    return minecraftVersions;
  };

  const handleServerTypeChange = (type: string) => {
    setFormData({
      ...formData,
      serverType: type,
      version: type === 'bedrock' ? '1.21.44' : latestVersion,
      port: type === 'bedrock' ? 19132 : 25565,
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🔨 [FRONTEND] Creating server with latest version:', data);
      
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
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
      toast.success(`🎉 Server created with Minecraft ${formData.version}!`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      onOpenChange(false);
      setFormData({
        name: '',
        serverType: 'java',
        version: latestVersion,
        port: 25565,
        rconPort: 25575,
        rconPassword: '',
        maxRam: 2,
        maxPlayers: 20
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
    
    if (formData.serverType === 'java' && !formData.rconPassword.trim()) {
      toast.error('Please enter a RCON password');
      return;
    }

    createMutation.mutate(formData);
  };

  const getVersionBadgeColor = (version: any) => {
    if (version.id === latestVersion) return 'bg-green-600 text-white';
    if (version.id?.includes('1.20') || version.id?.includes('1.19')) return 'bg-purple-500 text-white';
    if (version.id?.includes('1.16') || version.id?.includes('1.12')) return 'bg-orange-500 text-white';
    if (version.id?.includes('1.8')) return 'bg-red-500 text-white';
    return 'bg-blue-500 text-white';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Minecraft Server</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              placeholder="My Minecraft Server"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Minecraft Version</Label>
            {loadingVersions ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading versions from Mojang...</span>
              </div>
            ) : (
              <Select 
                value={formData.version} 
                onValueChange={(value) => setFormData({ ...formData, version: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {getAvailableVersions().map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1">
                          {version.id}
                          {version.id === latestVersion && ' (Latest Release)'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getVersionBadgeColor(version)}`}>
                          {version.id === latestVersion ? 'Latest' : version.type || 'Release'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.serverType === 'bedrock' 
                ? 'Latest Bedrock version available'
                : `Latest Java version: ${latestVersion} (fetched from Mojang API)`
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
                  <SelectItem value="1">1 GB</SelectItem>
                  <SelectItem value="2">2 GB (Recommended)</SelectItem>
                  <SelectItem value="4">4 GB</SelectItem>
                  <SelectItem value="6">6 GB</SelectItem>
                  <SelectItem value="8">8 GB</SelectItem>
                  <SelectItem value="12">12 GB</SelectItem>
                  <SelectItem value="16">16 GB</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={createMutation.isPending || loadingVersions}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create Server (${formData.version})`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
