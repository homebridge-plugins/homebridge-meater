import type { API } from 'homebridge'

import { describe, expect, it, vi } from 'vitest'

import registerPlatform from './index.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

describe('registerPlatform', () => {
  it('should register the platform with homebridge', () => {
    const api = {
      registerPlatform: vi.fn(),
    } as unknown as API

    registerPlatform(api)

    expect(api.registerPlatform).toHaveBeenCalledWith(PLUGIN_NAME, PLATFORM_NAME, expect.any(Function))
  })

  it('should register a proxy that falls back to HAP when Matter is unavailable', () => {
    const api = {
      registerPlatform: vi.fn(),
    } as unknown as API

    registerPlatform(api)

    const [, , ProxyCtor] = (api.registerPlatform as ReturnType<typeof vi.fn>).mock.calls[0]

    // Instantiate the proxy without Matter available — should use HAP platform.
    const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), success: vi.fn() }
    const config = { platform: 'Meater', options: {} }
    const mockApi = { hap: { uuid: { generate: vi.fn(() => 'uuid') } }, on: vi.fn(), registerPlatform: vi.fn() }

    // Should not throw when instantiated in HAP fallback mode.
    expect(() => new ProxyCtor(log, config, mockApi)).not.toThrow()
  })
})
