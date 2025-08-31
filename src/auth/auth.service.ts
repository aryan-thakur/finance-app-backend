import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validate(username: string, password: string) {
    const envUser = this.config.get<string>('USER');
    const envPass = this.config.get<string>('PASS');
    if (username !== envUser) return null;
    const hash = envPass;
    if (!hash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return { username };
  }

  async signToken(user: { username: string }) {
    // minimal JWT: subject is username
    return this.jwt.signAsync({ sub: user.username, username: user.username });
  }
}
