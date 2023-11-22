export default class Tunnel {
  id: string
  name: string
  interface: {
    ipAddress: string
    port: string
    privateKey: string
    dns: string
    mtu: string
  }

  peer: {
    endpoint: string
    port: string
    publicKey: string
    presharedKey: string
    persistentKeepalive: string
  }

  rules: {
    allowed: {
      apps: string
      folders: string
      ipAddresses: string
    }
    disallowed: {
      apps: string
      folders: string
      ipAddresses: string
    }
  }

  constructor() {
    this.id = ''
    this.name = ''
    this.interface = {
      ipAddress: '',
      port: '',
      privateKey: '',
      dns: '',
      mtu: '',
    }
    this.peer = {
      endpoint: '',
      port: '',
      publicKey: '',
      presharedKey: '',
      persistentKeepalive: '',
    }
    this.rules = {
      allowed: {
        apps: '',
        folders: '',
        ipAddresses: '',
      },
      disallowed: {
        apps: '',
        folders: '',
        ipAddresses: '',
      },
    }
  }
}
