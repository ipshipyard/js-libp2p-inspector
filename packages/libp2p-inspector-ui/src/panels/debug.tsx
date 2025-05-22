import { useState } from 'react'
import { Button } from './button.js'
import { Panel } from './panel.js'
import { SmallError, SmallSuccess } from './status.js'
import { TextInput } from './text-input.js'
import type { MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { ReactElement } from 'react'

export interface DebugProps {
  metrics: MetricsRPC
  debug: string
}

export function Debug ({ metrics, debug }: DebugProps): ReactElement {
  const [namespace, setNamespace] = useState(debug)
  const [result, setResult] = useState(<small>E.g. `libp2p:*`, `libp2p:kad-dht*,*:trace`, etc</small>)

  function sendDebug (evt: { preventDefault(): void }, namespace: string): boolean {
    evt.preventDefault()

    metrics.setDebug(namespace)
      .then(() => {
        setNamespace(namespace)
        setResult(<SmallSuccess message="Update successful" />)
      }, (err) => {
        console.info('no', err)
        setResult(<SmallError error={err} />)
      })

    return false
  }

  return (
    <Panel>
      <h2>Debug</h2>
      <p>Enter the name of one or more libp2p components to enable logging in the console tab or disable it completely</p>
      <form onSubmit={(evt) => sendDebug(evt, namespace)}>
        <TextInput type="text" value={namespace} placeholder="libp2p:*" onChange={(e) => { setNamespace(e.target.value) }} />
        <Button onClick={(evt) => sendDebug(evt, namespace)} primary={true}>Go</Button>
        <Button onClick={(evt) => sendDebug(evt, '')} danger={true}>Disable</Button>
      </form>
      {result}
    </Panel>
  )
}
