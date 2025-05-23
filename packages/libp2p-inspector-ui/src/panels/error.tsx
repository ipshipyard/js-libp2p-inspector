import type { JSX } from "react"
import { Panel } from "./panel.tsx"
import './error.css'

interface ErrorPanelProps {
  error: Error
}

export function ErrorPanel ({ error }: ErrorPanelProps): JSX.Element {
  return (
    <Panel className='Error'>
      <pre><code>{error.stack ?? error.toString()}</code></pre>
    </Panel>
  )
}
