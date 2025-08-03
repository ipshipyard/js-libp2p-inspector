import { SOURCE_CLIENT } from '@ipshipyard/libp2p-inspector-metrics'
import { SOURCE_SERVICE_WORKER } from './constants.js'
import { getBrowserInstance } from './utils/get-browser.js'
import type { DevToolsMessage, PageLoadedMessage, WorkerMessage } from './app.tsx'

const browser = getBrowserInstance()

/**
 * Holds connections between tab id -> devTools
 */
const toDevTools: Record<number, chrome.runtime.Port> = {}

/**
 * Holds connections between tab id -> browser
 */
const toContentScript: Record<number, chrome.runtime.Port> = {}

/**
 * Listen for incoming connections from the dev tools panel, when a message is
 * received, open a port to the content script and forward the message.
 *
 * Listen for incoming messages on the forwarding port and relay them back to
 * the dev tools panel.
 */
browser.runtime.onConnect.addListener(port => {
  // only accept incoming connections from the dev tools panel
  if (port.name !== SOURCE_CLIENT) {
    return
  }

  let tabId: number | undefined

  const onContentScriptMessage = (message: WorkerMessage): void => {
    port.postMessage(message)
  }

  const onDevToolsPanelMessage = (message: DevToolsMessage): void => {
    if (tabId == null) {
      tabId = message.tabId
    }

    if (tabId != null && toDevTools[tabId] !== port) {
      toDevTools[tabId]?.onMessage.removeListener(onDevToolsPanelMessage)
      toDevTools[tabId] = port
    }

    if (tabId != null && toContentScript[tabId] == null) {
      toContentScript[tabId] = browser.tabs.connect(message.tabId, {
        name: SOURCE_SERVICE_WORKER
      })

      toContentScript[tabId].onMessage.addListener(onContentScriptMessage)

      toContentScript[tabId].onDisconnect.addListener((port) => {
        port.onMessage.removeListener(onContentScriptMessage)

        delete toContentScript[message.tabId]
      })
    }

    // intercept copy-to-clipboard message
    if (message.type === 'copy-to-clipboard' && tabId != null) {
      copyToClipboard(tabId, message.value)
      return
    }

    // forward message to content script
    if (tabId != null) {
      toContentScript[tabId].postMessage(message)
    }
  }

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(onDevToolsPanelMessage)

  // if the dev tools panel disconnects, clean up references - we will reconnect
  // if the dev tools panel is reloaded
  port.onDisconnect.addListener(() => {
    // do not process messages on a closed port
    port.onMessage.removeListener(onDevToolsPanelMessage)

    // clean up ports
    if (tabId != null) {
      // stop processing content script messages
      toContentScript[tabId]?.onMessage.removeListener(onContentScriptMessage)

      delete toContentScript[tabId]

      delete toDevTools[tabId]
    }
  })
})

browser.tabs?.onUpdated.addListener((tabId, changeInfo): void => {
  if (changeInfo.status !== 'complete') {
    return
  }

  const port = toDevTools[tabId]

  if (port != null) {
    const message: PageLoadedMessage = {
      source: SOURCE_CLIENT,
      type: 'page-loaded',
      tabId
    }

    port.postMessage(message)
  }
})

function copyToClipboard(tabId: number, text: string): void {
  function contentCopy(text: string): void {
    const input = document.createElement('textarea')

    // position absolutely to stop the page from jumping when we call .focus()
    input.style.position = 'absolute'
    input.style.top = `${window.scrollY}px`
    input.style.left = `${window.scrollX}px`

    document.body.appendChild(input)
    input.value = text
    input.focus()
    input.select()
    document.execCommand('copy')
    input.remove()
  }

  // execute the content script
  chrome.scripting.executeScript({
    target: { tabId },
    func: contentCopy,
    args: [text]
  })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error('error executing copy script', err)
    })
}
