import type { Multiaddr } from "@multiformats/multiaddr"
import type { PeerId } from "@libp2p/interface"

/**
 * - pending - just discovered
 * - connecting - we are connecting to this node
 * - ready - node is compatible & ready to be connected to
 * - failed - failed to connect to this node
 * - incompatible - node is running an incompatible version of inspector-metrics
 * - connected - we have connected to this node
 */
export type InspectTargetStatus = 'pending' | 'ready' | 'failed' | 'incompatible' | 'connecting' | 'connected'

export interface InspectTarget {
  id: PeerId
  multiaddrs: Multiaddr[]
  status: InspectTargetStatus
  error?: string
  name: string
  version: string
  userAgent: string
  inspector: string
}

/**
 * The IPC API defined in ./preload.ts
 */
export interface InspectorIPC {
  onTargets(callback: (targets: InspectTarget[]) => void): void
  onConnected(callback: (err: Error | undefined) => void): void
  onRPC(callback: (message: Uint8Array) => void): void

  connect(address: string | PeerId): void
  cancelConnect(): void
  disconnect(): void
  sendRPC(message: Uint8Array): void
}
