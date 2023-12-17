import { useState, useRef, useEffect } from 'react'
import Tunnel from '../../models/Tunnel.ts'
import { useNavigate } from 'react-router-dom'
import DeleteModal from '../DeleteModal.tsx'
import { ExclamationTriangleIcon, EyeIcon, EyeSlashIcon, LinkIcon } from '@heroicons/react/24/outline'
import type TunnelManager from '../../models/TunnelManager.ts'
import { derivePublicKey, generateKeyPair } from '../../utilities/wireguard.ts'

interface ConfigProps {
  tunnelManager: TunnelManager
  selectedTunnelID: string | null
  setSelectedTunnelID: (tunnelID: string | null) => void
  setTunnelManager: (tunnelManager: TunnelManager) => void
}

function TunnelEditor({
  tunnelManager,
  selectedTunnelID,
  setSelectedTunnelID,
  setTunnelManager,
}: ConfigProps): JSX.Element {
  /* ------------------------- */
  /* ------- useState -------- */
  /* ------------------------- */

  const [wasValidated, setWasValidated] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [ipError, setIpError] = useState(false)
  const [interfacePublicKey, setInterfacePublicKey] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPrivateKeyHidden, setIsPrivateKeyHidden] = useState(true)
  const [isPublicKeyHidden, setIsPublicKeyHidden] = useState(true)
  const [isPresharedKeyHidden, setIsPresharedKeyHidden] = useState(true)
  const [editedTunnel, setEditedTunnel] = useState<Tunnel>(() => {
    // If a tunnel is passed in we are editing it, otherwise we are creating a new tunnel
    if (selectedTunnelID === null) {
      const newTunnel = new Tunnel(tunnelManager.getTunnelIDList())
      return newTunnel
    } else {
      const getTunnel = tunnelManager?.getTunnel(selectedTunnelID)
      if (getTunnel !== null) {
        return getTunnel
      } else {
        // Problem retrieving the tunnel from storage
        const newTunnel = new Tunnel(tunnelManager.getTunnelIDList())
        return newTunnel
      }
    }
  })

  /* ------------------------- */
  /* ------- variables ------- */
  /* ------------------------- */

  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)

  /* ------------------------- */
  /* ------ useEffect's ------ */
  /* ------------------------- */

  // Monitor the tunnel name to see if it is already in use
  useEffect(() => {
    const isNameUsedByAnotherTunnel = Object.values(tunnelManager.tunnels).some((tunnel) => {
      return tunnel.name === editedTunnel.name && tunnel.id !== editedTunnel.id
    })
    setNameError(isNameUsedByAnotherTunnel)
  }, [editedTunnel.name])

  // Monitor local interface ipv4 and ipv6 addresses to make sure one exists
  useEffect(() => {
    if (editedTunnel.interface.ipv4Address.length === 0 && editedTunnel.interface.ipv6Address.length === 0) {
      setIpError(true)
    } else {
      setIpError(false)
    }
  }, [editedTunnel.interface.ipv4Address, editedTunnel.interface.ipv6Address])

  // Monitor local interface private key for changes
  useEffect(() => {
    if (editedTunnel.interface.privateKey.length !== 0) {
      const publicKey = derivePublicKey(editedTunnel.interface.privateKey)
      setInterfacePublicKey(publicKey)
    }
  }, [editedTunnel.interface.privateKey])

  /* ------------------------- */
  /* ------- functions ------- */
  /* ------------------------- */

  function generateKeys(): void {
    const keys = generateKeyPair()
    setInterfacePublicKey(keys.publicKey)
    setEditedTunnel({
      ...editedTunnel,
      interface: { ...editedTunnel.interface, 'privateKey': keys.privateKey },
    })
  }

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

    // Remove any quotes from the input value
    const sanitizedValue = value.replace(/"/g, '')

    if (keys.length === 1) {
      if (keys[0] === 'name') {
        setEditedTunnel({ ...editedTunnel, name: sanitizedValue ?? '' })
      }
    } else if (keys.length === 2) {
      if (keys[0] === 'interface') {
        setEditedTunnel({
          ...editedTunnel,
          interface: { ...editedTunnel.interface, [keys[1]]: sanitizedValue },
        })
      } else if (keys[0] === 'peer') {
        setEditedTunnel({ ...editedTunnel, peer: { ...editedTunnel.peer, [keys[1]]: sanitizedValue } })
      }
    } else if (keys.length === 3) {
      if (keys[0] === 'rules') {
        if (keys[1] === 'allowed' || keys[1] === 'disallowed') {
          setEditedTunnel({
            ...editedTunnel,
            rules: {
              ...editedTunnel.rules,
              [keys[1]]: {
                ...editedTunnel.rules[keys[1]],
                [keys[2]]: sanitizedValue,
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
    setSelectedTunnelID(null)
  }

  function saveTunnel(): void {
    tunnelManager.addTunnel(editedTunnel)
    setSelectedTunnelID(editedTunnel.id)
  }

  function handleSaveButtonClick(event: React.FormEvent): void {
    event?.preventDefault() // Prevent form from submitting

    if (formRef.current?.checkValidity() === true && !nameError && !ipError) {
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

  function handleImportButtonClick(): void {
    const input = document.createElement('input')
    input.type = 'file'

    input.onchange = (_) => {
      if (input.files !== null) {
        const files = Array.from(input.files)

        for (const file of files) {
          const reader = new FileReader()

          reader.onload = function (_) {
            // Get the text in the file
            const text = this.result as string

            // Use the file name as the name of the tunnel
            const tunnelName = file.name.slice(0, file.name.lastIndexOf('.'))
            setEditedTunnel((prevState) => ({
              ...prevState,
              name: tunnelName,
            }))

            // Fill out the form data with what is in the file
            const lines = text.split('\n')
            for (let line = 0; line < lines.length; line++) {
              const lineText = lines[line]

              // Interface

              // Interface ipv4 and ipv6 addresses
              if (lineText.startsWith('Address = ')) {
                const addresses = lineText.replace('Address = ', '').split(',')
                let ipv4Address = ''
                let ipv6Address = ''

                for (const address of addresses) {
                  const trimmedAddress = address.trim()

                  if (trimmedAddress.includes('.')) {
                    // Assuming strings with . are ipv4
                    ipv4Address = trimmedAddress
                  } else if (trimmedAddress.includes(':')) {
                    // Assuming strings with : are ipv6
                    ipv6Address = trimmedAddress
                  }
                }

                setEditedTunnel((prevState) => ({
                  ...prevState,
                  interface: { ...prevState.interface, ipv4Address, ipv6Address },
                }))

                // Interface Port
              } else if (lineText.startsWith('Port = ')) {
                const x = lineText.replace('Port = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  interface: { ...prevState.interface, port: x },
                }))

                // Interface Private Key
              } else if (lineText.startsWith('PrivateKey = ')) {
                const x = lineText.replace('PrivateKey = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  interface: { ...prevState.interface, privateKey: x },
                }))

                // Interface DNS
              } else if (lineText.startsWith('DNS = ')) {
                const x = lineText.replace('DNS = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  interface: { ...prevState.interface, dns: x },
                }))

                // Interface MTU
              } else if (lineText.startsWith('MTU = ')) {
                const x = lineText.replace('MTU = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  interface: { ...prevState.interface, mtu: x },
                }))

                // Peer

                // Peer Endpoint and Port
              } else if (lineText.startsWith('Endpoint = ')) {
                const x = lineText.replace('Endpoint = ', '')

                // Split by the last colon to handle cases where a ipv6 address is used
                const lastColonIndex = x.lastIndexOf(':')
                const endpoint = x.substring(0, lastColonIndex)
                const port = x.substring(lastColonIndex + 1)
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  peer: { ...prevState.peer, endpoint, port },
                }))

                // Peer Public Key
              } else if (lineText.startsWith('PublicKey = ')) {
                const x = lineText.replace('PublicKey = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  peer: { ...prevState.peer, publicKey: x },
                }))

                // Peer Preshared Key
              } else if (lineText.startsWith('PresharedKey = ')) {
                const x = lineText.replace('PresharedKey = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  peer: { ...prevState.peer, presharedKey: x },
                }))

                // Peer Persistent Keepalive
              } else if (lineText.startsWith('PersistentKeepalive = ')) {
                const x = lineText.replace('PersistentKeepalive = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  peer: { ...prevState.peer, persistentKeepalive: x },
                }))

                // Rules (in case it is a Wiresock config)

                // Rules Allowed IP's
              } else if (lineText.startsWith('AllowedIPs = ')) {
                const x = lineText.replace('AllowedIPs = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  rules: { ...prevState.rules, allowed: { ...prevState.rules.allowed, ipAddresses: x } },
                }))

                // Rules Disallowed IP's
              } else if (lineText.startsWith('DisallowedIPs = ')) {
                const x = lineText.replace('DisallowedIPs = ', '')
                setEditedTunnel((prevState) => ({
                  ...prevState,
                  rules: { ...prevState.rules, disallowed: { ...prevState.rules.disallowed, ipAddresses: x } },
                }))

                // Rules Allowed Apps
              } else if (lineText.startsWith('AllowedApps = ')) {
                const items = lineText.replace('AllowedApps = ', '').split(',')
                let apps = ''
                let folders = ''

                for (const item of items) {
                  const trimmedItem = item.trim()
                  if (trimmedItem.includes('/') || trimmedItem.includes('\\')) {
                    folders += folders.length > 0 ? `, ${trimmedItem}` : trimmedItem
                  } else {
                    apps += apps.length > 0 ? `, ${trimmedItem}` : trimmedItem
                  }
                }

                setEditedTunnel((prevState) => ({
                  ...prevState,
                  rules: {
                    ...prevState.rules,
                    allowed: {
                      ...prevState.rules.allowed,
                      apps,
                      folders,
                    },
                  },
                }))

                // Rules Disallowed Apps
              } else if (lineText.startsWith('DisallowedApps = ')) {
                const items = lineText.replace('DisallowedApps = ', '').split(',')
                let apps = ''
                let folders = ''

                for (const item of items) {
                  const trimmedItem = item.trim()
                  if (trimmedItem.includes('/') || trimmedItem.includes('\\')) {
                    folders += folders.length > 0 ? `, ${trimmedItem}` : trimmedItem
                  } else {
                    apps += apps.length > 0 ? `, ${trimmedItem}` : trimmedItem
                  }
                }

                setEditedTunnel((prevState) => ({
                  ...prevState,
                  rules: {
                    ...prevState.rules,
                    disallowed: {
                      ...prevState.rules.disallowed,
                      apps,
                      folders,
                    },
                  },
                }))
              }
            }
          }

          reader.readAsText(file)
        }
      }
    }

    input.click()
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold leading-7 text-gray-900">Tunnel Config</h1>
        <button
          type="button"
          onClick={handleImportButtonClick}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Import
        </button>
      </div>

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
              value={editedTunnel.name}
              onChange={handleInputChange}
              type="text"
              name="name"
              id="name"
              required
              className={`${
                wasValidated || nameError ? 'invalid:ring-pink-600' : ''
              } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6`}
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

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-4 lg:col-span-3">
              <label htmlFor="interface.ipv4Address" className="block text-sm font-medium leading-6 text-gray-900">
                IPv4 Address
              </label>
              <div className="mt-2 flex rounded-md shadow-sm">
                <input
                  value={editedTunnel.interface.ipv4Address}
                  onChange={handleInputChange}
                  type="text"
                  name="interface.ipv4Address"
                  id="interface.ipv4Address"
                  spellCheck="false"
                  className={`${
                    wasValidated && ipError ? 'ring-pink-600' : ''
                  } block w-full rounded-none rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6`}
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 px-3 text-gray-500 text-sm">
                  /32
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-full sm:grid sm:grid-cols-12">
            <div className="sm:col-span-9 lg:col-span-6">
              <label htmlFor="interface.ipv6Address" className="block text-sm font-medium leading-6 text-gray-900">
                IPv6 Address
              </label>
              <div className="mt-2 flex rounded-md shadow-sm">
                <input
                  value={editedTunnel.interface.ipv6Address}
                  onChange={handleInputChange}
                  type="text"
                  name="interface.ipv6Address"
                  spellCheck="false"
                  className="block w-full rounded-none rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 px-3 text-gray-500 text-sm">
                  /128
                </span>
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-3 lg:col-span-2">
              <label htmlFor="interface.port" className="block text-sm font-medium leading-6 text-gray-900">
                Port
              </label>
              <div className="mt-2">
                <input
                  value={editedTunnel.interface.port}
                  onChange={handleInputChange}
                  type="text"
                  name="interface.port"
                  spellCheck="false"
                  id="interface.port"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-9 lg:col-span-6">
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
                <button
                  type="button"
                  onClick={generateKeys}
                  className="ml-auto rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
                >
                  Generate Keys
                </button>
              </label>
              <div className="mt-2">
                <input
                  value={editedTunnel.interface.privateKey}
                  onChange={handleInputChange}
                  type={isPrivateKeyHidden ? 'password' : 'text'}
                  name="interface.privateKey"
                  id="interface.privateKey"
                  spellCheck="false"
                  required
                  className={`${
                    wasValidated ? 'invalid:ring-pink-600' : ''
                  } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6`}
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-9 lg:col-span-6">
              <label
                htmlFor="interface.publicKey"
                className="text-sm font-medium leading-6 text-gray-900 flex items-center"
              >
                Public Key
              </label>
              <div className="mt-2">
                <input
                  value={interfacePublicKey}
                  type="text"
                  name="interface.publicKey"
                  id="interface.publicKey"
                  spellCheck="false"
                  disabled
                  readOnly
                  className="bg-slate-50 text-slate-500 border-slate-200 border-0 shadow-none block w-full rounded-md py-1.5 ring-1 ring-inset ring-gray-300 text-sm leading-6"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-9 lg:col-span-6">
              <label htmlFor="interface.dns" className="block text-sm font-medium leading-6 text-gray-900">
                DNS
              </label>
              <div className="mt-2">
                <input
                  value={editedTunnel.interface.dns}
                  onChange={handleInputChange}
                  type="text"
                  name="interface.dns"
                  spellCheck="false"
                  id="interface.dns"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-3 lg:col-span-2">
              <label htmlFor="interface.mtu" className="block text-sm font-medium leading-6 text-gray-900">
                MTU
              </label>
              <div className="mt-2">
                <input
                  value={editedTunnel.interface.mtu}
                  onChange={handleInputChange}
                  placeholder="1420"
                  type="text"
                  name="interface.mtu"
                  spellCheck="false"
                  id="interface.mtu"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                />
              </div>
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

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-4 lg:col-span-3">
              <label htmlFor="peer.endpoint" className="block text-sm font-medium leading-6 text-gray-900">
                Endpoint Address
              </label>
              <div className="mt-2">
                <input
                  value={editedTunnel.peer.endpoint}
                  onChange={handleInputChange}
                  type="text"
                  name="peer.endpoint"
                  id="peer.endpoint"
                  spellCheck="false"
                  required
                  className={`${
                    wasValidated ? 'invalid:ring-pink-600' : ''
                  } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6`}
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-3 lg:col-span-2">
              <label htmlFor="peer.port" className="block text-sm font-medium leading-6 text-gray-900">
                Port
              </label>
              <div className="mt-2">
                <input
                  value={editedTunnel.peer.port}
                  onChange={handleInputChange}
                  type="text"
                  name="peer.port"
                  id="peer.port"
                  spellCheck="false"
                  required
                  className={`${
                    wasValidated ? 'invalid:ring-pink-600' : ''
                  } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6`}
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-9 lg:col-span-6">
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
                  defaultValue={editedTunnel.peer.publicKey}
                  onChange={handleInputChange}
                  type={isPublicKeyHidden ? 'password' : 'text'}
                  name="peer.publicKey"
                  id="peer.publicKey"
                  spellCheck="false"
                  required
                  className={`${
                    wasValidated ? 'invalid:ring-pink-600' : ''
                  } block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6`}
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-9 lg:col-span-6">
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
                  defaultValue={editedTunnel.peer.presharedKey}
                  onChange={handleInputChange}
                  type={isPresharedKeyHidden ? 'password' : 'text'}
                  name="peer.presharedKey"
                  spellCheck="false"
                  id="peer.presharedKey"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-full grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-3 lg:col-span-2">
              <label
                htmlFor="peer.persistentKeepalive"
                className="block whitespace-nowrap text-sm font-medium leading-6 text-gray-900"
              >
                Persistent Keep-Alive
              </label>
              <div className="mt-2">
                <input
                  value={editedTunnel.peer.persistentKeepalive}
                  onChange={handleInputChange}
                  type="text"
                  name="peer.persistentKeepalive"
                  spellCheck="false"
                  id="peer.persistentKeepalive"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                />
              </div>
            </div>
          </div>
        </div>
        {/* End of Peer section **/}

        {/* Beginning of Rules section **/}
        <div className="border-b border-gray-900/10 pb-8 pt-4">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Rules</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Configure what should and should not route through the tunnel. Seperate entries with a comma.
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
                  value={editedTunnel.rules.allowed.apps}
                  onChange={handleInputChange}
                  id="rules.allowed.apps"
                  name="rules.allowed.apps"
                  spellCheck="false"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                />
              </div>

              <label htmlFor="rules.allowed.folders" className="block text-sm font-medium leading-6 text-gray-900 mt-4">
                Folders
              </label>
              <div className="mt-2">
                <textarea
                  value={editedTunnel.rules.allowed.folders}
                  onChange={handleInputChange}
                  id="rules.allowed.folders"
                  name="rules.allowed.folders"
                  spellCheck="false"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
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
                  value={editedTunnel.rules.allowed.ipAddresses}
                  onChange={handleInputChange}
                  id="rules.allowed.ipAddresses"
                  name="rules.allowed.ipAddresses"
                  spellCheck="false"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
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
                  value={editedTunnel.rules.disallowed.apps}
                  onChange={handleInputChange}
                  id="rules.disallowed.apps"
                  name="rules.disallowed.apps"
                  spellCheck="false"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
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
                  value={editedTunnel.rules.disallowed.folders}
                  onChange={handleInputChange}
                  id="rules.disallowed.folders"
                  name="rules.disallowed.folders"
                  spellCheck="false"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
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
                  value={editedTunnel.rules.disallowed.ipAddresses}
                  onChange={handleInputChange}
                  id="rules.disallowed.ipAddresses"
                  name="rules.disallowed.ipAddresses"
                  spellCheck="false"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
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
          <p className="text-red-600 text-sm">Some fields are not valid.</p>
          {ipError && <p className="text-red-600 text-sm">At least one interface IP address is required.</p>}
        </div>

        <div className="flex justify-end gap-x-6">
          <button
            onClick={handleCancelButtonClick}
            type="button"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Cancel
          </button>
          {selectedTunnelID !== null && (
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
