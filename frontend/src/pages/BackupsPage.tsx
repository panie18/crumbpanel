import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, Calendar, HardDrive, RefreshCw, Plus } from 'lucide-react';
import { backupsApi, serversApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadSatoshiFont } from '@/components/ui/typography';
import toast from 'react-hot-toast';

export default function BackupsPage() {
  loadSatoshiFont();
  const queryClient = useQueryClient();
  const [selectedServer, setSelectedServer] = useState<string>('');

  const { data: backupsResponse, isLoading, refetch } = useQuery({
    queryKey: ['backups'],
    queryFn: () => backupsApi.getAll(),
    refetchInterval: 60000,
  });

  const { data: serversResponse } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
  });

  const backups = backupsResponse?.data || [];
  const servers = serversResponse?.data || [];

  const createBackupMutation = useMutation({
    mutationFn: (serverId: string) => backupsApi.create(serverId),
    onSuccess: () => {
      toast.success('Backup created successfully!');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: () => toast.error('Failed to create backup'),
  });

  const downloadMutation = useMutation({
    mutationFn: (backupId: string) => backupsApi.download(backupId),
    onSuccess: (response, backupId) => {
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${backupId}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully!');
    },
    onError: () => toast.error('Failed to download backup'),
  });

  const restoreMutation = useMutation({
    mutationFn: ({ backupId, serverId }: { backupId: string; serverId: string }) => 
      backupsApi.restore(backupId, serverId),
    onSuccess: () => {
      toast.success('Backup restored successfully!');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Failed to restore backup'),
  });

  const deleteMutation = useMutation({
    mutationFn: (backupId: string) => backupsApi.delete(backupId),
    onSuccess: () => {
      toast.success('Backup deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: () => toast.error('Failed to delete backup'),
  });

  const totalSize = backups.reduce((sum: number, backup: any) => sum + (backup.size || 0), 0);
  const formattedSize = (totalSize / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Backup Management</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select server for backup" />
            </SelectTrigger>
            <SelectContent>
              {servers.map((server: any) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => selectedServer && createBackupMutation.mutate(selectedServer)}
            disabled={!selectedServer || createBackupMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {createBackupMutation.isPending ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backups.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all servers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">💾</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedSize} GB</div>
                <p className="text-xs text-muted-foreground">
                  Of unlimited storage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backups.length > 0 ? 'Just now' : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {backups.length > 0 ? backups[0]?.server?.name || 'Unknown server' : 'No backups yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auto Backups</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Enabled</div>
                <p className="text-xs text-muted-foreground">
                  Every 6 hours
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
              <p className="text-sm text-muted-foreground">
                {backups.length > 0 ? `${backups.length} backups available` : 'No backups created yet'}
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading backups...</span>
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-12">
                  <HardDrive className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No backups yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first backup to protect your server data
                  </p>
                  {servers.length > 0 ? (
                    <div className="space-y-2">
                      <Select value={selectedServer} onValueChange={setSelectedServer}>
                        <SelectTrigger className="max-w-sm mx-auto">
                          <SelectValue placeholder="Select a server" />
                        </SelectTrigger>
                        <SelectContent>
                          {servers.map((server: any) => (
                            <SelectItem key={server.id} value={server.id}>
                              {server.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => selectedServer && createBackupMutation.mutate(selectedServer)}
                        disabled={!selectedServer}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Backup
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Create a server first to enable backups</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup: any) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <HardDrive className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{backup.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(backup.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Server: {backup.server?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={backup.type === 'AUTO' ? 'default' : 'secondary'}>
                          {backup.type || 'MANUAL'}
                        </Badge>
                        <span className="text-sm font-medium">
                          {(backup.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadMutation.mutate(backup.id)}
                            disabled={downloadMutation.isPending}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Select onValueChange={(serverId) => 
                            restoreMutation.mutate({ backupId: backup.id, serverId })
                          }>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Restore" />
                            </SelectTrigger>
                            <SelectContent>
                              {servers.map((server: any) => (
                                <SelectItem key={server.id} value={server.id}>
                                  {server.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(backup.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
