import type { API, CharacteristicValue, HAP, Logging, PlatformAccessory, Service } from 'homebridge'

/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * device.ts: homebridge-meater.
 */
import type { MeaterPlatform } from '../platform.js'
import type { device, devicesConfig, MeaterPlatformConfig } from '../settings.js'

export abstract class deviceBase {
  public readonly api: API
  public readonly log: Logging
  public readonly config!: MeaterPlatformConfig
  protected readonly hap: HAP

  // Config
  protected deviceLogging!: string
  protected deviceRefreshRate!: number

  constructor(
    protected readonly platform: MeaterPlatform,
    protected accessory: PlatformAccessory,
    protected device: device,
  ) {
    this.api = this.platform.api
    this.log = this.platform.log
    this.config = this.platform.config
    this.hap = this.api.hap

    this.deviceLogs(device)
    this.getDeviceRefreshRate(accessory, device)
    this.deviceConfigOptions(device)
    this.deviceContext(accessory, device)

    // Set accessory information
    accessory
      .getService(this.hap.Service.AccessoryInformation)!
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Meater')
      .setCharacteristic(this.hap.Characteristic.Model, 'Smart Meat Thermometer')
      .setCharacteristic(this.hap.Characteristic.SerialNumber, device.id)
      .setCharacteristic(this.hap.Characteristic.HardwareRevision, accessory.context.version)
      .setCharacteristic(this.hap.Characteristic.FirmwareRevision, accessory.context.version)
  }

  /**
   * Update the characteristic value and log the change.
   *
   * @param Service Service
   * @param Characteristic Characteristic
   * @param CharacteristicValue CharacteristicValue | undefined
   * @param CharacteristicName string
   * @return: void
   *
   */
  async updateCharacteristic(Service: Service, Characteristic: any, CharacteristicValue: CharacteristicValue | undefined, CharacteristicName: string): Promise<void> {
    if (CharacteristicValue === undefined) {
      this.debugLog(`${CharacteristicName}: ${CharacteristicValue}`)
    } else {
      Service.updateCharacteristic(Characteristic, CharacteristicValue)
      this.debugLog(`updateCharacteristic ${CharacteristicName}: ${CharacteristicValue}`)
      this.debugWarnLog(`${CharacteristicName} context before: ${this.accessory.context[CharacteristicName]}`)
      this.accessory.context[CharacteristicName] = CharacteristicValue
      this.debugWarnLog(`${CharacteristicName} context after: ${this.accessory.context[CharacteristicName]}`)
    }
  }

  async deviceLogs(device: device & devicesConfig): Promise<void> {
    this.deviceLogging = this.platform.debugMode ? 'debugMode' : device.logging ?? this.platform.platformLogging ?? 'standard'
    const logging = this.platform.debugMode
      ? 'debugMode'
      : device.logging
        ? 'Device Config'
        : this.platform.platformLogging
          ? 'Platform Config'
          : 'Default'
    await this.debugLog(`Using ${logging} Logging: ${this.deviceLogging}`)
  }

  async getDeviceRefreshRate(accessory: PlatformAccessory, device: device & devicesConfig): Promise<void> {
    this.deviceRefreshRate = device.refreshRate ?? this.platform.platformRefreshRate ?? accessory.context.deviceRefreshRate ?? 1800
    const refreshRate = device.refreshRate
      ? 'Device Config'
      : this.platform.platformRefreshRate
        ? 'Platform Config'
        : accessory.context.deviceRefreshRate ? 'Accessory Cache' : 'Default'
    await this.debugLog(`Using ${refreshRate} refreshRate: ${this.deviceRefreshRate}`)
  }

  async deviceConfigOptions(device: device & devicesConfig): Promise<void> {
    const deviceConfig: { logging?: string, refreshRate?: number } = {}
    if (device.logging !== undefined) {
      deviceConfig.logging = device.logging
    }
    if (device.refreshRate !== undefined) {
      deviceConfig.refreshRate = device.refreshRate
    }
    if (Object.entries(deviceConfig).length !== 0) {
      this.infoLog(`Config: ${JSON.stringify(deviceConfig)}`)
    }
  }

  async deviceContext(accessory: PlatformAccessory, device: device & devicesConfig): Promise<void> {
    accessory.context.version = device.firmware ?? await this.platform.getVersion() ?? '3'
  }

  /**
   * Logging for Device
   */
  async infoLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.info(`${this.accessory.displayName}`, String(...log))
    }
  }

  async successLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.success(`${this.accessory.displayName}`, String(...log))
    }
  }

  async debugSuccessLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.success(`[DEBUG] ${this.accessory.displayName}`, String(...log))
      }
    }
  }

  async warnLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.warn(`${this.accessory.displayName}`, String(...log))
    }
  }

  async debugWarnLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.warn(`[DEBUG] ${this.accessory.displayName}`, String(...log))
      }
    }
  }

  async errorLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      this.log.error(`${this.accessory.displayName}`, String(...log))
    }
  }

  async debugErrorLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.error(`[DEBUG] ${this.accessory.displayName}`, String(...log))
      }
    }
  }

  async debugLog(...log: any[]): Promise<void> {
    if (await this.enablingDeviceLogging()) {
      if (this.deviceLogging === 'debug') {
        this.log.info(`[DEBUG] ${this.accessory.displayName}`, String(...log))
      } else if (this.deviceLogging === 'debugMode') {
        this.log.debug(`${this.accessory.displayName}`, String(...log))
      }
    }
  }

  async loggingIsDebug(): Promise<boolean> {
    return this.deviceLogging === 'debugMode' || this.deviceLogging === 'debug'
  }

  async enablingDeviceLogging(): Promise<boolean> {
    return this.deviceLogging === 'debugMode' || this.deviceLogging === 'debug' || this.deviceLogging === 'standard'
  }
}
