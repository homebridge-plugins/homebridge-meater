import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge'

import type { MeaterPlatform } from '../platform.js'
import type { device, devicesConfig } from '../settings.js'

import { interval, skipWhile, Subject } from 'rxjs'
/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * meater.ts: @homebridge-plugins/homebridge-meater
 */
import { request } from 'undici'

import { meaterUrl } from '../settings.js'
import { deviceBase } from './device.js'

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Meater extends deviceBase {
  // Service
  private ServiceLabel: {
    Name: CharacteristicValue
    Service: Service
    ServiceLabelNamespace: CharacteristicValue
  }

  private CookRefresh: {
    Name: CharacteristicValue
    Service: Service
    On: CharacteristicValue
  }

  private Internal: {
    Name: CharacteristicValue
    Service: Service
    CurrentTemperature: CharacteristicValue
  }

  private Ambient: {
    Name: CharacteristicValue
    Service: Service
    CurrentTemperature: CharacteristicValue
  }

  // DeviceStatus
  deviceStatus!: device

  // Updates
  SensorUpdateInProgress!: boolean
  doSensorUpdate!: Subject<void>

  constructor(
    readonly platform: MeaterPlatform,
    accessory: PlatformAccessory,
    device: device & devicesConfig,
  ) {
    super(platform, accessory, device)
    // Set category
    accessory.category = this.hap.Categories.SENSOR

    // this is subject we use to track when we need to POST changes to the SwitchBot API
    this.doSensorUpdate = new Subject()
    this.SensorUpdateInProgress = false

    // Initialize ServiceLabel property
    accessory.context.ServiceLabel = accessory.context.ServiceLabel ?? {}
    this.ServiceLabel = {
      Name: accessory.displayName,
      Service: accessory.getService(this.hap.Service.ServiceLabel) ?? accessory.addService(this.hap.Service.ServiceLabel) as Service,
      ServiceLabelNamespace: accessory.context.ServiceLabelNamespace ?? this.hap.Characteristic.ServiceLabelNamespace.DOTS,
    }
    accessory.context.LightBulb = this.ServiceLabel as object

    // Add serviceLabel Service's Characteristics
    this.ServiceLabel.Service
      .setCharacteristic(this.hap.Characteristic.Name, this.ServiceLabel.Name)
      .getCharacteristic(this.hap.Characteristic.ServiceLabelNamespace)
      .onGet(async () => {
        return this.ServiceLabel.ServiceLabelNamespace
      })

    // Initialize Internal property
    accessory.context.Internal = accessory.context.Internal ?? {}
    this.Internal = {
      Name: `${accessory.displayName} Internal Temperature`,
      Service: <Service> this.accessory.getServiceById(this.hap.Service.TemperatureSensor, `${accessory.displayName} Internal Temperature`),
      CurrentTemperature: accessory.context.Internal.CurrentTemperature ?? 32,
    }
    accessory.context.Internal = this.Internal as object
    if (this.Internal) {
      if (!this.Internal.Service) {
        this.Internal.Service = new this.hap.Service.TemperatureSensor(this.Internal.Name.toString(), this.Internal.Name.toString())
        if (this.Internal.Service) {
          this.Internal.Service = this.accessory.addService(this.Internal.Service)
          this.debugLog(`${accessory.displayName} Internal Temperature Service`)
        } else {
          this.errorLog(`${accessory.displayName} Internal Temperature Service -- Failed!`)
        }
      }
    }
    // Add InternalTemperature Sensor Service's Characteristics
    this.Internal.Service
      .setCharacteristic(this.hap.Characteristic.Name, this.Internal.Name)
      .setCharacteristic(this.hap.Characteristic.CurrentTemperature, this.Internal.CurrentTemperature)

    // Initialize Ambient property
    accessory.context.Ambient = accessory.context.Ambient ?? {}
    this.Ambient = {
      Name: `${accessory.displayName} Ambient Temperature`,
      Service: <Service> this.accessory.getServiceById(this.hap.Service.TemperatureSensor, `${accessory.displayName} Ambient Temperature`),
      CurrentTemperature: accessory.context.Ambient.CurrentTemperature ?? 32,
    }
    accessory.context.Ambient = this.Ambient as object
    if (this.Ambient) {
      if (!this.Ambient.Service) {
        this.Ambient.Service = new this.hap.Service.TemperatureSensor(this.Ambient.Name.toString(), this.Ambient.Name.toString())
        if (this.Ambient.Service) {
          this.Ambient.Service = this.accessory.addService(this.Ambient.Service)
          this.debugLog(`${accessory.displayName} Ambient Temperature Service`)
        } else {
          this.errorLog(`${accessory.displayName} Ambient Temperature Service -- Failed!`)
        }
      }
    }
    // Add AmbientTemperature Sensor Service's Characteristics
    this.Ambient.Service
      .setCharacteristic(this.hap.Characteristic.Name, this.Ambient.Name)
      .setCharacteristic(this.hap.Characteristic.CurrentTemperature, this.Ambient.CurrentTemperature)

    // Initialize CookRefresh property
    accessory.context.CookRefresh = accessory.context.CookRefresh ?? {}
    this.CookRefresh = {
      Name: `${accessory.displayName} Cook Refresh`,
      Service: <Service> this.accessory.getServiceById(this.hap.Service.Switch, `${accessory.displayName} Cook Refresh`),
      On: accessory.context.CookRefresh.On ?? false,
    }
    accessory.context.CookRefresh = this.CookRefresh as object

    this.CookRefresh.Service
      .setCharacteristic(this.hap.Characteristic.Name, this.CookRefresh.Name)
      .setCharacteristic(this.hap.Characteristic.On, this.CookRefresh.On)
      .getCharacteristic(this.hap.Characteristic.On)
      .onSet(this.handleOnSet.bind(this))

    // Retrieve initial values and updateHomekit
    this.debugLog('Retrieve initial values and update Homekit')
    this.refreshStatus()

    // Start an update interval
    interval(this.deviceRefreshRate * 1000)
      .pipe(skipWhile(() => this.SensorUpdateInProgress))
      .subscribe(async () => {
        await this.refreshStatus()
      })
  }

  /**
   * Parse the device status from the SwitchBot api
   */
  async parseStatus(): Promise<void> {
    // Internal Temperature
    this.Internal.CurrentTemperature = this.deviceStatus.data.temperature.internal
    if (this.Internal.CurrentTemperature !== this.accessory.context.Internal.CurrentTemperature) {
      this.infoLog(`Internal Current Temperature: ${this.Internal.CurrentTemperature}°c`)
    }

    // Ambient Temperature
    this.Ambient.CurrentTemperature = this.deviceStatus.data.temperature.ambient
    if (this.Ambient.CurrentTemperature !== this.accessory.context.Ambient.CurrentTemperature) {
      this.infoLog(`Ambient Current Temperature: ${this.Ambient.CurrentTemperature}°c`)
    }
  }

  /**
   * Asks the SwitchBot API for the latest device information
   */
  async refreshStatus(): Promise<void> {
    this.infoLog(`Refreshing ${this.accessory.displayName} Status... Cooking: ${this.CookRefresh ? 'On' : 'Off'}`)
    if (this.CookRefresh.On) {
      try {
        if (this.config.credentials?.token) {
          const { body, statusCode } = await request(`${meaterUrl}/${this.device.id}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.config.credentials?.token}`,
            },
          })
          const device: any = await body.json()
          this.debugLog(`Device: ${JSON.stringify(device)}`)
          this.debugLog(`statusCode: ${statusCode} Device StatusCode: ${device.statusCode}`)
          if (statusCode === 200 && device.statusCode === 200) {
            this.CookRefresh.On = true
            this.deviceStatus = device
            await this.parseStatus()
            await this.updateHomeKitCharacteristics()
          } else {
            await this.statusCode(statusCode)
            await this.statusCode(device.statusCode)
          }
        }
      } catch (e: any) {
        this.apiError(e)
        this.errorLog(`failed refreshStatus, Error Message: ${JSON.stringify(e.message)}`)
      }
    } else {
      this.infoLog(`Cook Refresh is off for ${this.accessory.displayName}`)
      this.CookRefresh.On = false
    }
  }

  /**
   * Updates the status for each of the HomeKit Characteristics
   */
  async updateHomeKitCharacteristics(): Promise<void> {
    // Internal Current Temperature
    await this.updateCharacteristic(this.Internal.Service, this.hap.Characteristic.CurrentTemperature, this.Internal.CurrentTemperature, 'Internal.CurrentTemperature')
    // Ambient Current Temperature
    await this.updateCharacteristic(this.Ambient.Service, this.hap.Characteristic.CurrentTemperature, this.Ambient.CurrentTemperature, 'Ambient.CurrentTemperature')
    // Cook Refresh On
    await this.updateCharacteristic(this.CookRefresh.Service, this.hap.Characteristic.On, this.CookRefresh.On, 'CookRefresh.On')
  }

  async statusCode(statusCode: number): Promise<void> {
    /**
     * Meater API Status Codes (https://github.com/apption-labs/meater-cloud-public-rest-api)
     *
     * Standard Response Codes: 200(OK), 201(Created), 204(No Content)
     * https://github.com/apption-labs/meater-cloud-public-rest-api#standard-response
     *
     * Error Response: 400(Bad Request), 401(Unauthorized), 404(Not Found), 429(Too Many Requests), 500(Internal Server Error)
     * https://github.com/apption-labs/meater-cloud-public-rest-api#error-response
     */
    switch (statusCode) {
      case 200:
        this.debugLog(`Standard Response, statusCode: ${statusCode}`)
        break
      case 400:
        this.errorLog(`Bad Request, statusCode: ${statusCode}`)
        break
      case 401:
        this.errorLog(`Unauthorized, statusCode: ${statusCode}`)
        break
      case 404:
        this.errorLog(`Not Found, statusCode: ${statusCode}`)
        this.CookRefresh.On = false
        break
      case 429:
        this.errorLog(`Too Many Requests, statusCode: ${statusCode}`)
        break
      case 500:
        this.errorLog(`Internal Server Error (Meater Server), statusCode: ${statusCode}`)
        break
      default:
        this.infoLog(`Unknown statusCode: ${statusCode}, Report Bugs Here: https://bit.ly/homebridge-meater-bug-report`)
    }
  }

  async apiError(e: any): Promise<void> {
    this.Internal.Service?.updateCharacteristic(this.hap.Characteristic.CurrentTemperature, e)
    this.Ambient.Service?.updateCharacteristic(this.hap.Characteristic.CurrentTemperature, e)
    this.CookRefresh.Service?.updateCharacteristic(this.hap.Characteristic.On, e)
  }

  /**
   * Handle requests to set the "On" characteristic
   */
  async handleOnSet(value: CharacteristicValue) {
    this.infoLog('Cook Refresh On:', value)
    this.CookRefresh.On = value as boolean
    await this.refreshStatus()
    await this.updateHomeKitCharacteristics()
  }
}
