import Tunnel from '../models/Tunnel.ts'
import SettingsModel from '../models/SettingsModel.ts'

/* --------------- */
/* Tunnels         */
/* --------------- */

// Get all tunnels
export function getAllTunnelsFromStorage(): Record<string, Tunnel> {
  console.log('Retrieving tunnels from local storage')
  const tunnelsStorageItem = localStorage.getItem('tunnels')
  const tunnels = tunnelsStorageItem !== null ? JSON.parse(tunnelsStorageItem) : {}
  return tunnels
}

// Save all tunnels
export function saveTunnelsToStorage(tunnels: Record<string, Tunnel>): void {
  console.log('Saving tunnels to local storage')
  localStorage.setItem('tunnels', JSON.stringify(tunnels))
}

/* --------------- */
/* Tunnel          */
/* --------------- */

// Get data for a tunnel
export function getTunnelFromStorage(tunnelID: string): Tunnel | null {
  console.log(`Retrieving tunnel data for ${tunnelID} from local storage`)
  const tunnels = getAllTunnelsFromStorage()
  if (tunnels[tunnelID] !== null) {
    return tunnels[tunnelID]
  }
  return null
}

/* --------------- */
/* Selected Tunnel */
/* --------------- */

// Delete the selected tunnel key
export function deleteSelectedTunnelIDKeyFromStorage(): void {
  console.log('Deleting the selected tunnel id key from local storage')
  localStorage.removeItem('selectedTunnelID')
}

// Get the selected tunnel
export function getSelectedTunnelIDFromStorage(): string | null {
  const selectedTunnelID = localStorage.getItem('selectedTunnelID')
  console.log(`Retrieved selected tunnel ID ${selectedTunnelID} from local storage`)
  return selectedTunnelID
}

// Save the selected tunnel
export function saveSelectedTunnelIDToStorage(selectedTunnelID: string): void {
  console.log(`Saving selected tunnel ID ${selectedTunnelID} to local storage`)
  localStorage.setItem('selectedTunnelID', selectedTunnelID)
}

/* --------------- */
/* Settings        */
/* --------------- */

// Save settings
export function saveSettingsToStorage(settings: SettingsModel): void {
  console.log('Saving settings to local storage')
  localStorage.setItem('settings', JSON.stringify(settings))
}

// Get the settings
export function getSettingsFromStorage(): SettingsModel {
  console.log('Retrieving settings from local storage')
  const settingsStorageItem = localStorage.getItem('settings')
  const settings = settingsStorageItem !== null ? JSON.parse(settingsStorageItem) : new SettingsModel()
  return settings
}
