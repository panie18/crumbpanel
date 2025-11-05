import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { TotpService } from './totp.service';
import { Fido2Service } from './fido2.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private totpService: TotpService,
    private fido2Service: Fido2Service,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get('setup-status')
  getSetupStatus() {
    return this.authService.getSetupStatus();
  }

  @Post('setup')
  async setup(@Body() data: { username: string; email: string; password: string }) {
    try {
      return await this.authService.initialSetup(data);
    } catch (error) {
      console.error('Setup endpoint error:', error);
      throw error;
    }
  }

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.authService.login(data.email, data.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: any) {
    return req.user;
  }

  @Patch('profile-picture')
  @UseGuards(AuthGuard('jwt'))
  async updateProfilePicture(@Req() req: any, @Body() data: { pictureUrl: string }) {
    try {
      console.log('🖼️ [AUTH] Updating profile picture for user:', req.user.id);
      
      await this.userRepository.update(req.user.id, {
        picture: data.pictureUrl
      });
      
      const updatedUser = await this.userRepository.findOne({
        where: { id: req.user.id }
      });
      
      console.log('✅ [AUTH] Profile picture updated');
      return { 
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          picture: updatedUser.picture,
          role: updatedUser.role
        }
      };
    } catch (error) {
      console.error('❌ [AUTH] Failed to update profile picture:', error);
      throw new Error('Failed to update profile picture');
    }
  }

  @Post('totp/setup')
  @UseGuards(AuthGuard('jwt'))
  async setupTotp(@Req() req: any) {
    try {
      console.log('🔐 [TOTP] Setting up TOTP for user:', req.user.email);
      
      const { secret, qrCodeUrl, manualEntryKey } = this.totpService.generateSecret(req.user.email);
      const qrCodeImage = await this.totpService.generateQRCode(qrCodeUrl);
      
      // Store secret temporarily (not confirmed yet)
      await this.userRepository.update(req.user.id, {
        totpSecret: secret,
        totpEnabled: false, // Not enabled until verified
      });

      return {
        qrCode: qrCodeImage,
        manualEntryKey,
        backupCodes: this.totpService.generateBackupCodes(),
      };
    } catch (error) {
      console.error('❌ [TOTP] Setup failed:', error);
      throw new Error('Failed to setup TOTP');
    }
  }

  @Post('totp/verify')
  @UseGuards(AuthGuard('jwt'))
  async verifyTotp(@Req() req: any, @Body() { token }: { token: string }) {
    try {
      console.log('🔍 [TOTP] Verifying TOTP for user:', req.user.email);
      
      const user = await this.userRepository.findOne({
        where: { id: req.user.id }
      });

      if (!user?.totpSecret) {
        throw new Error('TOTP not set up');
      }

      const isValid = this.totpService.verifyToken(user.totpSecret, token);

      if (isValid) {
        // Enable TOTP after successful verification
        await this.userRepository.update(req.user.id, {
          totpEnabled: true,
        });

        console.log('✅ [TOTP] TOTP enabled for user:', req.user.email);
        return { success: true, message: 'TOTP enabled successfully' };
      } else {
        throw new Error('Invalid TOTP token');
      }
    } catch (error) {
      console.error('❌ [TOTP] Verification failed:', error);
      throw new Error(error.message || 'TOTP verification failed');
    }
  }

  @Post('totp/login')
  async loginWithTotp(@Body() data: { email: string; password: string; totpToken: string }) {
    try {
      console.log('🔐 [TOTP] Login attempt with TOTP for:', data.email);
      
      // First verify email/password
      const user = await this.userRepository.findOne({
        where: { email: data.email }
      });

      if (!user || user.password !== data.password) {
        throw new Error('Invalid credentials');
      }

      // If TOTP is enabled, verify the token
      if (user.totpEnabled && user.totpSecret) {
        const isValidTotp = this.totpService.verifyToken(user.totpSecret, data.totpToken);
        
        if (!isValidTotp) {
          throw new Error('Invalid TOTP token');
        }
      }

      // Generate JWT token
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          totpEnabled: user.totpEnabled,
        },
        accessToken,
      };
    } catch (error) {
      console.error('❌ [TOTP] Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  @Post('totp/disable')
  @UseGuards(AuthGuard('jwt'))
  async disableTotp(@Req() req: any, @Body() { token }: { token: string }) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: req.user.id }
      });

      if (!user?.totpSecret) {
        throw new Error('TOTP not enabled');
      }

      const isValid = this.totpService.verifyToken(user.totpSecret, token);

      if (isValid) {
        await this.userRepository.update(req.user.id, {
          totpSecret: null,
          totpEnabled: false,
        });

        return { success: true, message: 'TOTP disabled successfully' };
      } else {
        throw new Error('Invalid TOTP token');
      }
    } catch (error) {
      console.error('❌ [TOTP] Disable failed:', error);
      throw new Error(error.message || 'Failed to disable TOTP');
    }
  }

  @Post('fido2/challenge')
  async createFido2Challenge(@Body() { email }: { email: string }) {
    try {
      console.log('🔐 [FIDO2] Creating challenge for:', email);
      
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's registered credentials (mock data for now)
      const allowCredentials = []; // In real implementation, fetch from database
      
      const options = await this.fido2Service.generateCredentialRequestOptions(email, allowCredentials);
      
      return options;
    } catch (error) {
      console.error('❌ [FIDO2] Challenge creation failed:', error);
      throw new Error('Failed to create FIDO2 challenge');
    }
  }

  @Post('fido2/verify')
  async verifyFido2(@Body() data: any) {
    try {
      console.log('🔐 [FIDO2] Verifying authentication for:', data.email);
      
      const user = await this.userRepository.findOne({ where: { email: data.email } });
      if (!user) {
        throw new Error('User not found');
      }

      const isValid = this.fido2Service.verifyAuthenticatorAssertion(data);
      
      if (isValid) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
        };
      } else {
        throw new Error('FIDO2 verification failed');
      }
    } catch (error) {
      console.error('❌ [FIDO2] Verification failed:', error);
      throw new Error('FIDO2 authentication failed');
    }
  }
}
