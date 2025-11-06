import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ServerCard from '@/components/ServerCard';
import CreateServerDialog from '@/components/CreateServerDialog';
import axios from 'axios';

export default function ServersPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  console.log('🎨 ServersPage rendering...');

  const { data: serversResponse, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await axios.get('/api/servers');
      return response.data; // Return only the data, not the full response
    },
  });

  // Extract the actual servers array from the response data
  const servers = serversResponse || [];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Servers</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Server
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && servers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Server className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No servers yet</h3>
            <p className="text-muted-foreground mb-4">Create your first Minecraft server to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Server
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && servers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server: any) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateServerDialog 
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}
