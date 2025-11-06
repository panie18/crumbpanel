import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MapPin, ZoomIn, ZoomOut, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Base {
  id: string;
  name: string;
  playerName: string;
  x: number;
  y: number;
  z: number;
  description?: string;
}

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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredBase, setHoveredBase] = useState<Base | null>(null);

  const queryClient = useQueryClient();

  const { data: bases = [] } = useQuery<Base[]>({
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
        playerUuid: 'unknown',
        dimension: 'overworld',
        ...data,
        x: parseFloat(data.x),
        y: parseFloat(data.y),
        z: parseFloat(data.z),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Base added successfully! 🏠');
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
      toast.success('Base deleted! 🗑️');
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });

  // Draw Minecraft-style map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    const gridSize = 50 * zoom;
    const startX = Math.floor(-centerX / gridSize) * gridSize + centerX;
    const startY = Math.floor(-centerY / gridSize) * gridSize + centerY;

    // Vertical lines
    for (let x = startX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw coordinate lines (0,0)
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // Draw spawn point (0,0)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw 0,0 label
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('SPAWN (0, 0)', centerX + 12, centerY - 12);

    // Draw bases
    bases.forEach((base) => {
      const baseX = centerX + base.x * zoom;
      const baseY = centerY + base.z * zoom; // Use Z for 2D map

      // Base marker
      const isHovered = hoveredBase?.id === base.id;
      
      ctx.fillStyle = isHovered ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(baseX, baseY, isHovered ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = isHovered ? '#dc2626' : '#2563eb';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Base name
      ctx.fillStyle = isHovered ? '#ffffff' : '#a1a1aa';
      ctx.font = isHovered ? 'bold 12px monospace' : '11px monospace';
      ctx.fillText(base.name, baseX + 12, baseY - 8);
      
      // Coordinates
      ctx.fillStyle = '#71717a';
      ctx.font = '10px monospace';
      ctx.fillText(`(${base.x}, ${base.z})`, baseX + 12, baseY + 8);
    });

  }, [bases, zoom, offset, hoveredBase]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // Check for hover
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    let found = null;
    for (const base of bases) {
      const baseX = centerX + base.x * zoom;
      const baseY = centerY + base.z * zoom;
      const distance = Math.sqrt((mouseX - baseX) ** 2 + (mouseY - baseY) ** 2);
      
      if (distance < 15) {
        found = base;
        break;
      }
    }
    setHoveredBase(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.2));
  const handleResetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

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
          <p className="text-muted-foreground">Track player bases on your Minecraft world</p>
        </div
        
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Saved Bases ({bases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {bases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No bases added yet</p>
              ) : (
                bases.map((base: Base) => (
                  <div 
                    key={base.id} 
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredBase(base)}
                    onMouseLeave={() => setHoveredBase(null)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{base.name}</p>
                      <p className="text-xs text-muted-foreground">By {base.playerName}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        X:{base.x} Y:{base.y} Z:{base.z}
                      </p>
                      {base.description && (
                        <p className="text-xs text-muted-foreground mt-1">{base.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteBaseMutation.mutate(base.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Minecraft World Map</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleResetView}>
                  <Home className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-[600px] border rounded-lg cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              <div className="absolute bottom-4 left-4 bg-background/90 p-2 rounded-lg border text-xs font-mono">
                <p>Zoom: {zoom.toFixed(2)}x</p>
                <p>🟢 Green = Spawn (0,0)</p>
                <p>🔵 Blue = Player Bases</p>
                <p className="mt-2 text-muted-foreground">💡 Drag to pan, use buttons to zoom</p>
              </div>
              {hoveredBase && (
                <div className="absolute top-4 right-4 bg-background/95 p-3 rounded-lg border">
                  <p className="font-bold">{hoveredBase.name}</p>
                  <p className="text-sm text-muted-foreground">By {hoveredBase.playerName}</p>
                  <p className="text-xs font-mono mt-1">X:{hoveredBase.x} Y:{hoveredBase.y} Z:{hoveredBase.z}</p>
                  {hoveredBase.description && (
                    <p className="text-xs text-muted-foreground mt-2">{hoveredBase.description}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
