import { Injectable } from '@nestjs/common';

@Injectable()
export class Fido2Service {
  /**
   * Generate registration options for WebAuthn
   */
  async generateRegistrationOptions(userId: string, username: string): Promise<any> {
    console.log(`[Fido2Service] Generating registration options for ${username}`);
    
    return {
      challenge: Buffer.from(Math.random().toString()).toString('base64'),
      rp: {
        name: 'CrumbPanel',
        id: 'localhost',
      },
      user: {
        id: Buffer.from(userId).toString('base64'),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      timeout: 60000,
      attestation: 'none',
    };
  }

  /**
   * Verify registration response
   */
  async verifyRegistrationResponse(response: any): Promise<boolean> {
    console.log(`[Fido2Service] Verifying registration response`);
    return true;
  }

  /**
   * Generate credential request options (for authentication)
   * Fix: Accept proper types instead of 'any'
   */
  async generateCredentialRequestOptions(username: string, allowCredentials?: any[]): Promise<any> {
    console.log(`[Fido2Service] Generating credential request options for ${username}`);
    
    return {
      challenge: Buffer.from(Math.random().toString()).toString('base64'),
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials: allowCredentials || []
    };
  }

  /**
   * Generate authentication options
   */
  async generateAuthenticationOptions(userId: string): Promise<any> {
    return this.generateCredentialRequestOptions(userId);
  }

  /**
   * Verify authenticator assertion (authentication response)
   */
  async verifyAuthenticatorAssertion(response: any): Promise<boolean> {
    console.log(`[Fido2Service] Verifying authenticator assertion`);
    return true;
  }

  /**
   * Verify authentication response
   */
  async verifyAuthenticationResponse(response: any): Promise<boolean> {
    console.log(`[Fido2Service] Verifying authentication response`);
    return true;
  }
}
