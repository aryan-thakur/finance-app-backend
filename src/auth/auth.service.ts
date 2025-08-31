import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { STATIC_CREDS } from '../creds/creds.config';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async validate(username: string, password: string) {
    const hash = STATIC_CREDS[username];
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
