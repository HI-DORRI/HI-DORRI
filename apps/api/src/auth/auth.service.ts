import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomInt, randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async signup(dto: SignupDto) {
    const email = this.normalizeEmail(dto.email);
    const name = dto.name?.trim();

    if (!name || !this.isEmail(email) || !this.isValidPassword(dto.password)) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Name, valid email, and password with at least 8 characters are required',
      });
    }

    const verificationCode = this.createVerificationCode();
    const expiresAt = this.createVerificationExpiry();

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            name,
            passwordHash: this.hashPassword(dto.password),
          },
        });

        await tx.emailVerificationCode.create({
          data: {
            email,
            codeHash: this.hashVerificationCode(email, verificationCode),
            expiresAt,
          },
        });

        return createdUser;
      });

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        nextStep: 'VERIFY_EMAIL',
        devVerificationCode: verificationCode,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Email is already registered',
        });
      }

      throw error;
    }
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = this.normalizeEmail(dto.email);

    if (!this.isEmail(email) || !/^\d{6}$/.test(dto.code ?? '')) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Valid email and 6-digit verification code are required',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'User was not found',
      });
    }

    const verification = await this.prisma.emailVerificationCode.findFirst({
      where: {
        email,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification || verification.codeHash !== this.hashVerificationCode(email, dto.code)) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Verification code is invalid or expired',
      });
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
      }),
    ]);

    return {
      userId: user.id,
      email: user.email,
      emailVerified: true,
      accessToken: this.authTokenService.createAccessToken({
        userId: user.id,
        email: user.email,
      }),
      nextStep: 'CREATE_WALLET',
    };
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    if (!this.isEmail(email) || !dto.password) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Valid email and password are required',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Email or password is incorrect',
      });
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Email is not verified',
      });
    }

    return {
      accessToken: this.authTokenService.createAccessToken({
        userId: user.id,
        email: user.email,
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
      },
    };
  }

  private normalizeEmail(email: string) {
    return email?.trim().toLowerCase();
  }

  private isEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPassword(password: string) {
    return typeof password === 'string' && password.length >= 8;
  }

  private createVerificationCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private createVerificationExpiry() {
    const ttlMinutes = this.config.get<number>('EMAIL_CODE_TTL_MINUTES') ?? 10;
    return new Date(Date.now() + ttlMinutes * 60 * 1000);
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');

    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, passwordHash: string) {
    const [salt, storedHash] = passwordHash.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const hash = scryptSync(password, salt, 64);
    const stored = Buffer.from(storedHash, 'hex');

    return stored.length === hash.length && timingSafeEqual(stored, hash);
  }

  private hashVerificationCode(email: string, code: string) {
    return createHmac('sha256', this.getVerificationSecret()).update(`${email}:${code}`).digest('hex');
  }

  private getVerificationSecret() {
    return this.config.get<string>('EMAIL_CODE_SECRET') ?? 'local-dev-email-code-secret';
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
