import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import prisma from '../config/database';
import fs from 'fs';

type EntityType = 'customers' | 'leads' | 'inventory' | 'spare-parts' | 'invoices';

export async function importData(
  companyId: string,
  entity: EntityType,
  filePath: string,
  format: 'csv' | 'xlsx',
  createdBy?: string
) {
  const job = await prisma.importExportJob.create({
    data: {
      companyId,
      type: 'IMPORT',
      entity,
      format,
      fileUrl: filePath,
      status: 'PROCESSING',
      createdBy,
    },
  });

  try {
    let records: Record<string, string>[];

    if (format === 'xlsx') {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(sheet);
    } else {
      const content = fs.readFileSync(filePath, 'utf-8');
      records = parse(content, { columns: true, skip_empty_lines: true });
    }

    let imported = 0;

console.log('Entity:', entity);
console.log('Records:', records.length);
console.log('First Record:', records[0]);


    switch (entity) {
      case 'customers':
        for (const row of records) {
          await prisma.customer.create({
            data: {
              companyId,
              name: row.name || row.Name,
              phone: row.phone || row.Phone,
              email: row.email || row.Email,
              idNumber: row.idNumber || row['ID Number'],
              kraPin: row.kraPin || row['KRA PIN'],
              county: row.county || row.County,
              physicalAddress: row.address || row.Address,
            },
          });
          imported++;
        }
        break;

      case 'leads':
        for (const row of records) {
          await prisma.lead.create({
            data: {
              companyId,
              title: row.title || row.Title,
              source: row.source || row.Source,
              estimatedValue: parseFloat(row.estimatedValue || row['Estimated Value'] || '0'),
              notes: row.notes || row.Notes,
            },
          });
          imported++;
        }
        break;

      case 'inventory':
        for (const row of records) {
          const costPrice = Number(
            String(row.costPrice || row['Cost Price'] || '0')
              .replace(/,/g, '')
              .replace(/"/g, '')
          );

          const sellingPrice = Number(
            String(row.sellingPrice || row['Selling Price'] || '0')
              .replace(/,/g, '')
              .replace(/"/g, '')
          );

          const chassisNumber = row.chassisNumber || row['Chassis Number'] || '';
          const serialNumber = row.serialNumber || row['Serial Number'] || chassisNumber;

          if (chassisNumber) {
            const existing = await prisma.machineryUnit.findFirst({
              where: { companyId, chassisNumber },
            });
            if (existing) {
              console.log(`Skipping duplicate chassis number: ${chassisNumber}`);
              continue;
            }
          }

          await prisma.machineryUnit.create({
            data: {
              companyId,
              productName: row.productName || row['Product Name'] || 'Unknown Unit',
              category: (row.category || row.Category || 'TRACTOR').toUpperCase() as any,
              brand: row.brand || row.Brand || 'Generic',
              model: row.model || row.Model || '',
              chassisNumber,
              engineNumber: row.engineNumber || row['Engine Number'] || '',
              serialNumber,
              costPrice: isNaN(costPrice) ? 0 : costPrice,
              sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
            },
          });

          imported++;
        }
        break;
  
      case 'spare-parts':
        for (const row of records) {
          await prisma.sparePart.create({
            data: {
              companyId,
              partNumber: row.partNumber || row['Part Number'],
              partName: row.partName || row['Part Name'],
              category: row.category || row.Category || 'General',
              supplier: row.supplier || row.Supplier,
              quantity: parseInt(row.quantity || row.Quantity || '0', 10),
              costPrice: parseFloat(row.costPrice || row['Cost Price'] || '0'),
              sellingPrice: parseFloat(row.sellingPrice || row['Selling Price'] || '0'),
              reorderLevel: parseInt(row.reorderLevel || row['Reorder Level'] || '10', 10),
            },
          });
          imported++;
        }
        break;

      default:
        throw new Error(`Import not supported for entity: ${entity}`);
    }

    await prisma.importExportJob.update({
      where: { id: job.id },
      data: { status: 'COMPLETED', recordCount: imported, completedAt: new Date() },
    });

    return { jobId: job.id, imported };
  } catch (error) {
    await prisma.importExportJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        errorLog: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

export async function exportData(
  companyId: string,
  entity: EntityType,
  format: 'csv' | 'xlsx',
  createdBy?: string
): Promise<string> {
  const job = await prisma.importExportJob.create({
    data: {
      companyId,
      type: 'EXPORT',
      entity,
      format,
      status: 'PROCESSING',
      createdBy,
    },
  });

  let data: Record<string, unknown>[] = [];

  switch (entity) {
    case 'customers':
      data = await prisma.customer.findMany({ where: { companyId } });
      break;
    case 'leads':
      data = await prisma.lead.findMany({ where: { companyId } });
      break;
    case 'inventory':
      data = await prisma.machineryUnit.findMany({ where: { companyId } });
      break;
    case 'spare-parts':
      data = await prisma.sparePart.findMany({ where: { companyId } });
      break;
    case 'invoices':
      data = await prisma.invoice.findMany({ where: { companyId } });
      break;
  }

  const exportDir = `${process.cwd()}/uploads/exports`;
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  const fileName = `${entity}-${Date.now()}.${format}`;
  const filePath = `${exportDir}/${fileName}`;

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entity);
    XLSX.writeFile(workbook, filePath);
  } else {
    const csv = stringify(data, { header: true });
    fs.writeFileSync(filePath, csv);
  }

  await prisma.importExportJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      fileUrl: `/uploads/exports/${fileName}`,
      recordCount: data.length,
      completedAt: new Date(),
    },
  });

  return `/uploads/exports/${fileName}`;
}
