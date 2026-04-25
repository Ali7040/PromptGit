import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { rawRefreshToken, refreshExpiresAt, ...tokenResponse } =
      await this.authService.register(dto);

    res.cookie(REFRESH_COOKIE, rawRefreshToken, {
      ...cookieOpts,
      expires: refreshExpiresAt,
    });
    return tokenResponse;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request & { user: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { rawRefreshToken, refreshExpiresAt, ...tokenResponse } =
      await this.authService.login(req.user);

    res.cookie(REFRESH_COOKIE, rawRefreshToken, {
      ...cookieOpts,
      expires: refreshExpiresAt,
    });
    return tokenResponse;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    const { rawRefreshToken, refreshExpiresAt, ...tokenResponse } =
      await this.authService.refresh(rawToken);

    res.cookie(REFRESH_COOKIE, rawRefreshToken, {
      ...cookieOpts,
      expires: refreshExpiresAt,
    });
    return tokenResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    await this.authService.logout(user.id, rawToken);
    res.clearCookie(REFRESH_COOKIE, cookieOpts);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
