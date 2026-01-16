import { InvalidParametersError } from '@libp2p/interface'
import type { GossipSub } from '@libp2p/gossipsub'

function isGossipSub (obj?: any): obj is GossipSub {
  if (obj == null) {
    return false
  }

  return typeof obj.publish === 'function' &&
    typeof obj.getSubscribers === 'function' &&
    typeof obj.unsubscribe === 'function' &&
    typeof obj.subscribe === 'function'
}

export function getPubSub (component: string, components: any): GossipSub {
  const pubsub = components[component]

  if (!isGossipSub(pubsub)) {
    throw new InvalidParametersError(`Component ${component} did not implement the PubSub interface`)
  }

  return pubsub
}
