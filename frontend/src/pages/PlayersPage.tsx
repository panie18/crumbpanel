import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { serversApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PlayersList from '@/components/PlayersList';

export default function PlayersPage() {
  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text">Player Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage players across all servers
        </p>
      </motion.div>

      <div className="grid gap-6">
        {servers?.data?.map((server: any) => (
          <Card key={server.id}>
            <CardHeader>
              <CardTitle>{server.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayersList serverId={server.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
