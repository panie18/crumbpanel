import { useState } from 'react';
import { Save, Shield, Database, Bell, Palette, Globe, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadSatoshiFont } from '@/components/ui/typography';
import { useThemeStore } from '@/store/themeStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  loadSatoshiFont();
  const { theme, setTheme, customPrimary, customAccent, setCustomColors } = useThemeStore();
  const { user } = useAuthStore();
  const [primaryColor, setPrimaryColor] = useState(customPrimary || '#000000');
  const [accentColor, setAccentColor] = useState(customAccent || '#ffffff');

  const handleSaveColors = () => {
    setCustomColors(primaryColor, accentColor);
    toast.success('Colors updated successfully!');
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save All Changes
        </Button>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Panel Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="panel-name">Panel Name</Label>
                    <Input id="panel-name" defaultValue="CrumbPanel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-url">Panel URL</Label>
                    <Input id="panel-url" defaultValue="http://localhost:8437" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-description">Description</Label>
                  <Input id="panel-description" defaultValue="Professional Minecraft Server Management Panel" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="maintenance-mode" />
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Database Type</Label>
                  <Select defaultValue="sqlite">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqlite">SQLite (Current)</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Database Location</Label>
                  <Input defaultValue="./data/crumbpanel.db" disabled />
                </div>
                <Button variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" />
                  <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="session-timeout" defaultChecked />
                  <Label htmlFor="session-timeout">Automatic Session Timeout (30 minutes)</Label>
                </div>
                <div className="space-y-2">
                  <Label>Maximum Login Attempts</Label>
                  <Select defaultValue="5">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage API keys for external integrations
                </p>
                <div className="space-y-2">
                  <Label>Current API Key</Label>
                  <div className="flex gap-2">
                    <Input value="crumb_****************************" disabled className="font-mono" />
                    <Button variant="outline">Regenerate</Button>
                  </div>
                </div>
                <Button>
                  Generate New API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveColors}>
                    Apply Colors
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Server Status Changes</Label>
                    <p className="text-sm text-muted-foreground">Get notified when servers start or stop</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Player Join/Leave</Label>
                    <p className="text-sm text-muted-foreground">Notifications for player activity</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important system notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Completion</Label>
                    <p className="text-sm text-muted-foreground">When automatic backups finish</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="auto-backup" defaultChecked />
                <Label htmlFor="auto-backup">Enable Automatic Backups</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select defaultValue="6h">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Every Hour</SelectItem>
                    <SelectItem value="6h">Every 6 Hours</SelectItem>
                    <SelectItem value="12h">Every 12 Hours</SelectItem>
                    <SelectItem value="24h">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Backup Retention</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Keep 7 days</SelectItem>
                    <SelectItem value="30">Keep 30 days</SelectItem>
                    <SelectItem value="90">Keep 3 months</SelectItem>
                    <SelectItem value="365">Keep 1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
