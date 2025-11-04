import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';
import { serversApi } from '@/lib/api';
import ServerCard from '@/components/ServerCard';
import CreateServerDialog from '@/components/CreateServerDialog';
import { Button } from '@/components/ui/button';

export default function ServersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: servers, isLoading, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text">Servers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Minecraft servers
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="glass" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Server
          </Button>
        </div>
      </motion.div>

      {/* Server Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-64 animate-pulse" />
          ))}
        </div>
      ) : servers?.data?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card text-center py-12"
        >
          <p className="text-muted-foreground mb-4">No servers available</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create first server
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers?.data?.map((server: any) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      <CreateServerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
