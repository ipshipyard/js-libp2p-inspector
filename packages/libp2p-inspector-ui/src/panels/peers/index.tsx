import { useState } from 'react'
import { Menu } from '../menu.js'
import { DialPeer } from './dial.js'
import { PeerList } from './list.js'
import type { MetricsRPC, Peer } from '@ipshipyard/libp2p-inspector-metrics'
import type { ReactElement } from 'react'

export interface PeersProps {
  peers: Peer[]
  metrics: MetricsRPC
}

export function Peers ({ peers, metrics }: PeersProps): ReactElement {
  const [panel, setPanel] = useState('Connected')

  return (
    <>
      <Menu onClick={(panel) => { setPanel(panel) }} panel={panel} options={['Connected', 'Dial']} />
      {panel === 'Connected' ? <PeerList peers={peers} metrics={metrics} /> : undefined}
      {panel === 'Dial' ? <DialPeer metrics={metrics} /> : undefined}
    </>
  )
}
