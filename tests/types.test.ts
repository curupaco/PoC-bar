import { describe, it, expect } from 'vitest';
import { safeFloat, parseCurrencyValue } from '../types';

describe('Financial Utilities', () => {
    describe('safeFloat', () => {
        it('should correctly round floating point numbers to 2 decimal places', () => {
            expect(safeFloat(10.123)).toBe(10.12);
            expect(safeFloat(10.126)).toBe(10.13);
            expect(safeFloat(0.1 + 0.2)).toBe(0.3);
        });
    });

    describe('parseCurrencyValue', () => {
        it('should correctly parse Brazilian currency strings to numbers', () => {
            expect(parseCurrencyValue('1.234,56')).toBe(1234.56);
            expect(parseCurrencyValue('10,00')).toBe(10);
            expect(parseCurrencyValue('0,50')).toBe(0.5);
        });

        it('should return 0 for empty or invalid strings', () => {
            expect(parseCurrencyValue('')).toBe(0);
            expect(parseCurrencyValue('abc')).toBe(0);
        });
    });
});
