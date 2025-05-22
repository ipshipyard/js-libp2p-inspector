import './group.css'

export interface GroupProps {
  children: any
}

export function Group ({ children }:GroupProps) {
  return (
    <div className="Group">
      {children}
    </div>
  )
}
