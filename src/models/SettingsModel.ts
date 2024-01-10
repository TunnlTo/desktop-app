export default class SettingsModel {
  autoStart: boolean
  autoConnectTunnelID: string
  logLevel: 'debug' | 'all'
  startMinimized: boolean
  minimizeToTray: boolean

  constructor() {
    this.autoStart = false
    this.autoConnectTunnelID = ''
    this.logLevel = 'debug'
    this.startMinimized = false
    this.minimizeToTray = true
  }
}
