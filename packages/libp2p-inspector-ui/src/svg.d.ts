// allows importing .svg files
declare module '*.svg' {
  const content: string
  export default content
}
