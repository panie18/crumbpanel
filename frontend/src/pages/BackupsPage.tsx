import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Download,
  Upload,
  Calendar,
  HardDrive,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { loadSatoshiFont } from '@/components/ui/typography';
import { backupsApi, serversApi } from '@/lib/api';
import { toast } from 'react-toastify';

export default function BackupsPage() {
  loadSatoshiFont();

  const { data: backupsResponse, isLoading, refetch } = useQuery({
    queryKey: ['backups'],
    queryFn: () => backupsApi.getAll(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: serversResponse } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
  });

  const backups = backupsResponse?.data || [];
  const servers = serversResponse?.data || [];

  // Calculate real storage
  const totalSize = backups.reduce((sum: number, backup: any) => sum + (backup.sizeBytes || 0), 0);
  const formattedSize = (totalSize / (1024 * 1024 * 1024)).toFixed(1); // GB

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

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Backup Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Backup
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
                <CardTitle className="text-sm font-medium">
                  Total Backups
                </CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockBackups.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all servers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Storage Used
                </CardTitle>
                <div className="h-4 w-4 text-muted-foreground">💾</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5.1 GB</div>
                <p className="text-xs text-muted-foreground">
                  Of 100 GB available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2h ago</div>
                <p className="text-xs text-muted-foreground">
                  Survival Server
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Auto Backups
                </CardTitle>
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
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Backup
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup: any) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <HardDrive className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{backup.server}</h4>
                          <p className="text-sm text-muted-foreground">
                            {backup.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={backup.type === 'Auto' ? 'default' : 'secondary'}
                        >
                          {backup.type}
                        </Badge>
                        <span className="text-sm font-medium">{backup.size}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm">
                            <Upload className="w-4 h-4 mr-1" />
                            Restore
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
