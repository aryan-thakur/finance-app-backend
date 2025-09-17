import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    if (
      !dto ||
      typeof (dto as any).username !== 'string' ||
      typeof (dto as any).password !== 'string'
    ) {
      throw new BadRequestException('username and password are required');
    }
    const user = await this.auth.validate(dto.username, dto.password);
    const access_token = await this.auth.signToken(user);
    return { user, access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() req: any) {
    const userId = req.user.userId;
    const metadata = await this.prisma.user_metadata.findFirst({
      where: { userId },
      select: { baseCurrency: true },
    });
    return { base_currency: metadata?.baseCurrency ?? null };
  }
}
