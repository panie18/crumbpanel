import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-auth0';
import { AuthService } from './auth.service';

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'auth0') {
  constructor(private authService: AuthService) {
    super({
      domain: process.env.AUTH0_DOMAIN || 'placeholder.auth0.com',
      clientID: process.env.AUTH0_CLIENT_ID || 'placeholder',
      clientSecret: process.env.AUTH0_CLIENT_SECRET || 'placeholder',
      callbackURL: '/api/auth/callback',
      scope: 'openid profile email',
    });
  }

  async validate(accessToken: string, refreshToken: string, extraParams: any, profile: any) {
    return this.authService.validateAuth0User(profile);
  }
}
