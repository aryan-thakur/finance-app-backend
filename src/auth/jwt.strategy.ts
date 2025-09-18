// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { ConfigService } from '@nestjs/config';

function getBearer(req: Request): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  // cookie fallback:
  if (req.cookies?.access_token) return req.cookies.access_token;
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(CustomStrategy, 'jwt') {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly verifyOpts: {
    issuer?: string;
    audience?: string | string[];
    algorithms?: ('RS256' | 'RS512' | 'ES256' | 'EdDSA')[];
  };

  constructor(private readonly config: ConfigService) {
    super();

    const supabaseUrl = config.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not set');
    }

    const jwksUrl = new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);

    // jose handles caching + key rotation internally
    this.jwks = createRemoteJWKSet(jwksUrl);
    this.verifyOpts = {
      issuer: `${supabaseUrl}/auth/v1`,
      // audience: config.get<string>('JWT_AUDIENCE'),
      algorithms: ['ES256'],
    };
  }

  async validate(req: Request): Promise<any> {
    const token = getBearer(req);
    if (!token) throw new UnauthorizedException('Missing Bearer token');

    try {
      const { payload, protectedHeader } = await jwtVerify(
        token,
        this.jwks,
        this.verifyOpts,
      );
      return {
        userId: payload?.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
