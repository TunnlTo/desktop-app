import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import type SettingsModel from './models/SettingsModel.ts'
import type Tunnel from './models/Tunnel.ts'
import { invoke } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event'
import type WiresockStateModel from './models/WiresockStateModel.ts'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/containers/Sidebar.tsx'
import TunnelDisplay from './components/containers/TunnelDisplay.tsx'
import TunnelEditor from './components/containers/TunnelEditor.tsx'
import {
  getSelectedTunnelIDFromStorage,
  getTunnelFromStorage,
  getSettingsFromStorage,
  saveSelectedTunnelIDInStorage,
  convertOldData,
} from './utilities/storageUtils.ts'
import Settings from './components/containers/Settings.tsx'
import Setup from './components/containers/Setup.tsx'
import TunnelManager from './models/TunnelManager.ts'

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
  const [tunnelManager, setTunnelManager] = useState(new TunnelManager())

  // For deciding where to route
  const [supportedWiresockInstalled, setSupportedWiresockInstalled] = useState<boolean | null>(null)

  // Keep track of which tunnel the UI is showing
  const [selectedTunnelID, setSelectedTunnelID] = useState<string | null>(() => {
    // Retrieve the selected tunnel ID from storage
    return getSelectedTunnelIDFromStorage() ?? null
  })

  /* ------------------------- */
  /* ------- useEffect ------- */
  /* ------------------------- */

  // Functions to run on component mount/dismount
  useEffect(() => {
    void setupTauriEventListener()
    void getWiresockVersion()

    const updatedTunnelManager = convertOldData(tunnelManager)
    if (updatedTunnelManager !== null) {
      setTunnelManager(updatedTunnelManager)
    }
  }, [])

  // Monitor selectedTunnelID for changes
  useEffect(() => {
    if (selectedTunnelID !== null) {
      saveSelectedTunnelIDInStorage(selectedTunnelID)
    }
  }, [selectedTunnelID])

  // Wait for wiresockState data to arrive from Tauri
  // Auto connect a tunnel if one is set
  useEffect(() => {
    if (!hasRunAutoConnect && wiresockState !== null && wiresockState.wiresock_status === 'STOPPED') {
      setHasRunAutoConnect(true)

      // Get the auto connect setting
      const settings: SettingsModel = getSettingsFromStorage()

      if (settings.autoConnectTunnelID !== '') {
        // There is an auto connect tunnel so get its details from settings
        const tunnel: Tunnel | null = getTunnelFromStorage(settings.autoConnectTunnelID)
        if (tunnel !== null) {
          enableTunnel(tunnel)
        }
      }
    }
  }, [wiresockState])

  /* ------------------------- */
  /* ------- functions ------- */
  /* ------------------------- */

  async function getWiresockVersion(): Promise<void> {
    console.log('Checking Wiresock version')

    const result = await invoke('get_wiresock_version')

    if (result === 'wiresock_not_installed') {
      console.log('WireSock is not installed')
      setSupportedWiresockInstalled(false)
      return
    }

    console.log('Wiresock version is ', result)
    if (result === '1.2.32.1') {
      console.log('Supported version of Wiresock installed')
      setSupportedWiresockInstalled(true)
    } else {
      console.log('An unsupported version of Wiresock is installed')
      setSupportedWiresockInstalled(false)
    }
  }

  async function setupTauriEventListener(): Promise<void> {
    console.log('Setting up wiresock_state listener')

    await listen('wiresock_state', function (event) {
      console.log('New wiresock_state event.payload received: ', event.payload)
      setWiresockState(event.payload as WiresockStateModel)
    })

    console.log('Retrieving wiresock_state from Tauri')
    await invoke('get_wiresock_state')
  }

  function enableTunnel(tunnelData?: Tunnel): void {
    // use tunnelData if provided, otherwise use selectedTunnel
    invoke('enable_wiresock', {
      tunnel: tunnelData ?? (selectedTunnelID != null ? tunnelManager.getTunnel(selectedTunnelID) : null),
    }).catch((error) => {
      // Handle any issues starting the wiresock_process or the tunnel connecting
      console.error('Invoking enable_wiresock returned error: ', error)
    })
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
            {supportedWiresockInstalled === null ? (
              <Route path="*" element={<div>Loading...</div>} />
            ) : supportedWiresockInstalled ? (
              <Route
                path="/"
                element={
                  <div className="flex min-h-screen w-full bg-gray-100">
                    <div>
                      <Sidebar
                        tunnelManager={tunnelManager}
                        selectedTunnelID={selectedTunnelID}
                        wiresockState={wiresockState}
                        setSelectedTunnelID={setSelectedTunnelID}
                      />
                    </div>
                    {selectedTunnelID !== null && (
                      <TunnelDisplay
                        selectedTunnelID={selectedTunnelID}
                        wiresockState={wiresockState}
                        enableTunnel={enableTunnel}
                        disableTunnel={disableTunnel}
                        tunnelManager={tunnelManager}
                      />
                    )}
                  </div>
                }
              />
            ) : (
              <Route
                path="/"
                element={
                  <div className="flex min-h-screen justify-center">
                    <Setup
                      supportedWiresockInstalled={supportedWiresockInstalled}
                      setSupportedWiresockInstalled={setSupportedWiresockInstalled}
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
                  <Settings tunnelManager={tunnelManager} />
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
