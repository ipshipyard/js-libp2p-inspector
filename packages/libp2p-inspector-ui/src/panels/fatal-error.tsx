import { Button, ErrorPanel, FloatingPanel } from '@ipshipyard/libp2p-inspector-ui'
import type { JSX } from 'react'
import './fatal-error.css'

interface FatalErrorPanelProps {
  error: Error
  onBack?: (evt: React.UIEvent) => void
}

export function FatalErrorPanel ({ error, onBack }: FatalErrorPanelProps): JSX.Element  {
  return (
    <>
      <FloatingPanel className='FatalErrorPanel'>
        <h2>Error</h2>
        <ErrorPanel error={error} />
        {onBack != null ? <Button onClick={onBack}>Back</Button> : ''}
      </FloatingPanel>
    </>
  )
}
