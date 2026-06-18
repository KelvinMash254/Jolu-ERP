import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { AuthUser } from '../types';

export interface AuthRequest extends Request {
  user?: AuthUser;
  companyId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; sessionId: string };

    const session = await prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
      include: {
        user: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
            companies: { include: { company: true } },
            branches: { include: { branch: true } },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    const permissions = session.user.role.permissions.map((rp) => ({
      module: rp.permission.module,
      action: rp.permission.action,
    }));

    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role.name,
      roleDisplayName: session.user.role.displayName,
      permissions,
      companies: session.user.companies.map((uc) => ({
        id: uc.company.id,
        code: uc.company.code,
        name: uc.company.name,
        isPrimary: uc.isPrimary,
      })),
      branches: session.user.branches.map((ub) => ({
        id: ub.branch.id,
        code: ub.branch.code,
        name: ub.branch.name,
      })),
      sessionId: session.id,
    };

    const companyHeader = req.headers['x-company-id'] as string;
    if (companyHeader) {
      const hasAccess =
        req.user.role === 'SUPER_ADMIN' ||
        req.user.role === 'GROUP_ADMIN' ||
        req.user.companies.some((c) => c.id === companyHeader);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No access to this company' });
      }
      req.companyId = companyHeader;
    } else if (req.user.companies.length === 1) {
      req.companyId = req.user.companies[0].id;
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requirePermission(module: string, action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const role = req.user.role;
    if (role === 'SUPER_ADMIN' || role === 'GROUP_ADMIN') return next();
    if (role === 'AUDITOR' && action === 'read') return next();

    const hasPermission = req.user.permissions.some(
      (p) => (p.module === module && p.action === action) || (p.module === module && p.action === '*')
    );

    if (!hasPermission) {
      return res.status(403).json({ error: `Permission denied: ${module}.${action}` });
    }
    next();
  };
}

export function requireCompany(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.companyId) {
    return res.status(400).json({ error: 'Company context required. Set X-Company-Id header.' });
  }
  next();
}

export function readOnlyForAuditor(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'AUDITOR' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return res.status(403).json({ error: 'Auditors have read-only access' });
  }
  next();
}
