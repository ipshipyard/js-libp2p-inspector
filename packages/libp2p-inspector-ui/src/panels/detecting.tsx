import { FloatingPanel } from './floating-panel.js'

export const DetectingPanel = () => {
  return (
    <>
      <FloatingPanel>
        <h2>Please wait</h2>
        <p>Connecting to libp2p...</p>
      </FloatingPanel>
    </>
  )
}
