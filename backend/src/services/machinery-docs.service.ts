import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'machinery-docs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function generateSalesContractPDF(contractId: string): Promise<string> {
  const contract = await prisma.salesContract.findUnique({
    where: { id: contractId },
    include: {
      customer: true,
      machineryUnit: true,
      company: true,
    },
  });

  if (!contract) throw new Error('Sales Contract not found');

  const fileName = `Contract-${contract.contractNumber.replace(/\//g, '-')}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Primary Jolu Green
    const primaryColor = '#18361e';

    // Header Logo
    const logoPath = path.join(process.cwd(), 'uploads/logos/machineries.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 120 });
    }

    // Company Header
    doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('SALES CONTRACT', 300, 45, { align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(contract.company.name, 300, doc.y + 5, { align: 'right' });
    doc.fontSize(8).font('Helvetica').text(contract.company.address || '', 300, doc.y, { align: 'right' });
    doc.text(`T: ${contract.company.phone || ''}`, 300, doc.y, { align: 'right' });
    doc.text(`Email: ${contract.company.email || ''}`, 300, doc.y, { align: 'right' });
    doc.text(`Website: ${contract.company.website || ''}`, 300, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.strokeColor(primaryColor).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);

    const infoY = doc.y;
    // Contract Details Left
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('CONTRACT DETAILS', 50, infoY);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('Contract Number: ', 50, doc.y + 5);
    doc.font('Helvetica').text(contract.contractNumber, 150, doc.y - 12);
    doc.font('Helvetica-Bold').text('Date: ', 50, doc.y + 5);
    doc.font('Helvetica').text(new Date(contract.createdAt).toLocaleDateString(), 150, doc.y - 12);
    doc.font('Helvetica-Bold').text('Selling Price: ', 50, doc.y + 5);
    doc.font('Helvetica').text(`KES ${Number(contract.salePrice).toLocaleString()}`, 150, doc.y - 12);

    // Customer Details Right
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('CUSTOMER INFORMATION', 300, infoY);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('Name: ', 300, doc.y + 5);
    doc.font('Helvetica').text(contract.customer.name, 380, doc.y - 12);
    doc.font('Helvetica-Bold').text('ID / Passport: ', 300, doc.y + 5);
    doc.font('Helvetica').text(contract.customer.idNumber || '-', 380, doc.y - 12);
    doc.font('Helvetica-Bold').text('Phone: ', 300, doc.y + 5);
    doc.font('Helvetica').text(contract.customer.phone, 380, doc.y - 12);

    doc.moveDown(2.5);

    // Machinery Details
    doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('EQUIPMENT / MACHINERY DETAILS', 50);
    doc.moveDown(0.5);

    const tableY = doc.y;
    doc.rect(50, tableY, 495, 20).fill(primaryColor);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('Product Name', 60, tableY + 5);
    doc.text('Brand / Model', 200, tableY + 5);
    doc.text('Chassis Number', 350, tableY + 5);
    doc.text('Engine / Serial Number', 450, tableY + 5);

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    doc.rect(50, tableY + 20, 495, 25).stroke();
    doc.text(contract.machineryUnit.productName, 60, tableY + 28);
    doc.text(`${contract.machineryUnit.brand} ${contract.machineryUnit.model}`, 200, tableY + 28);
    doc.text(contract.machineryUnit.chassisNumber || '-', 350, tableY + 28);
    doc.text(contract.machineryUnit.engineNumber || contract.machineryUnit.serialNumber || '-', 450, tableY + 28);

    doc.moveDown(3);

    // Terms and Conditions
    doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('TERMS AND CONDITIONS', 50);
    doc.fontSize(8.5).font('Helvetica').fillColor('#333333').text(contract.terms || '1. The buyer agrees to purchase the above equipment at the specified sale price.\n2. The equipment remains property of Jolu Agricultural Machineries Ltd until full payment is received.\n3. This contract is governed by the laws of Kenya.', 50, doc.y + 5, { width: 495, lineGap: 4 });

    doc.moveDown(4);

    // Signatures
    const sigY = doc.y;
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, sigY + 40).lineTo(220, sigY + 40).stroke();
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(325, sigY + 40).lineTo(495, sigY + 40).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Authorized Jolu Signature', 50, sigY + 45);
    doc.text('Buyer Signature', 325, sigY + 45);

    doc.end();
    stream.on('finish', () => resolve(`/uploads/machinery-docs/${fileName}`));
    stream.on('error', (err) => reject(err));
  });
}

export async function generateDeliveryNotePDF(deliveryNoteId: string): Promise<string> {
  const note = await prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
    include: {
      customer: true,
      machineryUnit: true,
      company: true,
    },
  });

  if (!note) throw new Error('Delivery Note not found');

  const fileName = `Delivery-${note.deliveryNumber.replace(/\//g, '-')}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const primaryColor = '#18361e';

    // Header Logo
    const logoPath = path.join(process.cwd(), 'uploads/logos/machineries.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 120 });
    }

    // Company Header
    doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('DELIVERY NOTE', 300, 45, { align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(note.company.name, 300, doc.y + 5, { align: 'right' });
    doc.fontSize(8).font('Helvetica').text(note.company.address || '', 300, doc.y, { align: 'right' });
    doc.text(`T: ${note.company.phone || ''}`, 300, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.strokeColor(primaryColor).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);

    const infoY = doc.y;
    // Delivery Details Left
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('DELIVERY INFORMATION', 50, infoY);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('Delivery No: ', 50, doc.y + 5);
    doc.font('Helvetica').text(note.deliveryNumber, 150, doc.y - 12);
    doc.font('Helvetica-Bold').text('Delivery Date: ', 50, doc.y + 5);
    doc.font('Helvetica').text(new Date(note.deliveryDate).toLocaleDateString(), 150, doc.y - 12);
    doc.font('Helvetica-Bold').text('Destination: ', 50, doc.y + 5);
    doc.font('Helvetica').text(note.destination || '-', 150, doc.y - 12);

    // Customer Details Right
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('CONSIGNEE / CUSTOMER', 300, infoY);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('Name: ', 300, doc.y + 5);
    doc.font('Helvetica').text(note.customer.name, 380, doc.y - 12);
    doc.font('Helvetica-Bold').text('Phone: ', 300, doc.y + 5);
    doc.font('Helvetica').text(note.customer.phone, 380, doc.y - 12);

    doc.moveDown(2.5);

    // Driver details
    doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('DISPATCH & DRIVER DETAILS', 50);
    doc.moveDown(0.5);
    const driverY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('Driver Name: ', 50, driverY);
    doc.font('Helvetica').text(note.driverName || '-', 140, driverY);
    doc.font('Helvetica-Bold').text('Driver ID: ', 50, driverY + 15);
    doc.font('Helvetica').text(note.driverIdNumber || '-', 140, driverY + 15);
    doc.font('Helvetica-Bold').text('Truck No Plate: ', 300, driverY);
    doc.font('Helvetica').text(note.truckNumberPlate || '-', 390, driverY);
    doc.font('Helvetica-Bold').text('Driver Phone: ', 300, driverY + 15);
    doc.font('Helvetica').text(note.driverPhone || '-', 390, driverY + 15);

    doc.moveDown(2.5);

    // Equipment Details
    doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('EQUIPMENT RECEIVED', 50);
    doc.moveDown(0.5);

    const tableY = doc.y;
    doc.rect(50, tableY, 495, 20).fill(primaryColor);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('Item Description', 60, tableY + 5);
    doc.text('Brand / Model', 250, tableY + 5);
    doc.text('Chassis / Engine', 380, tableY + 5);
    doc.text('Qty', 495, tableY + 5, { align: 'right' });

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    doc.rect(50, tableY + 20, 495, 25).stroke();
    doc.text(note.machineryUnit.productName, 60, tableY + 28);
    doc.text(`${note.machineryUnit.brand} ${note.machineryUnit.model}`, 250, tableY + 28);
    doc.text(`${note.machineryUnit.chassisNumber || '-'}\n${note.machineryUnit.engineNumber || '-'}`, 380, tableY + 25);
    doc.text('1', 495, tableY + 28, { align: 'right' });

    doc.moveDown(3);

    doc.fontSize(9).font('Helvetica-Bold').text('Customer Confirmation:', 50);
    doc.font('Helvetica').text('I/We hereby confirm that we have received the above equipment in good order and condition.', 50, doc.y + 5);

    doc.moveDown(4);

    // Signatures
    const sigY = doc.y;
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, sigY + 40).lineTo(220, sigY + 40).stroke();
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(325, sigY + 40).lineTo(495, sigY + 40).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Received By (Name & Signature)', 50, sigY + 45);
    doc.text('Date', 325, sigY + 45);

    doc.end();
    stream.on('finish', () => resolve(`/uploads/machinery-docs/${fileName}`));
    stream.on('error', (err) => reject(err));
  });
}

