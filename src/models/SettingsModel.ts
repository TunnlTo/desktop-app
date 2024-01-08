export default class SettingsModel {
  autoStart: boolean
  autoConnectTunnelID: string
  logLevel: 'debug' | 'all'
  startMinimized: boolean

  constructor() {
    this.autoStart = false
    this.autoConnectTunnelID = ''
    this.logLevel = 'debug'
    this.startMinimized = false
  }
}
