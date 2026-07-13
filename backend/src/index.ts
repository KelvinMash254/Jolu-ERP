import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { auditLog } from './middleware/audit';
import { readOnlyForAuditor } from './middleware/auth';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import companiesRoutes from './routes/companies.routes';
import crmRoutes from './routes/crm.routes';
import inventoryRoutes from './routes/inventory.routes';
import invoicesRoutes from './routes/invoices.routes';
import accountingRoutes from './routes/accounting.routes';
import serviceRoutes from './routes/service.routes';
import securityRoutes from './routes/security.routes';
import financingRoutes from './routes/financing.routes';
import mpesaRoutes from './routes/mpesa.routes';
import pettycashRoutes from './routes/pettycash.routes';
import notificationsRoutes from './routes/notifications.routes';
import importExportRoutes from './routes/import-export.routes';
import carHireRoutes from './routes/car-hire.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: 'Too many requests' },
  })
);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(auditLog);
app.use(readOnlyForAuditor);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Jolu ERP API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/financing', financingRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/pettycash', pettycashRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/car-hire', carHireRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: config.nodeEnv === 'production' ? 'Internal server error' : err.message });
});

app.listen(config.port, () => {
  console.log(`Jolu ERP API running on port ${config.port}`);
});

export default app;
