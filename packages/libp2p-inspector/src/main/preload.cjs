const { contextBridge, ipcRenderer } = require('electron/renderer')

/**
 * main <-> renderer process communication API
 */
contextBridge.exposeInMainWorld('inspector', {
  /**
   * @param {(nodes: string[]) => void} callback
   */
  onTargets: (callback) => {
    /**
     * @param {any} event
     * @param {string} value
     */
    const onTargets = (event, value) => callback(JSON.parse(value))
    ipcRenderer.on('libp2p-inspector:targets', onTargets)
  },

  /**
   * @param {(address: string) => void} callback
   */
  onConnected: (callback) => {
    /**
     * @param {any} event
     * @param {string} value
     */
    const onConnected = (event, value) => callback(value)
    ipcRenderer.on('libp2p-inspector:connected', onConnected)
  },

  /**
   * @param {(message: any) => void} callback
   */
  onRPC: (callback) => {
    /**
     * @param {any} event
     * @param {any} message
     */
    const onRPC = (event, message) => {
      callback(message)
    }
    ipcRenderer.on('libp2p-inspector:receive-rpc', onRPC)
  },

  /**
   * @param {string} address
   */
  connect: (address) => {
    ipcRenderer.send('libp2p-inspector:connect', address)
  },

  cancelConnect: () => {
    ipcRenderer.send('libp2p-inspector:cancel-connect')
  },

  disconnect: () => {
    ipcRenderer.send('libp2p-inspector:disconnect')
  },

  /**
   * @param {any} message
   */
  sendRPC: (message) => {
    ipcRenderer.send('libp2p-inspector:send-rpc', message)
  }
})

/*
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) {
      element.innerText = text
    }
  }

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type] ?? '')
  }
})
*/
