import './heading.css'

export interface HeadingProps {
  children: any
  help?: string
}

export function Heading ({ children, help }: HeadingProps) {
  const sub = help == null ? undefined : <small>{help}</small>

  return (
    <div className="Heading">
      {children}
      {sub}
    </div>
  )
}
