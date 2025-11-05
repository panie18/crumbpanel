import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, Plus, Trash2, Play, Clock, Users, 
  Activity, MessageSquare, RefreshCw, Bell 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Welcome New Players',
      trigger: 'player_join',
      action: 'send_message',
      enabled: true
    },
    {
      id: '2',
      name: 'Auto Restart at 3 AM',
      trigger: 'schedule',
      action: 'restart_server',
      enabled: true
    }
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const triggerIcons = {
    player_join: <Users className="w-4 h-4" />,
    player_leave: <Users className="w-4 h-4" />,
    server_start: <Play className="w-4 h-4" />,
    tps_low: <Activity className="w-4 h-4" />,
    schedule: <Clock className="w-4 h-4" />
  };

  const actionIcons = {
    run_command: <Zap className="w-4 h-4" />,
    send_message: <MessageSquare className="w-4 h-4" />,
    restart_server: <RefreshCw className="w-4 h-4" />,
    send_webhook: <Bell className="w-4 h-4" />
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-8 h-8" />
            Automation & Workflows
          </h2>
          <p className="text-muted-foreground">
            Create automated tasks and triggers for your servers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Active Rules */}
      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h3 className="font-semibold text-lg">{rule.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {triggerIcons[rule.trigger as keyof typeof triggerIcons]}
                        <span>When: {rule.trigger.replace('_', ' ')}</span>
                      </div>
                      <span>→</span>
                      <div className="flex items-center gap-2">
                        {actionIcons[rule.action as keyof typeof actionIcons]}
                        <span>Do: {rule.action.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRules(rules.map(r => 
                        r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                      ));
                      toast.success(rule.enabled ? 'Rule disabled' : 'Rule enabled');
                    }}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRules(rules.filter(r => r.id !== rule.id));
                      toast.success('Rule deleted');
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Rule Dialog */}
      {showCreateDialog && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Create Automation Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input placeholder="e.g., Welcome new players" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger (When)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player_join">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Player joins
                      </div>
                    </SelectItem>
                    <SelectItem value="player_leave">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Player leaves
                      </div>
                    </SelectItem>
                    <SelectItem value="tps_low">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        TPS below threshold
                      </div>
                    </SelectItem>
                    <SelectItem value="schedule">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Scheduled time
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action (Do)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="run_command">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Run command
                      </div>
                    </SelectItem>
                    <SelectItem value="send_message">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Send message
                      </div>
                    </SelectItem>
                    <SelectItem value="restart_server">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Restart server
                      </div>
                    </SelectItem>
                    <SelectItem value="send_webhook">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Send webhook
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action Details</Label>
              <Input placeholder="e.g., say Welcome to the server!" />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  const newRule: AutomationRule = {
                    id: Date.now().toString(),
                    name: 'New Rule',
                    trigger: 'player_join',
                    action: 'send_message',
                    enabled: true
                  };
                  setRules([...rules, newRule]);
                  setShowCreateDialog(false);
                  toast.success('Rule created!');
                }}
              >
                Create Rule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Auto Restart', icon: <RefreshCw className="w-8 h-8" /> },
              { name: 'Player Greeting', icon: <Users className="w-8 h-8" /> },
              { name: 'Performance Alert', icon: <Activity className="w-8 h-8" /> },
              { name: 'Discord Webhook', icon: <Bell className="w-8 h-8" /> },
              { name: 'Scheduled Backup', icon: <Clock className="w-8 h-8" /> },
              { name: 'TPS Monitor', icon: <Activity className="w-8 h-8" /> }
            ].map((template, i) => (
              <Card key={i} className="cursor-pointer hover:bg-accent transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="text-primary">{template.icon}</div>
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">Click to use</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
