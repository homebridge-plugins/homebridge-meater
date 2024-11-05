/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * setting.ts: homebridge-meater.
 */

import type { PlatformConfig } from 'homebridge'
/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'Meater'

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-meater'

/**
 * This is the main url used to access Meater API https://github.com/apption-labs/meater-cloud-public-rest-api
 */
export const meaterEndPoint = 'https://public-api.cloud.meater.com/v1'

export const meaterUrl = 'https://public-api.cloud.meater.com/v1/devices'

export const meaterUrlLogin = 'https://public-api.cloud.meater.com/v1/login'

// Config
export interface MeaterPlatformConfig extends PlatformConfig {
  credentials?: credentials
  options?: options
}

export interface credentials {
  email?: string
  password?: string
  token?: string
}

export interface options {
  devices?: devicesConfig[]
  refreshRate?: number
  updateRate?: number
  pushRate?: number
  logging?: string
  allowInvalidCharacters?: boolean
}

export interface devicesConfig extends device {
  id: string
  configDeviceName?: string
  hide_device?: boolean
  firmware?: string
  external?: boolean
  refreshRate?: number
  updateRate?: number
  pushRate?: number
  logging?: string
}

export interface getDevice {
  status: string
  statusCode: number
  data: Data
  meta: object
}

export interface Data {
  devices: device[]
}

export interface device {
  id: string
  temperature: Temperature
  cook: Cook
  updated_at: number
  data: deviceData
}

export interface deviceData {
  temperature: Temperature
}

export interface Temperature {
  ambient: number
  internal: number
}

export interface Cook {
  id: string
  name: string
  state: string
  temperature: cookTemperature
  time: cookTime
}

export interface cookTemperature {
  target: number
  peak: number
}

export interface cookTime {
  elapsed: number
  remaining: number
}
