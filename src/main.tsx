import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import type SettingsModel from './models/SettingsModel.ts'
import Tunnel from './models/Tunnel.ts'
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
  getAllTunnelsFromStorage,
  getSettingsFromStorage,
  saveSelectedTunnelIDInStorage,
  saveAllTunnelsInStorage,
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

  // Get the tunnel configs from local storage
  const [tunnels, setTunnels] = useState<Record<string, Tunnel>>(getAllTunnelsFromStorage())

  // Keep track of which tunnel the UI is showing
  const [selectedTunnel, setSelectedTunnel] = useState<Tunnel | null>(() => {
    // Retrieve the selected tunnel id from local storage
    const selectedTunnelID = getSelectedTunnelIDFromStorage()

    // Retrieve the associated tunnel data
    return selectedTunnelID != null ? getTunnelFromStorage(selectedTunnelID) : null
  })

  /* ------------------------- */
  /* ------- useEffect ------- */
  /* ------------------------- */

  // Functions to run on component mount/dismount
  useEffect(() => {
    void checkWiresockInstalled()
    void setupTauriEventListener()
    convertOldData()
  }, [])

  // Monitor selectedTunnel for changes
  useEffect(() => {
    if (selectedTunnel !== null) {
      saveSelectedTunnelIDInStorage(selectedTunnel.id)
    }
  }, [selectedTunnel])

  // Monitor tunnels for changes
  useEffect(() => {
    if (tunnels !== null) {
      saveAllTunnelsInStorage(tunnels)
    }
  }, [tunnels])

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

  // Convert local storage data for versions <1.0.0 to the 1.0.0 data structure changes.
  function convertOldData(): void {
    // Get all keys from local storage
    const keys = Object.keys(localStorage)

    // Remove the old selectedTunnel key
    localStorage.removeItem('selectedTunnel')

    // Filter keys that start with 'tunnel-wireguard-'
    const oldTunnelKeys = keys.filter((key) => key.startsWith('tunnel-wireguard-'))

    // Iterate over each old tunnel key
    oldTunnelKeys.forEach((oldTunnelKey) => {
      // Get the old tunnel data from local storage
      const oldTunnelData = localStorage.getItem(oldTunnelKey)

      if (oldTunnelData != null) {
        // Parse the old tunnel data into a JavaScript object
        const oldTunnel = JSON.parse(oldTunnelData)

        // Create a new Tunnel object and assign the old tunnel data to it
        const newTunnel = new Tunnel(tunnels)
        newTunnel.name = oldTunnel.name

        // Interface

        newTunnel.interface.privateKey = oldTunnel.privateKey
        newTunnel.interface.dns = oldTunnel.dns
        newTunnel.interface.mtu = oldTunnel.mtu
        // The /32 is no longer required
        const [interfaceIpAddress] = oldTunnel.interfaceAddress.split('/')
        newTunnel.interface.ipAddress = interfaceIpAddress

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

        // Save the new tunnel
        saveTunnelInStorage(tunnels, newTunnel)
        console.log(`Migrated tunnel "${oldTunnel.name}" to TunnlTo v1.0.0 data structure.`)

        // Update the tunnels useState
        setTunnels(getAllTunnelsFromStorage())

        // Delete the old tunnel from local storage
        localStorage.removeItem(oldTunnelKey)
        console.log(`Removed old version of "${oldTunnel.name}" tunnel data from local storage.`)
      }
    })
  }

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
                        tunnels={tunnels}
                        selectedTunnel={selectedTunnel}
                        wiresockState={wiresockState}
                        setSelectedTunnel={setSelectedTunnel}
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
                    setSelectedTunnel={setSelectedTunnel}
                    setTunnels={setTunnels}
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
                    setSelectedTunnel={setSelectedTunnel}
                    setTunnels={setTunnels}
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
