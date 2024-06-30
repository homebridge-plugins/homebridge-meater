/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * device.ts: homebridge-meater.
 */
import type { MeaterPlatform } from '../platform.js';
import type { API, HAP, Logging, PlatformAccessory } from 'homebridge';
import type { MeaterPlatformConfig, device, devicesConfig } from '../settings.js';

export abstract class deviceBase {
  public readonly api: API;
  public readonly log: Logging;
  public readonly config!: MeaterPlatformConfig;
  protected readonly hap: HAP;

  // Config
  protected deviceLogging!: string;
  protected deviceRefreshRate!: number;

  constructor(
    protected readonly platform: MeaterPlatform,
    protected accessory: PlatformAccessory,
    protected device: device,
  ) {
    this.api = this.platform.api;
    this.log = this.platform.log;
    this.config = this.platform.config;
    this.hap = this.api.hap;

    this.deviceLogs(device);
    this.getDeviceRefreshRate(device);
    this.deviceConfigOptions(device);
    this.deviceContext(accessory, device);

    // Set accessory information
    accessory
      .getService(this.hap.Service.AccessoryInformation)!
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Meater')
      .setCharacteristic(this.hap.Characteristic.Model, 'Smart Meat Thermometer')
      .setCharacteristic(this.hap.Characteristic.SerialNumber, device.id)
      .setCharacteristic(this.hap.Characteristic.HardwareRevision, accessory.context.version)
      .setCharacteristic(this.hap.Characteristic.FirmwareRevision, accessory.context.version);
  }

  async deviceLogs(device: device & devicesConfig): Promise<void> {
    this.deviceLogging = this.platform.debugMode ? 'debug' : device.logging ?? this.config.options?.logging ?? 'standard';
    const logging = this.platform.debugMode ? 'debugMode' : device.logging ? 'Device Config' : this.config.options?.logging ? 'Platform Config'
      : 'Default';
    await this.debugLog(`Using ${logging} Logging: ${this.deviceLogging}`);
  }

  async getDeviceRefreshRate(device: device & devicesConfig): Promise<void> {
    if (device.refreshRate) {
      if (device.refreshRate < 1800) {
        device.refreshRate = 1800;
        this.warnLog('Refresh Rate cannot be set to lower the 5 mins, as Lock detail (battery level, etc) are unlikely to change within that period');
      }
      this.deviceRefreshRate = this.accessory.context.refreshRate = device.refreshRate;
      this.debugLog(`Lock: ${this.accessory.displayName} Using Device Config refreshRate: ${this.deviceRefreshRate}`);
    } else if (this.config.refreshRate) {
      this.deviceRefreshRate = this.accessory.context.refreshRate = this.config.refreshRate;
      this.debugLog(`Lock: ${this.accessory.displayName} Using Platform Config refreshRate: ${this.deviceRefreshRate}`);
    }
  }

  async deviceConfigOptions(device: device & devicesConfig): Promise<void> {
    const deviceConfig = {};
    if (device.logging !== undefined) {
      deviceConfig['logging'] = device.logging;
    }
    if (device.refreshRate !== undefined) {
      deviceConfig['refreshRate'] = device.refreshRate;
    }
    if (Object.entries(deviceConfig).length !== 0) {
      this.infoLog(`Lock: ${this.accessory.displayName} Config: ${JSON.stringify(deviceConfig)}`);
    }
  }

  async deviceContext(accessory: PlatformAccessory, device: device & devicesConfig): Promise<void> {
    accessory.context.version = device.firmware ?? await this.platform.getVersion() ?? '3';
  }

  /**
   * Logging for Device
   */
  async infoLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.info(`${this.accessory.displayName}`, String(...log));
    }
  }

  async successLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.success(`${this.accessory.displayName}`, String(...log));
    }
  }

  async debugSuccessLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (this.deviceLogging?.includes('debug')) {
        this.log.success(`[DEBUG] ${this.accessory.displayName}`, String(...log));
      }
    }
  }

  async warnLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.warn(`${this.accessory.displayName}`, String(...log));
    }
  }

  async debugWarnLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (this.deviceLogging?.includes('debug')) {
        this.log.warn(`[DEBUG] ${this.accessory.displayName}`, String(...log));
      }
    }
  }

  async errorLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.error(`${this.accessory.displayName}`, String(...log));
    }
  }

  async debugErrorLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (this.deviceLogging?.includes('debug')) {
        this.log.error(`[DEBUG] ${this.accessory.displayName}`, String(...log));
      }
    }
  }

  async debugLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (this.deviceLogging === 'debug') {
        this.log.info(`[DEBUG] ${this.accessory.displayName}`, String(...log));
      } else {
        this.log.debug(`${this.accessory.displayName}`, String(...log));
      }
    }
  }

  async enablingDeviceLogging(): Promise<boolean> {
    return this.deviceLogging.includes('debug') || this.deviceLogging === 'standard';
  }
}