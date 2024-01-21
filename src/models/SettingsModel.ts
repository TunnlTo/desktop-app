export default class SettingsModel {
  autoStart: boolean
  autoConnectTunnelID: string
  logLevel: 'debug' | 'all'
  startMinimized: boolean
  minimizeToTray: boolean

  constructor(data?: Partial<SettingsModel>) {
    this.autoStart = data?.autoStart ?? false
    this.autoConnectTunnelID = data?.autoConnectTunnelID ?? ''
    this.logLevel = data?.logLevel ?? 'debug'
    this.startMinimized = data?.startMinimized ?? false
    this.minimizeToTray = data?.minimizeToTray ?? true
  }
}
