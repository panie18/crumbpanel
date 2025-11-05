import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map, Maximize2, Minimize2, Navigation, Layers } from 'lucide-react';

interface LiveMapViewerProps {
  serverId: string;
}

export default function LiveMapViewer({ serverId }: LiveMapViewerProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [mapType, setMapType] = useState<'surface' | 'caves' | 'nether'>('surface');

  // Dynmap/BlueMap URL (customize based on your setup)
  const mapUrl = `http://localhost:8123/?worldname=world&mapname=${mapType}&zoom=4`;

  return (
    <Card className={fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Live Server Map
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={mapType} onValueChange={(v: any) => setMapType(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="surface">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Surface
                </div>
              </SelectItem>
              <SelectItem value="caves">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Caves
                </div>
              </SelectItem>
              <SelectItem value="nether">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Nether
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          src={mapUrl}
          className={fullscreen ? 'w-full h-screen' : 'w-full h-96'}
          frameBorder="0"
          title="Minecraft Live Map"
        />
      </CardContent>
    </Card>
  );
}
