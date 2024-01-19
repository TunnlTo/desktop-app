import type Tunnel from './Tunnel'

export default class TunnelManager {
  tunnels: Record<string, Tunnel>

  constructor(initialTunnels: Record<string, Tunnel>) {
    this.tunnels = initialTunnels
  }

  getTunnel(tunnelID: string): Tunnel | null {
    return this.tunnels[tunnelID] ?? null
  }

  getTunnelIDList(): string[] {
    return Object.keys(this.tunnels)
  }

  getTunnelNames(): string[] {
    const tunnelNames: string[] = []
    for (const tunnel of Object.values(this.tunnels)) {
      tunnelNames.push(tunnel.name)
    }
    return tunnelNames
  }
}
