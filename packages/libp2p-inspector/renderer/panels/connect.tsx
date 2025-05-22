import { FloatingPanel, Button, TextInput, Heading, Group, Libp2pIcon } from '@ipshipyard/libp2p-inspector-ui'
import { useState } from 'react'
import { TargetListPanel } from './target-list.tsx'
import type { PeerId } from '@libp2p/interface'
import type { JSX } from 'react'
import type { InspectTarget } from '../../ipc/index.ts'

export interface ConnectingPanelProps {
  targets: InspectTarget[]
  onConnect: (evt: React.UIEvent, peer: string | PeerId) => void
}

export const ConnectPanel = ({ targets, onConnect }: ConnectingPanelProps): JSX.Element => {
  const [connecting, setConnecting] = useState(false)
  const [address, setAddress] = useState('')
  const [output, setOutput] = useState('')

  return (
    <>
      <FloatingPanel>
        <Group>
          <Libp2pIcon height={64} width={64} style={{marginBottom: 8}} />
          <Heading>
            <h1>Connect to libp2p</h1>
          </Heading>
          <p>Enter a multiaddr or choose from a detected node</p>
          <form onSubmit={(evt) => onConnect}>
            <TextInput type="text" value={address} placeholder="/ip4/127.0.0.1/tcp/1234" onChange={(e) => { setAddress(e.target.value) }} />
            <Button disabled={connecting} onClick={(evt) => onConnect(evt, address)} primary={true}>Connect</Button>
          </form>
        </Group>
        <Group>
          <h2>Detected nodes</h2>
          <TargetListPanel targets={targets} onConnect={onConnect} />
        </Group>
        {output !== '' ? (
          <pre>{output}</pre>
        ) : ('')}
      </FloatingPanel>
    </>
  )
}
