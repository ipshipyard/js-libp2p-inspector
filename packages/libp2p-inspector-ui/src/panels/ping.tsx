import { useState } from 'react'
import { delay } from '../utils/delay.ts'
import { Button } from './button.tsx'
import { ConsolePanel } from './console.tsx'
import { ErrorPanel } from './error.tsx'
import { Panel } from './panel.tsx'
import { TextInput } from './text-input.tsx'
import type { MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { JSX } from 'react'

interface PingPanelProps {
  component: string
  metrics: MetricsRPC
}

export function Ping ({ component, metrics }: PingPanelProps): JSX.Element {
  const [peerIdOrMultiaddr, setPeerIdOrMultiaddr] = useState('')
  const [result, setResult] = useState<JSX.Element | string>('')

  function ping (evt: { preventDefault(): void }, topic: string): void {
    evt.preventDefault()

    let remote = peerIdOrMultiaddr

    setResult(<ConsolePanel>{formatHeader(remote)}</ConsolePanel>)

    Promise.resolve()
      .then(async () => {
        const conn = await metrics.openConnection(peerIdOrMultiaddr, {
          signal: AbortSignal.timeout(10_000)
        })
        remote = conn.remotePeer.toString()

        const results: Array<string | number> = []

        for (let i = 0; i < 5; i++) {
          try {
            const rtt = await metrics.ping(component, peerIdOrMultiaddr, {
              signal: AbortSignal.timeout(10_000)
            })

            results.push(rtt)

            setResult(
              <ConsolePanel>
                {formatHeader(remote)}{'\n'}
                {formatResults(results)}
              </ConsolePanel>
            )

            await delay(1_000)
          } catch (err: any) {
            results.push(err.message)
          }
        }

        setResult((
          <ConsolePanel>
            {formatHeader(remote)}{'\n'}
            {formatResults(results)}{'\n'}
            --- {peerIdOrMultiaddr} ping statistics ---{'\n'}
            {calculateStats(results)}
          </ConsolePanel>
        ))
      })
      .catch(err => {
        setResult(<ErrorPanel error={err} />)
      })
  }

  return (
    <Panel>
      <p>Ping a peer</p>
      <form onSubmit={(evt) => ping(evt, peerIdOrMultiaddr)}>
        <TextInput type='text' value={peerIdOrMultiaddr} placeholder='Peer ID or Multiaddr' onChange={(e) => { setPeerIdOrMultiaddr(e.target.value) }} />
        <Button onClick={(evt) => ping(evt, peerIdOrMultiaddr)} primary>Ping</Button>
      </form>
      {result}
    </Panel>
  )
}

function formatHeader (remote: string): string {
  return `PING ${remote}: 32 data bytes`
}

function formatResults (results: Array<string | number>): string {
  return results.map((res, index) => {
    if (typeof res === 'string') {
      return `seq=${index} ${res}`
    }

    return `seq=${index} time=${res} ms`
  })
    .join('\n')
}

function calculateStats (results: Array<string | number>): string {
  const success = results
    .filter(res => typeof res !== 'string')

  let min = Infinity
  let max = 0
  let sum = 0

  for (const res of success) {
    if (res < min) {
      min = res
    }

    if (res > max) {
      max = res
    }

    sum += res
  }

  const mean = sum / success.length
  const squaredDeviations = success.map(val => Math.pow(val - mean, 2))
  const variance = squaredDeviations.reduce((acc, curr) => acc + curr, 0) / (success.length - 1)
  const stdDeviation = Math.sqrt(variance)

  return [
    `${results.length} packets transmitted, ${success.length} packets received, ${100 - Math.round((success.length / results.length) * 100)}% packet loss`,
    `round-trip min/avg/max/stddev = ${min}/${Math.round(mean)}/${max}/${Math.round(stdDeviation)} ms`
  ].join('\n')
}