export async function generateGatePassPDF(gatePassId: string): Promise<string> {
  const gp = await prisma.gatePass.findUnique({
    where: { id: gatePassId },
    include: {
      customer: true,
      machineryUnit: true,
      company: true,
    },
  });

  if (!gp) throw new Error('Gate Pass not found');

  const fileName = `GatePass-${gp.gatePassNumber.replace(/\//g, '-')}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  return new Promise((resolve, reject) => {
    // Generate exactly matching the Gate Pass structure and style from image.png
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const primaryColor = '#18361e'; // Green as in the header image

    // Draw top layout border
    doc.rect(20, 20, 555, 800).strokeColor('#000000').lineWidth(0.5).stroke();

    // Top Logo on left
    const logoPath = path.join(process.cwd(), 'uploads/logos/machineries.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 35, { width: 110 });
    }

    // Company Header Info on right
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('Jolu Machineries', 320, 35, { align: 'right' });
    doc.fontSize(9).font('Helvetica').text('P.O Box 7161 - 00200,', 320, doc.y, { align: 'right' });
    doc.text('Nairobi, Kenya', 320, doc.y, { align: 'right' });
    doc.text('Tel: + (254) 705 038679', 320, doc.y, { align: 'right' });
    doc.font('Helvetica-Bold').text('Email: ', 320, doc.y, { align: 'right', continued: true }).font('Helvetica').text('info@jolumachineries.com');
    doc.font('Helvetica-Bold').text('Website: ', 320, doc.y, { align: 'right', continued: true }).font('Helvetica').text('www.jolumachineries.com');

    doc.moveDown(1.5);

    // GATE PASS TITLE (Green, underlined)
    doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('Gate Pass', 40, doc.y, { align: 'center', underline: true });
    doc.moveDown(1.5);

    const block1Y = doc.y;
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text(`Gate Pass No: ${gp.gatePassNumber}`, 40, block1Y);
    doc.text(`Date: .......................................`, 230, block1Y);
    doc.text(new Date(gp.date).toLocaleDateString(), 265, block1Y);
    doc.text(`Time Out: ......................`, 420, block1Y);
    doc.text(gp.timeOut || '-', 475, block1Y);

    doc.moveDown(1.5);

    // Delivery Information Section
    const divY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('Delivery Information', 40, divY, { underline: true });
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Reg. No. of Tractor: ...........................................', 40, divY + 18);
    doc.font('Helvetica').text(gp.machineryUnit.registrationNumber || '-', 140, divY + 18);
    doc.font('Helvetica-Bold').text('Name of Customer: ............................................', 300, divY + 18);
    doc.font('Helvetica').text(gp.customer.name, 395, divY + 18);

    doc.font('Helvetica-Bold').text('Location & Destination: .....................................', 40, divY + 36);
    doc.font('Helvetica').text(gp.destination || '-', 155, divY + 36);
    doc.font('Helvetica-Bold').text('Contact: ..............................................................', 300, divY + 36);
    doc.font('Helvetica').text(gp.customer.phone, 350, divY + 36);

    doc.font('Helvetica-Bold').text('Signature: ...........................................................', 40, divY + 54);
    doc.font('Helvetica-Bold').text('Date of Delivery: .................................................', 300, divY + 54);
    doc.font('Helvetica').text(new Date(gp.date).toLocaleDateString(), 385, divY + 54);

    doc.moveDown(2);

    // Driver Details Section
    const drvY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('Driver Details', 40, drvY, { underline: true });
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Driver Name: ......................................................', 40, drvY + 18);
    doc.font('Helvetica').text(gp.driverName || '-', 110, drvY + 18);
    doc.font('Helvetica-Bold').text('Driver ID Number: ...............................................', 300, drvY + 18);
    doc.font('Helvetica').text(gp.driverIdNumber || '-', 390, drvY + 18);

    doc.font('Helvetica-Bold').text('Driver Phone Number: ........................................', 40, drvY + 36);
    doc.font('Helvetica').text(gp.driverPhone || '-', 150, drvY + 36);
    doc.font('Helvetica-Bold').text('Delivery Truck Number Plate: ..............................', 300, drvY + 36);
    doc.font('Helvetica').text(gp.truckNumberPlate || '-', 440, drvY + 36);

    doc.font('Helvetica-Bold').text('Signature: ...........................................................', 40, drvY + 54);

    doc.moveDown(2.5);

    // Equipment Details Section
    const eqY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('Equipment Details', 40, eqY, { underline: true });
    doc.moveDown(0.5);

    const tblY = doc.y;
    // Draw table headers
    doc.lineWidth(1);
    doc.rect(40, tblY, 515, 20).fillAndStroke('#eaf2e8', '#000000');
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text('EQUIPMENTS', 120, tblY + 6);
    doc.text('QUANTITY', 290, tblY + 6);
    doc.text('SUPPLIER', 380, tblY + 6);
    doc.text('COMMENTS', 475, tblY + 6);

    // Table lines and content
    const cellH = 100;
    doc.rect(40, tblY + 20, 515, cellH).stroke();
    // Vertical dividers
    doc.moveTo(280, tblY + 20).lineTo(280, tblY + 20 + cellH).stroke();
    doc.moveTo(350, tblY + 20).lineTo(350, tblY + 20 + cellH).stroke();
    doc.moveTo(450, tblY + 20).lineTo(450, tblY + 20 + cellH).stroke();

    // Fill table data
    doc.fontSize(8.5).font('Helvetica');
    const eqDetails = gp.equipmentDetails || `${gp.machineryUnit.productName.toUpperCase()}\nBRAND: ${gp.machineryUnit.brand.toUpperCase()} MODEL: ${gp.machineryUnit.model.toUpperCase()}`;
    doc.text(eqDetails, 45, tblY + 26, { width: 230 });
    doc.text(String(gp.quantity), 285, tblY + 26, { width: 60, align: 'center' });
    doc.text(gp.supplier || 'JOLU AGRICULTURAL MACHINERIES LTD.', 355, tblY + 26, { width: 90 });
    
    const commentsText = gp.comments || `REG NO: ${gp.machineryUnit.registrationNumber || '-'}\nCHASSIS: ${gp.machineryUnit.chassisNumber || '-'}\nENGINE: ${gp.machineryUnit.engineNumber || '-'}`;
    doc.text(commentsText, 455, tblY + 26, { width: 95 });

    doc.moveDown(1.5);

    // Disclaimer
    const discY = doc.y + 90;
    doc.fontSize(8.5).font('Helvetica-Bold');
    doc.text('That,', 40, discY);
    doc.text('I/We ....................................................................................... have confirmed that I/We have received the', 40, discY + 12);
    doc.text('above Equipment in good order and working condition.', 40, discY + 24);
    doc.text('Signature: .......................................', 380, discY + 24);

    // Sign-off sections
    const signOffY = discY + 45;
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(primaryColor).text('Security/Gate Officer:', 40, signOffY);
    doc.fillColor('#000000');
    doc.text('Name: ................................................... Time: ................................', 40, signOffY + 15);
    doc.text(gp.securityOfficer || '', 80, signOffY + 15);
    doc.text('Signature: .........................................', 350, signOffY + 15);

    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(primaryColor).text('Jolu Staff Present:', 40, signOffY + 35);
    doc.fillColor('#000000');
    doc.text('Name: ................................................... Date: ................................', 40, signOffY + 50);
    doc.text(gp.staffPresent || '', 80, signOffY + 50);
    doc.text(new Date(gp.date).toLocaleDateString(), 270, signOffY + 50);
    doc.text('Signature: .........................................', 350, signOffY + 50);

    // Footer at the bottom
    doc.fontSize(9).font('Helvetica-BoldOblique').fillColor('#c2c2c2');
    // Green and Red coloring for footer "For Jolu With Jolu & Always Jolu"
    doc.text('For Jolu, With Jolu & Always Jolu', 40, 800, { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(`/uploads/machinery-docs/${fileName}`));
    stream.on('error', (err) => reject(err));
  });
}
