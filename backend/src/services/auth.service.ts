import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { config } from '../config';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokens(userId: string, sessionId: string) {
  const accessOptions: SignOptions = { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] };
  const refreshOptions: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] };
  const accessToken = jwt.sign({ userId, sessionId }, config.jwt.secret, accessOptions);
  const refreshToken = jwt.sign({ userId, sessionId }, config.jwt.refreshSecret, refreshOptions);
  return { accessToken, refreshToken };
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  deviceInfo?: string
) {
  const sessionId = uuidv4();
  const { accessToken, refreshToken } = generateTokens(userId, sessionId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.userSession.create({
    data: {
      id: sessionId,
      userId,
      token: accessToken,
      refreshToken,
      ipAddress,
      userAgent,
      deviceInfo,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return { accessToken, refreshToken, sessionId };
}

export function generate2FASecret(): string {
  return authenticator.generateSecret();
}

export function verify2FAToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

export function get2FAQRCodeUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, 'Jolu ERP', secret);
}
