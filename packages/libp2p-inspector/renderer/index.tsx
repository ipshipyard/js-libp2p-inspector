import '@ipshipyard/libp2p-inspector-ui/index.css'
import { valueCodecs } from '@ipshipyard/libp2p-inspector-metrics'
import { TypedEventEmitter } from '@libp2p/interface'
import { pipe } from 'it-pipe'
import { pushable } from 'it-pushable'
import { rpc } from 'it-rpc'
import { Component } from 'react'
import { createRoot } from 'react-dom/client'
import type { InspectorRPCEvents, MetricsRPC, Peer } from '@ipshipyard/libp2p-inspector-metrics'
import type { TypedEventTarget, Message, PeerInfo, PeerId } from '@libp2p/interface'
import type { RPC } from 'it-rpc'
import type { ReactElement } from 'react'
import { Inspector, FloatingPanel, Button } from '@ipshipyard/libp2p-inspector-ui'
import { ConnectPanel } from './panels/connect.js'
import { NodePanel } from './panels/node.js'
import { rendererIPC } from './ipc.js'
import type { InspectorIPC, InspectTarget } from '../ipc/index.ts'

const platform = 'chrome'
const RPC_TIMEOUT = 1_000

interface ConnectingAppState {
  status: 'connecting'
  targets: InspectTarget[]
}

interface ErrorAppState {
  status: 'error'
  error: Error
  targets: InspectTarget[]
}

interface OnlineAppState {
  status: 'connected'
  target: InspectTarget
  self: Peer
  peers: Peer[]
  debug: string
  capabilities: Record<string, string[]>
  pubsub: Record<string, Message[]>
  targets: InspectTarget[]
}

type AppState = ConnectingAppState | ErrorAppState | OnlineAppState

interface ErrorPanelProps {
  error: Error
  onBack: (evt: React.UIEvent) => void
}

const ErrorPanel = ({ error, onBack }: ErrorPanelProps): ReactElement => {
  return (
    <>
      <FloatingPanel>
        <h2>Error</h2>
        <pre>
          <code>{error.stack ?? error.message}</code>
        </pre>
        <Button onClick={onBack}>Back</Button>
      </FloatingPanel>
    </>
  )
}

export interface AppProps {

}

export class App extends Component<AppProps> {
  state: AppState
  nodeConnected: PromiseWithResolvers<boolean>
  private readonly rpc: RPC
  private readonly metrics: MetricsRPC
  private readonly events: TypedEventTarget<InspectorRPCEvents>
  private readonly ipc: InspectorIPC

  constructor (props: AppProps) {
    super(props)

    this.state = {
      status: 'connecting',
      targets: []
    }

    // set up IPC
    this.ipc = rendererIPC()

    this.rpc = rpc({
      valueCodecs
    })

    // remote metrics instance
    this.metrics = this.rpc.createClient<MetricsRPC>('metrics', {
      timeout: RPC_TIMEOUT
    })

    // register for updates from main thread
    this.ipc.onTargets((targets: PeerInfo[]) => {
      this.setState(s => ({
        ...s,
        targets
      }))
    })

    // called after connecting to a remote node
    this.ipc.onConnected(this.onConnected)

    // create event emitter to receive events from inspector-metrics
    this.events = new TypedEventEmitter<InspectorRPCEvents>()
    this.events.addEventListener('metrics', (evt) => {
      // handle incoming metrics
    })
    this.events.addEventListener('self', (evt) => {
      this.setState(s => ({
        ...s,
        self: evt.detail
      }))
    })
    this.events.addEventListener('peers', (evt) => {
      this.setState(s => ({
        ...s,
        peers: evt.detail
      }))
    })
    this.events.addEventListener('pubsub:message', (evt) => {
      this.setState(s => ({
        ...s,
        pubsub: {
          // @ts-expect-error fixme
          ...(s.pubsub ?? {}),
          [evt.detail.topic ?? '']: [
            // @ts-expect-error fixme
            ...(s.pubsub[evt.detail.topic] ?? []),
            evt.detail
          ]
        }
      }))
    })

    this.rpc.createTarget('inspector', this.events)

    // receive messages
    const ipcSource = pushable()
    this.ipc.onRPC((buf) => {
      ipcSource.push(buf)
    })

    // send RPC messages
    Promise.resolve()
      .then(async () => {
        await pipe(
          ipcSource,
          this.rpc,
          async (source) => {
            for await (const buf of source) {
              this.ipc.sendRPC(buf)
            }
          }
        )
      })
      .catch(err => {
        console.error('error while reading RPC messages', err)
      })

    this.nodeConnected = Promise.withResolvers()
  }

  copyToClipboard = (value: string): void => {

  }

  onConnect = (evt: React.UIEvent, address: string | PeerId) => {
    evt.preventDefault()
    this.ipc.connect(address)
  }

  onConnected = (err?: Error) => {
    console.info('connected!', err)

    if (err != null) {
      this.setState({
        status: 'error',
        error: err
      })

      return
    }

    Promise.resolve().then(async () => {
      console.info('do init')

      const { self, peers, debug, capabilities } = await this.metrics.init()

      console.info('did init')

      this.setState((s: ConnectingAppState) => {
        const target = s.targets.find(n => n.id.equals(self.id))

        return {
          ...s,
          status: 'connected',
          target,
          self,
          peers,
          debug,
          capabilities,
          pubsub: {}
        }
      })
    })
      .catch(err => {
        this.setState({
          status: 'error',
          error: err
        })
      })
  }

  onCancelConnect = (evt: React.UIEvent) => {
    evt.preventDefault()
    this.ipc.cancelConnect()
  }

  onDisconnect = (evt: React.UIEvent) => {
    evt.preventDefault()
    this.ipc.disconnect()
    this.setState(s => ({
      ...s,
      status: 'connecting'
    }))
  }

  render (): ReactElement {
    if (this.state.status === 'error') {
      return (
        <ErrorPanel error={this.state.error} onBack={this.onDisconnect} />
      )
    }

    if (this.state.status === 'connected') {
      return (
        <>
          <NodePanel {...this.state} onDisconnect={this.onDisconnect} />
          <Inspector {...this.state} metrics={this.metrics} copyToClipboard={this.copyToClipboard} />
        </>
      )
    }

    return (
      <ConnectPanel {...this.state} onConnect={this.onConnect} />
    )
  }
}

const body = document.getElementsByTagName('body')[0]

if (body != null) {
  body.className = `${body.className} ${platform}`
}

const app = document.getElementById('app')

if (app != null) {
  const root = createRoot(app)
  root.render(<App />)
}
