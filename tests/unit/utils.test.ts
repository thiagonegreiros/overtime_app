import { describe, it, expect } from 'bun:test';
import { calculateHours, formatHours, calculateAvailableDays, calculateBalance } from '../../lib/utils';

describe('Utils', () => {
  describe('calculateHours', () => {
    it('should calculate hours correctly for same day times', () => {
      expect(calculateHours('08:00', '10:00')).toBe(2);
      expect(calculateHours('09:30', '12:00')).toBe(2.5);
      expect(calculateHours('14:15', '18:45')).toBe(4.5);
    });

    it('should handle edge cases', () => {
      expect(calculateHours('00:00', '01:00')).toBe(1);
      expect(calculateHours('23:00', '23:30')).toBe(0.5);
    });

    it('should calculate fractional hours correctly', () => {
      expect(calculateHours('08:00', '08:15')).toBe(0.25);
      expect(calculateHours('10:00', '10:45')).toBe(0.75);
    });
  });

  describe('formatHours', () => {
    it('should format whole hours', () => {
      expect(formatHours(1)).toBe('1h');
      expect(formatHours(8)).toBe('8h');
      expect(formatHours(10)).toBe('10h');
    });

    it('should format hours with minutes', () => {
      expect(formatHours(1.5)).toBe('1h 30min');
      expect(formatHours(2.25)).toBe('2h 15min');
      expect(formatHours(3.75)).toBe('3h 45min');
    });

    it('should handle edge cases', () => {
      expect(formatHours(0)).toBe('0h');
      expect(formatHours(0.5)).toBe('0h 30min');
      expect(formatHours(0.25)).toBe('0h 15min');
    });

    it('should round minutes correctly', () => {
      expect(formatHours(1.33)).toBe('1h 20min');
      expect(formatHours(2.67)).toBe('2h 40min');
    });
  });

  describe('calculateAvailableDays', () => {
    it('should calculate available days correctly', () => {
      expect(calculateAvailableDays(8)).toBe(1);
      expect(calculateAvailableDays(16)).toBe(2);
      expect(calculateAvailableDays(40)).toBe(5);
    });

    it('should handle fractional days', () => {
      expect(calculateAvailableDays(4)).toBe(0.5);
      expect(calculateAvailableDays(12)).toBe(1.5);
      expect(calculateAvailableDays(20)).toBe(2.5);
    });

    it('should handle zero hours', () => {
      expect(calculateAvailableDays(0)).toBe(0);
    });

    it('should handle negative hours', () => {
      expect(calculateAvailableDays(-8)).toBe(-1);
      expect(calculateAvailableDays(-16)).toBe(-2);
    });
  });

  describe('calculateBalance', () => {
    it('should calculate positive balance', () => {
      expect(calculateBalance(10, 5)).toBe(5);
      expect(calculateBalance(20, 8)).toBe(12);
    });

    it('should calculate negative balance', () => {
      expect(calculateBalance(5, 10)).toBe(-5);
      expect(calculateBalance(8, 20)).toBe(-12);
    });

    it('should calculate zero balance', () => {
      expect(calculateBalance(10, 10)).toBe(0);
      expect(calculateBalance(0, 0)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(calculateBalance(10.5, 3.25)).toBe(7.25);
      expect(calculateBalance(15.75, 8.5)).toBe(7.25);
    });
  });
});
