import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import type SettingsModel from './models/SettingsModel.ts'
import { invoke } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event'
import type WiresockStateModel from './models/WiresockStateModel.ts'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/containers/Sidebar.tsx'
import TunnelDisplay from './components/containers/TunnelDisplay.tsx'
import TunnelEditor from './components/containers/TunnelEditor.tsx'
import {
  getSelectedTunnelIDFromStorage,
  getSettingsFromStorage,
  saveSelectedTunnelIDToStorage,
  saveSettingsToStorage,
  saveTunnelsToStorage,
  getAllTunnelsFromStorage,
  deleteSelectedTunnelIDKeyFromStorage,
} from './utilities/storageUtils.ts'
import Settings from './components/containers/Settings.tsx'
import Setup from './components/containers/Setup.tsx'
import TunnelManager from './models/TunnelManager.ts'
import GetStarted from './components/GetStarted.tsx'
import WiresockInstallDetails from './models/WiresockInstallDetails.ts'
import { WIRESOCK_VERSION } from './config.ts'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

function Main(): JSX.Element {
  /* ------------------------- */
  /* ------- useState -------- */
  /* ------------------------- */

  // For keeping track of the state of the wiresock process and tunnel connection status emitted from Tauri.
  const [wiresockState, setWiresockState] = useState<WiresockStateModel | null>(null)

  // Keep track of whether auto connect has already fired. Don't want it running again on component reload.
  const [hasRunAutoConnect, setHasRunAutoConnect] = useState(false)

  // Get the tunnels from local storage
  const [tunnelManager, setTunnelManager] = useState(() => {
    const initialTunnels = getAllTunnelsFromStorage()
    return new TunnelManager(initialTunnels)
  })

  // For checking if WireSock is installed and its version
  const [wiresockInstallDetails, setWiresockInstallDetails] = useState<WiresockInstallDetails | null>(null)

  // Keep track of which tunnel the UI is showing
  const [selectedTunnelID, setSelectedTunnelID] = useState<string | null>(() => {
    // Retrieve the selected tunnel ID from storage
    return getSelectedTunnelIDFromStorage() ?? null
  })

  const [settings, setSettings] = useState<SettingsModel>(() => {
    return getSettingsFromStorage()
  })

  /* ------------------------- */
  /* -------- useRef --------- */
  /* ------------------------- */
  const isSettingsFirstChange = useRef(true)
  const isTunnelManagerFirstChange = useRef(true)
  const isSelectedTunnelIDFirstChange = useRef(true)
  const tunnelManagerRef = useRef(tunnelManager)
  const prevTunnelStatusRef = useRef(wiresockState?.tunnel_status)

  /* ------------------------- */
  /* ------- useEffect ------- */
  /* ------------------------- */

  // Functions to run on component mount/dismount
  useEffect(() => {
    void setupTauriEventListeners()
    void getWiresockVersion()

    // Show the app window
    if (!settings.startMinimized) {
      void invoke('show_app')
    }
  }, [])

  // Handle changes to settings
  useEffect(() => {
    // Sync the minimize to tray setting with Rust
    void invoke('set_minimize_to_tray', { value: settings.minimizeToTray })

    // Sync the log limit setting with Rust
    void invoke('set_log_limit', { value: settings.logLimit })

    // Save the updated settings to local storage
    if (isSettingsFirstChange.current) {
      // Don't need to save as its the first time retrieving the settings
      isSettingsFirstChange.current = false
    } else {
      // Save the settings to local storage
      saveSettingsToStorage(settings)
    }
  }, [settings])

  // Handle changes to tunnelManager
  useEffect(() => {
    console.log('change to tunnelManager')
    tunnelManagerRef.current = tunnelManager

    // Handle the system tray Connect menu items
    if (settings.minimizeToTray) {
      const connectMenuItems = Object.entries(tunnelManager.tunnels).map(([tunnelId, tunnel]) => [
        tunnelId,
        tunnel.name,
      ])

      console.log('Updating system tray connect menu items')
      void invoke('update_systray_connect_menu_items', { items: connectMenuItems })
    }

    // Save the updated tunnels to local storage
    if (isTunnelManagerFirstChange.current) {
      // Don't need to save as its the first time retrieving the tunnel manager data
      isTunnelManagerFirstChange.current = false
    } else {
      // Save the settings to local storage
      saveTunnelsToStorage(tunnelManager.tunnels)
    }
  }, [tunnelManager])

  // Handle changes to selectedTunnelID
  useEffect(() => {
    if (isSelectedTunnelIDFirstChange.current) {
      // Don't need to save as its the first time retrieving the selectedTunnelID
      isSelectedTunnelIDFirstChange.current = false
    } else {
      if (selectedTunnelID !== null) {
        saveSelectedTunnelIDToStorage(selectedTunnelID)
      } else {
        deleteSelectedTunnelIDKeyFromStorage()
      }
    }
  }, [selectedTunnelID])

  // Handles changes to wiresockState
  useEffect(() => {
    const prevTunnelStatus = prevTunnelStatusRef.current
    const currentTunnelStatus = wiresockState?.tunnel_status

    // Update the ref with the new tunnel status
    prevTunnelStatusRef.current = currentTunnelStatus

    if (!hasRunAutoConnect && wiresockState !== null && wiresockState.wiresock_status === 'STOPPED') {
      setHasRunAutoConnect(true)

      // Auto connect a tunnel if one is set
      if (settings.autoConnectTunnelID !== '') {
        // There is an auto connect tunnel so get its details from settings
        enableTunnel(settings.autoConnectTunnelID)
      }
    }

    // Update the system tray icon
    if (wiresockState !== null && prevTunnelStatus === 'DISCONNECTED' && currentTunnelStatus === 'CONNECTED') {
      // Show a connected icon
      void invoke('change_icon', { enabled: true })

      // Get the name of the currently connected tunnel
      const connectedTunnel = tunnelManager.getTunnel(wiresockState.tunnel_id)

      // Show the currently connected tunnel name in the system tray tooltip
      void invoke('change_systray_tooltip', { tooltip: `Connected: ${connectedTunnel?.name}` })

      // Update the system tray menu to add a disconnect option
      console.log('sending update_systray_menu to rust')
      void invoke('add_or_update_systray_menu_item', { itemId: 'disconnect', itemLabel: 'Disconnect' })
    } else if (wiresockState !== null && prevTunnelStatus === 'CONNECTED' && currentTunnelStatus === 'DISCONNECTED') {
      // Show a disconnected icon
      void invoke('change_icon', { enabled: false })

      // Update the system tray tooltip to show tunnel is disconnected
      void invoke('change_systray_tooltip', { tooltip: 'TunnlTo: Disconnected' })

      // Remove the disconnect option from the system tray menu
      void invoke('remove_systray_menu_item', { itemId: 'disconnect', itemLabel: 'Disconnect' })
    }
  }, [wiresockState])

  /* ------------------------- */
  /* ------- functions ------- */
  /* ------------------------- */

  async function getWiresockVersion(): Promise<void> {
    console.log('Checking Wiresock version')

    const result: string = await invoke('get_wiresock_version')

    if (result === 'wiresock_not_installed') {
      console.log('WireSock is not installed')
      setWiresockInstallDetails(new WiresockInstallDetails(false, '', false))
      return
    }

    console.log('Wiresock installed version:', result)
    if (result === WIRESOCK_VERSION) {
      console.log('Supported version of WireSock is installed')
      setWiresockInstallDetails(new WiresockInstallDetails(true, result, true))
    } else {
      console.log('Unsupported WireSock version installed')
      setWiresockInstallDetails(new WiresockInstallDetails(true, result, false))
    }
  }

  // Listen for events emitted by Tauri with updates to the wiresock_state
  async function setupTauriEventListeners(): Promise<void> {
    console.log('Setting up wiresock_state listener')

    await listen('wiresock_state', function (event) {
      console.log('Received new wiresock_state event')
      setWiresockState(event.payload as WiresockStateModel)
    })

    // Listen for when items are clicked in the system tray "Connect" menu
    await listen('systray_connect_menu_clicked', function (event) {
      console.log('Received new systray_connect_menu_clicked event')
      const tunnelId = event.payload as string // Event payload is tunnel id
      enableTunnel(tunnelId)
    })

    console.log('Retrieving wiresock_state from Tauri')
    await invoke('get_wiresock_state')
  }

  function enableTunnel(tunnelId: string): void {
    // Retrieve the tunnel data from the tunnelManager ref.
    // If we retrieve it directly from tunnelManager, the data will be stale
    // as it is locked to when the listener was initiated.
    const tunnelData = tunnelManagerRef.current.getTunnel(tunnelId)

    if (tunnelData != null) {
      invoke('enable_wiresock', {
        tunnel: tunnelData,
        logLevel: settings.logLevel,
      }).catch((error) => {
        // Handle any issues starting the wiresock_process or the tunnel connecting
        console.error('Invoking enable_wiresock returned error: ', error)
      })
    } else {
      console.error('Tunnel not found for ID:', tunnelId)
    }
  }

  async function disableTunnel(): Promise<void> {
    // Send the message down to Tauri Rust function to close the wiresock process
    // - Tauri will emit an event when the wiresock process finishes
    // - The event is received by the JavaScript Tauri listen implementations.
    try {
      console.log('Sending disable_wiresock command to Tauri')
      await invoke('disable_wiresock')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <React.StrictMode>
      <div>
        <Router>
          <Routes>
            {wiresockInstallDetails === null ? (
              <Route path="*" element={<div>Loading...</div>} />
            ) : wiresockInstallDetails?.isSupportedVersion ? (
              /* Supported version of WireSock is installed, so show the main components */
              <Route
                path="/"
                element={
                  <div>
                    <Sidebar
                      tunnelManager={tunnelManager}
                      selectedTunnelID={selectedTunnelID}
                      wiresockState={wiresockState}
                      setSelectedTunnelID={setSelectedTunnelID}
                    />
                    {
                      /* If selectedTunnelID and wiresockState are not null, render the TunnelDisplay component */
                      selectedTunnelID !== null && wiresockState !== null ? (
                        <TunnelDisplay
                          selectedTunnelID={selectedTunnelID}
                          wiresockState={wiresockState}
                          enableTunnel={enableTunnel}
                          disableTunnel={disableTunnel}
                          tunnelManager={tunnelManager}
                        />
                      ) : /* If selectedTunnelID or wiresockState are null, check if tunnelManager.tunnels is empty */
                      Object.keys(tunnelManager.tunnels ?? {}).length === 0 ? (
                        /* If tunnelManager.tunnels is empty, render the GetStarted component */
                        <GetStarted />
                      ) : /* If tunnelManager.tunnels is not empty, render nothing */
                      null
                    }
                  </div>
                }
              />
            ) : (
              /* Unsupported version of Wiresock installed, so send user to setup component */
              <Route
                path="/"
                element={
                  <div className="flex min-h-screen justify-center">
                    <Setup
                      wiresockInstallDetails={wiresockInstallDetails}
                      setWiresockInstallDetails={setWiresockInstallDetails}
                    />
                  </div>
                }
              />
            )}
            <Route
              path="/edit"
              element={
                <div className="flex min-h-screen justify-center">
                  <TunnelEditor
                    tunnelManager={tunnelManager}
                    selectedTunnelID={selectedTunnelID}
                    setSelectedTunnelID={setSelectedTunnelID}
                    setTunnelManager={setTunnelManager}
                  />
                </div>
              }
            />
            <Route
              path="/add"
              element={
                <div className="flex min-h-screen justify-center">
                  <TunnelEditor
                    tunnelManager={tunnelManager}
                    selectedTunnelID={null}
                    setSelectedTunnelID={setSelectedTunnelID}
                    setTunnelManager={setTunnelManager}
                  />
                </div>
              }
            />
            <Route
              path="/settings"
              element={
                <div className="flex min-h-screen justify-center">
                  <Settings
                    tunnelManager={tunnelManager}
                    settings={settings}
                    setSettings={setSettings}
                    wiresockInstallDetails={wiresockInstallDetails}
                  />
                </div>
              }
            />
          </Routes>
        </Router>
      </div>
    </React.StrictMode>
  )
}

root.render(<Main />)
