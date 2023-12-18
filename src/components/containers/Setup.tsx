import { useState } from 'react'
import { invoke } from '@tauri-apps/api'
import WiresockInstallDetails from '../../models/WiresockInstallDetails'
import { WIRESOCK_VERSION } from '../../config'

interface SetupProps {
  wiresockInstallDetails: WiresockInstallDetails
  setWiresockInstallDetails: (details: WiresockInstallDetails) => void
}

function Setup({ wiresockInstallDetails, setWiresockInstallDetails }: SetupProps): JSX.Element {
  const [errorMessage, setErrorMessage] = useState('')
  const [installing, setInstalling] = useState(false)

  function handleInstallButtonClick(): void {
    setInstalling(true)
    setErrorMessage('')
    void (async () => {
      try {
        const result: string = await invoke('install_wiresock')
        const lines = JSON.parse(result)
        for (const line of lines) {
          switch (line) {
            case '0':
              console.log('WireSock installed successfully')
              setWiresockInstallDetails(new WiresockInstallDetails(true, WIRESOCK_VERSION, true))
              break
            case '1602':
              console.log('User cancelled the installation')
              setErrorMessage('User cancelled the installation')
              break
            case '1603':
              console.log('A newer version of WireSock is installed')
              setWiresockInstallDetails(new WiresockInstallDetails(true, wiresockInstallDetails.version, false))
              setErrorMessage('A newer version of WireSock is installed')
              break
            default:
              console.log(`Unknown exit code: ${line}`)
              setErrorMessage(
                'Unknown error attempting to install WireSock. To resolve this issue, manually install WireSock. You can find the WireSock installer in the same directory where TunnlTo is installed.',
              )
          }
        }
      } catch (error) {
        console.error('Error in handleInstallButtonClick: ', error)
        const errorString: string = (error as Error).toString()
        if (errorString.includes('program not found')) {
          setErrorMessage(
            'PowerShell failed to start. To resolve this issue, manually install WireSock. You can find the WireSock installer in the same directory where TunnlTo is installed.',
          )
        } else {
          setErrorMessage(errorString)
        }
      } finally {
        setInstalling(false)
      }
    })()
  }

  return (
    <div className="flex flex-col items-center justify-center w-1/2 text-center mx-auto space-y-6">
      <div className="flex flex-col items-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold leading-7 text-gray-900">
          {!wiresockInstallDetails.isInstalled
            ? 'Install WireSock'
            : `WireSock version ${wiresockInstallDetails.version} is currently installed.`}
        </h1>
        <p className="pt-6 text-sm leading-6 text-gray-600 text-center">
          {!wiresockInstallDetails.isInstalled ? (
            'WireSock is a network driver to manage WireGuard connections and facilitate split tunneling. It is required by TunnlTo.'
          ) : (
            <>
              This version of TunnlTo integrates with WireSock {WIRESOCK_VERSION}
              <br />
              <br />
              Please uninstall the current version of WireSock, then click Install WireSock.
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={handleInstallButtonClick}
        disabled={installing}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {installing ? 'Installing...' : 'Install WireSock'}
      </button>

      <p className="text-sm leading-6 text-red-600">{errorMessage}</p>
    </div>
  )
}

export default Setup
