import { getBrowserInstance } from './get-browser.js'

const browser = getBrowserInstance()

export type BrowserTheme = 'light' | 'dark'

export function getBrowserTheme (): BrowserTheme {
  return browser.devtools.panels.themeName === 'dark' ? 'dark' : 'light'
}
