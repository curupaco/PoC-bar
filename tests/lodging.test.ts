import { describe, it, expect } from 'vitest';
import { calculateBilledBlocks } from '../src/features/lodging/LodgingDashboard';

describe('Lodging Billing Calculations', () => {
  describe('calculateBilledBlocks', () => {
    // Increment: 30 minutes, Grace: 5 minutes
    const increment30 = 30;
    const grace5 = 5;

    it('should charge at least 1 block for very short durations', () => {
      expect(calculateBilledBlocks(1, increment30, grace5)).toBe(1);
      expect(calculateBilledBlocks(5, increment30, grace5)).toBe(1);
      expect(calculateBilledBlocks(15, increment30, grace5)).toBe(1);
    });

    it('should charge exactly 1 block for durations up to the increment', () => {
      expect(calculateBilledBlocks(30, increment30, grace5)).toBe(1);
    });

    it('should apply grace period and not charge an extra block if within grace', () => {
      expect(calculateBilledBlocks(31, increment30, grace5)).toBe(1);
      expect(calculateBilledBlocks(34, increment30, grace5)).toBe(1);
      expect(calculateBilledBlocks(35, increment30, grace5)).toBe(1);
    });

    it('should charge an extra block if exceeding the grace period', () => {
      expect(calculateBilledBlocks(36, increment30, grace5)).toBe(2);
      expect(calculateBilledBlocks(45, increment30, grace5)).toBe(2);
      expect(calculateBilledBlocks(60, increment30, grace5)).toBe(2);
    });

    it('should scale to multiple blocks applying grace period correctly', () => {
      // 60 minutes is exactly 2 blocks.
      // Up to 65 minutes should still be 2 blocks (grace applied).
      expect(calculateBilledBlocks(61, increment30, grace5)).toBe(2);
      expect(calculateBilledBlocks(65, increment30, grace5)).toBe(2);
      // 66 minutes exceeds grace, so it charges 3 blocks.
      expect(calculateBilledBlocks(66, increment30, grace5)).toBe(3);
    });

    // Custom configuration: Increment: 15 minutes, Grace: 2 minutes
    const increment15 = 15;
    const grace2 = 2;

    it('should work correctly with custom increments and grace periods', () => {
      expect(calculateBilledBlocks(10, increment15, grace2)).toBe(1);
      expect(calculateBilledBlocks(15, increment15, grace2)).toBe(1);
      expect(calculateBilledBlocks(17, increment15, grace2)).toBe(1); // within 2min grace
      expect(calculateBilledBlocks(18, increment15, grace2)).toBe(2); // exceeds grace
      expect(calculateBilledBlocks(32, increment15, grace2)).toBe(2); // within 2min grace (30 + 2)
      expect(calculateBilledBlocks(33, increment15, grace2)).toBe(3); // exceeds grace (30 + 3)
    });
  });
});
