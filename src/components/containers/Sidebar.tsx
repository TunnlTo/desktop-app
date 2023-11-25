import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import type Tunnel from '../../models/Tunnel.ts'
import { useNavigate } from 'react-router-dom'
import type WiresockStateModel from '../../models/WiresockStateModel.ts'
import type TunnelManager from '../../models/TunnelManager.ts'

interface SidebarProps {
  tunnelManager: TunnelManager | null
  selectedTunnel: Tunnel | null
  wiresockState: WiresockStateModel | null
  setSelectedTunnel: (tunnel: Tunnel) => void
}

function Sidebar({ tunnelManager, selectedTunnel, wiresockState, setSelectedTunnel }: SidebarProps): JSX.Element {
  const { tunnels } = tunnelManager ?? {}
  const menuItems = Object.keys(tunnels ?? {})
  const navigate = useNavigate()

  function handleAddTunnelButtonClick(): void {
    navigate('/add')
  }

  function handleSettingsButtonClick(): void {
    navigate('/settings')
  }

  function handleListItemClick(id: string): void {
    const selectedTunnel = tunnels?.[id]
    if (selectedTunnel != null) {
      setSelectedTunnel(selectedTunnel)
    }
  }

  return (
    <div className="bg-gray-800 w-64 p-4 flex flex-col min-h-screen">
      <h1 className="text-4xl font-semibold text-gray-300 mb-8">TunnlTo</h1>
      <div className="font-medium text-gray-200 text-xs mb-4">Your tunnels</div>
      <ul className="space-y-2">
        {menuItems.map((id) => (
          <li
            key={id}
            className={`${
              selectedTunnel?.id === id ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            } rounded-md px-2 cursor-pointer text-sm font-medium py-2 flex items-center align-center`}
            onClick={() => {
              handleListItemClick(id)
            }}
          >
            {tunnels?.[id]?.name ?? ''}
            {wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === id ? (
              <span className="ml-auto bg-green-400/30 p-1 text-green-400 flex-none rounded-full" aria-hidden="true">
                <div className="h-2 w-2 rounded-full bg-current" />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleAddTunnelButtonClick}
        className="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Add Tunnel
      </button>
      <button
        type="button"
        onClick={handleSettingsButtonClick}
        className="flex items-center align-center gap-3 mt-auto ali bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-2 cursor-pointer text-sm font-medium py-2"
      >
        <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
        Settings
      </button>
    </div>
  )
}

export default Sidebar
