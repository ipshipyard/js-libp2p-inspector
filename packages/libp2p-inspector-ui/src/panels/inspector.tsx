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
import { Ping } from './ping.tsx'
import { Identify } from './identify.tsx'

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

  const tabs = [{
    name: 'Node',
    panel: (index: string) => <Node self={self} copyToClipboard={copyToClipboard} key={`panel-${index}`} />
  }, {
    name: 'Peers',
    panel: (index: string) => <Peers peers={peers} metrics={metrics} copyToClipboard={copyToClipboard} key={`panel-${index}`} />
  }, {
    name: 'Debug',
    panel: (index: string) => <Debug metrics={metrics} debug={debug} key={`panel-${index}`} />
  }, {
    name: 'Routing',
    panel: (index: string) => <Routing metrics={metrics} key={`panel-${index}`} />
  }, {
    capability: '@libp2p/ping',
    name: 'Ping',
    component: '',
    panel: (index: string, component?: string) => <Ping component={component ?? ''} metrics={metrics} key={`panel-${index}`} />
  }, {
    capability: '@libp2p/identify',
    name: 'Identify',
    component: '',
    panel: (index: string, component?: string) => <Identify component={component ?? ''} metrics={metrics} key={`panel-${index}`} />
  }, {
    capability: '@libp2p/pubsub',
    name: 'PubSub',
    component: '',
    panel: (index: string, component?: string) => <PubSub component={component ?? ''} metrics={metrics} pubsub={pubsub} key={`panel-${index}`} />
  }]

  for (const tab of tabs) {
    if (tab.capability == null) {
      continue
    }

    const component = findComponent(capabilities, tab.capability)

    if (component != null) {
      tab.component = component
      panels.push(tab.name)
    }
  }

  return (
    <>
      <Menu logo={logo} onClick={(panel) => { setPanel(panel) }} panel={panel} options={panels} />
      {
        tabs.map(tab => {
          if (panel === tab.name) {
            return tab.panel(tab.name, tab.component)
          }
        })
      }
    </>
  )
}

function findComponent (capabilities: Record<string, string[]>, capability: string): string | undefined {
  for (const component of Object.keys(capabilities)) {
    if (capabilities[component].includes(capability)) {
      return component
    }
  }
}
