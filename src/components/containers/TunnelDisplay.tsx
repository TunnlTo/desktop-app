import { useNavigate } from 'react-router-dom'
import type WiresockStateModel from '../../models/WiresockStateModel.ts'
import Logs from '../Logs.tsx'
import type TunnelManager from '../../models/TunnelManager.ts'

interface ConfigProps {
  selectedTunnelID: string
  wiresockState: WiresockStateModel | null
  enableTunnel: () => void
  disableTunnel: () => Promise<void>
  tunnelManager: TunnelManager
}

function TunnelDisplay({
  selectedTunnelID,
  wiresockState,
  enableTunnel,
  disableTunnel,
  tunnelManager,
}: ConfigProps): JSX.Element {
  const navigate = useNavigate()

  function handleEditButtonClick(): void {
    navigate('/edit')
  }

  return (
    <main className="py-8 pl-72">
      <div className="px-8 flex flex-grow flex-col">
        {/* Start of the header section */}
        <div className="flex flex-col sm:flex-row">
          {/* Start of name, status and buttons */}
          <div className="flex-col mb-4 sm:mb-0">
            {/* Tunnel name */}
            <h1 className="text-xl font-semibold leading-7 text-gray-900">
              {tunnelManager?.getTunnel(selectedTunnelID)?.name}
            </h1>

            {/* Tunnel status section */}
            <div className="flex items-center align-center mt-1">
              {/* Start of Tunnel status icon */}
              <div
                className={`${
                  wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnelID
                    ? 'bg-green-400/30 p-1 text-green-400'
                    : 'text-red-400'
                } flex-none rounded-full mr-2`}
              >
                <div className="h-2 w-2 rounded-full bg-current" />
              </div>

              {/* Tunnel status description */}
              <p className="max-w-2xl text-sm leading-6 text-gray-500">
                {wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnelID
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
              disabled={wiresockState?.tunnel_id !== selectedTunnelID && wiresockState?.tunnel_status === 'CONNECTED'}
              onClick={() => {
                void (async () => {
                  if (wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnelID) {
                    await disableTunnel()
                  } else {
                    enableTunnel()
                  }
                })()
              }}
              className={`${
                wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnelID
                  ? 'bg-red-500 hover:bg-red-400 focus-visible:outline-red-500'
                  : wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id !== selectedTunnelID
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-400 focus-visible:outline-green-500'
              } w-24 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
            >
              {wiresockState?.tunnel_status === 'CONNECTED' && wiresockState.tunnel_id === selectedTunnelID
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
                {`${tunnelManager?.getTunnel(selectedTunnelID)?.peer.endpoint}:${tunnelManager?.getTunnel(
                  selectedTunnelID,
                )?.peer.port}`}
              </dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Allowed</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {/* Create an array of the values and seperate with a comma */}
                {[
                  tunnelManager?.getTunnel(selectedTunnelID)?.rules.allowed.apps,
                  tunnelManager?.getTunnel(selectedTunnelID)?.rules.allowed.folders,
                  tunnelManager?.getTunnel(selectedTunnelID)?.rules.allowed.ipAddresses,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Disallowed</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {/* Create an array of the values and seperate with a comma */}
                {[
                  tunnelManager?.getTunnel(selectedTunnelID)?.rules.disallowed.apps,
                  tunnelManager?.getTunnel(selectedTunnelID)?.rules.disallowed.folders,
                  tunnelManager?.getTunnel(selectedTunnelID)?.rules.disallowed.ipAddresses,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </dd>
            </div>
          </dl>
        </div>
        {/* End of the tunnel config data section **/}

        {/* Start of the logs section **/}
        {wiresockState?.tunnel_id === selectedTunnelID ? (
          <div className="overflow-y-auto pt-4">
            <h2 className="text-base font-semibold leading-7 text-gray-700 pb-4">Connection Logs</h2>
            <Logs wiresockState={wiresockState} />
          </div>
        ) : null}
        {/* End of the logs section **/}
      </div>
    </main>
  )
}

export default TunnelDisplay
