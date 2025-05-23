export type Platform = 'chrome' | 'firefox' | 'unknown'

export function getPlatform (): Platform {
  const userAgent = navigator.userAgent

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
  if (userAgent.includes('Firefox/')) {
    return 'firefox'
  }

  if (userAgent.includes('Chrome/') || userAgent.includes('Chromium/')) {
    return 'chrome'
  }

  return 'unknown'
}
