import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Star, Eye, Package } from 'lucide-react';
import { serversApi, pluginsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadSatoshiFont } from '@/components/ui/typography';
import toast from 'react-hot-toast';

export default function PluginLibraryPage() {
  loadSatoshiFont();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServer, setSelectedServer] = useState<string>('');

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
  });

  const { data: pluginsResponse, isLoading } = useQuery({
    queryKey: ['plugins', searchTerm],
    queryFn: () => pluginsApi.search(searchTerm || 'popular'),
  });

  const { data: installedPluginsResponse } = useQuery({
    queryKey: ['installed-plugins', selectedServer],
    queryFn: () => selectedServer ? pluginsApi.getInstalled(selectedServer) : Promise.resolve({ data: [] }),
    enabled: !!selectedServer,
  });

  const installPluginMutation = useMutation({
    mutationFn: ({ serverId, pluginId }: { serverId: string; pluginId: string }) => {
      console.log('📦 [PLUGINS] Installing plugin:', pluginId, 'on server:', serverId);
      return pluginsApi.install(serverId, pluginId);
    },
    onSuccess: (_, variables) => {
      toast.success(`Plugin installed on server successfully!`);
    },
    onError: (error: any) => {
      console.error('❌ [PLUGINS] Installation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to install plugin');
    }
  });

  const handleInstallPlugin = (pluginId: number) => {
    if (!selectedServer) {
      toast.error('Please select a server first');
      return;
    }
    installPluginMutation.mutate({ 
      serverId: selectedServer, 
      pluginId: pluginId.toString() 
    });
  };

  // Mock popular plugins if no real data
  const mockPlugins = [
    {
      id: 'worldedit',
      name: 'WorldEdit',
      description: 'The most popular world editing plugin for Minecraft',
      version: '7.2.15',
      downloads: '50M+',
      rating: 4.9,
      category: 'World Management'
    },
    {
      id: 'essentials',
      name: 'EssentialsX',
      description: 'Essential commands and features for your server',
      version: '2.20.1',
      downloads: '45M+',
      rating: 4.8,
      category: 'Server Management'
    },
    {
      id: 'luckperms',
      name: 'LuckPerms',
      description: 'Advanced permissions plugin with web editor',
      version: '5.4.113',
      downloads: '30M+',
      rating: 4.9,
      category: 'Permissions'
    },
    {
      id: 'vault',
      name: 'Vault',
      description: 'Economy and permissions API for plugins',
      version: '1.7.3',
      downloads: '40M+',
      rating: 4.7,
      category: 'API'
    }
  ];

  const availablePlugins = pluginsResponse?.data || mockPlugins;
  const installedPlugins = installedPluginsResponse?.data || [];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Plugin Library</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plugins..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="popular" className="space-y-4">
        <TabsList>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plugins</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15,000+</div>
                <p className="text-xs text-muted-foreground">
                  Available plugins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Installed</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  On your servers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Updates Available</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">🔄</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Ready to update
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">📂</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">25+</div>
                <p className="text-xs text-muted-foreground">
                  Plugin categories
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plugin Library</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {availablePlugins.length > 0 ? `${availablePlugins.length} plugins available` : 'Search for plugins...'}
                  </p>
                </div>
                <Select value={selectedServer} onValueChange={setSelectedServer}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    {servers?.data?.map((server: any) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading plugins...</span>
                </div>
              ) : availablePlugins.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No plugins found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try searching for specific plugin names like "WorldEdit" or "EssentialsX"
                  </p>
                  <Input
                    placeholder="Search plugins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm mx-auto"
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {availablePlugins.map((plugin: any) => {
                    const isInstalled = installedPlugins.some((installed: any) => installed.id === plugin.id);
                    
                    return (
                      <Card key={plugin.id} className="transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{plugin.name}</CardTitle>
                            <Badge variant="outline">{plugin.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">v{plugin.version}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">{plugin.description}</p>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Download className="w-4 h-4" />
                              {plugin.downloads}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {plugin.rating}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleInstallPlugin(plugin.id)}
                              disabled={installPluginMutation.isPending || !selectedServer || isInstalled}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              {isInstalled ? 'Installed' : installPluginMutation.isPending ? 'Installing...' : 'Install'}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
