import prisma from '../config/database';
import { PaymentStatus, VehicleStatus } from '@prisma/client';

export async function getNextBookingNumber(companyId: string): Promise<string> {
  const count = await prisma.carHireBooking.count({ where: { companyId } });
  const year = new Date().getFullYear();
  return `JBK-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function createBooking(companyId: string, data: any) {
  const bookingNumber = await getNextBookingNumber(companyId);
  const totalCharges = Number(data.dailyRate) * 1; // Simplification, should calculate days
  const balanceDue = totalCharges - Number(data.depositPaid || 0);

  return prisma.carHireBooking.create({
    data: {
      companyId,
      bookingNumber,
      ...data,
      totalCharges,
      balanceDue,
    },
    include: {
      vehicle: true,
      customer: true,
    },
  });
}

export async function updateBooking(id: string, data: any) {
  if (data.dailyRate || data.depositPaid) {
    // Recalculate charges if needed
  }

  return prisma.carHireBooking.update({
    where: { id },
    data,
    include: {
      vehicle: true,
      customer: true,
    },
  });
}
