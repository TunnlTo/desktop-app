export default class SettingsModel {
  autoStart: boolean
  autoConnectTunnelID: string
  logLevel: 'debug' | 'all'

  constructor() {
    this.autoStart = false
    this.autoConnectTunnelID = ''
    this.logLevel = 'debug'
  }
}
