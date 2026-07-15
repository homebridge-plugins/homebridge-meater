/* Copyright(C) 2023-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * index.ts: @homebridge-plugins/homebridge-meater
 */
import type { API } from 'homebridge'

import { MeaterMatterPlatform } from './MeaterMatterPlatform.js'
import { MeaterPlatform } from './platform.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'
import { createPlatformProxy } from './utils.js'

// Register our platform with homebridge using a proxy that selects HAP or Matter at runtime.
export default (api: API): void => {
  const ProxyCtor = createPlatformProxy(MeaterPlatform, MeaterMatterPlatform)
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, ProxyCtor as any)
}
