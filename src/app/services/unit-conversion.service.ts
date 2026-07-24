import { Injectable, computed, signal, inject } from '@angular/core';
import { UserSettings } from '../models/interfaces';
import { STORAGE_PORT, StoragePort } from '../ports/storage.port';

@Injectable({ providedIn: 'root' })
export class UnitConversionService {
  // Signal of the current user settings — fed by initialize() on app startup
  // and by SettingsComponent on every save.
  public currentSettings = signal<UserSettings | null>(null);
  public settingsLoaded = signal<boolean>(false);

  private storage = inject<StoragePort>(STORAGE_PORT);

  // Called once by APP_INITIALIZER before any component renders.
  // Returns a Promise so Angular can await it during bootstrap.
  async initialize(): Promise<void> {
    const settings = await this.storage.getSettings();
    this.currentSettings.set(settings);
    this.settingsLoaded.set(true);
  }

  // Derived signals for convenience
  public currentWeightUnit = computed(() => this.currentSettings()?.weightUnit ?? 'kg');
  public currentDistanceUnit = computed(() => this.currentSettings()?.distanceUnit ?? 'km');

  // Constants
  private readonly LBS_PER_KG = 2.20462;
  private readonly METERS_PER_KM = 1000;
  private readonly METERS_PER_MILE = 1609.34;

  /**
   * Weights (Base = kg)
   */

  // Convert DB value (kg) to user's preferred unit for display
  kgToUser(kg: number): number {
    if (this.currentWeightUnit() === 'lb') {
      return this.round(kg * this.LBS_PER_KG);
    }
    return this.round(kg);
  }

  // Convert User input (kg or lb) to base DB value (kg) for saving
  userToKg(userWeight: number): number {
    if (this.currentWeightUnit() === 'lb') {
      return this.round(userWeight / this.LBS_PER_KG);
    }
    return this.round(userWeight);
  }

  /**
   * Distances (Base = meters)
   */

  // Convert DB value (meters) to user's preferred unit (km or mi) for display
  metersToUser(meters: number): number {
    const unit = this.currentDistanceUnit();
    if (unit === 'mi') {
      return this.round(meters / this.METERS_PER_MILE, 2);
    }
    return this.round(meters / this.METERS_PER_KM, 2);
  }

  // Convert User input (km or mi) to base DB value (meters) for saving
  userToMeters(userDistance: number): number {
    const unit = this.currentDistanceUnit();
    if (unit === 'mi') {
      return this.round(userDistance * this.METERS_PER_MILE, 0);
    }
    return this.round(userDistance * this.METERS_PER_KM, 0);
  }

  /**
   * Utility for progression increments
   * E.g. Add 2.5 user units to a base value.
   * We convert base to user, add increment, convert back to base.
   */
  addIncrementToBaseWeight(baseKg: number, userIncrement: number): number {
    const currentInUserUnit = this.kgToUser(baseKg);
    const newInUserUnit = currentInUserUnit + userIncrement;
    return this.userToKg(newInUserUnit);
  }

  // Rounding helper
  private round(value: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
