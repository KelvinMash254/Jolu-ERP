import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import {
  getNextBookingNumber,
  checkVehicleAvailability,
  checkDriverAvailability,
  getAvailableVehicles,
  getAvailableDrivers,
  calculateRentalPrice
} from '../services/car-hire.service';
import { createJournalEntry } from '../services/accounting.service';
import { getNextInvoiceNumber } from '../services/invoice.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'car-hire');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype === 'application/pdf' ? '.pdf' : '.png');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

const router = Router();
router.use(authenticate, requireCompany);

// ==========================================
// LIVE AVAILABILITY & PRICING ENDPOINTS
// ==========================================

router.get('/availability', async (req: AuthRequest, res: Response) => {
  try {
    const { pickupDate, returnDate, excludeBookingId } = req.query;
    if (!pickupDate || !returnDate) {
      return res.status(400).json({ error: 'pickupDate and returnDate are required' });
    }

    const pDate = new Date(pickupDate as string);
    const rDate = new Date(returnDate as string);
    const companyId = req.companyId!;

    const vehicles = await getAvailableVehicles(companyId, pDate, rDate, excludeBookingId as string);
    const drivers = await getAvailableDrivers(companyId, pDate, rDate, excludeBookingId as string);

    res.json({ success: true, data: { vehicles, drivers } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/calculate-price', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, pickupDate, returnDate, rentalType, extras, promoCode } = req.body;
    if (!vehicleId || !pickupDate || !returnDate) {
      return res.status(400).json({ error: 'vehicleId, pickupDate, and returnDate are required' });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId: req.companyId! }
    });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const pricing = calculateRentalPrice(
      vehicle,
      new Date(pickupDate),
      new Date(returnDate),
      rentalType || 'SelfDrive',
      extras || {},
      promoCode
    );

    res.json({ success: true, data: pricing });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// VEHICLES ENDPOINTS
// ==========================================

router.get('/vehicles', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId: req.companyId! },
      orderBy: { registrationNumber: 'asc' },
    });
    res.json({ success: true, data: vehicles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vehicles', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: req.companyId!,
        ...req.body
      }
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/vehicles/:id', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: vehicle });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/vehicles/:id', requirePermission('inventory', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DRIVERS ENDPOINTS
// ==========================================

router.get('/drivers', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { companyId: req.companyId! },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: drivers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/drivers', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const driver = await prisma.driver.create({
      data: {
        companyId: req.companyId!,
        ...req.body,
        licenseExpiry: new Date(req.body.licenseExpiry),
        medicalExpiry: req.body.medicalExpiry ? new Date(req.body.medicalExpiry) : null,
      }
    });
    res.status(201).json({ success: true, data: driver });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/drivers/:id', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.licenseExpiry) data.licenseExpiry = new Date(data.licenseExpiry);
    if (data.medicalExpiry !== undefined) data.medicalExpiry = data.medicalExpiry ? new Date(data.medicalExpiry) : null;

    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, data: driver });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/drivers/:id', requirePermission('inventory', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// BOOKINGS ENDPOINTS
// ==========================================

const getBookingsList = async (companyId: string) => {
  return prisma.carHireBooking.findMany({
    where: { companyId },
    include: {
      vehicle: true,
      driver: true,
      customer: { select: { id: true, name: true, phone: true } },
      inspections: true,
      returns: true
    },
    orderBy: { createdAt: 'desc' },
  });
};

