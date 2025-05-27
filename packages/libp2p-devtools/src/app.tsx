import '@ipshipyard/libp2p-inspector-ui/index.css'
import { LIBP2P_INSPECTOR_METRICS_KEY, valueCodecs } from '@ipshipyard/libp2p-inspector-metrics'
import { Inspector, FloatingPanel, FatalErrorPanel, HandleCopyToClipboardContext, ConnectingPanel } from '@ipshipyard/libp2p-inspector-ui'
import { TypedEventEmitter } from '@libp2p/interface'
import { pipe } from 'it-pipe'
import { pushable } from 'it-pushable'
import { rpc } from 'it-rpc'
import { base64 } from 'multiformats/bases/base64'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { GrantPermissions } from './panels/grant-permissions.js'
import { evalOnPage } from './utils/eval-on-page.js'
import { getPlatform } from './utils/get-platform.js'
import { devToolEvents, sendMessage } from './utils/send-message.js'
import type { ClientMessage, InspectorRPCEvents, MetricsRPC, RPCMessage, SOURCE_CLIENT } from '@ipshipyard/libp2p-inspector-metrics'
import type { TypedEventTarget } from '@libp2p/interface'
import type { Duplex } from 'it-stream-types'
import type { ReactElement } from 'react'

const platform = getPlatform()
const RPC_TIMEOUT = 10_000

export interface InspectorEvents extends InspectorRPCEvents {
  'permissions-error': CustomEvent<PermissionsErrorMessage>
  'copy-to-clipboard': CustomEvent<CopyToClipboardMessage>
}

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

const MissingPanel = (): ReactElement => {
  return (
    <>
      <FloatingPanel>
        <h2>Missing</h2>
        <p>@ipshipyard/libp2p-inspector-metrics was not found on the on the current page, or there may not be a libp2p node running.</p>
        <p>Please ensure you have configured your libp2p node correctly:</p>
        <SyntaxHighlighter language='javascript' style={dark}>
          {`import { inspectorMetrics } from '@ipshipyard/libp2p-inspector-metrics'
import { createLibp2p } from 'libp2p'

const node = await createLibp2p({
  metrics: inspectorMetrics({ /* ... */ })
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
  metrics: MetricsRPC
  events: TypedEventTarget<InspectorEvents>
}

function App ({ metrics, events }: AppProps): ReactElement {
  const [status, setStatus] = useState('init')
  const [error, setError] = useState<Error>()

  useEffect(() => {
    function onPageLoaded (): void {
      setStatus('init')

      Promise.resolve()
        .then(async () => {
          const metricsPresent = await evalOnPage<boolean>(`globalThis?.${LIBP2P_INSPECTOR_METRICS_KEY} === true`)

          if (!metricsPresent) {
            setStatus('missing')
            return
          }

          setStatus('online')
        })
        .catch(err => {
          setStatus('error')
          setError(err)
        })
    }

    devToolEvents.addEventListener('page-loaded', onPageLoaded)

    onPageLoaded()

    return () => {
      devToolEvents.removeEventListener('page-loaded', onPageLoaded)
    }
  }, [])

  if (error != null) {
    return (
      <FatalErrorPanel error={error} />
    )
  }

  if (status === 'init') {
    return (
      <ConnectingPanel />
    )
  }

  if (status === 'missing') {
    return (
      <MissingPanel />
    )
  }

  if (status === 'permissions') {
    return (
      <GrantPermissionsPanel />
    )
  }

  if (status === 'online') {
    return (
      <Inspector
        metrics={metrics}
        events={events}
      />
    )
  }

  return (
    <p>{status}</p>
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

// receive RPC messages
const source = pushable<Uint8Array>()
devToolEvents.addEventListener('libp2p-rpc', (event) => {
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

// send RPC messages
Promise.resolve()
  .then(async () => {
    await pipe(
      messages,
      r,
      messages
    )
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error('error while reading RPC messages', err)
  })

function handleCopyToClipboard (value: string): void {
  sendMessage<CopyToClipboardMessage>({
    type: 'copy-to-clipboard',
    value
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
        <App messages={messages} metrics={metrics} events={events} />
      </HandleCopyToClipboardContext.Provider>
    </>
  )
}
