import { bases } from 'multiformats/basics'

// @ts-expect-error - Not easy to combine these types.
const multibaseDecoder = Object.values(bases).map(b => b.decoder).reduce((d, b) => d.or(b))

export function getBytes (str: string): Uint8Array {
  str = str?.trim()

  if (str == null || str === '') {
    throw new Error('Please enter a key')
  }

  return multibaseDecoder.decode(str)
}