router.get('/', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await getBookingsList(req.companyId!);
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bookings', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await getBookingsList(req.companyId!);
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.carHireBooking.findFirst({
      where: { id: req.params.id, companyId: req.companyId! },
      include: {
        vehicle: true,
        driver: true,
        customer: true,
        inspections: true,
        returns: true
      }
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      vehicleId,
      driverId,
      customerName,
      phoneNumber,
      idNumber,
      pickupBranch,
      dropoffBranch,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      rentalType,
      remarks,
      location,
      extras,
      promoCode,
      depositPaid
    } = req.body;

    const companyId = req.companyId!;
    const pDate = new Date(pickupDate);
    const rDate = returnDate ? new Date(returnDate) : pDate;

    // 1. Prevent overlapping double bookings for Vehicle
    const isVehicleAvailable = await checkVehicleAvailability(companyId, vehicleId, pDate, rDate);
    if (!isVehicleAvailable) {
      return res.status(400).json({ error: 'Selected vehicle is already booked, on hire, or under maintenance for overlapping dates.' });
    }

    // 2. Prevent overlapping double bookings for Driver
    if (driverId) {
      const isDriverAvailable = await checkDriverAvailability(companyId, driverId, pDate, rDate);
      if (!isDriverAvailable) {
        return res.status(400).json({ error: 'Selected driver is already assigned or unavailable for overlapping dates.' });
      }
    }

    // 3. Calculate Pricing
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const pricing = calculateRentalPrice(vehicle, pDate, rDate, rentalType || 'SelfDrive', extras || {}, promoCode);

    const bookingNumber = await getNextBookingNumber(companyId);
    const commission = Number(req.body.commission || 0);
    const actualBalance = pricing.totalCharges - commission;
    const balanceDue = actualBalance - Number(depositPaid || 0);

    // 4. Create everything in a transaction with Accounting & Invoice Integration
    const booking = await prisma.$transaction(async (tx) => {
      let resolvedCustomerId = customerId || null;

      if (!resolvedCustomerId && customerName && phoneNumber) {
        // Find or create customer
        let customer = await tx.customer.findFirst({
          where: {
            companyId,
            phone: phoneNumber
          }
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              companyId,
              name: customerName,
              phone: phoneNumber,
              idNumber: idNumber || null,
              isActive: true
            }
          });
        }
        resolvedCustomerId = customer.id;
      }

      const createdBooking = await tx.carHireBooking.create({
        data: {
          companyId,
          bookingNumber,
          customerId: resolvedCustomerId,
          vehicleId,
          driverId: driverId || null,
          customerName,
          phoneNumber,
          idNumber,
          pickupBranch: pickupBranch || 'Head Office',
          dropoffBranch: dropoffBranch || 'Head Office',
          pickupDate: pDate,
          pickupTime: pickupTime || '09:00',
          returnDate: rDate,
          returnTime: returnTime || '17:00',
          rentalDuration: pricing.durationDays,
          rentalType: rentalType || 'SelfDrive',
          status: 'Confirmed', // Create directly as Confirmed to lock availability
          dailyRate: vehicle.dailyRate,
          totalCharges: pricing.totalCharges,
          commission,
          actualBalance,
          depositPaid: depositPaid || 0,
          balanceDue,
          paymentStatus: Number(depositPaid) >= pricing.totalCharges ? 'PAID_IN_FULL' : (Number(depositPaid) > 0 ? 'PARTIAL' : 'PENDING'),
          remarks,
          location,
          pricingDetails: JSON.stringify(pricing),
          optionalExtras: JSON.stringify(extras || {})
        },
        include: { vehicle: true, customer: true, driver: true }
      });

      // Update vehicle status
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'Booked' }
      });

      // Update driver status
      if (driverId) {
        await tx.driver.update({
          where: { id: driverId },
          data: { status: 'Assigned' }
        });
      }

      // Generate invoice for accounting integration under AUTOMOBILE company code
      const invoiceNumber = await getNextInvoiceNumber(companyId, 'INVOICE');
      const subtotal = pricing.subtotal;
      const taxAmount = 0; // Tax is a second option, not autocalculated by default
      const totalAmount = subtotal + taxAmount + pricing.extrasTotal;

      const inv = await tx.invoice.create({
        data: {
          companyId,
          invoiceNumber,
          type: 'INVOICE',
          customerId: resolvedCustomerId,
          subtotal,
          taxAmount,
          totalAmount,
          dueDate: rDate,
          notes: `Vehicle Rental booking ${bookingNumber}. Vehicle: ${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model}).`,
          lines: {
            create: [
              {
                description: `Vehicle Rental Base Fee (${pricing.durationDays} Days @ KES ${Number(pricing.baseRate).toLocaleString()})`,
                quantity: pricing.durationDays,
                unitPrice: pricing.baseRate,
                taxRate: 0,
                total: pricing.subtotal
              },
              ...(pricing.extrasTotal > 0 ? [{
                description: `Optional Rental Extras & Packages Charges`,
                quantity: 1,
                unitPrice: pricing.extrasTotal,
                taxRate: 0,
                total: pricing.extrasTotal
              }] : [])
            ]
          }
        }
      });

      // Double entry journal creation
      const journalLines = [
        { accountCode: '1100', debit: totalAmount, description: `Invoice ${inv.invoiceNumber} (Booking ${bookingNumber})` },
        { accountCode: '4000', credit: subtotal, description: `Car Rental Revenue ${bookingNumber}` },
      ];
      if (taxAmount > 0) {
        journalLines.push({ accountCode: '2100', credit: taxAmount, description: `VAT on Car Hire ${bookingNumber}` });
      }

      const entry = await createJournalEntry(
        companyId,
        `Vehicle Rental Income - ${bookingNumber}`,
        journalLines,
        {
          reference: inv.invoiceNumber,
          sourceType: 'INVOICE',
          sourceId: inv.id,
          tx
        }
      );

      // Link journal to invoice
      await tx.invoice.update({
        where: { id: inv.id },
        data: { journalEntryId: entry.id }
      });

      return createdBooking;
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, remarks, returnDate, location, paymentStatus, depositPaid } = req.body;

    const currentBooking = await prisma.carHireBooking.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true }
    });
    if (!currentBooking) return res.status(404).json({ error: 'Booking not found' });

    const updateData: any = {
      status,
      remarks,
      location,
      paymentStatus
    };

    if (returnDate) updateData.returnDate = new Date(returnDate);
    if (depositPaid !== undefined) {
      updateData.depositPaid = depositPaid;
      updateData.balanceDue = Number(currentBooking.totalCharges) - Number(depositPaid);
    }

    const booking = await prisma.carHireBooking.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Handle vehicle/driver status updates based on booking status
    if (status === 'Completed') {
      await prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'Available' }
      });
      if (booking.driverId) {
        await prisma.driver.update({
          where: { id: booking.driverId },
          data: { status: 'Available' }
        });
      }
    } else if (status === 'Cancelled' || status === 'NoShow') {
      await prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'Available' }
      });
      if (booking.driverId) {
        await prisma.driver.update({
          where: { id: booking.driverId },
          data: { status: 'Available' }
        });
      }
    } else if (status === 'Active' || status === 'PickedUp') {
      await prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'On Hire' }
      });
    }

    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/upload-docs', requirePermission('inventory', 'update'), upload.fields([
  { name: 'signedContract', maxCount: 1 },
  { name: 'clientIdCard', maxCount: 1 },
  { name: 'clientPhoto', maxCount: 1 }
]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const updateData: Record<string, string> = {};
    if (files) {
      if (files.signedContract?.[0]) {
        updateData.signedContractUrl = `/uploads/car-hire/${files.signedContract[0].filename}`;
      }
      if (files.clientIdCard?.[0]) {
        updateData.clientIdCardUrl = `/uploads/car-hire/${files.clientIdCard[0].filename}`;
      }
      if (files.clientPhoto?.[0]) {
        updateData.clientPhotoUrl = `/uploads/car-hire/${files.clientPhoto[0].filename}`;
      }
    }

    const booking = await prisma.carHireBooking.update({
      where: { id },
      data: updateData,
      include: { vehicle: true, customer: true }
    });

    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// INSPECTIONS ENDPOINTS
