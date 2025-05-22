import '@ipshipyard/libp2p-inspector-ui/index.css'
import { Inspector, FloatingPanel } from '@ipshipyard/libp2p-inspector-ui'
import { LIBP2P_INSPECTOR_METRICS_KEY } from '@ipshipyard/libp2p-inspector-metrics'
import { valueCodecs } from '@ipshipyard/libp2p-inspector-metrics'
import { TypedEventEmitter } from '@libp2p/interface'
import { pipe } from 'it-pipe'
import { pushable } from 'it-pushable'
import { rpc } from 'it-rpc'
import { base64 } from 'multiformats/bases/base64'
import { Component } from 'react'
import { createRoot } from 'react-dom/client'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { DetectingPanel } from './panels/detecting.js'
import { GrantPermissions } from './panels/grant-permissions.js'
import { evalOnPage } from './utils/eval-on-page.js'
import { getPlatform } from './utils/get-platform.js'
import { getBrowserTheme } from './utils/get-theme.js'
import { sendMessage, events } from './utils/send-message.js'
import type { ClientMessage, InspectorRPCEvents, MetricsRPC, Peer, RPCMessage, SOURCE_CLIENT } from '@ipshipyard/libp2p-inspector-metrics'
import type { TypedEventTarget, Message } from '@libp2p/interface'
import type { RPC } from 'it-rpc'
import type { Duplex } from 'it-stream-types'
import type { ReactElement } from 'react'

const theme = getBrowserTheme()
const platform = getPlatform()

export const SOURCE_SERVICE_WORKER = '@ipshipyard/libp2p-inspector-metrics:worker'
export const SOURCE_CONTENT_SCRIPT = '@ipshipyard/libp2p-inspector-metrics:content'

/**
 * Sent by the DevTools service worker to the DevTools panel when the inspected
 * page has finished (re)loading
 */
export interface PageLoadedMessage {
  source: typeof SOURCE_CLIENT
  type: 'page-loaded'
  tabId: number
}

/**
 * Sent by the DevTools service worker to the DevTools panel when it has failed
 * to send a message to the inspected page as there is no receiving end present.
 *
 * This normally means the content script has not been loaded due to the user
 * not having granted permission for the script to run.
 */
export interface PermissionsErrorMessage {
  source: typeof SOURCE_CLIENT
  type: 'permissions-error'
  tabId: number
}

/**
 * This event is intercepted by the service worker which injects a content
 * script into the current page which copies the passed value to the clipboard.
 */
export interface CopyToClipboardMessage {
  source: typeof SOURCE_CLIENT
  type: 'copy-to-clipboard'
  tabId: number
  value: string
}

/**
 * Messages that are sent from the service worker to the devtools panel
 */
export type WorkerMessage = PageLoadedMessage | PermissionsErrorMessage

/**
 * Messages that are sent from the devtools panel to the service worker
 */
export type DevToolsMessage = CopyToClipboardMessage | ClientMessage & { tabId: number }

interface OfflineAppState {
  status: 'init' | 'missing' | 'permissions'
}

interface ErrorAppState {
  status: 'error'
  error: Error
}

interface OnlineAppState {
  status: 'online'
  self: Peer
  peers: Peer[]
  debug: string
  capabilities: Record<string, string[]>
  pubsub: Record<string, Message[]>
}

type AppState = OfflineAppState | ErrorAppState | OnlineAppState

const ErrorPanel = ({ error }: { error: Error }): ReactElement => {
  return (
    <>
      <FloatingPanel>
        <h2>Error</h2>
        <p>An error occurred while tring to detect a libp2p node on the current page</p>
        <pre>
          <code>{error.stack ?? error.message}</code>
        </pre>
      </FloatingPanel>
    </>
  )
}

const MissingPanel = (): ReactElement => {
  return (
    <>
      <FloatingPanel>
        <h2>Missing</h2>
        <p>@libp2p/devtool-metrics was not found on the on the current page</p>
        <p>Please ensure you have configured your libp2p node correctly:</p>
        <SyntaxHighlighter language="javascript" style={dark}>
      {`import { devToolsMetrics } from '@ipshipyard/libp2p-inspector-metrics'
import { createLibp2p } from 'libp2p'

const node = await createLibp2p({
  metrics: devToolsMetrics({ /* ... */ })
  // ...other config here
})`}
        </SyntaxHighlighter>
      </FloatingPanel>
    </>
  )
}

