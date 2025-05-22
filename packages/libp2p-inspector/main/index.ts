import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { discovery } from './discovery.js'
import { Events } from './events.ts'
import type { Target } from './target.ts'

let mainWindow: BrowserWindow | undefined

const events = new Events()
const targets = new Map<string, Target>()
discovery(targets, events)

events.addEventListener('targets', (evt) => {
  const list = []

  for (const [key, target] of targets.entries()) {
    if (target.status === 'failed') {
      targets.delete(key)
    } else {
      list.push(target)
    }
  }

  mainWindow?.webContents.send('libp2p-inspector:targets', JSON.stringify(list, null, 2))
})

events.addEventListener('rpc', (evt) => {
  mainWindow?.webContents.send('libp2p-inspector:receive-rpc', evt.detail)
})

ipcMain.on('libp2p-inspector:connect', (_event, value) => {
  try {
    if (value.startsWith('/')) {
      console.log('libp2p-inspector:connect connect to multiaddr', value)
      throw new Error('Not implemented')
    } else {
      for (const target of targets.values()) {
        if (target.id.equals(value)) {
          target.connect()
        } else {
          target.disconnect()
        }
      }
    }

    mainWindow?.webContents.send('libp2p-inspector:connected')
  } catch (err) {
    mainWindow?.webContents.send('libp2p-inspector:connected', err)
  }
})

ipcMain.on('libp2p-inspector:cancel-connect', (_event, value) => {
  console.log('libp2p-inspector:cancel-connect', value)
})

ipcMain.on('libp2p-inspector:send-rpc', (_event, value) => {
  for (const target of targets.values()) {
    if (target.status === 'connected') {
      target.sendMessage(value)
    }
  }
})

ipcMain.on('libp2p-inspector:disconnect', (_event) => {
  for (const target of targets.values()) {
    target.disconnect()
  }
})

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.cjs')
    }
  })
  mainWindow.loadFile(path.join(import.meta.dirname, '../../index.html'));

  if (process.env.NODE_ENV !== 'test') {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('close', () => {
    mainWindow = undefined
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})
