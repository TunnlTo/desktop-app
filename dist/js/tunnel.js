// Define the object
function Tunnel (
  name,
  privateKey,
  interfaceAddress,
  dns,
  publicKey,
  endpoint,
  allowedApps,
  disallowedApps,
  allowedIPs,
  disallowedIPs,
  mtu) {
  this.name = name
  this.privateKey = privateKey
  this.interfaceAddress = interfaceAddress
  this.dns = dns
  this.publicKey = publicKey
  this.endpoint = endpoint
  this.allowedApps = allowedApps
  this.disallowedApps = disallowedApps
  this.allowedIPs = allowedIPs
  this.disallowedIPs = disallowedIPs
  this.mtu = mtu
}

// Export the object
export default Tunnel
