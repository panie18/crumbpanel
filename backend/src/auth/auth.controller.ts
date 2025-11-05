import { Controller, Get, Post, Patch, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
