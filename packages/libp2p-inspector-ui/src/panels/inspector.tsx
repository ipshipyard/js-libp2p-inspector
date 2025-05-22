import { useState } from 'react'
import libp2pLogo from '../../public/img/libp2p.svg'
import { Debug } from './debug.js'
import { Menu } from './menu.js'
import { Node } from './node.js'
import { Peers } from './peers/index.js'
import { PubSub } from './pubsub/index.js'
import { Routing } from './routing/index.js'
import type { MetricsRPC, Peer } from '@ipshipyard/libp2p-inspector-metrics'
import type { Message } from '@libp2p/interface'
import type { ReactElement } from 'react'

export interface InspectorProps {
  self: Peer
  copyToClipboard(value: string): void
  peers: Peer[]
  debug: string
  metrics: MetricsRPC
  capabilities: Record<string, string[]>
  pubsub: Record<string, Message[]>
}

export function Inspector ({ self, copyToClipboard, peers, debug, metrics, capabilities, pubsub }: InspectorProps): ReactElement {
  const panels = ['Node', 'Peers', 'Debug', 'Routing']
  const [panel, setPanel] = useState(panels[0])

  const logo = (
    <img src={libp2pLogo} height={24} width={24} className={'Icon'} />
  )

  const pubSubComponent = findPubSubComponent(capabilities)

  if (pubSubComponent != null) {
    panels.push('PubSub')
  }

  return (
    <>
      <Menu logo={logo} onClick={(panel) => { setPanel(panel) }} panel={panel} options={panels} />
      { panel === 'Node' ? <Node self={self} copyToClipboard={copyToClipboard} /> : undefined }
      { panel === 'Peers' ? <Peers peers={peers} metrics={metrics} copyToClipboard={copyToClipboard} /> : undefined }
      { panel === 'Debug' ? <Debug metrics={metrics} debug={debug} /> : undefined }
      { panel === 'Routing' ? <Routing metrics={metrics} /> : undefined }
      { panel === 'PubSub' ? <PubSub component={pubSubComponent ?? ''} metrics={metrics} pubsub={pubsub} /> : undefined}
    </>
  )
}

function findPubSubComponent (capabilities: Record<string, string[]>): string | undefined {
  for (const component of Object.keys(capabilities)) {
    if (capabilities[component].includes('@libp2p/pubsub')) {
      return component
    }
  }
}
