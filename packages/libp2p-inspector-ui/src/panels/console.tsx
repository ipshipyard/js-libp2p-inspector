import type { JSX } from "react"
import { Panel } from "./panel.tsx"
import './console.css'

interface ConsolePanelProps {
  children: any[] | string
}

export function ConsolePanel ({ children }: ConsolePanelProps): JSX.Element {
  return (
    <Panel className='Console'>
      <pre><code>{children}</code></pre>
    </Panel>
  )
}
