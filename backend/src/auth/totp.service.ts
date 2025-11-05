import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TotpService {
  generateSecret(userEmail: string): { secret: string; qrCodeUrl: string; manualEntryKey: string } {
    console.log('🔐 [TOTP] Generating secret for:', userEmail);
    
    const secret = speakeasy.generateSecret({
      name: `CrumbPanel (${userEmail})`,
      issuer: 'CrumbPanel',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
      manualEntryKey: secret.base32,
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('❌ [TOTP] QR Code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  verifyToken(secret: string, token: string): boolean {
    console.log('🔍 [TOTP] Verifying token for secret');
    
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 steps before and after for time drift
    });

    console.log('🔍 [TOTP] Verification result:', verified);
    return verified;
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
