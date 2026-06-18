import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';
import {
  hashPassword,
  comparePassword,
  createSession,
  generate2FASecret,
  verify2FAToken,
  get2FAQRCodeUrl,
} from '../services/auth.service';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        companies: { include: { company: true } },
        branches: { include: { branch: true } },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorToken) {
        return res.status(200).json({ requires2FA: true, message: 'Two-factor authentication required' });
      }
      if (!verify2FAToken(twoFactorToken, user.twoFactorSecret)) {
        return res.status(401).json({ error: 'Invalid 2FA token' });
      }
    }

    const tokens = await createSession(
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-device-info'] as string
    );

    res.json({
      success: true,
      data: {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          roleDisplayName: user.role.displayName,
          companies: user.companies.map((uc) => ({
            id: uc.company.id,
            code: uc.company.code,
            name: uc.company.name,
            isPrimary: uc.isPrimary,
          })),
          branches: user.branches.map((ub) => ({
            id: ub.branch.id,
            code: ub.branch.code,
            name: ub.branch.name,
          })),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      userId: string;
      sessionId: string;
    };

    const session = await prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    await prisma.userSession.delete({ where: { id: session.id } });
    const tokens = await createSession(decoded.userId);

    res.json({ success: true, data: tokens });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user?.sessionId) {
    await prisma.userSession.delete({ where: { id: req.user.sessionId } }).catch(() => {});
  }
  res.json({ success: true, message: 'Logged out' });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

router.post('/2fa/setup', authenticate, async (req: AuthRequest, res: Response) => {
  const secret = generate2FASecret();
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { twoFactorSecret: secret },
  });

  const qrUrl = get2FAQRCodeUrl(req.user!.email, secret);
  res.json({ success: true, data: { secret, qrUrl } });
});

router.post('/2fa/enable', authenticate, async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user?.twoFactorSecret || !verify2FAToken(token, user.twoFactorSecret)) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  res.json({ success: true, message: '2FA enabled' });
});

router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  res.json({ success: true, message: 'Password changed' });
});

export default router;
