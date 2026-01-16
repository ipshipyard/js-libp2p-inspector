import { inspectorMetrics } from '@ipshipyard/libp2p-inspector-metrics'
import { webRTCDirect } from '@libp2p/webrtc'
import { createLibp2p } from 'libp2p'
import type { Libp2p, Libp2pOptions } from 'libp2p'

export function getLibp2p (config: Libp2pOptions = {}): Promise<Libp2p> {
  return createLibp2p({
    metrics: inspectorMetrics(),
    addresses: {
      listen: [
        '/ip4/0.0.0.0/udp/0/webrtc-direct'
      ]
    },
    transports: [
      webRTCDirect()
    ],
    ...config
  })
}
