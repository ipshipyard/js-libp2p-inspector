import { base64 } from 'multiformats/bases/base64'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

export function getAgent (metadata: Record<string, string>): string {
  if (metadata.AgentVersion != null) {
    return uint8ArrayToString(base64.decode(metadata.AgentVersion))
  }

  return ''
}
