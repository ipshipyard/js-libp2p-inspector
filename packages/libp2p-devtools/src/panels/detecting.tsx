import { FloatingPanel } from '@ipshipyard/libp2p-inspector-ui'
import type { JSX } from 'react'

export const DetectingPanel = (): JSX.Element => {
  return (
    <>
      <FloatingPanel>
        <h2>Please wait</h2>
        <p>Connecting to libp2p...</p>
      </FloatingPanel>
    </>
  )
}
