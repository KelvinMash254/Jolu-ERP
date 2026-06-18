import prisma from '../config/database';
import { postPaymentJournal } from './accounting.service';
import { generateInvoicePDF } from './invoice.service';
import { sendEmail, sendSMS } from './notification.service';
import { config } from '../config';

interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: { Name: string; Value: string | number }[];
      };
    };
  };
}

export async function processMpesaCallback(payload: MpesaCallbackPayload, companyId: string) {
  const callback = payload.Body.stkCallback;

  if (callback.ResultCode !== 0) {
    return { success: false, message: callback.ResultDesc };
  }

  const metadata = callback.CallbackMetadata?.Item || [];
  const getValue = (name: string) => metadata.find((i) => i.Name === name)?.Value;

  const transactionCode = String(getValue('MpesaReceiptNumber') || '');
  const amount = Number(getValue('Amount') || 0);
  const phoneNumber = String(getValue('PhoneNumber') || '');

  const existing = await prisma.mpesaTransaction.findUnique({
    where: { transactionCode },
  });
  if (existing) return { success: true, message: 'Already processed', transaction: existing };

  // Match customer by phone
  const customer = await prisma.customer.findFirst({
    where: {
      companyId,
      phone: { contains: phoneNumber.slice(-9) },
    },
  });

  // Match outstanding invoice
  let invoice = customer
    ? await prisma.invoice.findFirst({
        where: {
          companyId,
          customerId: customer.id,
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        orderBy: { issueDate: 'asc' },
      })
    : null;

  const transaction = await prisma.mpesaTransaction.create({
    data: {
      companyId,
      transactionCode,
      amount,
      phoneNumber,
      customerId: customer?.id,
      invoiceId: invoice?.id,
      rawPayload: payload as object,
    },
  });

  if (invoice) {
    const newAmountPaid = Number(invoice.amountPaid) + amount;
    const status = newAmountPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        paymentMethod: 'MPESA',
        reference: transactionCode,
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: newAmountPaid, status },
    });

    await postPaymentJournal(companyId, amount, 'MPESA', undefined, transactionCode);

    const pdfUrl = await generateInvoicePDF(invoice.id);

    if (customer?.email) {
      await sendEmail(
        customer.email,
        `Payment Receipt - ${invoice.invoiceNumber}`,
        `Dear ${customer.name},\n\nWe have received your M-Pesa payment of KES ${amount.toLocaleString()}.\nTransaction Code: ${transactionCode}\n\nThank you for your business.\n\nJolu Group`
      );
    }

    if (customer?.phone) {
      await sendSMS(
        customer.phone,
        `Jolu Group: Payment of KES ${amount.toLocaleString()} received. Ref: ${transactionCode}. Invoice: ${invoice.invoiceNumber}`
      );
    }

    return { success: true, transaction, invoice, pdfUrl };
  }

  return { success: true, transaction, message: 'Payment recorded but no matching invoice found' };
}

export async function initiateSTKPush(
  companyId: string,
  phoneNumber: string,
  amount: number,
  invoiceId?: string,
  accountReference?: string
) {
  const token = await getMpesaAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(
    `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`
  ).toString('base64');

  const url =
    config.mpesa.environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: config.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: config.mpesa.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: config.mpesa.callbackUrl,
      AccountReference: accountReference || invoiceId || 'JOLU-ERP',
      TransactionDesc: 'Invoice Payment',
    }),
  });

  return response.json();
}

async function getMpesaAccessToken(): Promise<string> {
  const url =
    config.mpesa.environment === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const auth = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString('base64');

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}
