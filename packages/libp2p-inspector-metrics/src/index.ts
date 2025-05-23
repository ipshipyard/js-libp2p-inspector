/**
 * @packageDocumentation
 *
 * Configure your browser-based libp2p node with DevTools metrics:
 *
 * ```typescript
 * import { createLibp2p } from 'libp2p'
 * import { devToolsMetrics } from '@ipshipyard/libp2p-inspector-metrics'
 *
 * const node = await createLibp2p({
 *   metrics: devToolsMetrics()
 * })
 * ```
 *
 * Then use the [DevTools plugin](https://github.com/ipfs-shipyard/js-libp2p-devtools)
 * for Chrome or Firefox to inspect the state of your running node.
 */

import { isPubSub, serviceCapabilities, start, stop } from '@libp2p/interface'
import { simpleMetrics } from '@libp2p/simple-metrics'
import { pipe } from 'it-pipe'
import { pushable } from 'it-pushable'
import { rpc } from 'it-rpc'
import { base64 } from 'multiformats/bases/base64'
import manifest from '../package.json' with { type: 'json' }
import { messages } from './messages/index.js'
import { valueCodecs } from './rpc/index.js'
import { metricsRpc } from './rpc/rpc.js'
import { debounce } from './utils/debounce.js'
import { findCapability } from './utils/find-capability.js'
import { getPeers } from './utils/get-peers.js'
import { getSelf } from './utils/get-self.js'
import type { Messages } from './messages/index.js'
import type { InspectorRPC } from './rpc/index.js'
import type { ComponentLogger, Connection, Libp2pEvents, Logger, Metrics, MultiaddrConnection, PeerId, PeerStore, Stream, ContentRouting, PeerRouting, TypedEventTarget, Startable, Message, SubscriptionChangeData, NodeInfo } from '@libp2p/interface'
import type { TransportManager, Registrar, ConnectionManager, AddressManager } from '@libp2p/interface-internal'
import type { Pushable } from 'it-pushable'
import type { RPC } from 'it-rpc'

export * from './rpc/index.js'

export const SOURCE_CLIENT = '@ipshipyard/libp2p-inspector-metrics:client'
export const SOURCE_METRICS = '@ipshipyard/libp2p-inspector-metrics:metrics'
export const LIBP2P_INSPECTOR_METRICS_KEY = '________ipshipyard_libp2p_inspector_metrics'

// let inspector know we are here
Object.defineProperty(globalThis, LIBP2P_INSPECTOR_METRICS_KEY, {
  value: true,
  enumerable: false,
  writable: false
})

// don't wait for inspector RPC forever
const RPC_TIMEOUT = 10_000

/**
 * Sent by the client to discover basic node info & versions
 */
export interface IdentifyMessage {
  source: typeof SOURCE_CLIENT
  type: 'libp2p-identify'
}

/**
 * Sent to the client to let it know basic node info & versions
 */
export interface IdentifyResponse {
  source: typeof SOURCE_METRICS
  type: 'libp2p-identify',
  name: string
  version: string
  userAgent: string
  inspector: string
}

/**
 * Invoke a method on the libp2p object
 */
export interface RPCMessage {
  source: typeof SOURCE_CLIENT | typeof SOURCE_METRICS
  type: 'libp2p-rpc'

  /**
   * The RPC message encoded as a multibase string
   */
  message: string
}

/**
 * Messages that are sent from the inspector to the client
 */
export type InspectorMessage = IdentifyResponse | RPCMessage

/**
 * Messages that are sent from the client to the inspector
 */
export type ClientMessage = IdentifyMessage | RPCMessage

export interface Address {
  /**
   * The multiaddr this address represents
   */
  multiaddr: string

  /**
   * If `true`, this multiaddr came from a signed peer record
   */
  isCertified?: boolean

  /**
   * If `true`, the current node has an active connection to this peer via this
   * address
   */
  isConnected?: boolean
}

export interface InspectorMetricsInit {
  /**
   * How often to pass metrics to the DevTools panel
   */
  intervalMs?: number

  /**
   * When used under Node.js this is the mDNS service tag that is advertised
   *
   * @default '_libp2p_inspector_metrics._tcp.local'
   */
  serviceTag?: string

