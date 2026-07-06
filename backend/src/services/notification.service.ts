import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import prisma from '../config/database';
import { config } from '../config';
import { NotificationChannel } from '@prisma/client';

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.gmail.user,
    pass: config.gmail.pass,
  },
});

export interface EmailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: EmailAttachment[]
) {
  // Try Gmail first if configured
  if (config.gmail.user && config.gmail.pass) {
    await transporter.sendMail({
      from: `"Jolu Group" <${config.gmail.user}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
      attachments,
    });
    return { success: true, provider: 'gmail' };
  }

  // Fallback to SendGrid
  if (config.sendgrid.apiKey) {
    await sgMail.send({
      to,
      from: config.sendgrid.fromEmail,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.path, // SG might need base64, but we'll see
        type: a.contentType,
        disposition: 'attachment'
      })),
    });
    return { success: true, provider: 'sendgrid' };
  }

  console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
  if (attachments) console.log(`[EMAIL MOCK] Attachments: ${attachments.map(a => a.filename).join(', ')}`);

  return { success: true, mock: true };
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
