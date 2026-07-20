import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import {
  generateSalesContractPDF,
  generateDeliveryNotePDF,
  generateGatePassPDF
} from '../services/machinery-docs.service';
import path from 'path';
import fs from 'fs';

const router = Router();
router.use(authenticate, requireCompany);

// ==================== SALES CONTRACTS ====================

router.get('/sales-contracts', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const contracts = await prisma.salesContract.findMany({
    where: { companyId: req.companyId! },
    include: { customer: true, machineryUnit: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: contracts });
});

router.post('/sales-contracts', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  const { customerId, machineryUnitId, salePrice, terms } = req.body;

  const count = await prisma.salesContract.count({ where: { companyId: req.companyId! } });
  const contractNumber = `JM-SC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const contract = await prisma.salesContract.create({
    data: {
      companyId: req.companyId!,
      contractNumber,
      customerId,
      machineryUnitId,
      salePrice,
      terms,
    },
  });

  // Automatically update stock status of the unit to RESERVED or SOLD
  await prisma.machineryUnit.update({
    where: { id: machineryUnitId },
    data: { stockStatus: 'RESERVED' },
  });

  res.status(201).json({ success: true, data: contract });
});

router.get('/sales-contracts/:id/pdf', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const pdfUrl = await generateSalesContractPDF(req.params.id);
    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELIVERY NOTES ====================

router.get('/delivery-notes', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const notes = await prisma.deliveryNote.findMany({
    where: { companyId: req.companyId! },
    include: { customer: true, machineryUnit: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: notes });
});

router.post('/delivery-notes', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  const {
    customerId,
    machineryUnitId,
    destination,
    receivedBy,
    driverName,
    driverIdNumber,
    driverPhone,
    truckNumberPlate
  } = req.body;

  const count = await prisma.deliveryNote.count({ where: { companyId: req.companyId! } });
  const deliveryNumber = `JM-DN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const note = await prisma.deliveryNote.create({
    data: {
      companyId: req.companyId!,
      deliveryNumber,
      customerId,
      machineryUnitId,
      destination,
      receivedBy,
      driverName,
      driverIdNumber,
      driverPhone,
      truckNumberPlate,
    },
  });

  // Automatically update stock status of the unit to DELIVERED
  await prisma.machineryUnit.update({
    where: { id: machineryUnitId },
    data: { stockStatus: 'DELIVERED', soldAt: new Date() },
  });

  res.status(201).json({ success: true, data: note });
});

router.get('/delivery-notes/:id/pdf', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const pdfUrl = await generateDeliveryNotePDF(req.params.id);
    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GATE PASSES ====================

router.get('/gate-passes', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const passes = await prisma.gatePass.findMany({
    where: { companyId: req.companyId! },
    include: { customer: true, machineryUnit: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: passes });
});

router.post('/gate-passes', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  const {
    customerId,
    machineryUnitId,
    timeOut,
    destination,
    driverName,
    driverIdNumber,
    driverPhone,
    truckNumberPlate,
    equipmentDetails,
    quantity,
    supplier,
    comments,
    securityOfficer,
    staffPresent
  } = req.body;

  const count = await prisma.gatePass.count({ where: { companyId: req.companyId! } });
  const gatePassNumber = `JM/GP/ON/${new Date().getFullYear().toString().slice(-2)}/${String(count + 1).padStart(3, '0')}`;

  const pass = await prisma.gatePass.create({
    data: {
      companyId: req.companyId!,
      gatePassNumber,
      customerId,
      machineryUnitId,
      timeOut,
      destination,
      driverName,
      driverIdNumber,
      driverPhone,
      truckNumberPlate,
      equipmentDetails,
      quantity: Number(quantity || 1),
      supplier,
      comments,
      securityOfficer,
      staffPresent,
    },
  });

  // Update status to SOLD/DELIVERED if needed, or leave as is
  res.status(201).json({ success: true, data: pass });
});

router.get('/gate-passes/:id/pdf', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const pdfUrl = await generateGatePassPDF(req.params.id);
    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
