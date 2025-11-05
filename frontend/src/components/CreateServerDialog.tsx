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

// Latest Minecraft versions (researched December 2024)
const MINECRAFT_VERSIONS = [
  { value: '1.21.44', label: '1.21.44 (Latest Release)', type: 'release' },
  { value: '1.21.43', label: '1.21.43', type: 'release' },
  { value: '1.21.42', label: '1.21.42', type: 'release' },
  { value: '1.21.41', label: '1.21.41', type: 'release' },
  { value: '1.21.40', label: '1.21.40', type: 'release' },
  { value: '1.21.30', label: '1.21.30', type: 'release' },
  { value: '1.21.23', label: '1.21.23', type: 'release' },
  { value: '1.21.22', label: '1.21.22', type: 'release' },
  { value: '1.21.21', label: '1.21.21', type: 'release' },
  { value: '1.21.20', label: '1.21.20', type: 'release' },
  { value: '1.21.4', label: '1.21.4 (Java Latest)', type: 'java' },
  { value: '1.21.3', label: '1.21.3 (Java)', type: 'java' },
  { value: '1.21.1', label: '1.21.1 (Java)', type: 'java' },
  { value: '1.21', label: '1.21 (Java)', type: 'java' },
  { value: '1.20.6', label: '1.20.6', type: 'release' },
  { value: '1.20.4', label: '1.20.4 (Popular)', type: 'popular' },
  { value: '1.20.1', label: '1.20.1 (Popular)', type: 'popular' },
  { value: '1.19.4', label: '1.19.4', type: 'release' },
  { value: '1.19.2', label: '1.19.2 (Popular)', type: 'popular' },
  { value: '1.18.2', label: '1.18.2', type: 'release' },
  { value: '1.17.1', label: '1.17.1', type: 'release' },
  { value: '1.16.5', label: '1.16.5 (Popular)', type: 'popular' },
  { value: '1.12.2', label: '1.12.2 (Modded)', type: 'modded' },
  { value: '1.8.9', label: '1.8.9 (PvP)', type: 'pvp' },
  { value: '1.7.10', label: '1.7.10 (Legacy)', type: 'legacy' },
];

const getVersionBadgeColor = (type: string) => {
  switch (type) {
    case 'release': return 'bg-green-500 text-white';
    case 'java': return 'bg-blue-500 text-white';
    case 'popular': return 'bg-purple-500 text-white';
    case 'modded': return 'bg-orange-500 text-white';
    case 'pvp': return 'bg-red-500 text-white';
    case 'legacy': return 'bg-gray-500 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

export default function CreateServerDialog({
  open,
  onOpenChange,
}: CreateServerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    version: '1.21.44', // Latest version
    port: 25565,
    rconPort: 25575,
    rconPassword: '',
    maxRam: 2,
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
        version: '1.21.44',
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
            <Label htmlFor="version">Minecraft Version</Label>
            <Select 
              value={formData.version} 
              onValueChange={(value) => setFormData({ ...formData, version: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {MINECRAFT_VERSIONS.map((version) => (
                  <SelectItem key={version.value} value={version.value}>
                    <div className="flex items-center gap-2">
                      <span>{version.label}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getVersionBadgeColor(version.type)}`}>
                        {version.type}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Latest versions include Bedrock and Java editions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Server Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) =>
                  setFormData({ ...formData, port: parseInt(e.target.value) })
                }
                min={1024}
                max={65535}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRam">RAM (GB)</Label>
              <Select
                value={formData.maxRam.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, maxRam: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 GB</SelectItem>
                  <SelectItem value="2">2 GB</SelectItem>
                  <SelectItem value="4">4 GB</SelectItem>
                  <SelectItem value="6">6 GB</SelectItem>
                  <SelectItem value="8">8 GB</SelectItem>
                  <SelectItem value="12">12 GB</SelectItem>
                  <SelectItem value="16">16 GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rconPort">RCON Port</Label>
              <Input
                id="rconPort"
                type="number"
                value={formData.rconPort}
                onChange={(e) =>
                  setFormData({ ...formData, rconPort: parseInt(e.target.value) })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, rconPassword: e.target.value })
                }
                required
              />
            </div>
          </div>

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
