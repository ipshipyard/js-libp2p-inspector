import './index.css'

export { Inspector } from './panels/inspector.js'
export { FloatingPanel } from './panels/floating-panel.js'
export { Button } from './panels/button.js'
export { TextInput } from './panels/text-input.js'
export { Heading } from './panels/heading.js'
export { Group } from './panels/group.js'
export * from './panels/status.js'
export { ErrorPanel } from './panels/error.tsx'
export { FatalErrorPanel } from './panels/fatal-error.tsx'
export { Footer } from './panels/footer.tsx'
export { ConnectingPanel } from './panels/connecting.tsx'

// icons
export type { IconProps } from './panels/icons/index.js'
export { CopyIcon } from './panels/icons/icon-copy.js'
export { DeleteIcon } from './panels/icons/icon-delete.js'
export { Libp2pIcon } from './panels/icons/icon-libp2p.js'
export { SpinnerIcon } from './panels/icons/icon-spinner.js'
export { ShipyardIcon } from './panels/icons/icon-shipyard.tsx'

// context
export { HandleCopyToClipboardContext } from './context/handle-copy-to-clipboard.ts'
