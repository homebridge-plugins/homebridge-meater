/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * platform.ts: @homebridge-plugins/homebridge-meater
 */
import type { API, DynamicPlatformPlugin, HAP, Logging, PlatformAccessory } from 'homebridge'

import type { device, devicesConfig, MeaterPlatformConfig, options } from './settings.js'

import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'

import { Meater } from './device/meater.js'
import { meaterUrl, meaterUrlLogin, PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

interface RequestOptions {
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class MeaterPlatform implements DynamicPlatformPlugin {
  public accessories: PlatformAccessory[]
  public readonly api: API
  public readonly log: Logging
  protected readonly hap: HAP
  public config!: MeaterPlatformConfig

  platformConfig!: MeaterPlatformConfig
  platformLogging!: options['logging']
  platformRefreshRate!: options['refreshRate']
  platformPushRate!: options['pushRate']
  platformUpdateRate!: options['updateRate']
  version: any

  constructor(
    log: Logging,
    config: MeaterPlatformConfig,
    api: API,
  ) {
    this.accessories = []
    this.api = api
    this.hap = this.api.hap
    this.log = log
    // only load if configured
    if (!config) {
      return
    }

    // Plugin options into our config variables.
    this.config = {
      platform: 'Meater',
      name: config.name,
      credentials: config.credentials,
      options: config.options,
    }

    // Plugin Configuration
    this.getPlatformLogSettings()
    this.getPlatformRateSettings()
    this.getPlatformConfigSettings()
    this.getVersion()

    // Finish initializing the platform
    this.debugLog(`Finished initializing platform: ${config.name}`);

    // verify the config
    (async () => {
      try {
        await this.verifyConfig()
        this.debugLog('Config OK')
      } catch (e: any) {
        this.errorLog(`Verify Config, Error Message: ${e.message}, Submit Bugs Here: https://bit.ly/homebridge-meater-bug-report`)
        this.debugErrorLog(`Verify Config, Error: ${e}`)
      }
    })()

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      this.debugLog('Executed didFinishLaunching callback')
      // run the method to discover / register your devices as accessories
      try {
        await this.discoverDevices()
      } catch (e: any) {
        this.errorLog(`Failed to Discover, Error Message: ${e.message}, Submit Bugs Here: ` + 'https://bit.ly/homebridge-meater-bug-report')
        this.debugErrorLog(`Failed to Discover, Error: ${e}`)
      }
    })
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.debugLog(`Loading accessory from cache: ${accessory.displayName}`)

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory)
  }

  /**
   * Verify the config passed to the plugin is valid
   */
  async verifyConfig() {
    if (!this.config.credentials?.email) {
      throw new Error('Email not provided')
    }
    if (!this.config.credentials?.password) {
      throw new Error('Password not provided')
    }
  }

  /**
   * this method discovers devices
   */
  async discoverDevices() {
    try {
      if (this.config.credentials?.token) {
        const { body, statusCode } = await this.requestJson(meaterUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.credentials.token}`,
          },
        })
        this.debugLog(`Device statusCode: ${statusCode}`)
        const device: any = body
        this.debugLog(`Device: ${JSON.stringify(device)}`)
        this.debugLog(`Device StatusCode: ${device.statusCode}`)
        if (statusCode === 200 && device.statusCode === 200) {
          this.infoLog (`Found ${device.data.devices.length} Devices`)
          const deviceLists = device.data.devices
          await this.configureDevices(deviceLists)
          // Meater Devices
          /* device.data.devices.forEach((device: device & deviceConfig) => {
            this.createMeter(device);
          }); */
        } else {
          this.statusCode(statusCode)
          this.statusCode(device.statusCode)
        }
      } else {
        const payload = JSON.stringify({
          email: this.config.credentials?.email,
          password: this.config.credentials?.password,
        })
        const { body, statusCode } = await this.requestJson(meaterUrlLogin, {
          body: payload,
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        })
        this.debugLog(`statusCode: ${statusCode}`)
        const login: any = body
        this.debugLog(`Login: ${JSON.stringify(login)}`)
        this.debugLog(`Login Token: ${JSON.stringify(login.data.token)}`)
        this.debugLog(`statusCode: ${statusCode} & devicesAPI StatusCode: ${login.statusCode}`)
        if (statusCode === 200 && login.statusCode === 200) {
          this.infoLog('Successfully authenticated with Meater API')
          // Save the token to config for future use
          if (this.config.credentials) {
            this.config.credentials.token = login.data.token
          }
          const { body, statusCode } = await this.requestJson(meaterUrl, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${login.data.token}`,
            },
          })
          this.debugLog(`Device statusCode: ${statusCode}`)
          const device: any = body
          this.debugLog(`Device: ${JSON.stringify(device)}`)
          this.debugLog(`Device StatusCode: ${device.statusCode}`)
          if (statusCode === 200 && device.statusCode === 200) {
            this.infoLog (`Found ${device.data.devices.length} Devices`)
            const deviceLists = device.data.devices

            // Log device IDs for user configuration (visible without debug mode)
            if (deviceLists && deviceLists.length > 0) {
              this.infoLog('Discovered Meater devices:')
              deviceLists.forEach((device: any, index: number) => {
                this.infoLog(`  Device ${index + 1}: ID = ${device.id}`)
              })
              this.infoLog('To configure specific devices, add these IDs to your config under options.devices')
            }

            await this.configureDevices(deviceLists)
            // Meater Devices
            /* device.data.devices.forEach((device: device & deviceConfig) => {
              this.createMeter(device);
            }); */
          } else {
            this.statusCode(statusCode)
            this.statusCode(device.statusCode)
          }
        } else {
          // Login failed
          this.errorLog('Failed to authenticate with Meater API')
          this.statusCode(statusCode)
          this.statusCode(login.statusCode)
        }
      }
    } catch (e: any) {
      this.errorLog(
        `Failed to Discover Devices, Error Message: ${JSON.stringify(e.message)}, Submit Bugs Here: ` + 'https://bit.ly/homebridge-meater-bug-report',
      )
      this.errorLog(`Failed to Discover Devices, Error: ${e}`)
    }
  }

  private async configureDevices(deviceLists: any) {
    if (!this.config.options?.devices) {
      this.debugLog(`No Meater Device Config: ${JSON.stringify(this.config.options?.devices)}`)
      if (deviceLists && deviceLists.length > 0) {
        this.infoLog('Auto-discovering devices (no device configuration found)')
        this.infoLog('For custom device names or settings, add device IDs to your configuration')
      }
      const devices = deviceLists.map((v: any) => v)
      for (const device of devices) {
        await this.createMeter(device)
      }
    } else {
      this.debugLog(`Meater Device Config Set: ${JSON.stringify(this.config.options?.devices)}`)
      const deviceConfigs = this.config.options?.devices
      if (deviceLists === undefined) {
        deviceLists = deviceConfigs
      }

      const mergeByid = (a1: { id: string }[], a2: any[]) => a1.map((itm: { id: string }) => ({
        ...a2.find((item: { id: string }) => item.id === itm.id && item),
        ...itm,
      }))

      const devices = mergeByid(deviceLists, deviceConfigs)
      this.debugLog(`Meater Devices: ${JSON.stringify(devices)}`)
      for (const device of devices) {
        await this.createMeter(device)
      }
    }
  }

  private async createMeter(device: device & devicesConfig) {
    const uuid = this.api.hap.uuid.generate(device.id)

    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)

    if (existingAccessory) {
      // the accessory already exists
      if (await this.registerDevice(device)) {
        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        existingAccessory.context.device.id = device.id
        existingAccessory.displayName = device.configDeviceName ?? `Meater Thermometer (${device.id.slice(0, 4)})`
        existingAccessory.context.FirmwareRevision = await this.FirmwareRevision(device)
        this.infoLog(`Restoring existing accessory from cache: ${existingAccessory.displayName} DeviceID: ${device.id}`)
        this.api.updatePlatformAccessories([existingAccessory])
        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        existingAccessory.control = new Meater(this, existingAccessory, device)
        this.debugLog(`uuid: ${device.id}, (${existingAccessory.UUID})`)
      } else {
        this.unregisterPlatformAccessories(existingAccessory)
      }
    } else if (await this.registerDevice(device)) {
      // create a new accessory
      const accessory = new this.api.platformAccessory((device.configDeviceName
        ?? `Meater Thermometer (${device.id.slice(0, 4)})`), uuid)

      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.device = device
      accessory.context.device.id = device.id
      accessory.displayName = device.configDeviceName ?? `Meater Thermometer (${device.id.slice(0, 4)})`
      accessory.context.FirmwareRevision = await this.FirmwareRevision(device)
      // the accessory does not yet exist, so we need to create it
      if (!device.external) {
        const displayName = device.configDeviceName ?? `Meater Thermometer (${device.id.slice(0, 4)})`
        this.infoLog(`Adding new accessory, Meater: ${displayName}, id: ${device.id}`)
      }
      // create the accessory handler for the newly create accessory
      // this is imported from `platformAccessory.ts`
      accessory.control = new Meater(this, accessory, device)
      this.debugLog(`uuid: ${device.id}, (${accessory.UUID})`)

      // publish device externally or link the accessory to your platform
      this.externalOrPlatform(device, accessory)
      this.accessories.push(accessory)
    } else {
      this.debugLog(`Device not registered, DeviceID: ${device.id}`)
    }
  }

  async FirmwareRevision(device: device & devicesConfig): Promise<any> {
    let firmware: any
    if (device.firmware) {
      firmware = device.firmware
    } else {
      firmware = await this.getVersion()
    }
    return firmware
  }

  async registerDevice(device: device & devicesConfig): Promise<boolean> {
    let registerDevice: boolean
    if (!device.hide_device) {
      registerDevice = true
    } else {
      registerDevice = false
      const displayName = device.configDeviceName || `Meater Thermometer (${device.id.slice(0, 4)})`
      this.errorLog(
        `Meater: ${displayName}, id: ${device.id} will not display in HomeKit, hide_device: ${device.hide_device}`,
      )
    }
    return registerDevice
  }

  public async externalOrPlatform(device: device & devicesConfig, accessory: PlatformAccessory) {
    if (device.external) {
      this.warnLog(`${accessory.displayName} External Accessory Mode`)
      this.externalAccessory(accessory)
    } else {
      this.debugLog(`${accessory.displayName} External Accessory Mode: ${device.external}`)
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
    }
  }

  public async externalAccessory(accessory: PlatformAccessory) {
    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory])
  }

  public unregisterPlatformAccessories(existingAccessory: PlatformAccessory) {
    // remove platform accessories when no longer present
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory])
    this.warnLog(`Removing existing accessory from cache: ${existingAccessory.displayName}`)
  }

  async statusCode(statusCode: number): Promise<void> {
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

  async getPlatformLogSettings() {
    // `debugMode` was worked out here by looking for `-D` in the plugin's own
    // process arguments. That is right in the main Homebridge process and wrong
    // in a child bridge, which only receives `-D` when that bridge has its own
    // debug setting turned on - so with debug enabled globally the plugin
    // decided debug was off and printed nothing.
    //
    // Nothing needs deciding: 'debugMode' routes debug lines to Homebridge's
    // own debug logger, which prints them only when debug is actually on, in
    // either kind of process. An explicit `logging` in the config still wins.
    this.platformLogging = (this.config.options?.logging === 'debug' || this.config.options?.logging === 'standard'
      || this.config.options?.logging === 'none')
      ? this.config.options.logging
      : 'debugMode'
    const logging = this.config.options?.logging ? 'Platform Config' : 'Default'
    await this.debugLog(`Using ${logging} Logging: ${this.platformLogging}`)
  }

  private async requestJson(url: string, options: RequestOptions): Promise<{ body: any, statusCode: number }> {
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

      if (options.body) {
        req.write(options.body)
      }

      req.end()
    })
  }

  async getPlatformRateSettings() {
    // RefreshRate
    this.platformRefreshRate = this.config.options?.refreshRate ? this.config.options.refreshRate : undefined
    const refreshRate = this.config.options?.refreshRate ? 'Using Platform Config refreshRate' : 'Platform Config refreshRate Not Set'
    await this.debugLog(`${refreshRate}: ${this.platformRefreshRate}`)
    // UpdateRate
    this.platformUpdateRate = this.config.options?.updateRate ? this.config.options.updateRate : undefined
    const updateRate = this.config.options?.updateRate ? 'Using Platform Config updateRate' : 'Platform Config updateRate Not Set'
    await this.debugLog(`${updateRate}: ${this.platformUpdateRate}`)
    // PushRate
    this.platformPushRate = this.config.options?.pushRate ? this.config.options.pushRate : undefined
    const pushRate = this.config.options?.pushRate ? 'Using Platform Config pushRate' : 'Platform Config pushRate Not Set'
    await this.debugLog(`${pushRate}: ${this.platformPushRate}`)
  }

  async getPlatformConfigSettings() {
    if (this.config.options) {
      const platformConfig: MeaterPlatformConfig = {
        platform: 'Meater',
      }
      platformConfig.logging = this.config.options.logging ? this.config.options.logging : undefined
      platformConfig.refreshRate = this.config.options.refreshRate ? this.config.options.refreshRate : undefined
      platformConfig.updateRate = this.config.options.updateRate ? this.config.options.updateRate : undefined
      platformConfig.pushRate = this.config.options.pushRate ? this.config.options.pushRate : undefined
      if (Object.entries(platformConfig).length !== 0) {
        await this.debugLog(`Platform Config: ${JSON.stringify(platformConfig)}`)
      }
      this.platformConfig = platformConfig
    }
  }

  /**
   * Asynchronously retrieves the version of the plugin from the package.json file.
   *
   * This method reads the package.json file located in the parent directory,
   * parses its content to extract the version, and logs the version using the debug logger.
   * The extracted version is then assigned to the `version` property of the class.
   *
   * @returns {Promise<void>} A promise that resolves when the version has been retrieved and logged.
   */
  async getVersion(): Promise<void> {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))
    this.debugLog(`Plugin Version: ${version}`)
    this.version = version
  }

  /**
   * Validate and clean a string value for a Name Characteristic.
   * @param displayName - The display name of the accessory.
   * @param name - The name of the characteristic.
   * @param value - The value to be validated and cleaned.
   * @returns The cleaned string value.
   */
  async validateAndCleanDisplayName(displayName: string, name: string, value: string): Promise<string> {
    if (this.config.options?.allowInvalidCharacters) {
      return value
    } else {
      const validPattern = /^[\p{L}\p{N}][\p{L}\p{N} ']*[\p{L}\p{N}]$/u
      const invalidCharsPattern = /[^\p{L}\p{N} ']/gu
      const invalidStartEndPattern = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu

      if (typeof value === 'string' && !validPattern.test(value)) {
        this.warnLog(`WARNING: The accessory '${displayName}' has an invalid '${name}' characteristic ('${value}'). Please use only alphanumeric, space, and apostrophe characters. Ensure it starts and ends with an alphabetic or numeric character, and avoid emojis. This may prevent the accessory from being added in the Home App or cause unresponsiveness.`)

        // Remove invalid characters
        if (invalidCharsPattern.test(value)) {
          const before = value
          this.warnLog(`Removing invalid characters from '${name}' characteristic, if you feel this is incorrect,  please enable \'allowInvalidCharacter\' in the config to allow all characters`)
          value = value.replace(invalidCharsPattern, '')
          this.warnLog(`${name} Before: '${before}' After: '${value}'`)
        }

        // Ensure it starts and ends with an alphanumeric character
        if (invalidStartEndPattern.test(value)) {
          const before = value
          this.warnLog(`Removing invalid starting or ending characters from '${name}' characteristic, if you feel this is incorrect, please enable \'allowInvalidCharacter\' in the config to allow all characters`)
          value = value.replace(invalidStartEndPattern, '')
          this.warnLog(`${name} Before: '${before}' After: '${value}'`)
        }
      }

      return value
    }
  }

  /**
   * If device level logging is turned on, log to log.warn
   * Otherwise send debug logs to log.debug
   */
  async infoLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.info(String(...log))
    }
  }

  async successLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.success(String(...log))
    }
  }

  async debugSuccessLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.success('[DEBUG]', String(...log))
      }
    }
  }

  async warnLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.warn(String(...log))
    }
  }

  async debugWarnLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.warn('[DEBUG]', String(...log))
      }
    }
  }

  async errorLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.error(String(...log))
    }
  }

  async debugErrorLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.error('[DEBUG]', String(...log))
      }
    }
  }

  async debugLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (this.platformLogging === 'debugMode') {
        this.log.debug(String(...log))
      } else if (this.platformLogging === 'debug') {
        this.log.info('[DEBUG]', String(...log))
      }
    }
  }

  async loggingIsDebug(): Promise<boolean> {
    return this.platformLogging === 'debugMode' || this.platformLogging === 'debug'
  }

  async enablingPlatformLogging(): Promise<boolean> {
    return this.platformLogging === 'debugMode' || this.platformLogging === 'debug' || this.platformLogging === 'standard'
  }
}
