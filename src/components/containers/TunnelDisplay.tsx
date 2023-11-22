import type Tunnel from '../../models/Tunnel.ts'
import { useNavigate } from 'react-router-dom'
import type WiresockStateModel from '../../models/WiresockStateModel.ts'
import Logs from '../Logs.tsx'

interface ConfigProps {
  selectedTunnel: Tunnel
  wiresockState: WiresockStateModel | null
  enableTunnel: () => void
  disableTunnel: () => Promise<void>
}

function TunnelDisplay({ selectedTunnel, wiresockState, enableTunnel, disableTunnel }: ConfigProps): JSX.Element {
  const navigate = useNavigate()

  function handleEditButtonClick(): void {
    navigate('/edit')
  }

  if (wiresockState === null) {
    ;<div></div>
  }

  return (
    <main className="flex flex-grow flex-col max-h-screen p-4">
      {/* Start of the header section */}
      <div className="flex flex-col sm:flex-row">
        {/* Start of name, status and buttons */}
        <div className="flex-col mb-4 sm:mb-0">

          {/* Tunnel name */}
          <h1 className="text-xl font-semibold leading-7 text-gray-900">{selectedTunnel?.name}</h1>

          {/* Tunnel status section */}
          <div className="flex items-center align-center mt-1">

            {/* Start of Tunnel status icon */}
            <div
              className={`${
                wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnel.id
                  ? 'bg-green-400/30 p-1 text-green-400'
                  : 'text-red-400'
              } flex-none rounded-full mr-2`}
            >
              <div className="h-2 w-2 rounded-full bg-current" />
            </div>

            {/* Tunnel status description */}
            <p className="max-w-2xl text-sm leading-6 text-gray-500">
              {wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnel.id
                ? 'Enabled'
                : 'Disabled'}
            </p>
            
          </div>
          {/* End tunnel status section */}

        </div>
        {/* End of name, status and buttons */}

        {/* Start of top right buttons */}
        <div className="sm:ms-auto flex items-center justify-start sm:justify-end gap-x-6">
          {/* Edit button */}
          <button
            type="button"
            onClick={handleEditButtonClick}
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Edit
          </button>

          {/* Enable/Disable Button */}
          <button
            type="button"
            disabled={wiresockState?.tunnel_id !== selectedTunnel.id && wiresockState?.tunnel_status === 'CONNECTED'}
            onClick={() => {
              void (async () => {
                if (wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnel.id) {
                  await disableTunnel()
                } else {
                  enableTunnel()
                }
              })()
            }}
            className={`${
              wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnel.id
                ? 'bg-red-500 hover:bg-red-400 focus-visible:outline-red-500'
                : wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id !== selectedTunnel.id
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-400 focus-visible:outline-green-500'
            } w-24 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
          >
            {wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnel.id
              ? 'Disable'
              : 'Enable'}
          </button>
        </div>
        {/* End of top right buttons */}
      </div>
      {/* End of top section with name, status and buttons **/}

      {/* Start of the tunnel config data section **/}
      <div className="mt-4 border-y border-gray-200">
        <dl className="divide-y divide-gray-200">
          <div className="pt-4 pb-4 items-center sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">Peer Endpoint</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {selectedTunnel.peer.endpoint.length > 0 ? `${selectedTunnel.peer.endpoint}:` : ''}
              {selectedTunnel.peer.port}
            </dd>
          </div>
          <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">Allowed</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {selectedTunnel.rules.allowed.apps}
              {selectedTunnel.rules.allowed.folders.length > 0 ? `, ${selectedTunnel.rules.allowed.folders}` : ''}
              {selectedTunnel.rules.allowed.ipAddresses.length > 0
                ? `, ${selectedTunnel.rules.allowed.ipAddresses}`
                : ''}
            </dd>
          </div>
          <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">Disallowed</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {selectedTunnel.rules.disallowed.apps}
              {selectedTunnel.rules.disallowed.folders.length > 0 ? `, ${selectedTunnel.rules.disallowed.folders}` : ''}
              {selectedTunnel.rules.disallowed.ipAddresses.length > 0
                ? `, ${selectedTunnel.rules.disallowed.ipAddresses}`
                : ''}
            </dd>
          </div>
        </dl>
      </div>
      {/* End of the tunnel config data section **/}

      {/* Start of the logs section **/}
      {wiresockState?.tunnel_id === selectedTunnel.id ? (
        <div className="overflow-y-auto pt-4">
          <h2 className="text-base font-semibold leading-7 text-gray-700 pb-4">Connection Logs</h2>
          <Logs wiresockState={wiresockState} />
        </div>
      ) : null}
      {/* End of the logs section **/}
    </main>
  )
}

export default TunnelDisplay
