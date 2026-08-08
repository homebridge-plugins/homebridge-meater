/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * utils.ts: @homebridge-plugins/homebridge-meater
 */
import type { PlatformConfig } from 'homebridge'

import type { MeaterPlatformConfig } from './settings.js'

/**
 * Casts a raw PlatformConfig to a typed MeaterPlatformConfig without fabricating
 * an empty object for falsy values. Returning `null`/`undefined` as-is preserves
 * the `if (!config) return` early-exit guard inside MeaterPlatform and prevents
 * the platform from initialising with missing credentials.
 *
 * @param raw - The raw platform configuration received from Homebridge.
 * @returns The same reference typed as MeaterPlatformConfig, or undefined.
 */
export function normalizeConfig(raw?: PlatformConfig): MeaterPlatformConfig | undefined {
  if (!raw) {
    return undefined
  }
  return raw as MeaterPlatformConfig
}

/**
 * Creates a proxy class that instantiates the correct platform implementation
 * (Matter or HAP) at runtime based on Homebridge Matter availability.
 *
 * When Homebridge v2.0 Matter support is available, the MatterPlatform is used
 * by default. Users can force HAP by setting `enableMatter` to `false`.
 *
 * @param HAPPlatform - The HAP platform class constructor.
 * @param MatterPlatform - The Matter platform class constructor.
 * @returns A proxy class that delegates to the correct platform implementation.
 */
export function createPlatformProxy(HAPPlatform: any, MatterPlatform: any): any {
  return class MeaterPlatformProxy {
    /** The instantiated platform implementation (HAP or Matter) */
    private impl: any

    /**
     * Constructs the proxy and instantiates the correct platform implementation.
     *
     * @param log - Logger instance.
     * @param config - Platform configuration (may be falsy when not configured).
     * @param api - Homebridge API instance.
     */
    constructor(log: any, config: PlatformConfig, api: any) {
      const cfg = normalizeConfig(config)
      const enableMatter = cfg?.options?.enableMatter ?? true
      const matterAvailable = !!(api?.isMatterAvailable?.() && api?.isMatterEnabled?.())

      if (cfg && enableMatter && MatterPlatform && matterAvailable) {
        this.impl = new MatterPlatform(log, cfg, api)
        return this.impl
      }

      // Fallback to HAP (also handles falsy config — MeaterPlatform guards internally).
      this.impl = new HAPPlatform(log, config, api)
      return this.impl
    }
  }
}

/**
 * The largest delay a Node timer can hold, because it is stored in a signed
 * 32-bit integer. Roughly 24.85 days.
 */
export const MAX_TIMER_MS = 2147483647

/**
 * Keep a computed delay inside the range a Node timer can represent.
 *
 * Going over the limit does not throw. Node prints a TimeoutOverflowWarning and
 * quietly sets the delay to 1 ms, so a timer meant to fire in weeks fires a
 * thousand times a second instead - which for a polling loop means hammering
 * the service it polls.
 *
 * Clamping means a delay longer than 24.85 days simply fires at 24.85 days,
 * which for every setting here is early rather than wrong.
 */
export function safeTimerMs(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) {
    return 1
  }
  return Math.min(Math.floor(ms), MAX_TIMER_MS)
}
