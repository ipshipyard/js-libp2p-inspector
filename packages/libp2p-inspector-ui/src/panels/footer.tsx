import './footer.css'

export interface FooterProps {
  children: any
}

export function Footer ({ children }: FooterProps) {
  return (
    <div className="Footer">
      {children}
    </div>
  )
}