// ==========================================

router.post('/:id/pickup', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { fuelLevel, mileageOut, bodyCondition, tyreCondition, accessories, photos, driverSignature, customerSignature, notes } = req.body;

    const inspection = await prisma.$transaction(async (tx) => {
      const inspect = await tx.vehicleInspection.create({
        data: {
          bookingId,
          fuelLevel,
          mileageOut: Number(mileageOut),
          bodyCondition,
          tyreCondition,
          accessories,
          photos,
          driverSignature,
          customerSignature,
          notes
        }
      });

      // Update vehicle mileage and status
      const booking = await tx.carHireBooking.update({
        where: { id: bookingId },
        data: { status: 'PickedUp' }
      });

      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { mileage: Number(mileageOut), status: 'On Hire' }
      });

      return inspect;
    });

    res.status(201).json({ success: true, data: inspection });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/return', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { fuelReturned, mileageIn, bodyCondition, tyreCondition, additionalCharges, lateFees, cleaningCharges, depositRefundStatus, photos, signature, notes } = req.body;

    const returnInspect = await prisma.$transaction(async (tx) => {
      const ret = await tx.returnInspection.create({
        data: {
          bookingId,
          fuelReturned,
          mileageIn: Number(mileageIn),
          bodyCondition,
          tyreCondition,
          additionalCharges: Number(additionalCharges || 0),
          lateFees: Number(lateFees || 0),
          cleaningCharges: Number(cleaningCharges || 0),
          depositRefundStatus,
          photos,
          signature,
          notes
        }
      });

      // Calculate total additional cost
      const additionalTotal = Number(additionalCharges || 0) + Number(lateFees || 0) + Number(cleaningCharges || 0);

      const booking = await tx.carHireBooking.findUnique({
        where: { id: bookingId }
      });
      if (!booking) throw new Error('Booking not found');

      const updatedCharges = Number(booking.totalCharges) + additionalTotal;
      const updatedBalance = Number(booking.balanceDue) + additionalTotal;

      await tx.carHireBooking.update({
        where: { id: bookingId },
        data: {
          status: 'Completed',
          totalCharges: updatedCharges,
          balanceDue: updatedBalance
        }
      });

      // Reset vehicle & driver
      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { mileage: Number(mileageIn), status: 'Available' }
      });

      if (booking.driverId) {
        await tx.driver.update({
          where: { id: booking.driverId },
          data: { status: 'Available' }
        });
      }

      return ret;
    });

    res.status(201).json({ success: true, data: returnInspect });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// MAINTENANCE ENDPOINTS
