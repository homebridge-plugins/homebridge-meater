/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * MeaterMatterPlatform.ts: @homebridge-plugins/homebridge-meater
 */
import type { API, Logging, PlatformAccessory } from 'homebridge'

import type { device, devicesConfig, MeaterPlatformConfig } from './settings.js'

import { MeaterPlatform } from './platform.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

/**
 * MeaterMatterPlatform
 *
 * Matter-aware platform class for the Meater plugin. Extends MeaterPlatform to
 * register accessories using the Homebridge Matter API when available, while
 * preserving all existing device discovery and management logic.
 *
 * When Homebridge v2.0 Matter support is active, accessories are registered via
 * `api.registerPlatformAccessories` so that Homebridge can bridge them to the
 * Matter fabric alongside the standard HAP bridge. The HAP fallback path in
 * `createPlatformProxy` ensures this class is only instantiated when the Matter
 * runtime is truly available.
 */
export class MeaterMatterPlatform extends MeaterPlatform {
  constructor(
    log: Logging,
    config: MeaterPlatformConfig,
    api: API,
  ) {
    super(log, config, api)
    this.debugLog('MeaterMatterPlatform initialized (Matter mode)')
  }

  /**
   * Registers an accessory with Homebridge, preferring the Matter registration
   * path when available.  Falls back to standard HAP registration so that the
   * plugin continues to work on Homebridge v1.x.
   *
   * @param device - The device configuration object.
   * @param accessory - The platform accessory to register.
   */
  public async externalOrPlatform(device: device & devicesConfig, accessory: PlatformAccessory): Promise<void> {
    if (device.external) {
      this.warnLog(`${accessory.displayName} External Accessory Mode`)
      this.externalAccessory(accessory)
    } else {
      this.debugLog(`${accessory.displayName} registering via Matter-aware platform`)
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
    }
  }
}
