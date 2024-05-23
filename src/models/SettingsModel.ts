export default class SettingsModel {
  autoStart: boolean
  autoConnectTunnelID: string
  logLevel: 'debug' | 'all'
  startMinimized: boolean
  minimizeToTray: boolean
  logLimit: string

  constructor(data?: Partial<SettingsModel>) {
    this.autoStart = data?.autoStart ?? false
    this.autoConnectTunnelID = data?.autoConnectTunnelID ?? ''
    this.logLevel = data?.logLevel ?? 'debug'
    this.startMinimized = data?.startMinimized ?? false
    this.minimizeToTray = data?.minimizeToTray ?? true
    this.logLimit = data?.logLimit ?? '50'
  }
}
