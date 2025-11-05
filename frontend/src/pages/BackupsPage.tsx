import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export default function BackupsPage() {
  loadSatoshiFont();

  const mockBackups = [
    {
      id: 1,
      server: 'Survival Server',
      size: '2.5 GB',
      date: '2024-01-15 14:30',
      type: 'Auto',
    },
    {
      id: 2,
      server: 'Creative World',
      size: '1.8 GB',
      date: '2024-01-15 12:00',
      type: 'Manual',
    },
    {
      id: 3,
      server: 'PvP Arena',
      size: '850 MB',
      date: '2024-01-14 20:15',
      type: 'Auto',
    },
  ];

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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBackups.map((backup) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
