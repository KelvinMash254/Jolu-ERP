import nodemailer from 'nodemailer';
import prisma from '../config/database';
import { config } from '../config';
import { NotificationChannel } from '@prisma/client';


const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Failed");
    console.error(error);
  } else {
    console.log("✅ SMTP Connected");
  }
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
  attachments?: EmailAttachment[],
  from?: string
) {
  try {
    const info = await transporter.sendMail({
      from: from || config.email.from,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
      attachments,
    });

    console.log("✅ Email sent:", info.messageId);

    return {
      success: true,
      provider: "smtp",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
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
