import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
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
}
