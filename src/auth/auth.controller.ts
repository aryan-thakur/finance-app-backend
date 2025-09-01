import { Body, Controller, Get, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    if (!dto || typeof (dto as any).username !== 'string' || typeof (dto as any).password !== 'string') {
      throw new BadRequestException('username and password are required');
    }
    const user = await this.auth.validate(dto.username, dto.password);
    const access_token = await this.auth.signToken(user);
    return { user, access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() req: any) {
    return { username: req.user.username };
  }
}