  /**
   * How to accept/publish RPC messages.
   *
   * `window` - uses the [window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
   * API so communicate with a browser plugin (only available in browsers).
   *
   * `mdns` - start a TCP socket and advertise it to local connections via the
   * `_libp2p_inspector_metrics._tcp.local` service tag (not available in
   * browsers)
   *
   * `libp2p` - accept incoming libp2p streams with the `/libp2p/devtools/1.0.0`
   * protocol
   *
   * Defaults to `window` in browsers and `mdns` in Node.js
   *
   * @default 'window|mdns'
   */
  rpc?: 'mdns' | 'window' | 'libp2p'
}

export interface InspectorMetricsComponents {
  logger: ComponentLogger
  events: TypedEventTarget<Libp2pEvents>
  peerId: PeerId
  transportManager: TransportManager
  registrar: Registrar
  connectionManager: ConnectionManager
  peerStore: PeerStore
  nodeInfo: NodeInfo
  contentRouting: ContentRouting
  peerRouting: PeerRouting
  addressManager: AddressManager
}

class InspectorMetrics implements Metrics, Startable {
  private readonly log: Logger
  private readonly components: InspectorMetricsComponents
  private readonly simpleMetrics: Metrics
  private readonly intervalMs?: number
  private readonly rpcQueue: Pushable<Uint8Array>
  private readonly rpc: RPC
  private readonly inspector: InspectorRPC
  private readonly messages: Messages

  constructor (components: InspectorMetricsComponents, init: InspectorMetricsInit = {}) {
    this.log = components.logger.forComponent('libp2p:devtools-metrics')
    this.intervalMs = init?.intervalMs
    this.components = components

    // create RPC endpoint
    this.rpcQueue = pushable()
    this.rpc = rpc({
      valueCodecs
    })
    this.inspector = this.rpc.createClient('inspector', {
      timeout: RPC_TIMEOUT
    })
    this.messages = messages(components, init)

    // collect information on current peers and sent it to the dev tools panel
    this.onPeersUpdate = debounce(this.onPeersUpdate.bind(this), 1000)
    this.onSelfUpdate = debounce(this.onSelfUpdate.bind(this), 1000)
    this.onIncomingMessage = this.onIncomingMessage.bind(this)

    // relay pubsub messages to dev tools panel
    this.onPubSubMessage = this.onPubSubMessage.bind(this)
    this.onPubSubSubscriptionChange = this.onPubSubSubscriptionChange.bind(this)

    // collect metrics
    this.simpleMetrics = simpleMetrics({
      intervalMs: this.intervalMs,
      onMetrics: (metrics) => {
        this.inspector.safeDispatchEvent('metrics', {
          detail: metrics
        }).catch(err => {
          this.log.error('error sending metrics', err)
        })
      }
    })({})
  }

  readonly [Symbol.toStringTag] = '@ipshipyard/libp2p-inspector-metrics'

  readonly [serviceCapabilities]: string[] = [
    '@libp2p/metrics'
  ]

  trackMultiaddrConnection (maConn: MultiaddrConnection): void {
    this.simpleMetrics.trackMultiaddrConnection(maConn)
  }

  trackProtocolStream (stream: Stream, connection: Connection): void {
    this.simpleMetrics.trackProtocolStream(stream, connection)
  }

  registerMetric (name: any, options: any): any {
    return this.simpleMetrics.registerMetric(name, options)
  }

  registerMetricGroup (name: any, options: any): any {
    return this.simpleMetrics.registerMetricGroup(name, options)
  }

  registerCounter (name: any, options: any): any {
    return this.simpleMetrics.registerCounter(name, options)
  }

  registerCounterGroup (name: any, options: any): any {
    return this.simpleMetrics.registerCounterGroup(name, options)
  }

  registerHistogram (name: any, options: any): any {
    return this.simpleMetrics.registerHistogram(name, options)
  }

  registerHistogramGroup (name: any, options: any): any {
    return this.simpleMetrics.registerHistogramGroup(name, options)
  }

  registerSummary (name: any, options: any): any {
    return this.simpleMetrics.registerSummary(name, options)
  }

  registerSummaryGroup (name: any, options: any): any {
    return this.simpleMetrics.registerSummaryGroup(name, options)
  }

  createTrace (): any {
    return this.simpleMetrics.createTrace()
  }

  traceFunction <T extends (...args: any[]) => any> (name: string, fn: T, options?: any): T {
    return this.simpleMetrics.traceFunction(name, fn, options)
  }

