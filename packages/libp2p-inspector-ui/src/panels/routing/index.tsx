import { useState } from 'react'
import { Menu } from '../menu.js'
import { FindPeer } from './find-peer.js'
import { FindProviders } from './find-providers.js'
import { GetClosestPeers } from './get-closest-peers.js'
import { Get } from './get.js'
import { Provide } from './provide.js'
import { Put } from './put.js'
import type { MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { JSX } from 'react'

export interface PeersProps {
  metrics: MetricsRPC
}

export function Routing ({ metrics }: PeersProps): JSX.Element {
  const [panel, setPanel] = useState('Get')

  return (
    <>
      <Menu onClick={(panel) => setPanel(panel)} panel={panel} options={['Get', 'Put', 'Find Providers', 'Provide', 'Find Peer', 'Get Closest Peers']} />
      {panel === 'Get' ? <Get metrics={metrics} /> : undefined}
      {panel === 'Put' ? <Put metrics={metrics} /> : undefined}
      {panel === 'Find Providers' ? <FindProviders metrics={metrics} /> : undefined}
      {panel === 'Provide' ? <Provide metrics={metrics} /> : undefined}
      {panel === 'Find Peer' ? <FindPeer metrics={metrics} /> : undefined}
      {panel === 'Get Closest Peers' ? <GetClosestPeers metrics={metrics} /> : undefined}
    </>
  )
}
