import type { InspectorMessage, ClientMessage } from '../index.js'
import type { ComponentLogger, PeerId, TypedEventTarget } from '@libp2p/interface'
import type { ListenOptions } from 'node:net'

export interface ChannelMessages {
  message: MessageEvent<ClientMessage>
}

export interface Messages extends TypedEventTarget<ChannelMessages> {
  postMessage (message: InspectorMessage): void
  addEventListener(type: 'message', listener: (evt: MessageEvent<ClientMessage>) => void): void
}

export interface MessagesComponents {
  peerId: PeerId
  logger: ComponentLogger
}

export interface MessagesInit {
  serviceTag?: string
  listenOptions?: ListenOptions | string | number
}

export { messages } from './messages.js'
