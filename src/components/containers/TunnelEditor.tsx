import { useState, useRef } from 'react'
import Tunnel from '../../models/Tunnel.ts'
import { useNavigate } from 'react-router-dom'
import DeleteModal from '../DeleteModal.tsx'
import { ExclamationTriangleIcon, EyeIcon, EyeSlashIcon, LinkIcon } from '@heroicons/react/24/outline'
import type TunnelManager from '../../models/TunnelManager.ts'

interface ConfigProps {
  tunnelManager: TunnelManager
  selectedTunnel: Tunnel | null
  setSelectedTunnel: (tunnel: Tunnel | null) => void
  setTunnelManager: (tunnelManager: TunnelManager) => void
}

function TunnelEditor({
  tunnelManager,
  selectedTunnel,
  setSelectedTunnel,
  setTunnelManager,
}: ConfigProps): JSX.Element {
  /* ------------------------- */
  /* ------- useState -------- */
  /* ------------------------- */

  const [wasValidated, setWasValidated] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPrivateKeyHidden, setIsPrivateKeyHidden] = useState(true)
  const [isPublicKeyHidden, setIsPublicKeyHidden] = useState(true)
  const [isPresharedKeyHidden, setIsPresharedKeyHidden] = useState(true)
  const [editedTunnel, setEditedTunnel] = useState<Tunnel>(() => {
    // If a tunnel is passed in we are editing it, otherwise we are creating a new tunnel
    if (selectedTunnel === null) {
      const newTunnel = new Tunnel(tunnelManager.getTunnelIDList())
      return newTunnel
    } else {
      return selectedTunnel
    }
  })

  /* ------------------------- */
  /* ------- variables ------- */
  /* ------------------------- */

  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)

  /* ------------------------- */
  /* ------- functions ------- */
  /* ------------------------- */

  function toggleKeyVisibility(key: 'privateKey' | 'publicKey' | 'presharedKey'): void {
    if (key === 'privateKey') {
      setIsPrivateKeyHidden(!isPrivateKeyHidden)
    } else if (key === 'publicKey') {
      setIsPublicKeyHidden(!isPublicKeyHidden)
    } else if (key === 'presharedKey') {
      setIsPresharedKeyHidden(!isPresharedKeyHidden)
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    const { name, value } = event.target
    const keys = name.split('.')

    if (keys.length === 1) {
      if (keys[0] === 'name') {
        setEditedTunnel({ ...editedTunnel, name: value ?? '' })
      }
    } else if (keys.length === 2) {
      if (keys[0] === 'interface') {
        setEditedTunnel({
          ...editedTunnel,
          interface: { ...editedTunnel?.interface, [keys[1]]: value },
        })
      } else if (keys[0] === 'peer') {
        setEditedTunnel({ ...editedTunnel, peer: { ...editedTunnel?.peer, [keys[1]]: value } })
      }
    } else if (keys.length === 3) {
      if (keys[0] === 'rules') {
        if (keys[1] === 'allowed' || keys[1] === 'disallowed') {
          setEditedTunnel({
            ...editedTunnel,
            rules: {
              ...editedTunnel?.rules,
              [keys[1]]: {
                ...editedTunnel?.rules[keys[1]],
                [keys[2]]: value,
              },
            },
          })
        }
      }
    }
  }

  function handleDeleteButtonClick(): void {
    setIsDeleteModalOpen(true)
  }

  function handleUserDeleteDecision(decision: 'delete' | 'cancel'): void {
    if (decision === 'delete') {
      deleteTunnel()
      navigate('/')
    }
  }

  function deleteTunnel(): void {
    tunnelManager.removeTunnel(editedTunnel.id)
    setTunnelManager(tunnelManager)
    setSelectedTunnel(null)
  }

  function saveTunnel(): void {
    tunnelManager.addTunnel(editedTunnel)
    setTunnelManager(tunnelManager)
    setSelectedTunnel(editedTunnel)
  }

  function handleNameCheck(): void {
    const tunnelNames = tunnelManager.getTunnelNames()
    const currentTunnelName = editedTunnel.name

    const isNameUsedByAnotherTunnel = tunnelNames.includes(currentTunnelName)
    setNameError(isNameUsedByAnotherTunnel)
  }

  function handleSaveButtonClick(event: React.FormEvent): void {
    event?.preventDefault() // Prevent form from submitting

    if (formRef.current?.checkValidity() === true && !nameError) {
      // Form is valid
      saveTunnel()

      navigate('/')
    } else {
      // Form is not valid
      setWasValidated(true)
    }
  }

  function handleCancelButtonClick(): void {
    navigate('/')
  }

  return (
    <div className="container py-12 px-8">
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
        }}
        onDecision={handleUserDeleteDecision}
      />

      {/* Page Title section **/}
      <h1 className="text-2xl font-semibold leading-7 text-gray-900">Tunnel Config</h1>

      <div className="flex flex-row items-center gap-2 mt-4">
        <LinkIcon className="h-4 w-4 text-gray-600" />
        <a
          href="https://github.com/TunnlTo/desktop-app#documentation"
          target="_blank"
          className="text-sm leading-6 text-gray-600 hover:text-gray-900"
          rel="noreferrer"
        >
          Documentation
        </a>
      </div>

      <div className="flex flex-row items-center gap-2 mb-6 mt-2">
        <LinkIcon className="h-4 w-4 text-gray-600" />
        <a
          href="https://github.com/TunnlTo/desktop-app#example-configurations"
          target="_blank"
          className="text-sm leading-6 text-gray-600 hover:text-gray-900"
          rel="noreferrer"
        >
          Examples
        </a>
      </div>

      <form ref={formRef} className="space-y-4">
        {/* Beginning of Tunnel Name section **/}
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-12 border-b border-gray-900/10 pb-7">
          <div className="sm:col-span-6">
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
              Name
            </label>
            <input
              value={editedTunnel?.name}
              onChange={handleInputChange}
              onBlur={handleNameCheck}
              type="text"
              name="name"
              id="name"
              required
              className={`${
                wasValidated ? 'invalid:ring-pink-600' : ''
              } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
            />
          </div>
          <div className="sm:col-span-6 flex items-end mb-1">
            <div className={`${nameError ? 'visible' : 'invisible'} flex gap-x-2 items-center`}>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              <p className="text-red-600 text-sm">This name is already in use.</p>
            </div>
          </div>
        </div>
        {/* End of Tunnel Name section **/}

        {/* Beginning of Local Interface section **/}
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-12 border-b border-gray-900/10 pb-7">
          <div className="col-span-full">
            <h2 className="text-base font-semibold leading-7 text-gray-900 pt-2">Local Interface</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Configure the local network interface.</p>
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="interface.ipAddress" className="block text-sm font-medium leading-6 text-gray-900">
              IP Address
            </label>
            <div className="mt-2 flex rounded-md shadow-sm">
              <input
                value={editedTunnel?.interface?.ipAddress}
                onChange={handleInputChange}
                type="text"
                name="interface.ipAddress"
                id="interface.ipAddress"
                required
                className={`${
                  wasValidated ? 'invalid:ring-pink-600' : ''
                } block w-full min-w-0 flex-1 rounded-none rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 px-3 text-gray-500 sm:text-sm">
                /32
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="interface.port" className="block text-sm font-medium leading-6 text-gray-900">
              Port
            </label>
            <div className="mt-2">
              <input
                value={editedTunnel?.interface?.port}
                onChange={handleInputChange}
                type="text"
                name="interface.port"
                id="interface.port"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="sm:col-span-full">
            <label
              htmlFor="interface.privateKey"
              className="text-sm font-medium leading-6 text-gray-900 flex items-center"
            >
              Private Key
              <button
                type="button"
                onClick={() => {
                  toggleKeyVisibility('privateKey')
                }}
                className="inline-block ml-2"
              >
                {isPrivateKeyHidden ? (
                  <EyeIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </label>
            <div className="mt-2">
              <input
                value={editedTunnel?.interface?.privateKey}
                onChange={handleInputChange}
                type={isPrivateKeyHidden ? 'password' : 'text'}
                name="interface.privateKey"
                id="interface.privateKey"
                required
                className={`${
                  wasValidated ? 'invalid:ring-pink-600' : ''
                } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
              />
            </div>
          </div>

          <div className="sm:col-span-3 space-y-4">
            <label htmlFor="interface.dns" className="block text-sm font-medium leading-6 text-gray-900">
              DNS
            </label>
            <div className="mt-2">
              <input
                value={editedTunnel?.interface?.dns}
                onChange={handleInputChange}
                type="text"
                name="interface.dns"
                id="interface.dns"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>

            <label htmlFor="interface.mtu" className="block text-sm font-medium leading-6 text-gray-900">
              MTU
            </label>
            <div className="mt-2">
              <input
                value={editedTunnel?.interface?.mtu}
                onChange={handleInputChange}
                placeholder="1420"
                type="text"
                name="interface.mtu"
                id="interface.mtu"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>
        {/* End of Local Interface section **/}

        {/* Beginning of Peer section **/}
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-12 border-b border-gray-900/10 pb-7">
          <div className="col-span-full">
            <h2 className="text-base font-semibold leading-7 text-gray-900 pt-2">Remote Peer</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Details of the remote WireGuard peer.</p>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="peer.endpoint" className="block text-sm font-medium leading-6 text-gray-900">
              Endpoint
            </label>
            <div className="mt-2">
              <input
                value={editedTunnel?.peer?.endpoint}
                onChange={handleInputChange}
                type="text"
                name="peer.endpoint"
                id="peer.endpoint"
                required
                className={`${
                  wasValidated ? 'invalid:ring-pink-600' : ''
                } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="peer.port" className="block text-sm font-medium leading-6 text-gray-900">
              Port
            </label>
            <div className="mt-2">
              <input
                value={editedTunnel?.peer?.port}
                onChange={handleInputChange}
                type="text"
                name="peer.port"
                id="peer.port"
                required
                className={`${
                  wasValidated ? 'invalid:ring-pink-600' : ''
                } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
              />
            </div>
          </div>

          <div className="sm:col-span-full">
            <label htmlFor="peer.publicKey" className="text-sm font-medium leading-6 text-gray-900 flex items-center">
              Public Key
              <button
                type="button"
                onClick={() => {
                  toggleKeyVisibility('publicKey')
                }}
                className="inline-block ml-2"
              >
                {isPublicKeyHidden ? (
                  <EyeIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </label>
            <div className="mt-2">
              <input
                defaultValue={editedTunnel?.peer?.publicKey}
                onChange={handleInputChange}
                type={isPublicKeyHidden ? 'password' : 'text'}
                name="peer.publicKey"
                id="peer.publicKey"
                required
                className={`${
                  wasValidated ? 'invalid:ring-pink-600' : ''
                } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
              />
            </div>
          </div>

          <div className="sm:col-span-full">
            <label
              htmlFor="peer.presharedKey"
              className="text-sm font-medium leading-6 text-gray-900 flex items-center"
            >
              Preshared Key
              <button
                type="button"
                onClick={() => {
                  toggleKeyVisibility('presharedKey')
                }}
                className="inline-block ml-2"
              >
                {isPresharedKeyHidden ? (
                  <EyeIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </label>
            <div className="mt-2">
              <input
                defaultValue={editedTunnel?.peer?.presharedKey}
                onChange={handleInputChange}
                type={isPresharedKeyHidden ? 'password' : 'text'}
                name="peer.presharedKey"
                id="peer.presharedKey"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="peer.persistentKeepalive" className="block text-sm font-medium leading-6 text-gray-900">
              Persistent Keep-Alive
            </label>
            <div className="mt-2">
              <input
                value={editedTunnel?.peer?.persistentKeepalive}
                placeholder="25"
                onChange={handleInputChange}
                type="text"
                name="peer.persistentKeepalive"
                id="peer.persistentKeepalive"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>
        {/* End of Peer section **/}

        {/* Beginning of Rules section **/}
        <div className="border-b border-gray-900/10 pb-8 pt-4">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Rules</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Configure what should and should not route through the tunnel.
          </p>

          {/* Beginning of Allow/Disallow section **/}
          <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            {/* Beginning of Allow section **/}
            <div className="sm:col-span-3 sm:border-e sm:border-gray-900/10 mt-4 sm:pe-10">
              <h2 className="text-base font-semibold leading-7 text-gray-900">Allow</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">What will be routed through the tunnel.</p>

              <label htmlFor="rules.allowed.apps" className="block text-sm font-medium leading-6 text-gray-900 mt-6">
                Apps
              </label>
              <div className="mt-2">
                <textarea
                  value={editedTunnel?.rules?.allowed.apps}
                  onChange={handleInputChange}
                  id="rules.allowed.apps"
                  name="rules.allowed.apps"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <label htmlFor="rules.allowed.folders" className="block text-sm font-medium leading-6 text-gray-900 mt-4">
                Folders
              </label>
              <div className="mt-2">
                <textarea
                  value={editedTunnel?.rules?.allowed.folders}
                  onChange={handleInputChange}
                  id="rules.allowed.folders"
                  name="rules.allowed.folders"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <label
                htmlFor="rules.allowed.ipAddresses"
                className="block text-sm font-medium leading-6 text-gray-900 mt-4"
              >
                IP Addresses
              </label>
              <div className="mt-2">
                <textarea
                  value={editedTunnel?.rules?.allowed.ipAddresses}
                  onChange={handleInputChange}
                  id="rules.allowed.ipAddresses"
                  name="rules.allowed.ipAddresses"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            {/* End of Allow section **/}

            {/* Beginning of Disallow section **/}
            <div className="sm:col-span-3 sm:ps-4">
              <h2 className="text-base font-semibold leading-7 text-gray-900 mt-4">Disallow</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">What won&apos;t be routed through the tunnel.</p>

              <label htmlFor="rules.disallowed.apps" className="block text-sm font-medium leading-6 text-gray-900 mt-6">
                Apps
              </label>
              <div className="mt-2">
                <textarea
                  value={editedTunnel?.rules?.disallowed.apps}
                  onChange={handleInputChange}
                  id="rules.disallowed.apps"
                  name="rules.disallowed.apps"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <label
                htmlFor="rules.disallowed.folders"
                className="block text-sm font-medium leading-6 text-gray-900 mt-4"
              >
                Folders
              </label>
              <div className="mt-2">
                <textarea
                  value={editedTunnel?.rules?.disallowed.folders}
                  onChange={handleInputChange}
                  id="rules.disallowed.folders"
                  name="rules.disallowed.folders"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <label
                htmlFor="rules.disallowed.ipAddresses"
                className="block text-sm font-medium leading-6 text-gray-900 mt-4"
              >
                IP Addresses
              </label>
              <div className="mt-2">
                <textarea
                  value={editedTunnel?.rules?.disallowed.ipAddresses}
                  onChange={handleInputChange}
                  id="rules.disallowed.ipAddresses"
                  name="rules.disallowed.ipAddresses"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            {/* End of Disalllow section **/}
          </div>
          {/* End of Allow/Disallow section **/}
        </div>
        {/* End of rules section **/}
      </form>

      {/* Beginning of bottom buttons section **/}
      <div className="mt-6 flex align-center items-center">
        <div className={`${wasValidated ? 'visible' : 'invisible'} flex flex-row flex-auto gap-x-2 items-center`}>
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          <p className="text-red-600 text-sm">Some required fields are empty.</p>
        </div>

        <div className="flex justify-end gap-x-6">
          <button
            onClick={handleCancelButtonClick}
            type="button"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Cancel
          </button>
          {selectedTunnel !== null && (
            <button
              onClick={handleDeleteButtonClick}
              type="button"
              className="text-sm font-semibold leading-6 text-red-600"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            onClick={handleSaveButtonClick}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Save
          </button>
        </div>
      </div>
      {/* End of bottom buttons section **/}
    </div>
  )
}

export default TunnelEditor
