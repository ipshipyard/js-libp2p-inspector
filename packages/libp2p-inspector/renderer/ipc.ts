import { peerIdFromString } from "@libp2p/peer-id"
import { multiaddr } from "@multiformats/multiaddr"
import type { PeerId } from "@libp2p/interface"
import type { InspectorIPC, InspectTarget } from "../ipc/index.ts"

declare global {
  var inspector: InspectorIPC
}

class RendererIPC implements InspectorIPC {
  onTargets(callback: (targets: InspectTarget[]) => void): void {
    // register for updates from main thread
    globalThis.inspector.onTargets((targets: any[]) => {
      callback(targets.map(node => ({
        ...node,
        id: peerIdFromString(node.id),
        multiaddrs: node.multiaddrs.map((ma: string) => multiaddr(ma))
      })))
    })
  }

  onConnected(callback: (err: Error | undefined) => void): void {
    globalThis.inspector.onConnected((err) => {
      console.info('wat', err)

      callback(err)
    })
  }
  onRPC(callback: (message: Uint8Array) => void): void {
    globalThis.inspector.onRPC((message) => {
      callback(message)
    })
  }

  connect(address: string | PeerId): void {
    globalThis.inspector.connect(address.toString())
  }

  cancelConnect(): void {
    globalThis.inspector.cancelConnect()
  }

  disconnect(): void {
    globalThis.inspector.disconnect()
  }

  sendRPC(message: Uint8Array): void {
    globalThis.inspector.sendRPC(message)
  }
}

export function rendererIPC (): InspectorIPC {
  return new RendererIPC()
}
