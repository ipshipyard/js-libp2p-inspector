import { Button } from '@ipshipyard/libp2p-inspector-ui'
import { FaPlug, FaPlugCircleExclamation } from 'react-icons/fa6'
import type { InspectTarget, InspectTargetStatus } from '../../ipc/index.ts'
import type { JSX } from 'react'
import './node.css'

export interface NodePanelProps {
  targets: InspectTarget[]
  onDisconnect(evt: React.UIEvent): void
}

function getIcon (status: InspectTargetStatus): JSX.Element {
  if (status === 'connected') {
    return <FaPlug />
  }

  return <FaPlugCircleExclamation />
}

export const NodePanel = ({ targets, onDisconnect }: NodePanelProps): JSX.Element => {
  const target = targets.find(target => target.status === 'connected')

  if (target == null) {
    throw new Error('No connected target found')
  }

  return (
    <>
      <div className='NodePanel'>
        <p>{getIcon(target.status)} {target.userAgent} <Button onClick={onDisconnect}>Disconnect</Button></p>
      </div>
    </>
  )
}
