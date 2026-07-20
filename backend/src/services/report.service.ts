import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'reports');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

interface ReportHeaderOptions {
  doc: any;
  company: any;
  title: string;
  primaryColor: string;
}

// Draw professional shared header with logo, title, and company details
function drawHeader({ doc, company, title, primaryColor }: ReportHeaderOptions) {
  const headerY = 50;

  if (company.logoUrl) {
    try {
      const logoRelativePath = company.logoUrl.startsWith('/') 
        ? company.logoUrl.substring(1) 
        : company.logoUrl;
      const logoPath = path.join(process.cwd(), logoRelativePath);

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, headerY, { width: 140 });
      } else {
        const altPath = path.join(process.cwd(), logoRelativePath.replace(/^backend\//, ''));
        if (fs.existsSync(altPath)) {
          doc.image(altPath, 50, headerY, { width: 140 });
        }
      }
    } catch (error) {
      console.error('Logo loading in reports failed:', error);
    }
  }

  doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text(title.toUpperCase(), 300, headerY, { align: 'right' });
  
  const displayCompanyName = company.code === 'MACHINERIES' ? 'Jolu Machineries' : company.name;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text(displayCompanyName, 300, doc.y + 5, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#000000').text(company.address || '', 300, doc.y, { align: 'right' });
  doc.text(`T: ${company.phone || ''}`, 300, doc.y, { align: 'right' });
  doc.text(`Email: ${company.email || ''}`, 300, doc.y, { align: 'right' });
  if (company.ccEmail) doc.text(`CC: ${company.ccEmail}`, 300, doc.y, { align: 'right' });
  if (company.website) doc.text(`Website: ${company.website}`, 300, doc.y, { align: 'right' });

  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(primaryColor);
  doc.moveDown(1);
}

// Helper to draw footer
function drawFooter(doc: any, primaryColor: string) {
  doc.moveTo(50, 750).lineTo(545, 750).stroke(primaryColor);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
  doc.text(`For Jolu, With Jolu & Always Jolu`, 50, 765, { align: 'center' });
}

// Generate Trial Balance PDF
export async function generateTrialBalancePDF(companyId: string, accountsData: any[]): Promise<string> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  const fileName = `trial-balance-${company.code}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const companyColors: Record<string, string> = {
    MACHINERIES: '#18361e',
    SECURITY: '#e82126',
    AUTOMOBILE: '#e82126',
  };
  const primaryColor = companyColors[company.code] || '#18361e';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawHeader({ doc, company, title: 'Trial Balance', primaryColor });

    doc.fontSize(11).font('Helvetica-Bold').text(`As of Date: ${new Date().toLocaleDateString('en-GB')}`, 50, doc.y);
    doc.moveDown(1);

    // Draw Table Header
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 20).fill(primaryColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('Code', 55, tableTop + 5, { width: 60 });
    doc.text('Account Name', 120, tableTop + 5, { width: 180 });
    doc.text('Debit (KES)', 310, tableTop + 5, { width: 110, align: 'right' });
    doc.text('Credit (KES)', 430, tableTop + 5, { width: 110, align: 'right' });

    let y = tableTop + 20;
    doc.fillColor('#000000').font('Helvetica').fontSize(9);

    let totalDebit = 0;
    let totalCredit = 0;

    for (const a of accountsData) {
      doc.rect(50, y, 495, 18).stroke();
      doc.text(a.code, 55, y + 4, { width: 60 });
      doc.text(a.name, 120, y + 4, { width: 180 });
      doc.text(a.debit ? Number(a.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-', 310, y + 4, { width: 110, align: 'right' });
      doc.text(a.credit ? Number(a.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-', 430, y + 4, { width: 110, align: 'right' });
      
      totalDebit += (a.debit || 0);
      totalCredit += (a.credit || 0);
      y += 18;
    }

    // Totals Row
    doc.rect(50, y, 495, 20).fill(primaryColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('Total', 120, y + 5, { width: 180 });
    doc.text(totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }), 310, y + 5, { width: 110, align: 'right' });
    doc.text(totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }), 430, y + 5, { width: 110, align: 'right' });

    drawFooter(doc, primaryColor);
    doc.end();

    stream.on('finish', () => resolve(`/uploads/reports/${fileName}`));
    stream.on('error', reject);
  });
}

// Generate Income Statement PDF
export async function generateIncomeStatementPDF(companyId: string, incomeData: any): Promise<string> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  const fileName = `income-statement-${company.code}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const companyColors: Record<string, string> = {
    MACHINERIES: '#18361e',
    SECURITY: '#e82126',
    AUTOMOBILE: '#e82126',
  };
  const primaryColor = companyColors[company.code] || '#18361e';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawHeader({ doc, company, title: 'Income Statement', primaryColor });

    const startDateStr = new Date(incomeData.period.startDate).toLocaleDateString('en-GB');
    const endDateStr = new Date(incomeData.period.endDate).toLocaleDateString('en-GB');
    doc.fontSize(11).font('Helvetica-Bold').text(`For the Period: ${startDateStr} to ${endDateStr}`, 50, doc.y);
    doc.moveDown(1.5);

    // Revenue Section
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('REVENUE');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    
    for (const r of incomeData.revenue) {
      doc.text(r.name, 70, doc.y, { continued: true });
      doc.text(` KES ${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    }
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Total Revenue', 70, doc.y, { continued: true });
    doc.text(` KES ${Number(incomeData.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    doc.moveDown(1.5);

    // Expenses Section
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('EXPENSES');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    for (const e of incomeData.expenses) {
      doc.text(e.name, 70, doc.y, { continued: true });
      doc.text(` KES ${Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    }
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Total Expenses', 70, doc.y, { continued: true });
    doc.text(` KES ${Number(incomeData.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    doc.moveDown(1.5);

    // Net Income
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(primaryColor);
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(incomeData.netIncome >= 0 ? '#18361e' : '#e82126');
    doc.text('NET INCOME', 70, doc.y, { continued: true });
    doc.text(` KES ${Number(incomeData.netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });

    drawFooter(doc, primaryColor);
    doc.end();

    stream.on('finish', () => resolve(`/uploads/reports/${fileName}`));
    stream.on('error', reject);
  });
}

// Generate Balance Sheet PDF
export async function generateBalanceSheetPDF(companyId: string, bsData: any): Promise<string> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  const fileName = `balance-sheet-${company.code}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const companyColors: Record<string, string> = {
    MACHINERIES: '#18361e',
    SECURITY: '#e82126',
    AUTOMOBILE: '#e82126',
  };
  const primaryColor = companyColors[company.code] || '#18361e';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawHeader({ doc, company, title: 'Balance Sheet', primaryColor });

    doc.fontSize(11).font('Helvetica-Bold').text(`As of Date: ${new Date().toLocaleDateString('en-GB')}`, 50, doc.y);
    doc.moveDown(1.5);

    // Assets
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('ASSETS');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    for (const a of bsData.assets) {
      doc.text(a.name, 70, doc.y, { continued: true });
      doc.text(` KES ${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    }
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Total Assets', 70, doc.y, { continued: true });
    doc.text(` KES ${Number(bsData.totalAssets).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    doc.moveDown(1.5);

    // Liabilities
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('LIABILITIES');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    for (const l of bsData.liabilities) {
      doc.text(l.name, 70, doc.y, { continued: true });
      doc.text(` KES ${Number(l.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    }
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Total Liabilities', 70, doc.y, { continued: true });
    doc.text(` KES ${Number(bsData.totalLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    doc.moveDown(1.5);

    // Equity
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('EQUITY');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    for (const eq of bsData.equity) {
      doc.text(eq.name, 70, doc.y, { continued: true });
      doc.text(` KES ${Number(eq.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });
    }
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Total Equity', 70, doc.y, { continued: true });
    doc.text(` KES ${Number(bsData.totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { align: 'right' });

    drawFooter(doc, primaryColor);
    doc.end();

    stream.on('finish', () => resolve(`/uploads/reports/${fileName}`));
    stream.on('error', reject);
  });
}

// Generate Receivables Report PDF
export async function generateReceivablesPDF(companyId: string, receivablesData: any[]): Promise<string> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  const fileName = `receivables-${company.code}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const companyColors: Record<string, string> = {
    MACHINERIES: '#18361e',
    SECURITY: '#e82126',
    AUTOMOBILE: '#e82126',
  };
  const primaryColor = companyColors[company.code] || '#18361e';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawHeader({ doc, company, title: 'Accounts Receivable', primaryColor });

    doc.fontSize(11).font('Helvetica-Bold').text(`As of Date: ${new Date().toLocaleDateString('en-GB')}`, 50, doc.y);
    doc.moveDown(1);

    // Draw Table Header
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 20).fill(primaryColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('Invoice No', 55, tableTop + 5, { width: 90 });
    doc.text('Customer', 150, tableTop + 5, { width: 170 });
    doc.text('Due Date', 330, tableTop + 5, { width: 90 });
    doc.text('Outstanding (KES)', 430, tableTop + 5, { width: 110, align: 'right' });

    let y = tableTop + 20;
    doc.fillColor('#000000').font('Helvetica').fontSize(9);

    let grandTotal = 0;

    for (const inv of receivablesData) {
      doc.rect(50, y, 495, 18).stroke();
      doc.text(inv.invoiceNumber, 55, y + 4, { width: 90 });
      doc.text(inv.customer?.name || inv.securityClient?.name || 'N/A', 150, y + 4, { width: 170 });
      doc.text(inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '-', 330, y + 4, { width: 90 });
      
      const balance = Number(inv.totalAmount) - Number(inv.amountPaid);
      doc.text(balance.toLocaleString(undefined, { minimumFractionDigits: 2 }), 430, y + 4, { width: 110, align: 'right' });
      
      grandTotal += balance;
      y += 18;
    }

    // Totals Row
    doc.rect(50, y, 495, 20).fill(primaryColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('Total Receivables', 150, y + 5, { width: 170 });
    doc.text(grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), 430, y + 5, { width: 110, align: 'right' });

    drawFooter(doc, primaryColor);
    doc.end();

    stream.on('finish', () => resolve(`/uploads/reports/${fileName}`));
    stream.on('error', reject);
  });
}

// Generate Client Statement of Account PDF
export async function generateClientStatementPDF(companyId: string, statementData: any): Promise<string> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  const client = statementData.client;
  const fileName = `statement-${client.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const companyColors: Record<string, string> = {
    MACHINERIES: '#18361e',
    SECURITY: '#e82126',
    AUTOMOBILE: '#e82126',
  };
  const primaryColor = companyColors[company.code] || '#18361e';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawHeader({ doc, company, title: 'Statement of Account', primaryColor });

    // Client Details
    const detailsY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('STATEMENT FOR:', 50, detailsY);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(client.name.toUpperCase());
    doc.fontSize(9).font('Helvetica');
    if (client.address) doc.text(client.address);
    if (client.phone) doc.text(`Phone: ${client.phone}`);
    if (client.email) doc.text(`Email: ${client.email}`);
    if (client.kraPin) doc.text(`KRA PIN: ${client.kraPin}`);

    // Summary Box
    doc.rect(345, detailsY, 200, 75).stroke(primaryColor);
    doc.fontSize(9).font('Helvetica-Bold').text('STATEMENT SUMMARY', 355, detailsY + 8);
    doc.font('Helvetica').text(`Total Invoiced: KES ${Number(statementData.summary.totalInvoiced).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 355, detailsY + 24);
    doc.text(`Total Payments: KES ${Number(statementData.summary.totalPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 355, detailsY + 40);
    doc.font('Helvetica-Bold').text(`Outstanding Balance: KES ${Number(statementData.summary.outstandingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 355, detailsY + 56);

    doc.moveDown(3);

    // Ledger Table
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 20).fill(primaryColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('Date', 55, tableTop + 5, { width: 65 });
    doc.text('Tx Type', 125, tableTop + 5, { width: 60 });
    doc.text('Reference', 190, tableTop + 5, { width: 85 });
    doc.text('Debit (Dr)', 280, tableTop + 5, { width: 85, align: 'right' });
    doc.text('Credit (Cr)', 370, tableTop + 5, { width: 85, align: 'right' });
    doc.text('Balance', 460, tableTop + 5, { width: 80, align: 'right' });

    let y = tableTop + 20;
    doc.fillColor('#000000').font('Helvetica').fontSize(8.5);

    for (const row of statementData.ledger) {
      doc.rect(50, y, 495, 18).stroke();
      doc.text(new Date(row.date).toLocaleDateString('en-GB'), 55, y + 4, { width: 65 });
      doc.text(row.type, 125, y + 4, { width: 60 });
      doc.text(row.reference, 190, y + 4, { width: 85 });
      doc.text(row.debit ? Number(row.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-', 280, y + 4, { width: 85, align: 'right' });
      doc.text(row.credit ? Number(row.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-', 370, y + 4, { width: 85, align: 'right' });
      doc.text(Number(row.balance).toLocaleString(undefined, { minimumFractionDigits: 2 }), 460, y + 4, { width: 80, align: 'right' });
      y += 18;
    }

    drawFooter(doc, primaryColor);
    doc.end();

    stream.on('finish', () => resolve(`/uploads/reports/${fileName}`));
    stream.on('error', reject);
  });
}
