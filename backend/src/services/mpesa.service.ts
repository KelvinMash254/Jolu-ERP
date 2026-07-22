import prisma from '../config/database';
import { postPaymentJournal } from './accounting.service';
import { generateInvoicePDF, processPaymentAndSendReceipt } from './invoice.service';
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
    const updatedInvoice = await processPaymentAndSendReceipt(
      invoice.id,
      amount,
      'MPESA',
      transactionCode
    );

    if (customer?.phone) {
      await sendSMS(
        customer.phone,
        `Jolu Group: Payment of KES ${amount.toLocaleString()} received. Ref: ${transactionCode}. Invoice: ${invoice.invoiceNumber}`
      );
    }

    return { success: true, transaction, invoice: updatedInvoice, pdfUrl: updatedInvoice.pdfUrl };
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
  console.log("========== MPESA CONFIG ==========");

console.log({
  environment: config.mpesa.environment,
  shortcode: config.mpesa.shortcode,
  callbackUrl: config.mpesa.callbackUrl,
  consumerKey: config.mpesa.consumerKey.substring(0, 8) + "...",
  consumerSecret: config.mpesa.consumerSecret.substring(0, 8) + "...",
  passkeyLength: config.mpesa.passkey.length,
});
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(
    `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`
  ).toString('base64');

  const url =
    config.mpesa.environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

  // Normalize phone number: strip non-numeric and prefix properly
  let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
    cleanPhone = '254' + cleanPhone;
  }

console.log("====== STK REQUEST ======");
console.log({
  BusinessShortCode: config.mpesa.shortcode,
  Password: password,
  Timestamp: timestamp,
  TransactionType: "CustomerPayBillOnline",
  Amount: Math.round(Number(amount)),
  PartyA: cleanPhone,
  PartyB: config.mpesa.shortcode,
  PhoneNumber: cleanPhone,
  CallBackURL: config.mpesa.callbackUrl,
  AccountReference: accountReference || invoiceId || "JOLU-ERP",
  TransactionDesc: "Invoice Payment",
});



const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    BusinessShortCode: config.mpesa.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(Number(amount)),
    PartyA: cleanPhone,
    PartyB: config.mpesa.shortcode,
    PhoneNumber: cleanPhone,
    CallBackURL: config.mpesa.callbackUrl,
    AccountReference: accountReference || invoiceId || "JOLU-ERP",
    TransactionDesc: "Invoice Payment",
  }),
});

const text = await response.text();

console.log("====== STK PUSH ======");
console.log("Status:", response.status);
console.log("Body:", text);

return JSON.parse(text);
}

async function getMpesaAccessToken(): Promise<string> {
  const url =
    config.mpesa.environment === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const auth = Buffer.from(
    `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`
  ).toString("base64");

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const text = await response.text();

  console.log("====== OAUTH ======");
  console.log("Status:", response.status);
  console.log("Body:", text);

  if (!response.ok) {
    throw new Error(`OAuth failed: ${text}`);
  }

  const data = JSON.parse(text);

  return data.access_token;
}
