import React, { useState, useEffect, useRef } from 'react'
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
  convertInterfaceIPAddresses,
  saveSettingsInStorage,
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
  /* -------- useRef --------- */
  /* ------------------------- */
  const isFirstRender = useRef(true)

  /* ------------------------- */
  /* ------- useState -------- */
  /* ------------------------- */

  // For keeping track of the state of the wiresock process and tunnel connection status emitted from Tauri.
  const [wiresockState, setWiresockState] = useState<WiresockStateModel | null>(null)

  // Keep track of whether auto connect has already fired. Don't want it running again on component reload.
  const [hasRunAutoConnect, setHasRunAutoConnect] = useState(false)

  // Get the tunnels from local storage
  const [tunnelManager, setTunnelManager] = useState(new TunnelManager())

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
  /* ------- useEffect ------- */
  /* ------------------------- */

  useEffect(() => {
    // Don't need to save settings after they're first retrieved from storage
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    console.log('Saving settings to local storage')
    saveSettingsInStorage(settings)
  }, [settings])

  // Functions to run on component mount/dismount
  useEffect(() => {
    void setupTauriEventListener()
    void getWiresockVersion()

    // Handle <1.0.0 > 1.0.0 tunnel data structure changes
    const convertOldResult = convertOldData(tunnelManager)
    if (convertOldResult !== null) {
      // Update tunnelManager state with converted data
      setTunnelManager(convertOldResult)
    }

    // Handle 1.0.0 > 1.0.1 tunnel data structure changes
    // Use functional update form of setState to ensure we're working with the most recent state
    setTunnelManager((currentTunnelManager) => {
      // Convert interface IP addresses and update state
      const convertInterfaceResult = convertInterfaceIPAddresses(currentTunnelManager)
      return convertInterfaceResult ?? currentTunnelManager
    })

    // Handle 1.0.3 adding logLevel to settings data
    if (settings.logLevel === undefined) {
      setSettings({ ...settings, logLevel: 'debug' })
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
      logLevel: settings.logLevel
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
                  <Settings tunnelManager={tunnelManager} settings={settings} setSettings={setSettings} wiresockInstallDetails={wiresockInstallDetails} />
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
