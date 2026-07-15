<p align="center">
   <a href="https://github.com/homebridge-plugins/homebridge-meater"><img alt="homebridge-meater" src="https://raw.githubusercontent.com/homebridge-plugins/homebridge-meater/latest/branding/Homebridge_x_Meater.png" width="600px"></a>
</p>
<span align="center">

## homebridge-meater

Homebridge plugin to integrate MEATER smart meat thermometers into HomeKit

[![npm](https://img.shields.io/npm/v/@homebridge-plugins/homebridge-meater/latest?label=latest)](https://www.npmjs.com/package/@homebridge-plugins/homebridge-meater)
[![npm](https://img.shields.io/npm/v/@homebridge-plugins/homebridge-meater/beta?label=beta)](https://github.com/homebridge/homebridge/wiki/How-to-Install-Alternate-Plugin-Versions)<br>
[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?color=%23491F59&style=flat)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)<br>
[![npm](https://img.shields.io/npm/dt/@homebridge-plugins/homebridge-meater)](https://www.npmjs.com/package/@homebridge-plugins/homebridge-meater)
[![Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=hb-discord)](https://discord.gg/bHjKNkN)

</span>

### Plugin Information

- This plugin allows you to view your [MEATER](https://www.meater.com) thermometer readings within HomeKit. The plugin:
  - requires your MEATER account credentials to work
  - connects to the [MEATER Cloud REST API](https://github.com/apption-labs/meater-cloud-public-rest-api) to retrieve probe temperatures
  - exposes internal and ambient temperature sensors for each probe, plus a Cook Refresh switch

### Setup

- Installation
  - Search for "Meater" on the plugin screen of the [Homebridge UI](https://github.com/homebridge/homebridge-config-ui-x) and click **Install**.
- Configuration
  1. Download the MEATER app on the App Store or Google Play Store and register a MEATER account.
  2. Enter your MEATER account e-mail and password in the plugin settings.
  3. Click **Save** and restart Homebridge.
- Please note: your probe readings only appear in the MEATER cloud (and therefore HomeKit) during an active cook.

### Features

- **Matter** support is available when running Homebridge v2.0+ with Matter enabled - the plugin chooses Matter or HAP automatically at runtime and falls back to HAP when Matter is unavailable.

### Help/About

- [Support Request](https://github.com/homebridge-plugins/homebridge-meater/issues/new/choose)
- [Changelog](https://github.com/homebridge-plugins/homebridge-meater/blob/latest/CHANGELOG.md)
- [About Me](https://github.com/sponsors/bwp91)

### Credits

- To [@donavanbecker](https://github.com/donavanbecker): the original creator and maintainer of this plugin.
- To the creators/contributors of [Homebridge](https://homebridge.io) who make this plugin possible.

### Disclaimer

- I am in no way affiliated with MEATER or Apption Labs and this plugin is a personal project that I maintain in my free time.
- Use this plugin entirely at your own risk - please see licence for more information.
