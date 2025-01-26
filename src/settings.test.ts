import type {
  getDevice,
  MeaterPlatformConfig,
} from './settings.js'

import { describe, expect, it } from 'vitest'

import {
  meaterEndPoint,
  meaterUrl,
  meaterUrlLogin,
  PLATFORM_NAME,
  PLUGIN_NAME,
} from './settings.js'

describe('settings', () => {
  it('should have correct PLATFORM_NAME', () => {
    expect(PLATFORM_NAME).toBe('Meater')
  })

  it('should have correct PLUGIN_NAME', () => {
    expect(PLUGIN_NAME).toBe('@homebridge-plugins/homebridge-meater')
  })

  it('should have correct meaterEndPoint', () => {
    expect(meaterEndPoint).toBe('https://public-api.cloud.meater.com/v1')
  })

  it('should have correct meaterUrl', () => {
    expect(meaterUrl).toBe('https://public-api.cloud.meater.com/v1/devices')
  })

  it('should have correct meaterUrlLogin', () => {
    expect(meaterUrlLogin).toBe('https://public-api.cloud.meater.com/v1/login')
  })

  it('should define MeaterPlatformConfig interface', () => {
    const config: MeaterPlatformConfig = {
      platform: 'Meater',
      credentials: {
        email: 'test@example.com',
        password: 'password',
        token: 'token',
      },
      options: {
        devices: [
          {
            id: 'device1',
            configDeviceName: 'Device 1',
            hide_device: false,
            firmware: '1.0.0',
            external: true,
            refreshRate: 60,
            updateRate: 60,
            pushRate: 60,
            logging: 'info',
            temperature: {
              ambient: 25,
              internal: 75,
            },
            cook: {
              id: 'cook1',
              name: 'Steak',
              state: 'cooking',
              temperature: {
                target: 60,
                peak: 65,
              },
              time: {
                elapsed: 10,
                remaining: 20,
              },
            },
            updated_at: 1234567890,
            data: {
              temperature: {
                ambient: 25,
                internal: 75,
              },
            },
          },
        ],
        refreshRate: 60,
        updateRate: 60,
        pushRate: 60,
        logging: 'info',
        allowInvalidCharacters: false,
      },
    }
    expect(config.credentials?.email).toBe('test@example.com')
    expect(config.options?.devices?.[0].id).toBe('device1')
  })

  it('should define getDevice interface', () => {
    const deviceData: getDevice = {
      status: 'success',
      statusCode: 200,
      data: {
        devices: [
          {
            id: 'device1',
            temperature: {
              ambient: 25,
              internal: 75,
            },
            cook: {
              id: 'cook1',
              name: 'Steak',
              state: 'cooking',
              temperature: {
                target: 60,
                peak: 65,
              },
              time: {
                elapsed: 10,
                remaining: 20,
              },
            },
            updated_at: 1234567890,
            data: {
              temperature: {
                ambient: 25,
                internal: 75,
              },
            },
          },
        ],
      },
      meta: {},
    }
    expect(deviceData.status).toBe('success')
    expect(deviceData.data.devices[0].id).toBe('device1')
  })
})
