import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class Fido2Service {
  generateChallenge(): Uint8Array {
    return randomBytes(32);
  }

  async generateCredentialCreationOptions(userEmail: string) {
    const challenge = this.generateChallenge();
    
    return {
      challenge: Array.from(challenge),
      rp: {
        name: 'CrumbPanel',
        id: 'localhost', // Change to your domain in production
      },
      user: {
        id: Buffer.from(userEmail).toString('base64'),
        name: userEmail,
        displayName: userEmail,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };
  }

  async generateCredentialRequestOptions(userEmail: string, allowCredentials: any[]) {
    const challenge = this.generateChallenge();
    
    return {
      challenge: Array.from(challenge),
      allowCredentials: allowCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key',
      })),
      timeout: 60000,
      userVerification: 'required',
    };
  }

  verifyAuthenticatorAssertion(assertion: any): boolean {
    // In a real implementation, you would:
    // 1. Verify the signature using the stored public key
    // 2. Check the authenticator data
    // 3. Validate the client data JSON
    // For this demo, we'll return true
    console.log('🔐 [FIDO2] Verifying assertion (demo implementation)');
    return true;
  }
}
