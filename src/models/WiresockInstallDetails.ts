export default class WiresockInstallDetails {
  isInstalled: boolean
  version: string
  isSupportedVersion: boolean

  constructor(isInstalled: boolean, version: string, isSupportedVersion: boolean) {
    this.isInstalled = isInstalled
    this.version = version
    this.isSupportedVersion = isSupportedVersion
  }
}
