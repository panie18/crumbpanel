import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Power, Clock, Command, Save, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5829/api';

interface AutomationRule {
  id: string;
  serverId: string;
  name: string;
  trigger: string;
  triggerValue?: string;
  action: string;
  actionValue?: string;
  enabled: boolean;
  createdAt: string;
}

const TRIGGERS = [
  { value: 'time', label: 'Time Schedule', icon: Clock },
  { value: 'player_count', label: 'Player Count', icon: Zap },
  { value: 'server_crash', label: 'Server Crash', icon: Power },
  { value: 'low_tps', label: 'Low TPS', icon: Zap },
];

const ACTIONS = [
  { value: 'restart_server', label: 'Restart Server', icon: Power },
  { value: 'send_command', label: 'Send Command', icon: Command },
  { value: 'create_backup', label: 'Create Backup', icon: Save },
  { value: 'send_notification', label: 'Send Notification', icon: Zap },
];

export default function AutomationPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    triggerValue: '',
    action: '',
    actionValue: '',
  });

  // Fetch servers
  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const { data } = await axios.get(`${API_URL}/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    }
  });

  // Fetch automation rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation', selectedServer],
    queryFn: async () => {
      if (!selectedServer) return [];
      const token = localStorage.getItem('authToken');
      const { data } = await axios.get(`${API_URL}/servers/${selectedServer}/automations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!selectedServer
  });

  // Create automation
  const createMutation = useMutation({
    mutationFn: async (rule: any) => {
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_URL}/servers/${selectedServer}/automations`, rule, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', selectedServer] });
      setIsCreateDialogOpen(false);
      setNewRule({ name: '', trigger: '', triggerValue: '', action: '', actionValue: '' });
      toast.success('Automation rule created successfully!');
    },
    onError: () => {
      toast.error('Failed to create automation rule');
    }
  });

  // Delete automation
  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/servers/${selectedServer}/automations/${ruleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', selectedServer] });
      toast.success('Automation rule deleted');
    }
  });

  // Toggle automation
  const toggleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      const token = localStorage.getItem('authToken');
      await axios.patch(`${API_URL}/servers/${selectedServer}/automations/${ruleId}`, 
        { enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', selectedServer] });
    }
  });

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.trigger || !newRule.action) {
      toast.error('Please fill all required fields');
      return;
    }
    createMutation.mutate(newRule);
  };

  const getTriggerIcon = (trigger: string) => {
    const found = TRIGGERS.find(t => t.value === trigger);
    return found?.icon || Clock;
  };

  const getActionIcon = (action: string) => {
    const found = ACTIONS.find(a => a.value === action);
    return found?.icon || Command;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">⚡ Automation</h1>
          <p className="text-muted-foreground">Automate server tasks with custom rules</p>
        </div>
      </div>

      {/* Server Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Server</CardTitle>
          <CardDescription>Choose a server to manage automation rules</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger>
              <SelectValue placeholder="Select a server..." />
            </SelectTrigger>
            <SelectContent>
              {servers.map((server: any) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedServer && (
        <>
          {/* Create Button */}
          <div className="flex justify-end">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </div>

          {/* Automation Rules List */}
          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading automation rules...
                </CardContent>
              </Card>
            ) : rules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first automation rule to get started</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              rules.map((rule: AutomationRule) => {
                const TriggerIcon = getTriggerIcon(rule.trigger);
                const ActionIcon = getActionIcon(rule.action);
                
                return (
                  <Card key={rule.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{rule.name}</h3>
                            <Badge variant={rule.enabled ? "default" : "secondary"}>
                              {rule.enabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <TriggerIcon className="w-4 h-4" />
                              <span>Trigger: {TRIGGERS.find(t => t.value === rule.trigger)?.label}</span>
                              {rule.triggerValue && <span className="font-mono">({rule.triggerValue})</span>}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <ActionIcon className="w-4 h-4" />
                              <span>Action: {ACTIONS.find(a => a.value === rule.action)?.label}</span>
                              {rule.actionValue && <span className="font-mono">({rule.actionValue})</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => toggleMutation.mutate({ ruleId: rule.id, enabled: checked })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
            <DialogDescription>Set up a new automation rule for your server</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Auto Restart at 3 AM"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="trigger">Trigger</Label>
              <Select value={newRule.trigger} onValueChange={(value) => setNewRule({ ...newRule, trigger: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      <div className="flex items-center gap-2">
                        <trigger.icon className="w-4 h-4" />
                        {trigger.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newRule.trigger === 'time' && (
              <div>
                <Label htmlFor="triggerValue">Time (Cron format)</Label>
                <Input
                  id="triggerValue"
                  placeholder="0 3 * * * (3 AM daily)"
                  value={newRule.triggerValue}
                  onChange={(e) => setNewRule({ ...newRule, triggerValue: e.target.value })}
                />
              </div>
            )}

            {newRule.trigger === 'player_count' && (
              <div>
                <Label htmlFor="triggerValue">Player Count Threshold</Label>
                <Input
                  id="triggerValue"
                  type="number"
                  placeholder="e.g., 0"
                  value={newRule.triggerValue}
                  onChange={(e) => setNewRule({ ...newRule, triggerValue: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={newRule.action} onValueChange={(value) => setNewRule({ ...newRule, action: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      <div className="flex items-center gap-2">
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newRule.action === 'send_command' && (
              <div>
                <Label htmlFor="actionValue">Command</Label>
                <Input
                  id="actionValue"
                  placeholder="say Server restarting in 5 minutes"
                  value={newRule.actionValue}
                  onChange={(e) => setNewRule({ ...newRule, actionValue: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
