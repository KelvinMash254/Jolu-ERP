import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import { importData, exportData } from '../services/import-export.service';

const router = Router();
const uploadDir = path.join(process.cwd(), 'uploads', 'imports');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });

router.use(authenticate, requireCompany);

router.post('/import/:entity', requirePermission('importexport', 'create'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });

  const entity = req.params.entity as 'customers' | 'leads' | 'inventory' | 'spare-parts';
  const format = req.file.originalname.endsWith('.xlsx') ? 'xlsx' : 'csv';

  const result = await importData(req.companyId!, entity, req.file.path, format, req.user!.id);
  res.json({ success: true, data: result });
});

router.get('/export/:entity', requirePermission('importexport', 'read'), async (req: AuthRequest, res: Response) => {
  const entity = req.params.entity as 'customers' | 'leads' | 'inventory' | 'spare-parts' | 'invoices';
  const format = (req.query.format as 'csv' | 'xlsx') || 'xlsx';

  const fileUrl = await exportData(req.companyId!, entity, format, req.user!.id);
  res.json({ success: true, data: { fileUrl } });
});

export default router;
