import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import { getNextBookingNumber } from '../services/car-hire.service';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const bookings = await prisma.carHireBooking.findMany({
    where: { companyId: req.companyId! },
    include: {
      vehicle: true,
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: bookings });
});

router.post('/', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  const {
    customerId,
    vehicleId,
    customerName,
    phoneNumber,
    idNumber,
    driverAssigned,
    pickupDate,
    returnDate,
    destination,
    dailyRate,
    depositPaid,
    remarks
  } = req.body;

  const bookingNumber = await getNextBookingNumber(req.companyId!);

  // Calculate total charges based on days
  const start = new Date(pickupDate);
  const end = returnDate ? new Date(returnDate) : start;
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalCharges = Number(dailyRate) * days;
  const balanceDue = totalCharges - Number(depositPaid || 0);

  const booking = await prisma.carHireBooking.create({
    data: {
      companyId: req.companyId!,
      bookingNumber,
      customerId,
      vehicleId,
      customerName,
      phoneNumber,
      idNumber,
      driverAssigned,
      pickupDate: new Date(pickupDate),
      returnDate: returnDate ? new Date(returnDate) : null,
      destination,
      dailyRate,
      totalCharges,
      depositPaid: depositPaid || 0,
      balanceDue,
      paymentStatus: Number(depositPaid) >= totalCharges ? 'PAID_IN_FULL' : (Number(depositPaid) > 0 ? 'PARTIAL' : 'PENDING'),
      vehicleStatus: 'OUT_ON_HIRE',
      remarks
    },
    include: { vehicle: true, customer: true }
  });

  // Update vehicle status
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { stockStatus: 'SOLD' } // Re-using SOLD as 'unavailable' for now or should add HIRED status
  });

  res.status(201).json({ success: true, data: booking });
});

router.patch('/:id', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  const { paymentStatus, vehicleStatus, remarks, returnDate } = req.body;

  const booking = await prisma.carHireBooking.update({
    where: { id: req.params.id },
    data: {
      paymentStatus,
      vehicleStatus,
      remarks,
      returnDate: returnDate ? new Date(returnDate) : undefined
    }
  });

  if (vehicleStatus === 'RETURNED') {
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { stockStatus: 'IN_STOCK' }
    });
  }

  res.json({ success: true, data: booking });
});

export default router;
