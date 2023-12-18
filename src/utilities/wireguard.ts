import nacl from 'tweetnacl'
import { encodeBase64 } from 'tweetnacl-util'

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const keyPair = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  }
}

export function derivePublicKey(privateKeyBase64: string): string {
  try {
    const binaryString = atob(privateKeyBase64)
    const privateKey = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      privateKey[i] = binaryString.charCodeAt(i)
    }
    const keyPair = nacl.box.keyPair.fromSecretKey(privateKey)
    return encodeBase64(keyPair.publicKey)
  } catch (error) {
    // If an error occurs (such as if the input is not a valid base64 string)
    return ''
  }
}
