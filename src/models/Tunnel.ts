export default class Tunnel {
  id: string
  name: string
  interface: {
    ipv4Address: string
    ipv6Address: string
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

  constructor(tunnelIDList: string[]) {
    this.id = ''
    this.name = ''
    this.interface = {
      ipv4Address: '',
      ipv6Address: '',
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

    let uniqueId = ''
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'

    do {
      uniqueId = ''
      for (let i = 0; i < 4; i++) {
        uniqueId += characters.charAt(Math.floor(Math.random() * characters.length))
      }
    } while (tunnelIDList.includes(uniqueId))

    this.id = uniqueId
  }
}