  async start (): Promise<void> {
    // send peer updates
    this.components.events.addEventListener('peer:connect', this.onPeersUpdate)
    this.components.events.addEventListener('peer:disconnect', this.onPeersUpdate)
    this.components.events.addEventListener('peer:identify', this.onPeersUpdate)
    this.components.events.addEventListener('peer:update', this.onPeersUpdate)

    // send node status updates
    this.components.events.addEventListener('self:peer:update', this.onSelfUpdate)

    // process incoming messages from devtools
    this.messages.addEventListener('message', this.onIncomingMessage)

    // create rpc target
    this.rpc.createTarget('metrics', metricsRpc(this.components))

    // start metrics
    await start(this.simpleMetrics, this.messages)

    // send RPC messages
    Promise.resolve()
      .then(async () => {
        await pipe(
          this.rpcQueue,
          this.rpc,
          async source => {
            for await (const buf of source) {
              this.messages.postMessage({
                source: SOURCE_METRICS,
                type: 'libp2p-rpc',
                message: base64.encode(buf)
              })
            }
          }
        )
      })
      .catch(err => {
        this.log.error('error while reading RPC messages', err)
      })

    const pubsub = findCapability('@libp2p/pubsub', this.components)

    if (isPubSub(pubsub)) {
      pubsub.addEventListener('message', this.onPubSubMessage)
      pubsub.addEventListener('subscription-change', this.onPubSubSubscriptionChange)
    }
  }

  async stop (): Promise<void> {
    this.messages.removeEventListener('message', this.onIncomingMessage)
    this.components.events.removeEventListener('self:peer:update', this.onSelfUpdate)
    this.components.events.removeEventListener('peer:connect', this.onPeersUpdate)
    this.components.events.removeEventListener('peer:disconnect', this.onPeersUpdate)
    this.components.events.removeEventListener('peer:identify', this.onPeersUpdate)
    this.components.events.removeEventListener('peer:update', this.onPeersUpdate)
    await stop(this.simpleMetrics, this.messages)
  }

  private onIncomingMessage (event: MessageEvent<ClientMessage>): void {
    // Only accept messages from same frame
    // @ts-expect-error types are wonky
    if (event.source !== this.messages) {
      return
    }

    const message = event.data

    // Only accept messages of correct format (our messages)
    if (message?.source !== SOURCE_CLIENT) {
      return
    }

    // respond to identify message without invoking RPC since it will be used by
    // the client to understand what version of RPC we support

    if (message.type === 'libp2p-identify') {
      // @ts-expect-error wat
      this.messages.postMessage({
        source: SOURCE_METRICS,
        type: 'libp2p-identify',
        name: this.components.nodeInfo.name,
        version: this.components.nodeInfo.version,
        userAgent: this.components.nodeInfo.userAgent,
        inspector: manifest.version
      })

      return
    }

    if (message.type === 'libp2p-rpc') {
      this.rpcQueue.push(base64.decode(message.message))
    }
  }

  private onPubSubMessage (event: CustomEvent<Message>): void {
    this.inspector.safeDispatchEvent('pubsub:message', {
      detail: event.detail
    })
      .catch(err => {
        this.log.error('error relaying pubsub message', err)
      })
  }

  private onPubSubSubscriptionChange (event: CustomEvent<SubscriptionChangeData>): void {
    this.inspector.safeDispatchEvent('pubsub:subscription-change', {
      detail: event.detail
    })
      .catch(err => {
        this.log.error('error relaying pubsub subscription change', err)
      })
  }

  private onSelfUpdate (): void {
    Promise.resolve()
      .then(async () => {
        await this.inspector.safeDispatchEvent('self', {
          detail: await getSelf(this.components)
        })
      })
      .catch(err => {
        this.log.error('error sending peers message', err)
      })
  }

  private onPeersUpdate (): void {
    Promise.resolve()
      .then(async () => {
        await this.inspector.safeDispatchEvent('peers', {
          detail: await getPeers(this.components, this.log)
        })
      })
      .catch(err => {
        this.log.error('error sending peers message', err)
      })
  }
}

export function inspectorMetrics (init?: Partial<InspectorMetricsInit>): (components: InspectorMetricsComponents) => Metrics {
  return (components) => {
    return new InspectorMetrics(components, init)
  }
}