const GrantPermissionsPanel = (): ReactElement => {
  return (
    <>
      <FloatingPanel>
        <h2>Permissions</h2>
        <p>No data has been received from the libp2p node running on the page.</p>
        <p>You may need to grant this extension access to the current page.</p>
        {
          platform === 'unknown'
            ? (
              <p>Please see your browser documentation for how to do this.</p>
              )
            : <GrantPermissions />
        }
      </FloatingPanel>
    </>
  )
}

export interface AppProps {
  messages: Duplex<AsyncGenerator<Uint8Array>>
}

export class App extends Component<AppProps> {
  state: AppState
  nodeConnected: PromiseWithResolvers<boolean>
  private readonly rpc: RPC
  private readonly metrics: MetricsRPC
  private readonly events: TypedEventTarget<InspectorRPCEvents>

  constructor (props: AppProps) {
    super(props)

    this.state = {
      status: 'init'
    }

    this.rpc = rpc({
      valueCodecs
    })

    // remote metrics instance
    this.metrics = this.rpc.createClient<MetricsRPC>('metrics')

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

    // send RPC messages
    Promise.resolve()
      .then(async () => {
        await pipe(
          props.messages,
          this.rpc,
          props.messages
        )
      })
      .catch(err => {
        console.error('error while reading RPC messages', err)
      })

    this.nodeConnected = Promise.withResolvers()

    // the inspected page was reloaded while the dev tools panel is open
    events.addEventListener('page-loaded', () => {
      this.nodeConnected.reject(new Error('Page reloaded'))
      this.nodeConnected = Promise.withResolvers()
      this.setState({
        status: 'init'
      })
      this.init()
    })

    this.init()
  }

  init (): void {
    Promise.resolve().then(async () => {
      const metricsPresent = await evalOnPage<boolean>(`${LIBP2P_INSPECTOR_METRICS_KEY} === true`)

      if (!metricsPresent) {
        this.setState({
          status: 'missing'
        })
        return
      }

      const signal = AbortSignal.timeout(2_000)

      try {
        const { self, peers, debug, capabilities } = await this.metrics.init({
          signal
        })

        this.setState({
          status: 'online',
          self,
          peers,
          debug,
          capabilities,
          pubsub: {}
        })
      } catch (err: any) {
        if (signal.aborted) {
          this.setState({
            status: 'permissions'
          })
          return
        }

        this.setState({
          status: 'error',
          error: err
        })
      }
    })
      .catch(err => {
        console.error('error communicating with page', err)

        this.setState({
          status: 'error',
          error: err
        })
      })
  }

  copyToClipboard = (value: string): void => {
    sendMessage<CopyToClipboardMessage>({
      type: 'copy-to-clipboard',
      value
    })
  }

  render (): ReactElement {
    if (this.state.status === 'init') {
      return (
        <DetectingPanel />
      )
    }

    if (this.state.status === 'missing') {
      return (
        <MissingPanel />
      )
    }

    if (this.state.status === 'error') {
      return (
        <ErrorPanel error={this.state.error} />
      )
    }

    if (this.state.status === 'permissions') {
      return (
        <GrantPermissionsPanel />
      )
    }

    if (this.state.status === 'online') {
      return (
        <Inspector {...this.state} metrics={this.metrics} copyToClipboard={this.copyToClipboard} />
      )
    }

    return (
      <p>{this.state.status}</p>
    )
  }
}

const body = document.getElementsByTagName('body')[0]

if (body != null) {
  body.className = `${body.className} ${platform} ${theme}`
}

const app = document.getElementById('app')

if (app != null) {
  const source = pushable<Uint8Array>()

  // receive RPC messages
  events.addEventListener('libp2p-rpc', (event) => {
    source.push(base64.decode(event.detail.message))
  })

  const messages: Duplex<AsyncGenerator<Uint8Array>> = {
    source,
    async sink (source) {
      for await (const buf of source) {
        // send RPC messages
        sendMessage<RPCMessage>({
          type: 'libp2p-rpc',
          message: base64.encode(buf)
        })
      }
    }
  }

  const root = createRoot(app)
  root.render(<App messages={messages} />)
}
