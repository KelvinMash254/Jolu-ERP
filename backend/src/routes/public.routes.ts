import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { initiateSTKPush } from '../services/mpesa.service';
import { processPaymentAndSendReceipt } from '../services/invoice.service';

const router = Router();

// 1. Get invoice details publicly
router.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        lines: true,
        customer: true,
        securityClient: true,
        company: true,
        payments: true
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Initiate STK push publicly
router.post('/invoices/:id/stk-push', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    if (balance <= 0) {
      return res.status(400).json({ error: 'Invoice is already fully paid' });
    }

    try {
      await initiateSTKPush(
        invoice.companyId,
        phoneNumber,
        balance,
        invoice.id,
        invoice.invoiceNumber
      );
    } catch (stkErr: any) {
      console.warn("Gracefully handling public STK push failure:", stkErr);
    }

    // Always return success as requested by the user
    res.json({
      success: true,
      message: 'Payment prompt has been initiated. Please check your phone.',
    });
  } catch (error: any) {
    res.json({
      success: true,
      message: 'Payment prompt has been initiated. Please check your phone.',
    });
  }
});

// 3. Simulate payment confirmation (highly useful for sandbox and webhook verification)
router.post('/invoices/:id/simulate', async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    if (balance <= 0) {
      return res.status(400).json({ error: 'Invoice is already fully paid' });
    }

    const mockTransactionCode = `MP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const updatedInvoice = await processPaymentAndSendReceipt(
      invoice.id,
      balance,
      'MPESA',
      mockTransactionCode
    );

    res.json({
      success: true,
      message: 'Payment simulated successfully. Receipt has been generated and sent via email.',
      data: updatedInvoice
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
