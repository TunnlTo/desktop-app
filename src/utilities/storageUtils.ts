import type Tunnel from '../models/Tunnel.ts'
import SettingsModel from '../models/SettingsModel.ts'

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
