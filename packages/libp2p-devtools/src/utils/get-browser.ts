export function getBrowserInstance (): typeof chrome {
  if (globalThis.chrome != null) {
    return globalThis.chrome
  }

  // Get extension api Chrome or Firefox
  return (globalThis as any).browser
}
