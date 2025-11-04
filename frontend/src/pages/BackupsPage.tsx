import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serversApi, backupsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Database,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function BackupsPage() {
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [uploadToCloud, setUploadToCloud] = useState(true);
  const queryClient = useQueryClient();

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
  });

  const { data: cloudBackups, refetch: refetchCloud } = useQuery({
    queryKey: ['cloudBackups'],
    queryFn: () => backupsApi.listCloud(),
  });

  const createBackupMutation = useMutation({
    mutationFn: (serverId: string) =>
      backupsApi.create(serverId, uploadToCloud),
    onSuccess: () => {
      toast.success('Creating backup...');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      refetchCloud();
    },
    onError: () => toast.error('Backup failed'),
  });

  const restoreBackupMutation = useMutation({
    mutationFn: ({ backupId, fromCloud }: any) =>
      backupsApi.restore(backupId, fromCloud),
    onSuccess: () => {
      toast.success('Restoring backup...');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Restore failed'),
  });

  const deleteBackupMutation = useMutation({
    mutationFn: ({ backupId, deleteFromCloud }: any) =>
      backupsApi.delete(backupId, deleteFromCloud),
    onSuccess: () => {
      toast.success('Backup deleted');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      refetchCloud();
    },
    onError: () => toast.error('Delete failed'),
  });

  const syncMutation = useMutation({
    mutationFn: (serverId: string) => backupsApi.sync(serverId),
    onSuccess: (data) => {
      toast.success(`${data.data.count} backups synchronized`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Sync failed'),
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text">Backups</h1>
          <p className="text-muted-foreground mt-2">
            Manage local and cloud backups
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Database className="w-4 h-4 mr-2" />
              New Backup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Backup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Server</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2"
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                >
                  <option value="">Choose a server</option>
                  {servers?.data?.map((server: any) => (
                    <option key={server.id} value={server.id}>
                      {server.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cloudUpload"
                  checked={uploadToCloud}
                  onChange={(e) => setUploadToCloud(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="cloudUpload">Upload to cloud (WebDAV)</Label>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  if (selectedServer) {
                    createBackupMutation.mutate(selectedServer);
                  }
                }}
                disabled={!selectedServer || createBackupMutation.isPending}
              >
                Create Backup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Cloud Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-cyan-400" />
              <CardTitle>Cloud Backups (WebDAV)</CardTitle>
            </div>
            <Button
              variant="glass"
              size="icon"
              onClick={() => refetchCloud()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cloudBackups?.data?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No cloud backups available
              </p>
            ) : (
              cloudBackups?.data?.map((backup: any, i: number) => (
                <div
                  key={i}
                  className="glass-panel p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{backup.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(backup.size)} &bull; {formatDate(backup.lastModified)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="glass" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Server Backups */}
      {servers?.data?.map((server: any) => (
        <Card key={server.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <CardTitle>{server.name} - Local Backups</CardTitle>
              </div>
              <Button
                variant="glass"
                size="sm"
                onClick={() => syncMutation.mutate(server.id)}
              >
                <Cloud className="w-4 h-4 mr-2" />
                Sync with cloud
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {server.backups?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No backups available
                </p>
              ) : (
                server.backups?.map((backup: any) => (
                  <div
                    key={backup.id}
                    className="glass-panel p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{backup.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(Number(backup.size))} &bull; {formatDate(backup.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="glass"
                        size="icon"
                        onClick={() =>
                          restoreBackupMutation.mutate({
                            backupId: backup.id,
                            fromCloud: false,
                          })
                        }
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          deleteBackupMutation.mutate({
                            backupId: backup.id,
                            deleteFromCloud: true,
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
