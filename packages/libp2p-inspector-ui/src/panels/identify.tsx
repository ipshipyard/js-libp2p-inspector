import type { MetricsRPC } from "@ipshipyard/libp2p-inspector-metrics"
import { useState, type JSX } from "react"
import { Panel } from "./panel.tsx"
import { TextInput } from "./text-input.tsx"
import { Button } from "./button.tsx"
import { base58btc } from 'multiformats/bases/base58'
import { ErrorPanel } from "./error.tsx"
import { ConsolePanel } from "./console.tsx"

interface IdentifyPanelProps {
  component: string
  metrics: MetricsRPC
}

export function Identify ({ component, metrics }: IdentifyPanelProps): JSX.Element {
  const [peerIdOrMultiaddr, setPeerIdOrMultiaddr] = useState('')
  const [result, setResult] = useState<JSX.Element | string>('')

  function identify (evt: { preventDefault(): void }): boolean {
    evt.preventDefault()

    metrics.identify(component, peerIdOrMultiaddr, {
      signal: AbortSignal.timeout(10_000)
    })
      .then((result) => {
        const data: any = {
          peerId: result.peerId.toString(),
          agentVersion: result.agentVersion,
          protocolVersion: result.protocolVersion,
          observedAddr: result.observedAddr,
          publicKey: result.publicKey && base58btc.encode(result.publicKey),
          listenAddrs: result.listenAddrs.map(ma => ma.toString()),
          protocols: result.protocols
        }

        if (result.signedPeerRecord != null) {
          data.signedPeerRecord = {
            seq: `${result.signedPeerRecord.seq}n`,
            addresses: result.signedPeerRecord.addresses.map(ma => ma.toString())
          }
        }

        setResult(<ConsolePanel>{JSON.stringify(data, null, 2)}</ConsolePanel>)
      }, (err) => {
        setResult(<ErrorPanel error={err} />)
      })

    return false
  }

  return (
    <Panel>
      <p>Identify a peer</p>
      <form onSubmit={(evt) => identify(evt)}>
        <TextInput type="text" value={peerIdOrMultiaddr} placeholder="Peer ID or Multiaddr" onChange={(e) => { setPeerIdOrMultiaddr(e.target.value) }} />
        <Button onClick={(evt) => identify(evt)} primary={true}>Identify</Button>
      </form>
      {result}
    </Panel>
  )
}
