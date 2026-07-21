import { calculateRentalPrice } from '../src/services/car-hire.service';

describe('Car Hire Service - Pricing Engine', () => {
  const dummyVehicle = {
    dailyRate: 5000,
    weeklyRate: 30000,
    monthlyRate: 100000,
    depositRequired: 15000
  };

  it('should calculate basic daily rental price correctly', () => {
    const pickupDate = new Date('2026-08-10T09:00:00Z'); // Monday
    const returnDate = new Date('2026-08-13T09:00:00Z'); // Thursday
    const result = calculateRentalPrice(
      dummyVehicle,
      pickupDate,
      returnDate,
      'SelfDrive',
      {}
    );

    expect(result.durationDays).toBe(3);
    expect(result.baseRate).toBe(5000);
    expect(result.rateApplied).toBe('daily');
    expect(result.subtotal).toBe(15000);
    expect(result.extrasTotal).toBe(0);
    expect(result.totalCharges).toBe(15000);
    expect(result.depositRequired).toBe(15000);
  });

  it('should apply weekend premium for rentals containing Saturdays or Sundays', () => {
    const pickupDate = new Date('2026-08-14T09:00:00Z'); // Friday
    const returnDate = new Date('2026-08-16T09:00:00Z'); // Sunday (includes Sat & Sun: 2 weekend days)
    const result = calculateRentalPrice(
      dummyVehicle,
      pickupDate,
      returnDate,
      'SelfDrive',
      {}
    );

    // 2 days of base KES 5000 = 10000
    // plus 15% surcharge per weekend day = 5000 * 0.15 * 2 = 1500
    // Total subtotal = 11500
    expect(result.durationDays).toBe(2);
    expect(result.subtotal).toBe(11500);
    expect(result.totalCharges).toBe(11500);
  });

  it('should calculate optional extras correctly', () => {
    const pickupDate = new Date('2026-08-10T09:00:00Z'); // Monday
    const returnDate = new Date('2026-08-12T09:00:00Z'); // Wednesday
    const extras = {
      gps: true,       // KES 500/day * 2 = 1000
      cleaningFee: true // KES 1500 flat
    };
    const result = calculateRentalPrice(
      dummyVehicle,
      pickupDate,
      returnDate,
      'SelfDrive',
      extras
    );

    expect(result.durationDays).toBe(2);
    expect(result.subtotal).toBe(10000);
    expect(result.extrasTotal).toBe(2500);
    expect(result.totalCharges).toBe(12500);
  });

  it('should apply promo code discount correctly', () => {
    const pickupDate = new Date('2026-08-10T09:00:00Z'); // Monday
    const returnDate = new Date('2026-08-15T09:00:00Z'); // Saturday (5 days)
    const result = calculateRentalPrice(
      dummyVehicle,
      pickupDate,
      returnDate,
      'SelfDrive',
      {},
      'JOLU10'
    );

    // 5 weekdays = 25000 (includes Sat -> Friday/Saturday contains weekend surcharge of 15% on 1 day if we calculate inclusive)
    // Discount is 10% of subtotal
    expect(result.discountAmount).toBeGreaterThan(0);
    expect(result.totalCharges).toBeLessThan(result.subtotal);
  });
});
