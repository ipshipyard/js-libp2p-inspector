import 'react'
import { getAgent } from '../utils/get-agent.js'
import { Heading } from './heading.js'
import { MultiaddrList } from './multiaddr-list.js'
import { Panel } from './panel.js'
import type { PeerAddress } from '@ipshipyard/libp2p-inspector-metrics'
import type { PeerId } from '@libp2p/interface'
import type { ReactElement } from 'react'

export interface NodeProps {
  id: PeerId
  addresses: PeerAddress[]
  protocols: string[]
  metadata: Record<string, string>
}

export function Node ({ id, addresses, protocols, metadata }: NodeProps): ReactElement {
  const agent = getAgent(metadata)
  let agentVersion

  if (agent != null) {
    agentVersion = (
      <>
        <Heading help='The agent is sent to peers during Identify'>
          <h2>Agent</h2>
        </Heading>
        <p>{agent}</p>
      </>
    )
  }

  return (
    <Panel>
      <Heading help="A PeerId is derived from a node's cryptographic key and uniquely identifies it on the network">
        <h2>PeerId</h2>
      </Heading>
      <p>{id.toString()}</p>
      {agentVersion}
      <Heading help='Multiaddrs are addresses that other nodes can use to contact this node'>
        <h2>Multiaddrs</h2>
      </Heading>
      <MultiaddrList
        addresses={addresses.map(address => {
          let multiaddr = address.multiaddr

          if (multiaddr.getPeerId() == null) {
            multiaddr = multiaddr.encapsulate(`/p2p/${id}`)
          }

          return { multiaddr }
        })}
      />
      <Heading help='This node will respond to these protocols'>
        <h2>Supported protocols</h2>
      </Heading>
      <Protocols protocols={protocols} />
    </Panel>
  )
}

export interface ProtocolsPanelProps {
  protocols: string[]
}

function Protocols ({ protocols }: ProtocolsPanelProps): ReactElement {
  if (protocols.length === 0) {
    return (
      <p>This node has does not support any protocols.</p>
    )
  }

  return (
    <ul>
      {protocols.map((protocol, index) => <li key={`protocol-${index}`}>{protocol}</li>)}
    </ul>
  )
}
