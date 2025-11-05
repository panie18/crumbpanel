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

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MINECRAFT_VERSIONS = [
  { value: '1.21.3', label: '1.21.3 (Latest)' },
  { value: '1.21.2', label: '1.21.2' },
  { value: '1.21.1', label: '1.21.1' },
  { value: '1.21', label: '1.21' },
  { value: '1.20.6', label: '1.20.6' },
  { value: '1.20.4', label: '1.20.4' },
  { value: '1.20.2', label: '1.20.2' },
  { value: '1.20.1', label: '1.20.1' },
  { value: '1.19.4', label: '1.19.4' },
  { value: '1.19.2', label: '1.19.2' },
  { value: '1.18.2', label: '1.18.2' },
  { value: '1.17.1', label: '1.17.1' },
  { value: '1.16.5', label: '1.16.5' },
  { value: '1.12.2', label: '1.12.2 (Modded)' },
  { value: '1.8.9', label: '1.8.9 (PvP)' },
];

export default function CreateServerDialog({
  open,
  onOpenChange,
}: CreateServerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    version: '1.21.3',
    port: 25565,
    rconPort: 25575,
    rconPassword: '',
    maxRam: 2,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => serversApi.create(data),
    onSuccess: () => {
      toast.success('Server created successfully!');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      onOpenChange(false);
      setFormData({
        name: '',
        version: '1.21.3',
        port: 25565,
        rconPort: 25575,
        rconPassword: '',
        maxRam: 2
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create server');
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
              onValueChange={(value) =>
                setFormData({ ...formData, version: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {MINECRAFT_VERSIONS.map((version) => (
                  <SelectItem key={version.value} value={version.value}>
                    {version.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
