import { describe, it, expect } from 'bun:test';
import { overtimeEntrySchema } from '../../lib/validations';

describe('Validations', () => {
  describe('overtimeEntrySchema', () => {
    it('should validate a valid entry with direct hours', () => {
      const validData = {
        date: '2025-02-17',
        type: 'worked' as const,
        hours: 2.5,
      };

      const result = overtimeEntrySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate a valid entry with start and end time', () => {
      const validData = {
        date: '2025-02-17',
        type: 'worked' as const,
        startTime: '08:00',
        endTime: '10:30',
      };

      const result = overtimeEntrySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate entry with description', () => {
      const validData = {
        date: '2025-02-17',
        type: 'used' as const,
        hours: 4,
        description: 'Projeto urgente',
      };

      const result = overtimeEntrySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject entry without date', () => {
      const invalidData = {
        type: 'worked' as const,
        hours: 2,
      };

      const result = overtimeEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject entry with invalid type', () => {
      const invalidData = {
        date: '2025-02-17',
        type: 'invalid',
        hours: 2,
      };

      const result = overtimeEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject entry without hours or time', () => {
      const invalidData = {
        date: '2025-02-17',
        type: 'worked' as const,
      };

      const result = overtimeEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject entry with invalid time format', () => {
      const invalidData = {
        date: '2025-02-17',
        type: 'worked' as const,
        startTime: '8:00',
        endTime: '10:30',
      };

      const result = overtimeEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject entry where endTime is before startTime', () => {
      const invalidData = {
        date: '2025-02-17',
        type: 'worked' as const,
        startTime: '10:30',
        endTime: '08:00',
      };

      const result = overtimeEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject entry with description too long', () => {
      const invalidData = {
        date: '2025-02-17',
        type: 'worked' as const,
        hours: 2,
        description: 'a'.repeat(501),
      };

      const result = overtimeEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
