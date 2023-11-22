import type Tunnel from '../../models/Tunnel.ts'
import type SettingsModel from '../../models/SettingsModel.ts'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getSettingsFromStorage, saveSettingsInStorage } from '../../utilities/storageUtils.ts'
import { enable, isEnabled, disable } from 'tauri-plugin-autostart-api'

interface SettingsProps {
  tunnels: Record<string, Tunnel> | null
}

function Settings({ tunnels }: SettingsProps): JSX.Element {
  const [settings, setSettings] = useState<SettingsModel>(() => {
    return getSettingsFromStorage()
  })

  const navigate = useNavigate()

  function handleSaveButtonClick(): void {
    void enableAutoStart()
    saveSettingsInStorage(settings)
    navigate('/')
  }

  async function enableAutoStart(): Promise<void> {
    try {
      // Note: If trying to enable autostart when its already enabled, it returns a system cannot find specified file error,
      //       so we check if its current status first to avoid the error 
      const isAutoStartEnabled: boolean = await isEnabled()
      console.log('AutoStart enabled:', isAutoStartEnabled)
      
      if (settings.autoStart && !isAutoStartEnabled) {
        // Handle user turning on autostart
        await enable()

        console.log(`registered for autostart? ${await isEnabled()}`)
      } else if (!settings.autoStart && isAutoStartEnabled) {
        // User has turned off autostart and it is enabled
        await disable()

        console.log(`registered for autostart? ${await isEnabled()}`)
      }
    } catch (error) {
      console.error(error)
    }
  }

  function handleCancelButtonClick(): void {
    navigate('/')
  }

  function handleSettingChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const { name, value } = event.target

    // Handle checkboxes so they save as booleans instead of "on" or "off"
    if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
      setSettings({ ...settings, [name]: event.target.checked ?? '' })
    } else {
      setSettings({ ...settings, [name]: value ?? '' })
    }
  }

  return (
    <div className="flex justify-center flex-col">
      {/* Page Title section **/}
      <h1 className="text-2xl font-semibold leading-7 text-gray-900">Settings</h1>

      {/* Beginning of options section **/}
      <div className="my-6 divide-y border-y border-gray-200 divide-gray-200">
        <div className="sm:flex items-center py-6">
          <div className="flex-auto sm:w-96 mb-6 sm:mb-0">
            <label htmlFor="autoStart" className="block text-sm font-medium leading-6 text-gray-900">
              Auto Start
            </label>
            <p className="mt-1 text-sm leading-6 text-gray-600">Start TunnlTo when Windows starts.</p>
          </div>
          <input
            id="autoStart"
            checked={settings?.autoStart}
            onChange={handleSettingChange}
            name="autoStart"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        </div>

        <div className="sm:flex items-center py-6">
          <div className="flex-auto sm:w-96 mb-6 sm:mb-0">
            <label htmlFor="autoConnectTunnelID" className="block text-sm font-medium leading-6 text-gray-900">
              Auto Connect
            </label>
            <p className="mt-1 text-sm leading-6 text-gray-600">Connect a tunnel on app start.</p>
          </div>
          <select
            id="autoConnectTunnelID"
            value={settings?.autoConnectTunnelID}
            onChange={handleSettingChange}
            name="autoConnectTunnelID"
            className="block rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">Disabled</option>
            {tunnels != null &&
              Object.values(tunnels).map((tunnel, index) => (
                <option key={index} value={tunnel.id}>
                  {tunnel.name}
                </option>
              ))}
          </select>
        </div>
      </div>
      {/* End of options section **/}

      {/* Beginning of bottom button section **/}
      <div className="flex justify-end gap-x-6 ml-auto">
        <button
          onClick={handleCancelButtonClick}
          type="button"
          className="text-sm font-semibold leading-6 text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSaveButtonClick}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save
        </button>
      </div>
      {/* End of bottom button section **/}
    </div>
  )
}

export default Settings
