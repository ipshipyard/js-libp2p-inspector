import { cidCodec } from './codecs/cid.js'
import { customProgressEventCodec } from './codecs/custom-progress-event.js'
import { multiaddrCodec } from './codecs/multiaddr.js'
import { peerIdCodec } from './codecs/peer-id.js'
import type { ContentRouting, PeerId, PeerRouting, AbortOptions, IdentifyResult, Direction, ConnectionTimeline, ConnectionStatus, ConnectionLimits } from '@libp2p/interface'
import type { OpenConnectionOptions } from '@libp2p/interface-internal'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { ValueCodec } from 'it-rpc'

export const valueCodecs: Array<ValueCodec<any>> = [
  cidCodec,
  multiaddrCodec,
  peerIdCodec,
  customProgressEventCodec
]

export interface PeerAddress {
  multiaddr: Multiaddr
  isConnected?: boolean
  isCertified?: boolean
}

export interface Peer {
  /**
   * The identifier of the remote peer
   */
  id: PeerId

  /**
   * The list of addresses the peer has that we know about
   */
  addresses: PeerAddress[]

  /**
   * Any peer store tags the peer has
   */
  tags: Record<string, number>

  /**
   * Any peer store metadata the peer has
   */
  metadata: Record<string, string>

  /**
   * The protocols the peer supports, if known
   */
  protocols: string[]
}

export interface Connection {
  id: string
  remoteAddr: Multiaddr
  remotePeer: PeerId
  tags: string[]
  direction: Direction
  timeline: ConnectionTimeline
  multiplexer?: string
  encryption?: string
  status: ConnectionStatus
  limits?: ConnectionLimits
  rtt?: number
}

/**
 * RPC operations exposed by the metrics
 */
export interface MetricsRPC {
  /**
   * Called by DevTools on initial connect
   */
  init(options?: AbortOptions): Promise<{ self: Peer, peers: Peer[], debug: string, capabilities: Record<string, string[]> }>

  /**
   * Update the currently active debugging namespaces
   */
  setDebug(namespace?: string): Promise<void>

  /**
   * Open a connection to the passed peer or multiaddr
   */
  openConnection(peerIdOrMultiaddr: string, options?: OpenConnectionOptions): Promise<Connection>

  /**
   * Close connections open to the specified peer
   */
  closeConnection(peerId: PeerId, options?: AbortOptions): Promise<void>

  /**
   * Make content routing queries
   */
  contentRouting: ContentRouting

  /**
   * Make peer routing queries
   */
  peerRouting: PeerRouting

  /**
   * PubSub operations
   */
  pubsub: {
    /**
     * Subscribe to a PubSub topic
     */
    subscribe(component: string, topic: string): Promise<void>

    /**
     * Unsubscribe from a PubSub topic
     */
    unsubscribe(component: string, topic: string): Promise<void>

    /**
     * Get the list of subscriptions for the current node
     */
    getTopics (component: string): Promise<string[]>

    /**
     * Get the list of peers we know about who subscribe to the topic
     */
    getSubscribers (component: string, topic: string): Promise<PeerId[]>

    /**
     * Publish a message to a given topic
     */
    publish (component: string, topic: string, message: Uint8Array): Promise<void>
  },

  /**
   * Ping a remote node and return the RTT
   */
  ping(component: string, peerIdOrMultiaddr: string, options?: AbortOptions): Promise<number>

  identify(component: string, peerIdOrMultiaddr: string, options?: AbortOptions): Promise<IdentifyResult>
}

export interface InspectorRPCEvents {
  /**
   * Node metrics have been updated
   */
  metrics: CustomEvent<Record<string, any>>

  /**
   * The node's status has changed - new addresses and/or protocols, etc
   */
  self: CustomEvent<Peer>

  /**
   * The node's connected peers have changed
   */
  peers: CustomEvent<Peer[]>
}

/**
 * RPC operations exposed by the DevTools
 */
export interface InspectorRPC {
  safeDispatchEvent<Detail>(type: keyof InspectorRPCEvents, detail?: CustomEventInit<Detail>, options?: AbortOptions): Promise<void>
}
