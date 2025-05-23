import { expect } from '@playwright/test'
import { _electron as electron } from 'playwright-core'
import { getLibp2p } from './fixtures/get-libp2p.ts'
import type { Libp2p } from '@libp2p/interface'
import type { ElectronApplication } from 'playwright-core'

const TEST_USER_AGENT = 'libp2p/test'

describe('launch app', () => {
  let electronApp: ElectronApplication
  let libp2p: Libp2p

  beforeEach(async () => {
    electronApp = await electron.launch({
      args: [
        './dist/src/main/index.js'
      ]
    })
    libp2p = await getLibp2p({
      nodeInfo: {
        userAgent: TEST_USER_AGENT
      }
    })
  })

  afterEach(async () => {
    await electronApp?.close()
    await libp2p?.stop()
  })

  it('should detect libp2p node', async () => {
    const targetListSelector = '.TargetListPanel'
    const window = await electronApp.firstWindow()

    await window.waitForSelector(`${targetListSelector}:has-text("${TEST_USER_AGENT}")`)

    const outputContent = await window.textContent(targetListSelector)
    expect(outputContent).toContain(TEST_USER_AGENT)
  })
})
