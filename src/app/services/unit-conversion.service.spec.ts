import { vi, describe, beforeEach, it, expect } from 'vitest';
import { UnitConversionService } from './unit-conversion.service';
import { UserSettings, DEFAULT_SETTINGS } from '../models/interfaces';

describe('UnitConversionService', () => {
  let service: UnitConversionService;

  beforeEach(() => {
    service = new UnitConversionService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Weight Conversion', () => {
    it('should return the same weight when in kg mode', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, weightUnit: 'kg' });
      expect(service.kgToUser(100)).toBe(100);
      expect(service.userToKg(100)).toBe(100);
    });

    it('should convert kg to lb correctly', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, weightUnit: 'lb' });
      // 100 kg = 220.462 lbs -> rounds to 220.5 (1 decimal default)
      expect(service.kgToUser(100)).toBe(220.5);
    });

    it('should convert lb to kg correctly', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, weightUnit: 'lb' });
      // 220.5 lbs / 2.20462 = 100.017 -> rounds to 100.0
      expect(service.userToKg(220.5)).toBe(100);
    });

    it('should calculate progression increments properly', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, weightUnit: 'lb' });
      // Base is 100kg. In lbs that is 220.5 lbs. We want to add 5 lbs increment.
      // New target is 225.5 lbs. Convert back to kg -> 225.5 / 2.20462 = 102.28 -> 102.3 kg
      const newBaseKg = service.addIncrementToBaseWeight(100, 5);
      expect(newBaseKg).toBe(102.3);
    });
  });

  describe('Distance Conversion', () => {
    it('should convert meters to km when in km mode', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, distanceUnit: 'km' });
      expect(service.metersToUser(1500)).toBe(1.5); // 1.5 km
    });

    it('should convert km to meters', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, distanceUnit: 'km' });
      expect(service.userToMeters(1.5)).toBe(1500);
    });

    it('should convert meters to miles when in mi mode', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, distanceUnit: 'mi' });
      // 1609.34 meters = 1 mile
      expect(service.metersToUser(1609.34)).toBe(1);
    });

    it('should convert miles to meters', () => {
      service.currentSettings.set({ ...DEFAULT_SETTINGS, distanceUnit: 'mi' });
      expect(service.userToMeters(1)).toBe(1609); // rounded to 0 decimals for meters
    });
  });
});
