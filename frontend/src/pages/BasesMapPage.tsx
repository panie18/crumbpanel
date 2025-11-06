import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

export default function BasesMapPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBase, setNewBase] = useState({
    name: '',
    x: '',
    y: '',
    z: '',
    description: '',
    playerName: '',
  });

  const queryClient = useQueryClient();

  const { data: bases = [] } = useQuery({
    queryKey: ['bases', 'server-1'],
    queryFn: async () => {
      const response = await axios.get('/api/bases/server/server-1');
      return response.data;
    },
  });

  const createBaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/bases', {
        serverId: 'server-1',
        ...data,
        x: parseFloat(data.x),
        y: parseFloat(data.y),
        z: parseFloat(data.z),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Base added successfully!');
      queryClient.invalidateQueries({ queryKey: ['bases'] });
      setShowAddDialog(false);
      setNewBase({ name: '', x: '', y: '', z: '', description: '', playerName: '' });
    },
  });

  const deleteBaseMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/bases/${id}`);
    },
    onSuccess: () => {
      toast.success('Base deleted!');
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBaseMutation.mutate(newBase);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="w-8 h-8 text-blue-500" />
            Bases Map
          </h2>
          <p className="text-muted-foreground">
            Track player bases on your server
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Base
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Base</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Base Name</Label>
                <Input
                  value={newBase.name}
                  onChange={(e) => setNewBase({ ...newBase, name: e.target.value })}
                  placeholder="My Epic Base"
                  required
                />
              </div>
              <div>
                <Label>Player Name</Label>
                <Input
                  value={newBase.playerName}
                  onChange={(e) => setNewBase({ ...newBase, playerName: e.target.value })}
                  placeholder="Steve"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>X</Label>
                  <Input
                    type="number"
                    value={newBase.x}
                    onChange={(e) => setNewBase({ ...newBase, x: e.target.value })}
                    placeholder="100"
                    required
                  />
                </div>
                <div>
                  <Label>Y</Label>
                  <Input
                    type="number"
                    value={newBase.y}
                    onChange={(e) => setNewBase({ ...newBase, y: e.target.value })}
                    placeholder="64"
                    required
                  />
                </div>
                <div>
                  <Label>Z</Label>
                  <Input
                    type="number"
                    value={newBase.z}
                    onChange={(e) => setNewBase({ ...newBase, z: e.target.value })}
                    placeholder="-200"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newBase.description}
                  onChange={(e) => setNewBase({ ...newBase, description: e.target.value })}
                  placeholder="Describe your base..."
                />
              </div>
              <Button type="submit" className="w-full">
                Add Base
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saved Bases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No bases added yet</p>
              ) : (
                bases.map((base: any) => (
                  <div key={base.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{base.name}</p>
                      <p className="text-sm text-muted-foreground">
                        By {base.playerName} • X:{base.x} Y:{base.y} Z:{base.z}
                      </p>
                      {base.description && (
                        <p className="text-xs text-muted-foreground mt-1">{base.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBaseMutation.mutate(base.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Map View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Interactive map coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
