import { Cog6ToothIcon, ChatBubbleBottomCenterTextIcon, BugAntIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import type WiresockStateModel from '../../models/WiresockStateModel.ts'
import type TunnelManager from '../../models/TunnelManager.ts'
import { PlusIcon } from '@heroicons/react/24/solid'

interface SidebarProps {
  tunnelManager: TunnelManager | null
  selectedTunnelID: string | null
  wiresockState: WiresockStateModel | null
  setSelectedTunnelID: (tunnelID: string) => void
}

function Sidebar({ tunnelManager, selectedTunnelID, wiresockState, setSelectedTunnelID }: SidebarProps): JSX.Element {
  const { tunnels } = tunnelManager ?? {}
  const menuItems = Object.keys(tunnels ?? {})
  const navigate = useNavigate()

  function handleAddTunnelButtonClick(): void {
    navigate('/add')
  }

  function handleSettingsButtonClick(): void {
    navigate('/settings')
  }

  return (
    <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6">
        <h1 className="text-4xl font-semibold text-white pt-8">TunnlTo</h1>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-4">
            <li>
              <ul role="list" className="-mx-2 space-y-1 cursor-pointer">
                {menuItems.map((id) => (
                  <li
                    key={id}
                    className={`${
                      selectedTunnelID === id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold`}
                    onClick={() => {
                      setSelectedTunnelID(id)
                    }}
                  >
                    <span className="truncate">{tunnels?.[id]?.name ?? 'Undefined'}</span>
                    {wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === id ? (
                      <span
                        className="ml-auto bg-green-400/30 text-green-400 rounded-full p-1 my-auto"
                        aria-hidden="true"
                      >
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>

            {Object.keys(tunnels ?? {}).length !== 0 ? (
              <div className="border-t border-gray-500/10">
                <ul role="list" className="-mx-2 space-y-1 pt-4">
                  <li>
                    <button
                      type="button"
                      onClick={handleAddTunnelButtonClick}
                      className="w-full text-gray-400 hover:text-white hover:bg-gray-800 flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800">
                        <PlusIcon className="h-4 w-4 text-green-400" aria-hidden="true" />
                      </span>
                      <span className="truncate">Create Tunnel</span>
                    </button>
                  </li>
                </ul>
              </div>
            ) : null}

            <ul role="list" className="-mx-2 space-y-1 mt-auto pb-4">
              <li>
                <a
                  href="https://github.com/TunnlTo/desktop-app/discussions/110"
                  target="_blank"
                  className="flex"
                  rel="noreferrer"
                >
                  <button
                    type="button"
                    className="w-full text-gray-400 hover:text-white hover:bg-gray-800 flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border  border-gray-700 bg-gray-800">
                      <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-purple-400" aria-hidden="true" />
                    </span>
                    <span className="truncate">Feedback</span>
                  </button>
                </a>

                <a
                  href="https://github.com/TunnlTo/desktop-app/issues"
                  target="_blank"
                  className="flex"
                  rel="noreferrer"
                >
                  <button
                    type="button"
                    className="w-full text-gray-400 hover:text-white hover:bg-gray-800 flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border  border-gray-700 bg-gray-800">
                      <BugAntIcon className="h-4 w-4 text-pink-400" aria-hidden="true" />
                    </span>
                    <span className="truncate">Issues</span>
                  </button>
                </a>

                <button
                  type="button"
                  onClick={handleSettingsButtonClick}
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800 flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border  border-gray-700 bg-gray-800">
                    <Cog6ToothIcon className="h-4 w-4 text-blue-400" aria-hidden="true" />
                  </span>
                  <span className="truncate">Settings</span>
                </button>
              </li>
            </ul>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar
