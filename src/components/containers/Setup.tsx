import { useState } from 'react'
import { invoke } from '@tauri-apps/api'

interface SetupProps {
  setIsWiresockInstalled: (isWireSockInstalled: boolean) => void
}

function Setup({ setIsWiresockInstalled }: SetupProps): JSX.Element {
  const [errorMessage, setErrorMessage] = useState('')
  const [installing, setInstalling] = useState(false)

  function handleInstallButtonClick(): void {
    setInstalling(true)
    setErrorMessage('')
    void (async () => {
      try {
        const result = await invoke('install_wiresock')
        console.info(result)
        if (result === 'WIRESOCK_INSTALLED') {
          // Tell the parent that WireSock is now installed and it will handle routing to a new page
          setIsWiresockInstalled(true)
        }
      } catch (error) {
        console.error('Error in handleInstallButtonClick: ', error)
        setErrorMessage((error as Error).toString())
        setInstalling(false)
      }
    })()
  }

  return (
    <div className="flex flex-col items-center justify-center w-2/3 mx-auto space-y-6">
      <div className="flex flex-col items-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold leading-7 text-gray-900">Setup</h1>
        <p className="pt-6 text-sm leading-6 text-gray-600 text-center">
          Installation of WireSock is required. WireSock serves as a network driver designed to manage WireGuard
          connections and facilitate split tunneling.
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
