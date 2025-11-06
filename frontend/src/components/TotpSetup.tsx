import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface TotpSetupProps {
  secret: string;
  qrCodeUrl: string;
  onVerify: (token: string) => Promise<void>;
}

export default function TotpSetup({ secret, qrCodeUrl, onVerify }: TotpSetupProps) {
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Secret copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (token.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(token);
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Setup Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG 
              value={qrCodeUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code with your authenticator app
          </p>
        </div>

        {/* Manual Entry */}
        <div className="space-y-2">
          <Label>Or enter this code manually:</Label>
          <div className="flex gap-2">
            <Input 
              value={secret}
              readOnly
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copySecret}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Verification */}
        <div className="space-y-2">
          <Label htmlFor="token">Enter 6-digit code from your app:</Label>
          <div className="flex gap-2">
            <Input
              id="token"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              className="font-mono text-center text-2xl tracking-widest"
            />
            <Button
              onClick={handleVerify}
              disabled={token.length !== 6 || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
