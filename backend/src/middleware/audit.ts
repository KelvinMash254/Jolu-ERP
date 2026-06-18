import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';

export async function auditLog(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const action = `${req.method} ${req.path}`;
      const module = req.path.split('/')[2] || 'system';

      prisma.auditLog
        .create({
          data: {
            userId: req.user.id,
            companyId: req.companyId,
            action,
            module,
            ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
            userAgent: req.headers['user-agent'],
            deviceInfo: req.headers['x-device-info'] as string,
            newValues: req.method !== 'GET' ? (req.body as object) : undefined,
          },
        })
        .catch(() => {});
    }
    return originalJson(body);
  };

  next();
}

export async function createAuditEntry(data: {
  userId?: string;
  companyId?: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({ data });
}
