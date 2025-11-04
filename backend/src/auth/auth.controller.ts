import { Controller, Post, Body, UseGuards, Req, Get, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('setup-status')
  async getSetupStatus() {
    return this.authService.getSetupStatus();
  }

  @Post('setup')
  async initialSetup(@Body() dto: { username: string; email: string; password: string }) {
    try {
      console.log('Setup request received:', { email: dto.email, username: dto.username });
      return await this.authService.initialSetup(dto);
    } catch (error) {
      console.error('Setup endpoint error:', error);
      throw error;
    }
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('login')
  @UseGuards(AuthGuard('auth0'))
  async login() {
    // Initiates Auth0 login
  }

  @Get('callback')
  @UseGuards(AuthGuard('auth0'))
  async callback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.login(req.user);

    // Redirect to frontend with token
    const token = result.accessToken;
    res.redirect(`http://localhost:8437?token=${token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: any) {
    return req.user;
  }
}
