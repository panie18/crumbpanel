import { useState } from 'react';
import { Save, Shield, Database, Bell, Palette, Globe, Key, Mail, AlertTriangle, Trash2 } from 'lucide-react';
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
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export default function SettingsPage() {
  loadSatoshiFont();
  const { theme, setTheme, customPrimary, customAccent, setCustomColors } = useThemeStore();
  const { user } = useAuthStore();
  const [primaryColor, setPrimaryColor] = useState(customPrimary || '#000000');
  const [accentColor, setAccentColor] = useState(customAccent || '#ffffff');
  const [totpSetupOpen, setTotpSetupOpen] = useState(false);
  const [fidoSetupOpen, setFidoSetupOpen] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // TOTP Setup Mutation
  const totpSetupMutation = useMutation({
    mutationFn: async () => {
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';
      
      return axios.post(`${API_URL}/auth/totp/setup`);
    },
    onSuccess: (response) => {
      setQrCodeUrl(response.data.qrCode);
      setTotpSecret(response.data.manualEntryKey);
      setTotpSetupOpen(true);
      toast.success('TOTP setup initiated! Scan the QR code.');
    },
    onError: () => {
      toast.error('Failed to setup TOTP');
    }
  });

  // TOTP Verification Mutation
  const totpVerifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';
      
      return axios.post(`${API_URL}/auth/totp/verify`, { token });
    },
    onSuccess: () => {
      toast.success('TOTP enabled successfully!');
      setTotpSetupOpen(false);
      // Refresh user data
    },
    onError: () => {
      toast.error('Invalid TOTP code. Please try again.');
    }
  });

  // FIDO2 Setup Mutation
  const fidoSetupMutation = useMutation({
    mutationFn: async () => {
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';

      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      // Get creation options from server
      const optionsResponse = await axios.post(`${API_URL}/auth/fido2/register/begin`, {
        email: user?.email
      });

      const { publicKey } = optionsResponse.data;

      // Convert base64 to Uint8Array
      publicKey.challenge = new Uint8Array(publicKey.challenge);
      publicKey.user.id = new Uint8Array(publicKey.user.id);

      // Create credential
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Send credential to server
      const registrationResponse = await axios.post(`${API_URL}/auth/fido2/register/complete`, {
        credentialId: Array.from(new Uint8Array(credential.rawId)),
        publicKey: Array.from(new Uint8Array((credential.response as any).getPublicKey())),
        authenticatorData: Array.from(new Uint8Array((credential.response as any).getAuthenticatorData()))
      });

      return registrationResponse;
    },
    onSuccess: () => {
      toast.success('FIDO2/Passkey registered successfully!');
      setFidoSetupOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to setup FIDO2');
    }
  });

  const handleTotpSetup = () => {
    totpSetupMutation.mutate();
  };

  const handleFidoSetup = () => {
    fidoSetupMutation.mutate();
  };

  const handleTotpVerify = (token: string) => {
    if (token.length === 6) {
      totpVerifyMutation.mutate(token);
    }
  };

  const resetMutation = useMutation({
    mutationFn: async () => {
      const confirmed = window.confirm(
        'Are you ABSOLUTELY sure? This will delete ALL data and cannot be undone!\n\nType "DELETE" to confirm:'
      );
      
      if (!confirmed) throw new Error('Reset cancelled');
      
      const confirmation = window.prompt('Type "DELETE" to confirm:');
      if (confirmation !== 'DELETE') {
        throw new Error('Reset cancelled - incorrect confirmation');
      }

      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5829/api'
        : '/api';
      
      return axios.post(`${API_URL}/auth/reset-database`);
    },
    onSuccess: () => {
      toast.success('Database reset successfully!');
      // Logout and redirect to setup
      localStorage.clear();
      window.location.href = '/setup';
    },
    onError: (error: any) => {
      if (error.message.includes('cancelled')) {
        toast('Reset cancelled');
      } else {
        toast.error('Failed to reset database');
      }
    },
  });

  const handleDatabaseReset = () => {
    resetMutation.mutate();
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

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Reset All Data
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    This will permanently delete all servers, players, backups, and settings. 
                    This action cannot be undone!
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={handleDatabaseReset}
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset All Data
                      </>
                    )}
                  </Button>
                </div>
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
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* TOTP Section */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Authenticator App (TOTP)</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use Google Authenticator, Authy, or similar apps
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${user?.totpEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs font-medium">
                          {user?.totpEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={user?.totpEnabled ? "destructive" : "default"}
                    onClick={handleTotpSetup}
                    disabled={totpSetupMutation.isPending}
                  >
                    {totpSetupMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : user?.totpEnabled ? (
                      'Disable'
                    ) : (
                      'Setup TOTP'
                    )}
                  </Button>
                </div>

                {/* FIDO2 Section */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">FIDO2/WebAuthn Passkey</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hardware keys, fingerprint, or face recognition
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="text-xs font-medium">Not configured</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleFidoSetup}
                    disabled={fidoSetupMutation.isPending}
                  >
                    {fidoSetupMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add Passkey'
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Enhanced Security</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Enable 2FA to significantly improve your account security. We recommend using both TOTP and FIDO2 for maximum protection.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TOTP Setup Dialog */}
            <Dialog open={totpSetupOpen} onOpenChange={setTotpSetupOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Scan the QR code with your authenticator app
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {qrCodeUrl && (
                    <div className="flex justify-center">
                      <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Manual Entry Key</Label>
                    <div className="p-2 bg-muted rounded font-mono text-sm break-all">
                      {totpSecret}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use this key if you can't scan the QR code
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <InputOTP
                      maxLength={6}
                      onComplete={handleTotpVerify}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  SMTP Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.gmail.com"
                      defaultValue="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Select defaultValue="587">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 (Unencrypted)</SelectItem>
                        <SelectItem value="587">587 (STARTTLS)</SelectItem>
                        <SelectItem value="465">465 (SSL/TLS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">Username</Label>
                    <Input
                      id="smtp-username"
                      placeholder="your-email@gmail.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Password</Label>
                    <Input
                      id="smtp-password"
                      placeholder="App password or regular password"
                      type="password"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-from">From Address</Label>
                  <Input
                    id="smtp-from"
                    placeholder="CrumbPanel <noreply@yourserver.com>"
                    defaultValue="CrumbPanel <noreply@crumbpanel.local>"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="smtp-encryption" defaultChecked />
                  <Label htmlFor="smtp-encryption">Use TLS/SSL Encryption</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline">
                    Test SMTP Connection
                  </Button>
                  <Button>
                    Save SMTP Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

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
          </div>
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
