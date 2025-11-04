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
import toast from 'react-hot-toast';

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
    port: 25565,
    rconPort: 25575,
    rconPassword: '',
    version: '1.20.4',
    maxRam: 2048,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => serversApi.create(data),
    onSuccess: () => {
      toast.success('Server created!');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      onOpenChange(false);
      setFormData({
        name: '',
        port: 25565,
        rconPort: 25575,
        rconPassword: '',
        version: '1.20.4',
        maxRam: 2048,
      });
    },
    onError: () => {
      toast.error('Error creating server');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rconPort">RCON Port</Label>
              <Input
                id="rconPort"
                type="number"
                value={formData.rconPort}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rconPort: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rconPassword">RCON Password</Label>
            <Input
              id="rconPassword"
              type="password"
              value={formData.rconPassword}
              onChange={(e) =>
                setFormData({ ...formData, rconPassword: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRam">RAM (MB)</Label>
              <Input
                id="maxRam"
                type="number"
                value={formData.maxRam}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxRam: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Server'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
