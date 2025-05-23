import { TypedEventEmitter } from '@libp2p/interface'

export interface InspectorEvents {
  /**
   * Targets were updated and should be sent to the frontend
   */
  targets: CustomEvent

  /**
   * The current target sent an RPC message that should be sent to the frontend
   */
  rpc: CustomEvent<Uint8Array>
}

export class Events extends TypedEventEmitter<InspectorEvents> {
  private timeout?: ReturnType<typeof setTimeout>

  /**
   * Debounce telling the UI that the target info has changed
   */
  updateTargets (): void {
    clearTimeout(this.timeout)

    this.timeout = setTimeout(() => {
      this.safeDispatchEvent('targets')
    }, 1)
  }

  receiveRPC (buf: Uint8Array): void {
    this.safeDispatchEvent('rpc', {
      detail: buf
    })
  }
}