// ==========================================

router.get('/maintenance', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.vehicleMaintenance.findMany({
      where: { vehicle: { companyId: req.companyId! } },
      include: { vehicle: true },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/maintenance', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, type, cost, date, mileageAtService, status, notes } = req.body;

    const record = await prisma.$transaction(async (tx) => {
      const rec = await tx.vehicleMaintenance.create({
        data: {
          vehicleId,
          type,
          cost: Number(cost),
          date: new Date(date),
          mileageAtService: Number(mileageAtService || 0),
          status,
          notes
        }
      });

      // Lock vehicle status to Maintenance if in progress or scheduled
      if (status === 'InProgress' || status === 'Scheduled') {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: 'Maintenance' }
        });
      } else if (status === 'Completed' || status === 'Cancelled') {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: 'Available' }
        });
      }

      return rec;
    });

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DASHBOARD & REPORTS ENDPOINTS
// ==========================================

router.get('/dashboard', requirePermission('dashboard', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Vehicle counts by status
    const vehicles = await prisma.vehicle.findMany({ where: { companyId } });
    const availableCount = vehicles.filter(v => v.status === 'Available').length;
    const onHireCount = vehicles.filter(v => v.status === 'On Hire').length;
    const reservedCount = vehicles.filter(v => v.status === 'Reserved').length;
    const maintenanceCount = vehicles.filter(v => v.status === 'Maintenance' || v.status === 'Service').length;

    // 2. Booking pickups and returns today
    const bookings = await prisma.carHireBooking.findMany({
      where: { companyId },
      include: { vehicle: true, customer: true }
    });

    const todayPickups = bookings.filter(b => {
      const d = new Date(b.pickupDate);
      return d >= today && d < tomorrow;
    });

    const todayReturns = bookings.filter(b => {
      if (!b.returnDate) return false;
      const d = new Date(b.returnDate);
      return d >= today && d < tomorrow;
    });

    // 3. Revenues Today & Month
    let revenueToday = 0;
    let revenueMonth = 0;
    let outstandingPayments = 0;

    bookings.forEach(b => {
      const pickDate = new Date(b.pickupDate);
      const total = Number(b.totalCharges || 0);
      const balance = Number(b.balanceDue || 0);

      outstandingPayments += balance;

      if (pickDate >= today && pickDate < tomorrow) {
        revenueToday += total;
      }
      if (pickDate >= firstDayMonth) {
        revenueMonth += total;
      }
    });

    // 4. Fleet Utilization % (On Hire / Total Available Vehicles)
    const totalFleetCount = vehicles.length || 1;
    const utilizationRate = Math.round((onHireCount / totalFleetCount) * 100);

    // 5. Avg duration
    let totalDuration = 0;
    const completedOrActive = bookings.filter(b => b.status === 'Completed' || b.status === 'Active' || b.status === 'PickedUp');
    completedOrActive.forEach(b => {
      totalDuration += b.rentalDuration || 1;
    });
    const avgDuration = completedOrActive.length ? Math.round(totalDuration / completedOrActive.length) : 0;

    // 6. Most rented vehicle
    const rentalFrequency: Record<string, number> = {};
    bookings.forEach(b => {
      rentalFrequency[b.vehicleId] = (rentalFrequency[b.vehicleId] || 0) + 1;
    });
    let mostRentedId = '';
    let maxRentals = 0;
    Object.entries(rentalFrequency).forEach(([vid, count]) => {
      if (count > maxRentals) {
        maxRentals = count;
        mostRentedId = vid;
      }
    });
    const mostRentedVehicle = vehicles.find(v => v.id === mostRentedId) || null;

    res.json({
      success: true,
      data: {
        kpis: {
          available: availableCount,
          onHire: onHireCount,
          reserved: reservedCount,
          maintenance: maintenanceCount,
          todayPickups: todayPickups.length,
          todayReturns: todayReturns.length,
          revenueToday,
          revenueMonth,
          utilization: utilizationRate,
          avgDuration,
          outstandingPayments
        },
        mostRentedVehicle,
        todayPickupsList: todayPickups,
        todayReturnsList: todayReturns
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports', requirePermission('dashboard', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId!;
    const bookings = await prisma.carHireBooking.findMany({
      where: { companyId },
      include: { vehicle: true, customer: true, returns: true }
    });

    const maintenance = await prisma.vehicleMaintenance.findMany({
      where: { vehicle: { companyId } },
      include: { vehicle: true }
    });

    // Gather late returns (returns where return inspection date > returnDate + small grace or lateFees > 0)
    const lateReturns = bookings.filter(b => {
      const inspect = b.returns?.[0];
      return inspect && Number(inspect.lateFees || 0) > 0;
    });

    // Gather damage reports
    const damageReports = bookings.filter(b => {
      const inspect = b.returns?.[0];
      return inspect && Number(inspect.additionalCharges || 0) > 0;
    });

    res.json({
      success: true,
      data: {
        bookingsCount: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + Number(b.totalCharges || 0), 0),
        totalMaintenanceCost: maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0),
        lateReturnsCount: lateReturns.length,
        damageReportsCount: damageReports.length,
        maintenanceList: maintenance,
        lateReturnsList: lateReturns,
        damageReportsList: damageReports
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
