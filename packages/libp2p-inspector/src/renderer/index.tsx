import '@ipshipyard/libp2p-inspector-ui/index.css'
import { valueCodecs } from '@ipshipyard/libp2p-inspector-metrics'
import { Inspector, FatalErrorPanel, HandleCopyToClipboardContext } from '@ipshipyard/libp2p-inspector-ui'
import { TypedEventEmitter } from '@libp2p/interface'
import { pipe } from 'it-pipe'
import { pushable } from 'it-pushable'
import { rpc } from 'it-rpc'
import { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { rendererIPC } from './ipc.js'
import { ConnectPanel } from './panels/connect.js'
import { NodePanel } from './panels/node.js'
import type { InspectorIPC, InspectTarget } from '../ipc/index.ts'
import type { InspectorRPCEvents, MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { TypedEventTarget, PeerId } from '@libp2p/interface'
import type { ReactElement } from 'react'

const platform = 'chrome'
const RPC_TIMEOUT = 10_000

interface InspectorEvents extends InspectorRPCEvents {
  targets: CustomEvent<InspectTarget[]>
  connected: CustomEvent<Error | undefined>
}

export interface AppProps {
  ipc: InspectorIPC
  metrics: MetricsRPC
  events: TypedEventTarget<InspectorEvents>
}

function App ({ ipc, metrics, events }: AppProps): ReactElement {
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState<Error>()
  const [targets, setTargets] = useState<InspectTarget[]>([])

  const handleCancelConnect = useCallback((evt: React.UIEvent): void => {
    evt.preventDefault()
    ipc.cancelConnect()
  }, [])

  const handleDisconnect = useCallback((event: React.UIEvent) => {
    event.preventDefault()
    ipc.disconnect()
    setStatus('connecting')
  }, [])

  const handleConnect = useCallback((evt: React.UIEvent, address: string | PeerId): void => {
    evt.preventDefault()
    ipc.connect(address)
  }, [])

  useEffect(() => {
    function onConnected (evt: CustomEvent<Error | undefined>): void {
      if (evt.detail != null) {
        setError(evt.detail)
        setStatus('error')

        return
      }

      setStatus('connected')
    }

    function onTargets (evt: CustomEvent<InspectTarget[]>): void {
      if (JSON.stringify(evt.detail) === JSON.stringify(targets)) {
        return
      }

      setTargets(evt.detail)

      // if the main thread says we are connected to a peer but our state says we
      // are not, try to init with the connected peer (this can happen after a
      // page refresh)
      if (evt.detail.find(t => t.status === 'connected') != null && status !== 'connected') {
        onConnected(new CustomEvent<Error | undefined>('connected'))
      }
    }

    events.addEventListener('targets', onTargets)
    events.addEventListener('connected', onConnected)

    return () => {
      events.removeEventListener('targets', onTargets)
      events.removeEventListener('connected', onConnected)
    }
  }, [targets])

  if (error != null) {
    return (
      <FatalErrorPanel error={error} onBack={handleDisconnect} />
    )
  }

  if (status === 'connected') {
    return (
      <>
        <NodePanel targets={targets} onDisconnect={handleDisconnect} />
        <Inspector
          metrics={metrics}
          events={events}
        />
      </>
    )
  }

  return (
    <ConnectPanel targets={targets} onConnect={handleConnect} onCancelConnect={handleCancelConnect} />
  )
}

// create RPC instance
const r = rpc({
  valueCodecs
})

// create RPC client to send invocations to inspector-metrics
const metrics = r.createClient<MetricsRPC>('metrics', {
  timeout: RPC_TIMEOUT
})

// create event emitter to receive events from inspector-metrics
const events = new TypedEventEmitter()

r.createTarget('inspector', events)

// receive messages
const ipc = rendererIPC()
const ipcSource = pushable()
ipc.onRPC((buf) => {
  ipcSource.push(buf)
})

// register for updates from main thread
ipc.onTargets((targets) => {
  events.safeDispatchEvent('targets', {
    detail: targets
  })
})

// called after connecting to a remote node
ipc.onConnected((err) => {
  events.safeDispatchEvent('connected', {
    detail: err
  })
})

// send and receive RPC messages
Promise.resolve()
  .then(async () => {
    await pipe(
      ipcSource,
      r,
      async (source) => {
        for await (const buf of source) {
          ipc.sendRPC(buf)
        }
      }
    )
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error('error while reading RPC messages', err)
  })

function handleCopyToClipboard (value: string): void {
  navigator.clipboard.writeText(value)
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error('could not write to clipboard', err)
    })
}

const body = document.getElementsByTagName('body')[0]

if (body != null) {
  body.className = `${body.className} ${platform}`
}

const app = document.getElementById('app')

if (app != null) {
  const root = createRoot(app)
  root.render(
    <>
      <HandleCopyToClipboardContext.Provider value={handleCopyToClipboard}>
        <App ipc={ipc} metrics={metrics} events={events} />
      </HandleCopyToClipboardContext.Provider>
    </>
  )
}
