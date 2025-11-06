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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    const gridSize = 50 * zoom;
    const startX = Math.floor(-centerX / gridSize) * gridSize + centerX;
    const startY = Math.floor(-centerY / gridSize) * gridSize + centerY;

    for (let x = startX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = startY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

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

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    bases.forEach((base) => {
      const baseX = centerX + base.x * zoom;
      const baseY = centerY + base.z * zoom;
      const isHovered = hoveredBase?.id === base.id;
      
      ctx.fillStyle = isHovered ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(baseX, baseY, isHovered ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = isHovered ? '#ffffff' : '#a1a1aa';
      ctx.font = isHovered ? 'bold 12px monospace' : '11px monospace';
      ctx.fillText(base.name, baseX + 12, baseY - 8);
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
          <p className="text-muted-foreground">Track player bases</p>
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
                  required
                />
              </div>
              <div>
                <Label>Player Name</Label>
                <Input
                  value={newBase.playerName}
                  onChange={(e) => setNewBase({ ...newBase, playerName: e.target.value })}
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
                    required
                  />
                </div>
                <div>
                  <Label>Y</Label>
                  <Input
                    type="number"
                    value={newBase.y}
                    onChange={(e) => setNewBase({ ...newBase, y: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Z</Label>
                  <Input
                    type="number"
                    value={newBase.z}
                    onChange={(e) => setNewBase({ ...newBase, z: e.target.value })}
                    required
                  />
                </div>
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
            <CardTitle>Bases List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bases.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No bases yet</p>
              ) : (
                bases.map((base) => (
                  <div key={base.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-semibold text-sm">{base.name}</p>
                      <p className="text-xs text-muted-foreground">{base.playerName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteBaseMutation.mutate(base.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Map</CardTitle>
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
            <canvas
              ref={canvasRef}
              className="w-full h-[600px] border rounded-lg cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
