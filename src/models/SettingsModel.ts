export default class SettingsModel {
  autoStart: boolean
  autoConnectTunnelID: string

  constructor() {
    this.autoStart = false
    this.autoConnectTunnelID = ''
  }
}
