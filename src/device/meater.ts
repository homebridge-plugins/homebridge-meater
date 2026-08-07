import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge'
import type { Subscription } from 'rxjs'

import type { MeaterPlatform } from '../platform.js'
import type { device, devicesConfig } from '../settings.js'

import { Buffer } from 'node:buffer'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'

import { interval, Subject } from 'rxjs'
/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * meater.ts: @homebridge-plugins/homebridge-meater
 */

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
  private updateSubscription?: Subscription
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
    accessory.context.ServiceLabel = { ServiceLabelNamespace: this.ServiceLabel.ServiceLabelNamespace }

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
      Service: <Service> this.findExistingService(this.hap.Service.TemperatureSensor, 'Internal Temperature'),
      CurrentTemperature: accessory.context.Internal.CurrentTemperature ?? 32,
    }
    // Snapshot the values, not the live object. Assigning `this.Internal` itself made
    // the change check in parseStatus compare a property against itself, so the
    // temperature reading was never announced - and it put a live HAP Service into
    // the accessory cache, which is then serialised on every save.
    accessory.context.Internal = { CurrentTemperature: this.Internal.CurrentTemperature }
    if (this.Internal) {
      if (!this.Internal.Service) {
        this.Internal.Service = new this.hap.Service.TemperatureSensor(this.Internal.Name.toString(), 'Internal Temperature')
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
      Service: <Service> this.findExistingService(this.hap.Service.TemperatureSensor, 'Ambient Temperature'),
      CurrentTemperature: accessory.context.Ambient.CurrentTemperature ?? 32,
    }
    // Snapshot the values, not the live object. Assigning `this.Ambient` itself made
    // the change check in parseStatus compare a property against itself, so the
    // temperature reading was never announced - and it put a live HAP Service into
    // the accessory cache, which is then serialised on every save.
    accessory.context.Ambient = { CurrentTemperature: this.Ambient.CurrentTemperature }
    if (this.Ambient) {
      if (!this.Ambient.Service) {
        this.Ambient.Service = new this.hap.Service.TemperatureSensor(this.Ambient.Name.toString(), 'Ambient Temperature')
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
      Service: <Service> this.findExistingService(this.hap.Service.Switch, 'Cook Refresh'),
      On: accessory.context.CookRefresh.On ?? false,
    }
    accessory.context.CookRefresh = { On: this.CookRefresh.On }
    if (this.CookRefresh) {
      if (!this.CookRefresh.Service) {
        this.CookRefresh.Service = new this.hap.Service.Switch(this.CookRefresh.Name.toString(), 'Cook Refresh')
        if (this.CookRefresh.Service) {
          this.CookRefresh.Service = this.accessory.addService(this.CookRefresh.Service)
          this.debugLog(`${accessory.displayName} Cook Refresh Service`)
        } else {
          this.errorLog(`${accessory.displayName} Cook Refresh Service -- Failed!`)
        }
      }
    }
    // Add CookRefresh Switch Service's Characteristics
    this.CookRefresh.Service
      .setCharacteristic(this.hap.Characteristic.Name, this.CookRefresh.Name)
      .setCharacteristic(this.hap.Characteristic.On, this.CookRefresh.On)
      .getCharacteristic(this.hap.Characteristic.On)
      .onSet(this.handleOnSet.bind(this))

    // Retrieve initial values and updateHomekit
    this.debugLog('Retrieve initial values and update Homekit')
    this.refreshStatus()

    // Start an update interval. The overlap guard is checked inside refreshStatus
    // now: it used to be a `skipWhile`, which stops testing its predicate for good
    // after the first false, and nothing ever raised the flag anyway - so a stalled
    // request could be joined by a second one, both writing to the same fields.
    this.updateSubscription = interval(this.deviceRefreshRate * 1000)
      .subscribe(async () => {
        await this.refreshStatus()
      })
  }

  /**
   * Stop polling, so the interval does not keep calling the cloud - or hold the
   * process open - after Homebridge has asked the plugin to stop
   */
  public shutdown(): void {
    this.updateSubscription?.unsubscribe()
    this.updateSubscription = undefined
  }

  /**
   * Clamp temperature values to HomeKit's valid range (-270°C to 100°C)
   */
  private clampTemperature(temperature: number, sensorType: string): number {
    const minTemp = -270
    const maxTemp = 100

    // Debug, not warn. The ambient probe is rated to 275C and HomeKit's maximum
    // is 100C, so any normal oven or grill cook trips this on every single poll -
    // a three hour brisket filled the log with warnings about something correct,
    // unavoidable, and outside the owner's control.
    if (temperature > maxTemp) {
      this.debugLog(`${sensorType} temperature ${temperature}°C exceeds HomeKit maximum (${maxTemp}°C), clamping to ${maxTemp}°C`)
      return maxTemp
    }

    if (temperature < minTemp) {
      this.debugLog(`${sensorType} temperature ${temperature}°C below HomeKit minimum (${minTemp}°C), clamping to ${minTemp}°C`)
      return minTemp
    }

    return temperature
  }

  /**
   * Find one of this device's services, whatever the accessory was called when it
   * was created. The subtype used to be the full display name, so renaming a
   * device orphaned all three services and silently added a fresh set - the old
   * ones stayed in HomeKit frozen at their last value, and every later rename
   * added another set. Matching on the suffix finds the existing service under
   * any previous name; new ones are created under a stable subtype.
   */
  private findExistingService(serviceType: any, suffix: string): Service | undefined {
    return this.accessory.services.find(service =>
      service.UUID === serviceType.UUID && (service.subtype ?? '').endsWith(suffix))
  }

  /**
   * Parse the device status from the SwitchBot api
   */
  async parseStatus(): Promise<void> {
    // Internal Temperature
    const rawInternalTemp = this.deviceStatus.data.temperature.internal
    this.Internal.CurrentTemperature = this.clampTemperature(rawInternalTemp, 'Internal')
    if (this.Internal.CurrentTemperature !== this.accessory.context.Internal.CurrentTemperature) {
      this.infoLog(`Internal Current Temperature: ${this.Internal.CurrentTemperature}°c`)
      this.accessory.context.Internal.CurrentTemperature = this.Internal.CurrentTemperature
    }

    // Ambient Temperature
    const rawAmbientTemp = this.deviceStatus.data.temperature.ambient
    this.Ambient.CurrentTemperature = this.clampTemperature(rawAmbientTemp, 'Ambient')
    if (this.Ambient.CurrentTemperature !== this.accessory.context.Ambient.CurrentTemperature) {
      this.infoLog(`Ambient Current Temperature: ${this.Ambient.CurrentTemperature}°c`)
      this.accessory.context.Ambient.CurrentTemperature = this.Ambient.CurrentTemperature
    }
  }

  /**
   * Asks the SwitchBot API for the latest device information
   */
  async refreshStatus(): Promise<void> {
    if (this.SensorUpdateInProgress) {
      this.debugLog('Skipping this refresh, the previous one has not finished')
      return
    }
    this.SensorUpdateInProgress = true
    this.infoLog(`Refreshing ${this.accessory.displayName} Status... Cooking: ${this.CookRefresh ? 'On' : 'Off'}`)
    try {
      await this.doRefreshStatus()
    } finally {
      this.SensorUpdateInProgress = false
    }
  }

  private async doRefreshStatus(): Promise<void> {
    if (this.CookRefresh.On) {
      try {
        if (this.config.credentials?.token) {
          const { body, statusCode } = await this.requestJson(`${meaterUrl}/${this.device.id}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.config.credentials?.token}`,
            },
          })
          const device: any = body
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
        } else {
          this.errorLog('No authentication token available. Please restart Homebridge to re-authenticate with Meater API.')
          this.CookRefresh.On = false
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

  private async requestJson(url: string, options: { method: 'GET', headers?: Record<string, string> }): Promise<{ body: any, statusCode: number }> {
    return await new Promise((resolve, reject) => {
      const parsedUrl = new URL(url)
      const requestFn = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest

      const req = requestFn(parsedUrl, {
        method: options.method,
        headers: options.headers,
      }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => {
          const statusCode = res.statusCode ?? 0
          const text = Buffer.concat(chunks).toString('utf8')
          try {
            const body = text ? JSON.parse(text) : {}
            resolve({ body, statusCode })
          } catch (error) {
            reject(new Error(`Failed to parse JSON response: ${String(error)}`))
          }
        })
      })

      req.on('error', error => reject(error))
      req.end()
    })
  }
}
