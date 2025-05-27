import { FloatingPanel } from './floating-panel.js'
import type { JSX } from 'react'

export const ConnectingPanel = (): JSX.Element => {
  return (
    <>
      <FloatingPanel>
        <h2>Please wait</h2>
        <p>Connecting to libp2p...</p>
      </FloatingPanel>
    </>
  )
}
