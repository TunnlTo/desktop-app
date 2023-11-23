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
  getTunnelsFromStorage,
  deleteSelectedTunnelIDFromStorage,
  getSettingsFromStorage,
} from './utilities/storageUtils.ts'
import Settings from './components/containers/Settings.tsx'
import Setup from './components/containers/Setup.tsx'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

function Main(): JSX.Element {
  /* ------------------------- */
  /* ------- useState -------- */
  /* ------------------------- */
  // For checking if Wiresock is installed on app launch, so we know to show the setup component or not.
  const [isWiresockInstalled, setIsWiresockInstalled] = useState<boolean | null>(null)

  // For keeping track of the state of the wiresock process and tunnel connection status emitted from Tauri.
  const [wiresockState, setWiresockState] = useState<WiresockStateModel | null>(null)

  // Keep track of whether auto connect has already fired. Don't want it running again on component reload.
  const [hasRunAutoConnect, setHasRunAutoConnect] = useState(false)

  // Keep track of which tunnel the UI is showing
  const [selectedTunnel, setSelectedTunnel] = useState<Tunnel | null>(() => {
    // Get the previously selected tunnel from settings on first load
    const selectedTunnelID = getSelectedTunnelIDFromStorage()
    if (selectedTunnelID !== null) {
      return getTunnelFromStorage(selectedTunnelID)
    } else {
      return null
    }
  })

  // Get the tunnel configs from local storage
  const [tunnels, setTunnels] = useState<Record<string, Tunnel>>(() => {
    const tunnelsFromStorage = getTunnelsFromStorage()
    const filteredTunnels = Object.fromEntries(
      Object.entries(tunnelsFromStorage).filter(([_, value]) => value !== null),
    )
    return filteredTunnels
  })

  /* ------------------------- */
  /* ------- useEffect ------- */
  /* ------------------------- */

  useEffect(() => {
    // Check if Wiresock is installed
    void checkWiresockInstalled()

    // Setup Tauri event listeners
    void setupTauriEventListener()
  }, [])

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

  async function checkWiresockInstalled(): Promise<void> {
    console.log('Checking if Wiresock is installed')

    const result = await invoke('check_wiresock_installed')

    if (result === 'WIRESOCK_INSTALLED') {
      setIsWiresockInstalled(true)
      console.log('Wiresock is installed')
    } else if (result === 'WIRESOCK_NOT_INSTALLED') {
      console.log('Wiresock is not installed. Router will load the setup component.')
      setIsWiresockInstalled(false)
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

  function parentHandleTunnelSelect(tunnel: Tunnel | null): void {
    if (tunnel === null) {
      deleteSelectedTunnelIDFromStorage()
      setSelectedTunnel(null)
    } else {
      localStorage.setItem('selectedTunnelID', tunnel.id)
      setSelectedTunnel(tunnel)
    }
    setTunnels(getTunnelsFromStorage())
  }

  function enableTunnel(tunnelData?: Tunnel): void {
    // use tunnelData if provided, otherwise use selectedTunnel
    invoke('enable_wiresock', {
      tunnel: tunnelData ?? selectedTunnel,
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
            {isWiresockInstalled === null ? (
              <Route path="*" element={<div>Loading...</div>} />
            ) : isWiresockInstalled ? (
              <Route
                path="/"
                element={
                  <div className="flex min-h-screen w-full bg-gray-100">
                    <div>
                      <Sidebar
                        childHandleTunnelSelect={parentHandleTunnelSelect}
                        tunnels={tunnels}
                        selectedTunnel={selectedTunnel}
                        wiresockState={wiresockState}
                      />
                    </div>
                    {selectedTunnel !== null && (
                      <TunnelDisplay
                        selectedTunnel={selectedTunnel}
                        wiresockState={wiresockState}
                        enableTunnel={enableTunnel}
                        disableTunnel={disableTunnel}
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
                    <Setup setIsWiresockInstalled={setIsWiresockInstalled} />
                  </div>
                }
              />
            )}
            <Route
              path="/edit"
              element={
                <div className="flex min-h-screen justify-center">
                  <TunnelEditor
                    tunnels={tunnels}
                    selectedTunnel={selectedTunnel}
                    childHandleTunnelSelect={parentHandleTunnelSelect}
                  />
                </div>
              }
            />
            <Route
              path="/add"
              element={
                <div className="flex min-h-screen justify-center">
                  <TunnelEditor
                    tunnels={tunnels}
                    selectedTunnel={null}
                    childHandleTunnelSelect={parentHandleTunnelSelect}
                  />
                </div>
              }
            />
            <Route
              path="/settings"
              element={
                <div className="flex min-h-screen justify-center">
                  <Settings tunnels={tunnels} />
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
