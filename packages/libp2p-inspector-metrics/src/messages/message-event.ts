import type { Messages } from './index.ts'

export class MessageEvent<T> extends Event {
  data: T
  source: Messages

  constructor (source: Messages, data: T, eventInitDict?: EventInit) {
    super('message', eventInitDict)

    this.source = source
    this.data = data
  }
}
