import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Download, Trash2, FolderPlus, File, Folder } from 'lucide-react';
import { filesApi, serversApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { loadSatoshiFont } from '@/components/ui/typography';
import toast from 'react-hot-toast';

export default function FilesPage() {
  loadSatoshiFont();
  const { serverId } = useParams<{ serverId: string }>();
  const [currentPath, setCurrentPath] = useState('/');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const queryClient = useQueryClient();

  const { data: serverResponse, isLoading: serverLoading } = useQuery({
    queryKey: ['server', serverId],
    queryFn: () => serversApi.findById(serverId!),
    enabled: !!serverId,
  });

  const { data: filesResponse, isLoading: filesLoading } = useQuery({
    queryKey: ['files', serverId, currentPath],
    queryFn: () => filesApi.getServerFiles(serverId!, currentPath),
    enabled: !!serverId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, path }: { file: File; path?: string }) =>
      filesApi.uploadFile(serverId!, file, path),
    onSuccess: () => {
      toast.success('File uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['files', serverId, currentPath] });
      setUploadDialogOpen(false);
    },
    onError: () => toast.error('Failed to upload file'),
  });

  const deleteMutation = useMutation({
    mutationFn: (filePath: string) => filesApi.deleteFile(serverId!, filePath),
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['files', serverId, currentPath] });
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const createFolderMutation = useMutation({
    mutationFn: (folderPath: string) => filesApi.createFolder(serverId!, folderPath),
    onSuccess: () => {
      toast.success('Folder created successfully');
      queryClient.invalidateQueries({ queryKey: ['files', serverId, currentPath] });
      setFolderDialogOpen(false);
      setNewFolderName('');
    },
    onError: () => toast.error('Failed to create folder'),
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ file, path: currentPath });
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const response = await filesApi.downloadFile(serverId!, filePath);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop() || 'download';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    const folderPath = currentPath === '/' ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
    createFolderMutation.mutate(folderPath);
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };

  const getParentPath = () => {
    if (currentPath === '/') return '/';
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    return parts.length === 0 ? '/' : `/${parts.join('/')}`;
  };

  if (serverLoading || filesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const server = serverResponse?.data;
  const files = filesResponse?.data || [];

  if (!server) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Server not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">File Manager</h2>
          <p className="text-muted-foreground">Server: {server.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload to: {currentPath}
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
                  {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Current Path: {currentPath}
            </CardTitle>
            {currentPath !== '/' && (
              <Button variant="outline" size="sm" onClick={() => navigateToPath(getParentPath())}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {files.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No files in this directory
              </p>
            ) : (
              files.map((file: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    {file.type === 'directory' ? (
                      <Folder className="w-5 h-5 text-blue-500" />
                    ) : (
                      <File className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.size && `${file.size} bytes`} • {file.modified}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.type === 'directory' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPath(`${currentPath}/${file.name}`.replace('//', '/'))}
                      >
                        Open
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(`${currentPath}/${file.name}`.replace('//', '/'))}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(`${currentPath}/${file.name}`.replace('//', '/'))}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
