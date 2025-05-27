import { useEffect, useState } from 'react'
import libp2pLogo from '../../public/img/libp2p.svg'
import { ConnectingPanel } from './connecting.tsx'
import { Debug } from './debug.js'
import { FatalErrorPanel } from './fatal-error.tsx'
import { Identify } from './identify.tsx'
import { Menu } from './menu.js'
import { Node } from './node.js'
import { Peers } from './peers/index.js'
import { Ping } from './ping.tsx'
import { PubSub } from './pubsub/index.js'
import { Routing } from './routing/index.js'
import type { InspectorRPCEvents, MetricsRPC, Peer, PeerAddress } from '@ipshipyard/libp2p-inspector-metrics'
import type { PeerId, TypedEventTarget } from '@libp2p/interface'
import type { ReactElement } from 'react'

export interface InspectorProps {
  metrics: MetricsRPC
  events: TypedEventTarget<InspectorRPCEvents>
}

export function Inspector ({ metrics, events }: InspectorProps): ReactElement {
  const panels = ['Node', 'Peers', 'Debug', 'Routing']

  const [id, setId] = useState<PeerId>()
  const [addresses, setAddresses] = useState<PeerAddress[]>([])
  const [protocols, setProtocols] = useState<string[]>([])
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [peers, setPeers] = useState<Peer[]>([])
  const [debug, setDebug] = useState('')
  const [capabilities, setCapabilities] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<Error>()
  const [panel, setPanel] = useState(panels[0])

  useEffect(() => {
    Promise.resolve()
      .then(async () => {
        const { self, peers, debug, capabilities } = await metrics.init({
          signal: AbortSignal.timeout(1_000)
        })

        setId(self.id)
        setAddresses(self.addresses)
        setProtocols(self.protocols)
        setMetadata(self.metadata)
        setPeers(peers)
        setDebug(debug)
        setCapabilities(capabilities)
      })
      .catch(err => {
        setError(err)
      })

    function onMetrics (evt: CustomEvent<Record<string, any>>): void {

    }

    function onSelf (evt: CustomEvent<Peer>): void {
      if (!evt.detail.id.equals(id)) {
        setId(evt.detail.id)
      }

      if (JSON.stringify(evt.detail.addresses) !== JSON.stringify(addresses)) {
        setAddresses(evt.detail.addresses)
      }

      if (JSON.stringify(evt.detail.protocols) !== JSON.stringify(protocols)) {
        setProtocols(evt.detail.protocols)
      }

      if (JSON.stringify(evt.detail.metadata) !== JSON.stringify(metadata)) {
        setMetadata(evt.detail.metadata)
      }
    }

    function onPeers (evt: CustomEvent<Peer[]>): void {
      if (JSON.stringify(evt.detail) !== JSON.stringify(peers)) {
        setPeers(evt.detail)
      }
    }

    events.addEventListener('metrics', onMetrics)
    events.addEventListener('self', onSelf)
    events.addEventListener('peers', onPeers)

    return () => {
      events.removeEventListener('metrics', onMetrics)
      events.removeEventListener('self', onSelf)
      events.removeEventListener('peers', onPeers)
    }
  }, [])

  if (error != null) {
    return (
      <FatalErrorPanel error={error} />
    )
  }

  if (id == null) {
    return (
      <ConnectingPanel />
    )
  }

  const logo = (
    <img src={libp2pLogo} height={24} width={24} className='Icon' />
  )

  const tabs = [{
    name: 'Node',
    panel: (index: string) => <Node id={id} addresses={addresses} protocols={protocols} metadata={metadata} key={`panel-${index}`} />
  }, {
    name: 'Peers',
    panel: (index: string) => <Peers peers={peers} metrics={metrics} key={`panel-${index}`} />
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
    panel: (index: string, component?: string) => <PubSub component={component ?? ''} metrics={metrics} key={`panel-${index}`} />
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

          return ''
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
