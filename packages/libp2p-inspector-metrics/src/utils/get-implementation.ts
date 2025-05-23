import { InvalidParametersError, serviceCapabilities } from '@libp2p/interface'

export function getComponent <T> (component: string, components: any, capability: string): T {
  const output = components[component]

  if (output[serviceCapabilities]?.includes(capability) === true) {
    return output
  }

  throw new InvalidParametersError(`Component ${component} did not have capabilitiy ${capability}`)
}
