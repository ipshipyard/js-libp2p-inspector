import { SOURCE_CLIENT } from '@ipshipyard/libp2p-inspector-metrics'
import { TypedEventEmitter } from '@libp2p/interface'
import { getBrowserInstance } from './get-browser.js'
import type { DevToolsMessage, WorkerMessage } from '../app.tsx'
import type { RPCMessage } from '@ipshipyard/libp2p-inspector-metrics'
import type { TypedEventTarget } from '@libp2p/interface'

const browser = getBrowserInstance()
let port: chrome.runtime.Port | undefined

// listen for incoming connections from the service worker script

export interface DevToolEvents {
  'page-loaded': CustomEvent
  'libp2p-rpc': CustomEvent<RPCMessage>
}

export const events: TypedEventTarget<DevToolEvents> = new TypedEventEmitter()

export function sendMessage <Message extends Omit<DevToolsMessage, 'source' | 'tabId'>> (message: Omit<Message, 'source' | 'tabId'>): void {
  if (port == null) {
    port = browser.runtime.connect({
      name: SOURCE_CLIENT
    })

    port.onMessage.addListener((message: RPCMessage | WorkerMessage) => {
      if (message.type === 'page-loaded') {
        events.safeDispatchEvent('page-loaded', {})
      }

      if (message.type === 'libp2p-rpc') {
        events.safeDispatchEvent<RPCMessage>('libp2p-rpc', {
          detail: message
        })
      }
    })

    port.onDisconnect.addListener(() => {
      port = undefined
    })
  }

  port.postMessage({
    ...message,
    source: SOURCE_CLIENT,
    tabId: browser.devtools.inspectedWindow.tabId
  })
}
