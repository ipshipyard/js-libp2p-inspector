/**
 * This script is injected into the webpage being monitored
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts
 */

import { SOURCE_METRICS, SOURCE_CLIENT } from '@ipshipyard/libp2p-inspector-metrics'
import { SOURCE_SERVICE_WORKER } from './constants.js'
import { getBrowserInstance } from './utils/get-browser.js'
import type { DevToolsMessage } from './app.tsx'

const browser = getBrowserInstance()

let port: chrome.runtime.Port | undefined

/**
 * Receive events broadcast by `@ipshipyard/libp2p-inspector-metrics` and forward them on to
 * the service worker, which forwards them on to the dev tools panel
 */
window.addEventListener('message', (event) => {
  // Only accept messages from same frame
  if (event.source !== window) {
    return
  }

  const message = event.data

  if (message?.source !== SOURCE_METRICS) {
    // ignore messages from other sources
    return
  }

  // send message to worker
  port?.postMessage(message)
})

/**
 * Receive events broadcast by the service worker and forward them on to
 * `@ipshipyard/libp2p-inspector-metrics`.
 */
browser.runtime.onConnect.addListener((p) => {
  // only accept incoming connections from the service worker
  if (p.name !== SOURCE_SERVICE_WORKER) {
    return
  }

  port = p
  port.onMessage.addListener((message: DevToolsMessage) => {
    if (message.source === SOURCE_CLIENT) {
      // intercept copy-to-clipboard
      if (message.type === 'copy-to-clipboard') {
        navigator.clipboard.writeText(message.value)
          .catch(err => {
            // eslint-disable-next-line no-console
            console.error('could not write to clipboard', err)
          })

        return
      }

      window.postMessage(message, '*')
    }
  })

  port.onDisconnect.addListener(() => {
    port = undefined
  })
})
