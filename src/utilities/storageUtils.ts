import type Tunnel from '../models/Tunnel.ts'
import SettingsModel from '../models/SettingsModel.ts'

// Retrieve the existing tunnels data from local storage
export function getTunnelsFromStorage(): Record<string, Tunnel> {
  const tunnelsStorageItem = localStorage.getItem('tunnels')
  const tunnels = tunnelsStorageItem !== null ? JSON.parse(tunnelsStorageItem) : {}
  return tunnels
}

// Retrieve a tunnels data from local storage
export function getTunnelFromStorage(tunnelID: string): Tunnel | null {
  const tunnels = getTunnelsFromStorage()
  if (tunnels[tunnelID] !== null) {
    return tunnels[tunnelID]
  }
  return null
}

// Get the most recently selected tunnel from local storage
export function getSelectedTunnelIDFromStorage(): string | null {
  return localStorage.getItem('selectedTunnelID')
}

// Save a tunnel to local storage
export function saveTunnelInStorage(tunnels: Record<string, Tunnel>, tunnel: Tunnel): void {
  tunnels[tunnel.id] = tunnel

  // Store the updated tunnels data in local storage
  localStorage.setItem('tunnels', JSON.stringify(tunnels))
}

// Delete a tunnel from local storage
export function deleteTunnelFromStorage(tunnels: Record<string, Tunnel>, tunnelID: string): void {
  Reflect.deleteProperty(tunnels, tunnelID)

  // Store the updated tunnels data in local storage
  localStorage.setItem('tunnels', JSON.stringify(tunnels))
}

// Delete the selected tunnel from local storage
export function deleteSelectedTunnelIDFromStorage(): void {
  localStorage.removeItem('selectedTunnelID')
}

// Save a tunnel to local storage
export function saveSettingsInStorage(settings: SettingsModel): void {
  // Store the settings data in local storage
  localStorage.setItem('settings', JSON.stringify(settings))
}

// Save a tunnel to local storage
export function getSettingsFromStorage(): SettingsModel {
  // Get the settings from local storage
  const settingsStorageItem = localStorage.getItem('settings')
  const settings = settingsStorageItem !== null ? JSON.parse(settingsStorageItem) : new SettingsModel()
  return settings
}
