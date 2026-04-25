import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  rawRefreshToken: string;
  refreshExpiresAt: Date;
  expiresIn: number;
  tokenType: 'Bearer';
}

@Injectable()
export class AuthService implements OnModuleInit {
  // Precomputed dummy hash for constant-time comparison on unknown emails
  private dummyHash!: string;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await bcrypt.hash('timing-sentinel', BCRYPT_ROUNDS);
  }

  // ─── Called by LocalStrategy ────────────────────────────────────────────────

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    // Always run bcrypt to prevent user-enumeration via timing
    const hash = user?.passwordHash ?? this.dummyHash;
    const valid = await bcrypt.compare(password, hash);
    return valid && user ? user : null;
  }

  // ─── Endpoints ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<TokenPair> {
    const [byEmail, byUsername] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { username: dto.username } }),
    ]);
    if (byEmail) throw new ConflictException('Email already in use');
    if (byUsername) throw new ConflictException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName ?? dto.username,
        passwordHash,
      },
    });

    return this.issueTokenPair(user);
  }

  async login(user: User): Promise<TokenPair> {
    return this.issueTokenPair(user);
  }

  async refresh(rawToken?: string): Promise<TokenPair> {
    if (!rawToken) throw new UnauthorizedException('Refresh token missing');

    const tokenHash = hashToken(rawToken);
    const now = new Date();

    // Non-blocking background cleanup of consumed tokens older than 24 h
    void this.cleanupConsumedTokens();

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    // Replay attack: token was already consumed → revoke the entire family
    if (stored.usedAt) {
      await this.prisma.refreshToken.deleteMany({
        where: { familyId: stored.familyId },
      });
      throw new UnauthorizedException('Refresh token already used');
    }

    if (stored.expiresAt < now) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Atomic consume + issue new token in same family.
    // updateMany with usedAt: null acts as an optimistic lock —
    // only one concurrent request can win; the other gets count=0 → 401.
    const { rawRefresh, refreshExpiresAt, user } =
      await this.prisma.$transaction(async (tx) => {
        const result = await tx.refreshToken.updateMany({
          where: { id: stored.id, usedAt: null },
          data: { usedAt: now },
        });

        if (result.count === 0) {
          throw new UnauthorizedException('Refresh token already used');
        }

        const user = await tx.user.findUnique({ where: { id: stored.userId } });
        if (!user) throw new UnauthorizedException();

        const raw = randomBytes(48).toString('hex');
        const expiresAt = this.refreshExpiry();

        await tx.refreshToken.create({
          data: {
            token: hashToken(raw),
            userId: user.id,
            familyId: stored.familyId,
            expiresAt,
          },
        });

        return { rawRefresh: raw, refreshExpiresAt: expiresAt, user };
      });

    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
      plan: user.plan,
    });

    return {
      accessToken,
      rawRefreshToken: rawRefresh,
      refreshExpiresAt,
      expiresIn: this.parseSeconds(this.config.get('JWT_EXPIRES_IN', '15m')),
      tokenType: 'Bearer',
    };
  }

  async logout(userId: string, rawToken?: string): Promise<void> {
    if (rawToken) {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: hashToken(rawToken) },
      });
      if (stored) {
        // Revoke only this session's family (single-device logout)
        await this.prisma.refreshToken.deleteMany({
          where: { familyId: stored.familyId },
        });
        return;
      }
    }
    // Fallback: revoke all sessions for the user
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async issueTokenPair(user: User, familyId?: string): Promise<TokenPair> {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
      plan: user.plan,
    });

    const rawRefresh = randomBytes(48).toString('hex');
    const refreshExpiresAt = this.refreshExpiry();
    const family = familyId ?? randomBytes(16).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        token: hashToken(rawRefresh),
        userId: user.id,
        familyId: family,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      rawRefreshToken: rawRefresh,
      refreshExpiresAt,
      expiresIn: this.parseSeconds(this.config.get('JWT_EXPIRES_IN', '15m')),
      tokenType: 'Bearer',
    };
  }

  private refreshExpiry(): Date {
    return new Date(
      Date.now() + parseDuration(this.config.get('JWT_REFRESH_EXPIRES_IN', '7d')),
    );
  }

  private parseSeconds(val: string): number {
    return Math.floor(parseDuration(val) / 1000);
  }

  private cleanupConsumedTokens(): Promise<unknown> {
    const cutoff = new Date(Date.now() - 86_400_000); // 24 h grace window
    return this.prisma.refreshToken.deleteMany({
      where: { usedAt: { lte: cutoff } },
    });
  }
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function parseDuration(val: string): number {
  const n = parseInt(val, 10);
  switch (val.at(-1)) {
    case 'd': return n * 86_400_000;
    case 'h': return n * 3_600_000;
    case 'm': return n * 60_000;
    case 's': return n * 1_000;
    default:  return 7 * 86_400_000;
  }
}
