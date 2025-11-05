import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Map, Home, Plus, Eye, Edit, Trash2, Image, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5829/api'
  : '/api';

interface PlayerBase {
  id: string;
  name: string;
  description?: string;
  player: { username: string };
  world: string;
  x: number;
  y: number;
  z: number;
  screenshotUrl?: string;
  isPublic: boolean;
  createdAt: string;
}

export default function BasesMapPage() {
  const [selectedBase, setSelectedBase] = useState<PlayerBase | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<'overworld' | 'nether' | 'end'>('overworld');
  
  const queryClient = useQueryClient();

  const { data: bases, isLoading } = useQuery({
    queryKey: ['bases', 'server-1', selectedWorld],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/bases/server/server-1?world=${selectedWorld}`);
      return response.data;
    }
  });

  const createBaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return axios.post(`${API_URL}/bases`, data);
    },
    onSuccess: () => {
      toast.success('Base added to map! 🏡');
      queryClient.invalidateQueries({ queryKey: ['bases'] });
      setShowCreateDialog(false);
    },
    onError: () => toast.error('Failed to add base')
  });

  const deleteBaseMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`${API_URL}/bases/${id}`);
    },
    onSuccess: () => {
      toast.success('Base removed!');
      queryClient.invalidateQueries({ queryKey: ['bases'] });
      setSelectedBase(null);
    },
    onError: () => toast.error('Failed to delete base')
  });

  // Convert Minecraft coords to Leaflet coords
  const coordsToLatLng = (x: number, z: number): [number, number] => {
    return [z / 100, x / 100]; // Scale down for better map view
  };

  const getWorldColor = (world: string) => {
    switch (world) {
      case 'overworld': return 'bg-green-500';
      case 'nether': return 'bg-red-500';
      case 'end': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Map className="w-8 h-8" />
            Spielerbasen-Karte
          </h2>
          <p className="text-muted-foreground">
            Entdecke die Basen deiner Mitspieler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedWorld} onValueChange={(v: any) => setSelectedWorld(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overworld">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Overworld
                </div>
              </SelectItem>
              <SelectItem value="nether">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Nether
                </div>
              </SelectItem>
              <SelectItem value="end">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  End
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Basis hinzufügen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Map */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Interaktive Karte
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] w-full relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <MapContainer
                  center={[0, 0]}
                  zoom={4}
                  className="h-full w-full rounded-b-lg"
                  style={{ background: selectedWorld === 'nether' ? '#4a0000' : selectedWorld === 'end' ? '#1a0033' : '#87ceeb' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; Minecraft Bases'
                  />
                  {bases?.map((base: PlayerBase) => (
                    <Marker
                      key={base.id}
                      position={coordsToLatLng(base.x, base.z)}
                      eventHandlers={{
                        click: () => setSelectedBase(base)
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-bold text-lg">{base.name}</h3>
                          <p className="text-sm text-muted-foreground">by {base.player.username}</p>
                          {base.description && (
                            <p className="text-sm mt-2">{base.description}</p>
                          )}
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>📍 X: {base.x}, Y: {base.y}, Z: {base.z}</p>
                          </div>
                          {base.screenshotUrl && (
                            <img src={base.screenshotUrl} alt={base.name} className="mt-2 rounded" />
                          )}
                        </div>
                      </Popup>
                      <Tooltip>
                        <div className="font-semibold">{base.name}</div>
                      </Tooltip>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bases List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Alle Basen ({bases?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
              {bases?.map((base: PlayerBase) => (
                <Card 
                  key={base.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedBase(base)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getWorldColor(base.world)}`} />
                          {base.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          👤 {base.player.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          📍 {Math.floor(base.x)}, {Math.floor(base.y)}, {Math.floor(base.z)}
                        </p>
                      </div>
                      {base.screenshotUrl && (
                        <Image className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Base Details Dialog */}
      {selectedBase && (
        <Dialog open={!!selectedBase} onOpenChange={() => setSelectedBase(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                {selectedBase.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBase.screenshotUrl && (
                <img 
                  src={selectedBase.screenshotUrl} 
                  alt={selectedBase.name}
                  className="w-full rounded-lg"
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Besitzer</Label>
                  <p className="font-semibold">{selectedBase.player.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Welt</Label>
                  <p className="font-semibold capitalize">{selectedBase.world}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Koordinaten</Label>
                  <p className="font-mono">
                    X: {Math.floor(selectedBase.x)} | 
                    Y: {Math.floor(selectedBase.y)} | 
                    Z: {Math.floor(selectedBase.z)}
                  </p>
                </div>
              </div>

              {selectedBase.description && (
                <div>
                  <Label className="text-muted-foreground">Beschreibung</Label>
                  <p className="mt-1">{selectedBase.description}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(`/tp ${Math.floor(selectedBase.x)} ${Math.floor(selectedBase.y)} ${Math.floor(selectedBase.z)}`);
                    toast.success('Teleport-Befehl kopiert!');
                  }}
                >
                  📋 TP-Command kopieren
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => deleteBaseMutation.mutate(selectedBase.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Base Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Basis zur Karte hinzufügen</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createBaseMutation.mutate({
              name: formData.get('name'),
              description: formData.get('description'),
              playerId: 'player-1', // TODO: Get from auth
              serverId: 'server-1',
              world: formData.get('world'),
              x: Number(formData.get('x')),
              y: Number(formData.get('y')),
              z: Number(formData.get('z')),
              screenshotUrl: formData.get('screenshot'),
              isPublic: true
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Name der Basis</Label>
              <Input name="name" placeholder="z.B. Meine Mega-Burg" required />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Textarea name="description" placeholder="Erzähle über deine Basis..." />
            </div>

            <div className="space-y-2">
              <Label>Welt</Label>
              <Select name="world" defaultValue="overworld">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overworld">Overworld</SelectItem>
                  <SelectItem value="nether">Nether</SelectItem>
                  <SelectItem value="end">End</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>X-Koordinate</Label>
                <Input name="x" type="number" placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label>Y-Koordinate</Label>
                <Input name="y" type="number" placeholder="64" required />
              </div>
              <div className="space-y-2">
                <Label>Z-Koordinate</Label>
                <Input name="z" type="number" placeholder="0" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Screenshot-URL (optional)</Label>
              <Input name="screenshot" placeholder="https://..." />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createBaseMutation.isPending}>
                {createBaseMutation.isPending ? 'Wird hinzugefügt...' : 'Basis hinzufügen'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Abbrechen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
