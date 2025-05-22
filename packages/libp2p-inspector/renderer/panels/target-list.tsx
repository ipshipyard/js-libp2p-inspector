import { FloatingPanel, Button, TextInput, Heading, Group, SpinnerIcon, Libp2pIcon, SmallError } from '@ipshipyard/libp2p-inspector-ui'
import type { PeerId } from '@libp2p/interface'
import { useState } from 'react'
import type { JSX } from 'react'
import { FaServer } from 'react-icons/fa6'
import type { InspectTarget, InspectTargetStatus } from '../../ipc/index.ts'
import './target-list.css'

export interface TargetListPanelProps {
  targets: InspectTarget[]
  onConnect: (evt: React.UIEvent, peer: string | PeerId) => void
}

function getIcon (name: string) {
  if (name === 'js-libp2p') {
    return <Libp2pIcon />
  }

  return <FaServer />
}

function getAction (target: InspectTarget, onConnect: (evt: React.UIEvent, peer: string | PeerId) => void) {
  if (target.status === 'ready') {
    return <Button onClick={(evt) => onConnect(evt, target.id)}>Inspect</Button>
  }

  if (target.status === 'incompatible') {
    return <SmallError error='The remote @ipshipyard/inspector-metrics dep is outdated' />
  }

  return <SpinnerIcon />
}

export const TargetListPanel = ({ targets, onConnect }: TargetListPanelProps): JSX.Element => {
  return (
    <div className='TargetListPanel'>
      {
        targets.length > 0 ? (
          <ul>
            {targets.map((target, index) => (
              <li key={`node-${index}`}>
                {getIcon(target.name)} {target.userAgent} {getAction(target, onConnect)}
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p><SpinnerIcon /> Searching...</p>
          </>
        )
      }
    </div>
  )
}
