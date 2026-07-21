import prisma from '../config/database';

export async function getNextBookingNumber(companyId: string): Promise<string> {
  const count = await prisma.carHireBooking.count({ where: { companyId } });
  const year = new Date().getFullYear();
  return `JBK-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Checks if a vehicle is available for a given period.
 * Excludes overlapping bookings. Also checks if vehicle is in Available status.
 */
export async function checkVehicleAvailability(
  companyId: string,
  vehicleId: string,
  pickupDate: Date,
  returnDate: Date,
  excludeBookingId?: string
): Promise<boolean> {
  // 1. Fetch the vehicle
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, companyId },
  });

  if (!vehicle) return false;

  // If vehicle is explicitly in maintenance, retired, out of service, etc. it is not available.
  const unavailableStatuses = ['Maintenance', 'Service', 'Accident', 'OutOfService', 'Retired', 'On Hire'];
  if (unavailableStatuses.includes(vehicle.status)) {
    return false;
  }

  // 2. Check overlapping bookings
  // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
  const overlappingBookings = await prisma.carHireBooking.findMany({
    where: {
      companyId,
      vehicleId,
      status: { notIn: ['Cancelled', 'NoShow', 'Completed'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { pickupDate: { lte: returnDate } },
        {
          OR: [
            { returnDate: null },
            { returnDate: { gte: pickupDate } },
          ],
        },
      ],
    },
  });

  return overlappingBookings.length === 0;
}

/**
 * Checks if a driver is available for a given period.
 */
export async function checkDriverAvailability(
  companyId: string,
  driverId: string,
  pickupDate: Date,
  returnDate: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const driver = await prisma.driver.findFirst({
    where: { id: driverId, companyId },
  });

  if (!driver) return false;

  if (['OffDuty', 'Leave'].includes(driver.status)) {
    return false;
  }

  const overlappingBookings = await prisma.carHireBooking.findMany({
    where: {
      companyId,
      driverId,
      status: { notIn: ['Cancelled', 'NoShow', 'Completed'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { pickupDate: { lte: returnDate } },
        {
          OR: [
            { returnDate: null },
            { returnDate: { gte: pickupDate } },
          ],
        },
      ],
    },
  });

  return overlappingBookings.length === 0;
}

/**
 * Returns all vehicles available during the specified period.
 */
export async function getAvailableVehicles(
  companyId: string,
  pickupDate: Date,
  returnDate: Date,
  excludeBookingId?: string
): Promise<any[]> {
  // Get all vehicles that are not in explicit unavailable status
  const candidateVehicles = await prisma.vehicle.findMany({
    where: {
      companyId,
      status: { notIn: ['Maintenance', 'Service', 'Accident', 'OutOfService', 'Retired'] },
    },
  });

  // Filter overlapping bookings
  const overlappingBookings = await prisma.carHireBooking.findMany({
    where: {
      companyId,
      status: { notIn: ['Cancelled', 'NoShow', 'Completed'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { pickupDate: { lte: returnDate } },
        {
          OR: [
            { returnDate: null },
            { returnDate: { gte: pickupDate } },
          ],
        },
      ],
    },
    select: { vehicleId: true },
  });

  const bookedVehicleIds = new Set(overlappingBookings.map((b) => b.vehicleId));
  return candidateVehicles.filter((v) => !bookedVehicleIds.has(v.id));
}

/**
 * Returns all drivers available during the specified period.
 */
export async function getAvailableDrivers(
  companyId: string,
  pickupDate: Date,
  returnDate: Date,
  excludeBookingId?: string
): Promise<any[]> {
  const candidateDrivers = await prisma.driver.findMany({
    where: {
      companyId,
      status: { notIn: ['OffDuty', 'Leave'] },
    },
  });

  const overlappingBookings = await prisma.carHireBooking.findMany({
    where: {
      companyId,
      status: { notIn: ['Cancelled', 'NoShow', 'Completed'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { pickupDate: { lte: returnDate } },
        {
          OR: [
            { returnDate: null },
            { returnDate: { gte: pickupDate } },
          ],
        },
      ],
    },
    select: { driverId: true },
  });

  const bookedDriverIds = new Set(overlappingBookings.map((b) => b.driverId).filter(Boolean));
  return candidateDrivers.filter((d) => !bookedDriverIds.has(d.id));
}

/**
 * Performs flexible pricing calculation based on rates, dates, coupon codes, and optional extras.
 */
export function calculateRentalPrice(
  vehicle: any,
  pickupDate: Date,
  returnDate: Date,
  rentalType: string,
  extras: Record<string, boolean | number | string>,
  promoCode?: string
): {
  durationDays: number;
  baseRate: number;
  rateApplied: string;
  subtotal: number;
  extrasTotal: number;
  discountAmount: number;
  totalCharges: number;
  depositRequired: number;
} {
  const diffTime = Math.abs(returnDate.getTime() - pickupDate.getTime());
  const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let baseRate = Number(vehicle.dailyRate || 0);
  let rateApplied = 'daily';

  // Apply weekly or monthly tiers if applicable
  if (durationDays >= 30 && Number(vehicle.monthlyRate || 0) > 0) {
    baseRate = Number(vehicle.monthlyRate);
    rateApplied = 'monthly';
  } else if (durationDays >= 7 && Number(vehicle.weeklyRate || 0) > 0) {
    baseRate = Number(vehicle.weeklyRate);
    rateApplied = 'weekly';
  }

  // Calculate base cost
  let subtotal = 0;
  if (rateApplied === 'monthly') {
    // Pro-rate monthly rate
    subtotal = (baseRate / 30) * durationDays;
  } else if (rateApplied === 'weekly') {
    // Pro-rate weekly rate
    subtotal = (baseRate / 7) * durationDays;
  } else {
    subtotal = baseRate * durationDays;
  }

  // 1. Check for Weekend Pricing
  // If rental period contains Saturdays/Sundays, apply a 10% premium to those days
  let weekendDays = 0;
  const tempDate = new Date(pickupDate);
  while (tempDate <= returnDate) {
    const day = tempDate.getDay();
    if (day === 0 || day === 6) {
      weekendDays++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  if (weekendDays > 0) {
    // Premium of 15% on weekend days
    const weekendPremium = (baseRate * 0.15) * weekendDays;
    subtotal += weekendPremium;
  }

  // 2. Extras Calculation
  let extrasTotal = 0;
  const standardExtraPrices: Record<string, number> = {
    gps: 500,           // KES per day
    babySeat: 300,      // KES per day
    wifi: 400,          // KES per day
    driver: 2000,       // KES per day
    additionalDriver: 1000, // KES flat
    airportPickup: 2500,    // KES flat
    insuranceUpgrade: 1000, // KES per day
    cleaningFee: 1500,  // KES flat
  };

  Object.entries(extras).forEach(([key, val]) => {
    if (val && standardExtraPrices[key] !== undefined) {
      const price = standardExtraPrices[key];
      const isDaily = ['gps', 'babySeat', 'wifi', 'driver', 'insuranceUpgrade'].includes(key);
      if (isDaily) {
        extrasTotal += price * durationDays;
      } else {
        extrasTotal += price;
      }
    }
  });

  // Hand-entered specific penalty charges/late fees or custom extras can be passed as numbers
  if (typeof extras.lateReturnFee === 'number') extrasTotal += extras.lateReturnFee;
  if (typeof extras.damageFee === 'number') extrasTotal += extras.damageFee;
  if (typeof extras.extraMileageCharge === 'number') extrasTotal += extras.extraMileageCharge;
  if (typeof extras.penaltyCharges === 'number') extrasTotal += extras.penaltyCharges;

  // 3. Discount codes / Promos
  let discountAmount = 0;
  if (promoCode) {
    const code = promoCode.toUpperCase();
    if (code === 'JOLU10') {
      discountAmount = subtotal * 0.10; // 10% off base
    } else if (code === 'FREEDAY' && durationDays > 1) {
      discountAmount = baseRate; // 1 day free
    } else if (code === 'CORPORATE' && rentalType === 'Corporate') {
      discountAmount = subtotal * 0.15; // 15% off corporate
    }
  }

  // Automatic volume discounts (e.g. 5% for > 5 days)
  if (durationDays > 5 && !discountAmount) {
    discountAmount = subtotal * 0.05;
  }

  const totalCharges = Math.max(0, subtotal + extrasTotal - discountAmount);
  const depositRequired = Number(vehicle.depositRequired || 0);

  return {
    durationDays,
    baseRate,
    rateApplied,
    subtotal: Math.round(subtotal * 100) / 100,
    extrasTotal: Math.round(extrasTotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
    depositRequired,
  };
}
