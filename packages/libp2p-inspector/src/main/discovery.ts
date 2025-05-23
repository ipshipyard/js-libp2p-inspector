import { peerIdFromString } from '@libp2p/peer-id'
import { repeatingTask } from '@libp2p/utils/repeating-task'
import { multiaddr } from '@multiformats/multiaddr'
import multicastDNS from 'multicast-dns'
import { Target } from './target.js'
import type { Events } from './events.ts'

const DISCOVERY_INTERVAL = 1_000
const SERVICE_TAG = '_libp2p_inspector_metrics._tcp.local'

export function discovery (targets = new Map<string, Target>(), events: Events): void {
  const mdns = multicastDNS()
  mdns.on('warning', (err) => {
    // eslint-disable-next-line no-console
    console.error('mdns warning', err)
  })
  mdns.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('mdns error', err)
  })
  mdns.on('response', (event) => {
    for (const answer of event.answers) {
      if (answer.name.endsWith(`.${SERVICE_TAG}`) && answer.type === 'TXT') {
        const str = answer.name.replace(`.${SERVICE_TAG}`, '')
        const id = peerIdFromString(str)
        let target = targets.get(str)

        if (target == null) {
          target = new Target(id, events)
          targets.set(str, target)

          events.updateTargets()
        }

        target.addAddress(multiaddr(answer.data[0].toString()))
        events.updateTargets()
      }
    }
  })

  const task = repeatingTask(() => {
    mdns.query({
      questions: [{
        name: SERVICE_TAG,
        type: 'PTR'
      }]
    })
  }, DISCOVERY_INTERVAL, {
    runImmediately: true
  })
  task.start()
}
