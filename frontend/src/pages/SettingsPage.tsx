import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Settings, Cloud, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your panel
        </p>
      </motion.div>

      <div className="grid gap-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <CardTitle>Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input value={user?.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Input value={user?.role} disabled />
            </div>
            <Button>Change Password</Button>
          </CardContent>
        </Card>

        {/* WebDAV Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-purple-400" />
              <CardTitle>WebDAV Cloud Backup</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WebDAV URL</Label>
              <Input placeholder="https://your-webdav-server.com/remote.php/dav/files/username/" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remote Path</Label>
              <Input placeholder="/minecraft-backups" />
            </div>
            <div className="flex gap-2">
              <Button>Test Connection</Button>
              <Button variant="glass">Save</Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-400" />
              <CardTitle>Language</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <select className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2">
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
