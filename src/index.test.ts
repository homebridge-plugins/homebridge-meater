import type { API } from 'homebridge'

import { describe, expect, it, vi } from 'vitest'

import registerPlatform from './index.js'
import { MeaterMatterPlatform } from './MeaterMatterPlatform.js'
import { MeaterPlatform } from './platform.js'
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
    const mockApi = {
      hap: { uuid: { generate: vi.fn(() => 'uuid') } },
      on: vi.fn(),
      registerPlatform: vi.fn(),
      // Matter APIs absent — simulates Homebridge v1.x
    }

    const instance = new ProxyCtor(log, config, mockApi)
    expect(instance).toBeInstanceOf(MeaterPlatform)
    expect(instance).not.toBeInstanceOf(MeaterMatterPlatform)
  })

  it('should select the Matter platform when Matter is available and enabled', () => {
    const api = {
      registerPlatform: vi.fn(),
    } as unknown as API

    registerPlatform(api)

    const [, , ProxyCtor] = (api.registerPlatform as ReturnType<typeof vi.fn>).mock.calls[0]

    const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), success: vi.fn() }
    const config = {
      platform: 'Meater',
      options: {},
    }
    const mockApi = {
      hap: { uuid: { generate: vi.fn(() => 'uuid') } },
      on: vi.fn(),
      registerPlatform: vi.fn(),
      // Simulate Homebridge v2.0 Matter runtime
      isMatterAvailable: vi.fn(() => true),
      isMatterEnabled: vi.fn(() => true),
    }

    const instance = new ProxyCtor(log, config, mockApi)
    expect(instance).toBeInstanceOf(MeaterMatterPlatform)
  })

  it('should fall back to HAP when Matter is reported unavailable', () => {
    const api = {
      registerPlatform: vi.fn(),
    } as unknown as API

    registerPlatform(api)

    const [, , ProxyCtor] = (api.registerPlatform as ReturnType<typeof vi.fn>).mock.calls[0]

    const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), success: vi.fn() }
    const config = {
      platform: 'Meater',
      options: {},
    }
    const mockApi = {
      hap: { uuid: { generate: vi.fn(() => 'uuid') } },
      on: vi.fn(),
      registerPlatform: vi.fn(),
      isMatterAvailable: vi.fn(() => false),
      isMatterEnabled: vi.fn(() => true),
    }

    const instance = new ProxyCtor(log, config, mockApi)
    expect(instance).toBeInstanceOf(MeaterPlatform)
    expect(instance).not.toBeInstanceOf(MeaterMatterPlatform)
  })

  it('should fall back to HAP when enableMatter is false', () => {
    const api = {
      registerPlatform: vi.fn(),
    } as unknown as API

    registerPlatform(api)

    const [, , ProxyCtor] = (api.registerPlatform as ReturnType<typeof vi.fn>).mock.calls[0]

    const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), success: vi.fn() }
    const config = {
      platform: 'Meater',
      options: { enableMatter: false },
    }
    const mockApi = {
      hap: { uuid: { generate: vi.fn(() => 'uuid') } },
      on: vi.fn(),
      registerPlatform: vi.fn(),
      isMatterAvailable: vi.fn(() => true),
      isMatterEnabled: vi.fn(() => true),
    }

    const instance = new ProxyCtor(log, config, mockApi)
    expect(instance).toBeInstanceOf(MeaterPlatform)
    expect(instance).not.toBeInstanceOf(MeaterMatterPlatform)
  })

  it('should handle falsy config without throwing (preserves MeaterPlatform guard)', () => {
    const api = {
      registerPlatform: vi.fn(),
    } as unknown as API

    registerPlatform(api)

    const [, , ProxyCtor] = (api.registerPlatform as ReturnType<typeof vi.fn>).mock.calls[0]

    const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), success: vi.fn() }
    const mockApi = {
      hap: { uuid: { generate: vi.fn(() => 'uuid') } },
      on: vi.fn(),
      registerPlatform: vi.fn(),
    }

    // null/undefined config must not throw — MeaterPlatform handles it internally.
    expect(() => new ProxyCtor(log, null, mockApi)).not.toThrow()
  })
})
