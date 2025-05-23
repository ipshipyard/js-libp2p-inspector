import { createConnection } from 'node:net'
import { SOURCE_CLIENT } from '@ipshipyard/libp2p-inspector-metrics'
import { Queue } from '@libp2p/utils/queue'
import { encode, decode } from 'it-length-prefixed'
import { pushable } from 'it-pushable'
import { base64 } from 'multiformats/bases/base64'
import { raceSignal } from 'race-signal'
import { duplex } from 'stream-to-it'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import type { Events } from './events.ts'
import type { InspectTargetStatus } from '../ipc/index.ts'
import type { InspectorMessage } from '@ipshipyard/libp2p-inspector-metrics'
import type { AbortOptions, PeerId } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Pushable } from 'it-pushable'

/**
 * A remote process running the inspector metrics
 */
export class Target {
  public status: InspectTargetStatus
  public error?: string
  public id: PeerId
  public multiaddrs: Multiaddr[]
  public name: string
  public version: string
  public userAgent: string
  public inspector: string
  private queue: Queue
  private source?: Pushable<Uint8Array>
  private events: Events

  constructor (id: PeerId, events: Events) {
    this.status = 'pending'
    this.id = id
    this.multiaddrs = []
    this.name = ''
    this.version = ''
    this.userAgent = ''
    this.inspector = ''
    this.events = events

    this.queue = new Queue({
      concurrency: 1
    })
  }

  toJSON (): Record<string, unknown> {
    return {
      id: this.id,
      multiaddrs: this.multiaddrs,
      status: this.status,
      error: this.error,
      name: this.name,
      version: this.version,
      userAgent: this.userAgent,
      inspector: this.inspector
    }
  }

  addAddress (ma: Multiaddr): void {
    if (this.multiaddrs.find(addr => addr.equals(ma))) {
      return
    }

    this.multiaddrs.push(ma)
    this.queue.add(this.openConnection.bind(this, ma))
  }

  sendMessage (buf: Uint8Array): void {
    this.source?.push(uint8ArrayFromString(JSON.stringify({
      source: SOURCE_CLIENT,
      type: 'libp2p-rpc',
      message: base64.encode(buf)
    })))
  }

  connect (): void {
    this.setStatus('connected')
  }

  disconnect (): void {
    this.setStatus('ready')
  }

  setStatus (status: InspectTargetStatus): void {
    this.status = status
    this.events.updateTargets()
  }

  private async openConnection (ma: Multiaddr, options?: AbortOptions): Promise<void> {
    if (this.status !== 'pending' && this.status !== 'failed') {
      return
    }

    this.setStatus('connecting')

    try {
      await raceSignal(this._openConnection(ma, options), AbortSignal.timeout(5_000))
    } catch (err) {
      this.setStatus('failed')
    }
  }

  private async _openConnection (ma: Multiaddr, options?: AbortOptions): Promise<void> {
    const result = Promise.withResolvers<void>()

    const socket = createConnection(ma.toOptions(), () => {
      this.source = pushable()

      const duplexSocket = duplex(socket)

      Promise.all([
        duplexSocket.sink(encode(this.source)),
        (async () => {
          for await (const buf of decode(duplexSocket.source)) {
            try {
              const message: InspectorMessage = JSON.parse(uint8ArrayToString(buf.subarray()))

              if (message.type === 'libp2p-identify') {
                // got identify response
                this.setStatus('ready')
                this.name = message.name
                this.version = message.version
                this.userAgent = message.userAgent
                this.inspector = message.inspector

                result.resolve()
              } else if (message.type === 'libp2p-rpc') {
                if (this.status === 'connected') {
                  // got RPC message
                  this.events.receiveRPC(base64.decode(message.message))
                }
              } else {
                throw new Error(`Unknown message - ${message}`)
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('could not parse message', buf.toString(), err)
            }
          }
        })()
      ])
        .catch(err => {
          result.reject(err)
        })

      // send identify
      this.source.push(uint8ArrayFromString(JSON.stringify({
        source: SOURCE_CLIENT,
        type: 'libp2p-identify'
      })))
    })
    socket.on('close', async () => {
      this.setStatus('failed')
    })
    socket.on('error', (err: any) => {
      this.setStatus('failed')
      result.reject(err)
    })

    return result.promise
  }
}
