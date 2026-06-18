import sgMail from '@sendgrid/mail';
import prisma from '../config/database';
import { config } from '../config';
import { NotificationChannel } from '@prisma/client';

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  if (!config.sendgrid.apiKey) {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return { success: true, mock: true };
  }

  await sgMail.send({
    to,
    from: config.sendgrid.fromEmail,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
  });

  return { success: true };
}

export async function sendSMS(phone: string, message: string) {
  // Integrate with Africa's Talking or similar SMS gateway
  console.log(`[SMS] To: ${phone}, Message: ${message}`);
  return { success: true, mock: true };
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  options?: { companyId?: string; channel?: NotificationChannel; metadata?: object }
) {
  return prisma.notification.create({
    data: {
      userId,
      companyId: options?.companyId,
      title,
      message,
      channel: options?.channel || NotificationChannel.IN_APP,
      metadata: options?.metadata,
    },
  });
}

export async function notifyLowStock(companyId: string, sparePartName: string, quantity: number) {
  const managers = await prisma.user.findMany({
    where: {
      OR: [
        { role: { name: 'INVENTORY_MANAGER' } },
        { role: { name: 'COMPANY_ADMIN' } },
      ],
      companies: { some: { companyId } },
    },
  });

  for (const manager of managers) {
    await createNotification(
      manager.id,
      'Low Stock Alert',
      `${sparePartName} is running low. Current quantity: ${quantity}`,
      { companyId }
    );
  }
}

export async function notifyOverdueInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true },
  });
  if (!invoice) return;

  const financeUsers = await prisma.user.findMany({
    where: {
      role: { name: 'FINANCE_TEAM' },
      companies: { some: { companyId: invoice.companyId } },
    },
  });

  for (const user of financeUsers) {
    await createNotification(
      user.id,
      'Overdue Invoice',
      `Invoice ${invoice.invoiceNumber} for ${invoice.customer?.name || 'client'} is overdue.`,
      { companyId: invoice.companyId }
    );
  }
}
