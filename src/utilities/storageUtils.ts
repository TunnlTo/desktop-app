import Tunnel from '../models/Tunnel.ts'
import SettingsModel from '../models/SettingsModel.ts'
import type TunnelManager from '../models/TunnelManager.ts'

/* --------------- */
/* Tunnels         */
/* --------------- */

// Get all tunnels
export function getAllTunnelsFromStorage(): Record<string, Tunnel> {
  const tunnelsStorageItem = localStorage.getItem('tunnels')
  const tunnels = tunnelsStorageItem !== null ? JSON.parse(tunnelsStorageItem) : {}
  return tunnels
}

// Save all tunnels
export function saveAllTunnelsInStorage(tunnels: Record<string, Tunnel>): void {
  localStorage.setItem('tunnels', JSON.stringify(tunnels))
}

/* --------------- */
/* Tunnel          */
/* --------------- */

// Get data for a tunnel
export function getTunnelFromStorage(tunnelID: string): Tunnel | null {
  const tunnels = getAllTunnelsFromStorage()
  if (tunnels[tunnelID] !== null) {
    return tunnels[tunnelID]
  }
  return null
}

/* --------------- */
/* Selected Tunnel */
/* --------------- */

// Delete the selected tunnel
export function deleteSelectedTunnelIDFromStorage(): void {
  localStorage.removeItem('selectedTunnelID')
}

// Get the selected tunnel
export function getSelectedTunnelIDFromStorage(): string | null {
  return localStorage.getItem('selectedTunnelID')
}

// Save the selected tunnel
export function saveSelectedTunnelIDInStorage(selectedTunnelID: string): void {
  localStorage.setItem('selectedTunnelID', selectedTunnelID)
}

// Remove selectedTunnel key that was used in <1.0.0
export function removePreVersion1SelectedTunnel(): void {
  localStorage.removeItem('selectedTunnel')
}

/* --------------- */
/* Settings        */
/* --------------- */

// Save settings
export function saveSettingsInStorage(settings: SettingsModel): void {
  localStorage.setItem('settings', JSON.stringify(settings))
}

// Get the settings
export function getSettingsFromStorage(): SettingsModel {
  const settingsStorageItem = localStorage.getItem('settings')
  const settings = settingsStorageItem !== null ? JSON.parse(settingsStorageItem) : new SettingsModel()
  return settings
}

/* ------------------------------------------------- */
/* Update tunnel data structure from 1.0.0 to 1.0.1  */
/* ------------------------------------------------- */

export function convertInterfaceIPAddresses(tunnelManager: TunnelManager): TunnelManager | null {
  // Iterate over each tunnel in the manager
  for (const tunnelId in tunnelManager.tunnels) {
    const tunnel = tunnelManager.tunnels[tunnelId]

    // Check if the tunnel has an ipAddress field in its interface
    const ipAddress = (tunnel.interface as any).ipAddress

    if (ipAddress !== undefined && ipAddress !== null) {
      // Split the ipAddress field by comma and remove spaces
      const ipAddresses = ipAddress.replace(/\s/g, '').split(',')

      // Iterate over each IP address
      for (const ip of ipAddresses) {
        // If the address has a : we assume its ipv6, otherwise if it has a . we assume its ipv4
        if (ip.includes(':') === true) {
          // Add the IP address to the ipv6Address field
          tunnel.interface.ipv6Address = ip
        } else if (ip.includes('.') === true) {
          // Add the IP address to the ipv4Address field
          tunnel.interface.ipv4Address = ip
        }
      }

      // If tunnel parameters do not have values we save them with empty values
      if (tunnel.interface.ipv4Address === undefined) {
        tunnel.interface.ipv4Address = ''
      }
      if (tunnel.interface.ipv6Address === undefined) {
        tunnel.interface.ipv6Address = ''
      }

      // Remove the ipAddress field
      delete (tunnel.interface as any).ipAddress

      // Remove the old tunnel from the manager
      tunnelManager.removeTunnel(tunnelId)

      // Add the updated tunnel back to the manager
      tunnelManager.addTunnel(tunnel)

      console.log(`Updated ${tunnelId} tunnel data structure from v1.0.0 to v1.0.1`)
    }
  }

  return tunnelManager
}

/* --------------------------------------------- */
/* Local storage data migration for <1.0.0 data  */
/* --------------------------------------------- */

// Convert local storage data for versions <1.0.0 to the 1.0.0 data structure changes.
export function convertOldData(tunnelManager: TunnelManager): TunnelManager | null {
  // Remove old selected tunnel data
  removePreVersion1SelectedTunnel()

  // Get all keys from local storage
  const keys = Object.keys(localStorage)

  // Filter keys that start with 'tunnel-wireguard-'
  const oldTunnelKeys = keys.filter((key) => key.startsWith('tunnel-wireguard-'))

  if (oldTunnelKeys.length === 0) {
    return null
  }

  // Iterate over each old tunnel key
  oldTunnelKeys.forEach((oldTunnelKey) => {
    // Get the old tunnel data from local storage
    const oldTunnelData = localStorage.getItem(oldTunnelKey)

    if (oldTunnelData != null) {
      // Parse the old tunnel data into a JavaScript object
      const oldTunnel = JSON.parse(oldTunnelData)

      // Create a new Tunnel object and assign the old tunnel data to it
      const newTunnel = new Tunnel(tunnelManager.getTunnelIDList())

      // Name

      newTunnel.name = oldTunnel.name

      // Interface

      newTunnel.interface.privateKey = oldTunnel.privateKey
      newTunnel.interface.dns = oldTunnel.dns
      newTunnel.interface.mtu = oldTunnel.mtu
      // /32 is no longer required
      const [interfaceIpAddress] = oldTunnel.interfaceAddress.split('/')
      newTunnel.interface.ipv4Address = interfaceIpAddress

      // Peer

      newTunnel.peer.publicKey = oldTunnel.publicKey
      newTunnel.peer.presharedKey = oldTunnel.presharedKey
      // The old endpoint had the port included and now it is seperated
      const [peerEndpoint, peerPort] = oldTunnel.endpoint.split(':')
      newTunnel.peer.endpoint = peerEndpoint
      newTunnel.peer.port = peerPort

      // Rules

      newTunnel.rules.allowed.apps = oldTunnel.allowedApps
      newTunnel.rules.disallowed.apps = oldTunnel.disallowedApps
      newTunnel.rules.allowed.ipAddresses = oldTunnel.allowedIPs
      newTunnel.rules.disallowed.ipAddresses = oldTunnel.disallowedIPs

      // Delete the old tunnel from local storage
      localStorage.removeItem(oldTunnelKey)
      console.log(`Removed old version of "${oldTunnel.name}" tunnel data from local storage.`)

      // Add it to the tunnelManager
      tunnelManager.addTunnel(newTunnel)
    }
  })

  return tunnelManager
}
