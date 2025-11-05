import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi, serversApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Folder,
  File,
  Trash2,
  Edit,
  Save,
} from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function FilesPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const [currentPath, setCurrentPath] = useState('/');
  const [editingFile, setEditingFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState('');
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

  const readFileMutation = useMutation({
    mutationFn: (path: string) => filesApi.read(serverId!, path),
    onSuccess: (data, path) => {
      setFileContent(data.data.content);
      setEditingFile({ path, name: path.split('/').pop() });
    },
  });

  const saveFileMutation = useMutation({
    mutationFn: (data: { path: string; content: string }) =>
      filesApi.write(serverId!, data.path, data.content),
    onSuccess: () => {
      toast.success('File saved');
      setEditingFile(null);
      queryClient.invalidateQueries({ queryKey: ['files', serverId] });
    },
    onError: () => toast.error('Error saving file'),
  });

  const deleteMutation = useMutation({
    mutationFn: (path: string) => filesApi.delete(serverId!, path),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['files', serverId] });
    },
    onError: () => toast.error('Error deleting'),
  });

  const handleFileClick = (file: any) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else if (file.name.endsWith('.properties') || file.name.endsWith('.yml') || file.name.endsWith('.json') || file.name.endsWith('.txt')) {
      readFileMutation.mutate(file.path);
    }
  };

  const handleBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
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

  return (
    <div className="space-y-6">
      <div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" onClick={() => navigate('/servers')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">
              File Management
            </h1>
            <p className="text-muted-foreground mt-2">
              {server?.data?.name}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-sm">
              /{currentPath || 'root'}
            </CardTitle>
            {currentPath && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {files?.data?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Folder is empty
              </p>
            ) : (
              files?.data?.map((file: any) => (
                <div
                  key={file.path}
                  className="glass-panel p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex items-center gap-3">
                    {file.isDirectory ? (
                      <Folder className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <File className="w-5 h-5 text-purple-400" />
                    )}
                    <div>
                      <p className="font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {!file.isDirectory && formatBytes(file.size)} · {formatDate(file.modified)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {!file.isDirectory && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => readFileMutation.mutate(file.path)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Really delete?')) {
                          deleteMutation.mutate(file.path);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* File Editor Dialog */}
      <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{editingFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full h-96 font-mono text-sm glass-panel p-4 rounded-lg resize-none"
            />
            <Button
              onClick={() =>
                saveFileMutation.mutate({
                  path: editingFile?.path,
                  content: fileContent,
                })
              }
              disabled={saveFileMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
