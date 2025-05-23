import { enable, disable } from '@libp2p/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { gatherCapabilities } from '../utils/gather-capabilities.js'
import { getComponent } from '../utils/get-implementation.ts'
import { getPeers } from '../utils/get-peers.js'
import { getPubSub } from '../utils/get-pubsub.js'
import { getSelf } from '../utils/get-self.js'
import type { MetricsRPC } from './index.js'
import type { InspectorMetricsComponents } from '../index.js'
import type { Identify } from '@libp2p/identify'
import type { PeerId } from '@libp2p/interface'
import type { Ping } from '@libp2p/ping'
import type { Multiaddr } from '@multiformats/multiaddr'

function toPeerIdOrMultiaddr (peerIdOrMultiaddr: string): PeerId | Multiaddr {
  let peer: PeerId | Multiaddr

  try {
    peer = peerIdFromString(peerIdOrMultiaddr)
  } catch {
    peer = multiaddr(peerIdOrMultiaddr)
  }

  return peer
}

export function metricsRpc (components: InspectorMetricsComponents): MetricsRPC {
  const log = components.logger.forComponent('libp2p:devtools-metrics:metrics-rpc')
  let debug = globalThis.localStorage?.getItem('debug') ?? process.env.DEBUG ?? ''

  return {
    init: async () => {
      return {
        self: await getSelf(components),
        peers: await getPeers(components, log),
        debug,
        capabilities: gatherCapabilities(components)
      }
    },
    setDebug: async (namespace?) => {
      if (namespace?.length != null && namespace?.length > 0) {
        enable(namespace)
        globalThis.localStorage?.setItem('debug', namespace)
      } else {
        disable()
        globalThis.localStorage?.removeItem('debug')
      }

      debug = namespace ?? ''
    },
    openConnection: async (peerIdOrMultiaddr, options?) => {
      const peer = toPeerIdOrMultiaddr(peerIdOrMultiaddr)
      const conn = await components.connectionManager.openConnection(peer, options)

      return {
        id: conn.id,
        remoteAddr: conn.remoteAddr,
        remotePeer: conn.remotePeer,
        tags: conn.tags,
        direction: conn.direction,
        timeline: conn.timeline,
        multiplexer: conn.multiplexer,
        encryption: conn.encryption,
        status: conn.status,
        limits: conn.limits,
        rtt: conn.rtt
      }
    },
    closeConnection: async (peerId, options?) => {
      await Promise.all(
        components.connectionManager.getConnections(peerId)
          .map(async connection => {
            try {
              await connection.close(options)
            } catch (err: any) {
              connection.abort(err)
            }
          })
      )
    },
    contentRouting: components.contentRouting,
    peerRouting: components.peerRouting,
    pubsub: {
      async getTopics (component) {
        return getPubSub(component, components).getTopics()
      },
      async subscribe (component, topic) {
        getPubSub(component, components).subscribe(topic)
      },
      async unsubscribe (component, topic) {
        getPubSub(component, components).unsubscribe(topic)
      },
      async publish (component, topic, message) {
        await getPubSub(component, components).publish(topic, message)
      },
      async getSubscribers (component: string, topic: string) {
        return getPubSub(component, components).getSubscribers(topic)
      }
    },
    ping: async (component, peerIdOrMultiaddr, options) => {
      const ping = getComponent<Ping>(component, components, '@libp2p/ping')
      const peer = toPeerIdOrMultiaddr(peerIdOrMultiaddr)

      return ping.ping(peer, options)
    },
    identify: async (component, peerIdOrMultiaddr, options) => {
      const identify = getComponent<Identify>(component, components, '@libp2p/identify')
      const peer = toPeerIdOrMultiaddr(peerIdOrMultiaddr)
      const connection = await components.connectionManager.openConnection(peer, options)

      return identify.identify(connection, options)
    }
  }
}
