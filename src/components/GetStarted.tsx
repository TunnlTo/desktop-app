import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

function GetStarted(): JSX.Element {
  const navigate = useNavigate()

  function handleCreateTunnelButtonClick(): void {
    navigate('/add')
  }

  return (
    <main className="pl-72">
      <div className="flex text-center justify-center items-center flex-col min-h-screen">
        <PlusCircleIcon className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
        <h3 className="mt-4 text-sm font-semibold text-gray-900">No Tunnels</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new tunnel.</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={handleCreateTunnelButtonClick}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Tunnel
          </button>
        </div>
      </div>
    </main>
  )
}

export default GetStarted
