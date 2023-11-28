import { getAllTunnelsFromStorage, saveAllTunnelsInStorage } from '../utilities/storageUtils'
import type Tunnel from './Tunnel'

export default class TunnelManager {
  tunnels: Record<string, Tunnel>

  constructor() {
    this.tunnels = getAllTunnelsFromStorage()
  }

  addTunnel(tunnel: Tunnel): void {
    this.tunnels[tunnel.id] = tunnel
    saveAllTunnelsInStorage(this.tunnels)
  }

  removeTunnel(tunnelID: string): void {
    Reflect.deleteProperty(this.tunnels, tunnelID)
    saveAllTunnelsInStorage(this.tunnels)
  }

  getTunnel(tunnelID: string): Tunnel | null {
    return this.tunnels[tunnelID]
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
