import { createServer } from 'node:net'
import { start, stop, TypedEventEmitter } from '@libp2p/interface'
import { getThinWaistAddresses } from '@libp2p/utils/get-thin-waist-addresses'
import { isPrivate } from '@libp2p/utils/multiaddr/is-private'
import { multiaddr } from '@multiformats/multiaddr'
import { encode, decode } from 'it-length-prefixed'
import { pushable } from 'it-pushable'
import multicastDNS from 'multicast-dns'
import { duplex } from 'stream-to-it'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { MessageEvent } from './message-event.ts'
import type { InspectorMessage } from '../index.js'
import type { ChannelMessages, Messages, MessagesComponents, MessagesInit } from './index.js'
import type { Logger } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Answer, TxtAnswer } from 'dns-packet'
import type { Pushable } from 'it-pushable'
import type { MulticastDNS } from 'multicast-dns'
import type { Server, Socket, ListenOptions, AddressInfo } from 'node:net'

interface MDNSPortInit extends MessagesInit {
  messages: TCPPortMessages
}

class MDNSPortAdvertisement {
  private readonly components: MessagesComponents
  private readonly log: Logger
  private readonly serviceTag: string
  private mdns?: MulticastDNS
  private messages: TCPPortMessages

  constructor (components: MessagesComponents, init: MDNSPortInit) {
    this.components = components
    this.log = components.logger.forComponent('libp2p:inspector-metrics:messages')
    this.serviceTag = init.serviceTag ?? '_libp2p_inspector_metrics._tcp.local'
    this.messages = init.messages

    this._onMdnsQuery = this._onMdnsQuery.bind(this)
    this._onMdnsWarning = this._onMdnsWarning.bind(this)
    this._onMdnsError = this._onMdnsError.bind(this)
  }

  async start (): Promise<void> {
    this.mdns = multicastDNS()
    this.mdns.on('query', this._onMdnsQuery)
    this.mdns.on('warning', this._onMdnsWarning)
    this.mdns.on('error', this._onMdnsError)
  }

  async stop (): Promise<void> {
    this.mdns?.destroy()
    this.mdns = undefined
  }

  _onMdnsQuery (event: multicastDNS.QueryPacket): void {
    const address = this.messages.server?.address()

    if (this.mdns == null || address == null) {
      return
    }

    if (event.questions[0]?.name !== this.serviceTag) {
      return
    }

    const answers: Answer[] = [{
      name: this.serviceTag,
      type: 'PTR',
      class: 'IN',
      ttl: 120,
      data: `${this.components.peerId}.${this.serviceTag}`
    }, ...toMultiaddrs(address)
      // mDNS requires link-local addresses only
      // https://github.com/libp2p/specs/blob/master/discovery/mdns.md#issues
      .filter(isLinkLocal)
      .map((ma): TxtAnswer => {
        return {
          name: `${this.components.peerId}.${this.serviceTag}`,
          type: 'TXT',
          class: 'IN',
          ttl: 120,
          data: ma.toString()
        }
      })
    ]

    this.mdns.respond(answers)
  }

  _onMdnsWarning (err: Error): void {
    this.log.error('mdns warning', err)
  }

  _onMdnsError (err: Error): void {
    this.log.error('mdns error', err)
  }
}

function toMultiaddrs (addr: string | AddressInfo): Multiaddr[] {
  if (typeof addr === 'string') {
    // TODO: wrap with encodeURIComponent https://github.com/multiformats/multiaddr/pull/174
    return [multiaddr(`/unix/${addr}`)]
  }

  const { family, address, port } = addr

  return getThinWaistAddresses(multiaddr(`/ip${family === 'IPv6' ? 6 : 4}/${address}/tcp/${port}`))
}

function isLinkLocal (ma: Multiaddr): boolean {
  // match private ip4/ip6 & loopback addresses
  if (isPrivate(ma)) {
    return true
  }

  return false
}

interface Client {
  pushable: Pushable<Uint8Array>
  socket: Socket
}

class TCPPortMessages extends TypedEventEmitter<ChannelMessages> {
  private readonly log: Logger
  public server?: Server
  private clients: Client[]
  private readonly listenOptions: ListenOptions | string | number
  private advertisement: MDNSPortAdvertisement

  constructor (components: MessagesComponents, init: MessagesInit) {
    super()

    this.log = components.logger.forComponent('libp2p:inspector-metrics:messages')
    this.clients = []
    this.listenOptions = init.listenOptions ?? 0

    this.advertisement = new MDNSPortAdvertisement(components, {
      ...init,
      messages: this
    })

    this.onSocket = this.onSocket.bind(this)
  }

  async start (): Promise<void> {
    this.server = createServer(this.onSocket)

    await new Promise<void>((resolve, reject) => {
      this.server?.listen(this.listenOptions, () => {
        resolve()
      })
      this.server?.on('error', (err) => {
        reject(err)
      })
    })

    await start(this.advertisement)
  }

  async stop (): Promise<void> {
    await stop(this.advertisement)
    this.server?.close()
    this.clients.forEach(({ socket }) => {
      socket.destroy()
    })
  }

  onSocket (socket: Socket): void {
    const client = {
      socket,
      pushable: pushable()
    }

    this.clients.push(client)

    const duplexSocket = duplex(socket)

    Promise.all([
      duplexSocket.sink(encode(client.pushable)),
      (async () => {
        for await (const buf of decode(duplexSocket.source)) {
          try {
            const data = JSON.parse(uint8ArrayToString(buf.subarray()))

            this.dispatchEvent(new MessageEvent(this, data))
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('could not parse message', uint8ArrayToString(buf.subarray()), err)
          }
        }
      })()
    ])
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('socket error during messages decode', err)
      })
  }

  postMessage (message: InspectorMessage): void {
    const buf = uint8ArrayFromString(JSON.stringify(message))
    this.clients.forEach(({ pushable }) => {
      pushable.push(buf)
    })
  }
}

export function messages (components: MessagesComponents, init: MessagesInit = {}): Messages {
  return new TCPPortMessages(components, init)
}
