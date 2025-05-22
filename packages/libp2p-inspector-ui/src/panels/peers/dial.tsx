import './dial.css'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { Component } from 'react'
import { Button } from '../button.js'
import { Panel } from '../panel.js'
import { SmallError, SmallSuccess } from '../status.js'
import { TextInput } from '../text-input.js'
import type { MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { Address } from '@libp2p/interface'
import type { FormEvent, ReactElement, JSX } from 'react'

export interface DialPeerProps {
  metrics: MetricsRPC
}

export interface DialPeerState {
  target: string
  error: string
  details: JSX.Element[]
}

const dialEvents: Record<string, string | ReactElement | ((args: any) => string | ReactElement)> = {
  // internal dial events
  'dial-queue:already-connected': 'Already connected to this peer',
  'dial-queue:add-to-dial-queue': 'Adding dial to queue',
  'dial-queue:already-in-dial-queue': 'Dial to this peer already in queue',
  'dial-queue:start-dial': 'Dialing peer',
  'dial-queue:calculated-addresses': (addreseses: Address[]) => (
    <>
      Calculated addresses
      <ol>
        {
          addreseses.map((address, index) => (
            <li key={`address-${index}`} className='calculated-address'>{address.multiaddr.toString()}</li>
          ))
        }
      </ol>
    </>
  ),
  'transport-manager:selected-transport': (transport: string) => `Selected transport ${transport}`,

  // webrtc
  'webrtc:initiate-connection': 'WebRTC initiating connection',
  'webrtc:dial-relay': 'Dialing relay',
  'webrtc:reuse-relay-connection': 'Already connected to relay',
  'webrtc:open-signaling-stream': 'Open signaling stream',
  'webrtc:send-sdp-offer': 'Sending SDP offer',
  'webrtc:read-sdp-answer': 'Reading SDP answer',
  'webrtc:read-ice-candidates': 'Read ICE candidates',
  'webrtc:add-ice-candidate': (candidate) => (
    <>
      Add ICE candidate <span className='ice-candidate'>{candidate}</span>
    </>
  ),
  'webrtc:end-of-ice-candidates': 'End of ICE candidates',
  'webrtc:close-signaling-stream': 'Closing signaling stream',

  // circuit relay
  'circuit-relay:open-connection': 'Connecting to relay',
  'circuit-relay:reuse-connection': 'Already connected to relay',
  'circuit-relay:open-hop-stream': 'Opening hop stream',
  'circuit-relay:write-connect-message': 'Sending CONNECT',
  'circuit-relay:read-connect-response': 'Reading CONNECT response',

  // websockets
  'websockets:open-connection': 'Open connection',

  // webtransport
  'webtransport:wait-for-session': 'Opening session',
  'webtransport:open-authentication-stream': 'Open authentication stream',
  'webtransport:secure-outbound-connection': 'Perform Noise handshake',
  'webtransport:close-authentication-stream': 'Close authentication stream'
}

export class DialPeer extends Component<DialPeerProps, DialPeerState> {
  constructor (props: DialPeerProps) {
    super(props)

    this.state = {
      target: '',
      error: '',
      details: []
    }
  }

  componentDidMount (): void {
    this.setState({
      target: '',
      error: '',
      details: []
    })
  }

  private dial (evt: FormEvent | Event, target: string): boolean {
    evt.preventDefault()

    this.setState({
      error: '',
      details: []
    })

    target = target?.trim()

    if (target == null || target === '') {
      this.setState({
        error: 'Please enter a PeerId or Multiaddr'
      })

      return false
    }

    try {
      peerIdFromString(target)
    } catch {
      try {
        multiaddr(target)
      } catch {
        this.setState({
          error: 'PeerId/Multiaddr invalid'
        })

        return false
      }
    }

    this.props.metrics.openConnection(target, {
      onProgress: (event) => {
        const type: string = event.type
        const component = type.split(':')[0]
        let message = dialEvents[type]

        if (typeof message === 'function') {
          message = message(event.detail)
        }

        if (message == null) {
          message = type
        }

        this.setState(s => {
          return {
            details: [
              ...s.details,
              <p key={`event-${s.details.length}`} className={`DialEvent ${component}`}>{message}</p>
            ]
          }
        })
      }
    })
      .then(() => {
        this.setState(s => {
          return {
            error: '',
            details: [
              ...s.details,
              <SmallSuccess className='DialEvent' key={`event-${s.details.length}`} message={'Dial successful'} />
            ]
          }
        })
      })
      .catch(err => {
        this.setState(s => {
          return {
            details: [
              ...s.details,
              <SmallError className='DialEvent' key={`event-${s.details.length}`} errorPrefix='Dial failed' error={err} />
            ]
          }
        })
      })

    return false
  }

  render (): ReactElement {
    return (
      <Panel>
        <p>Enter a Peer ID or multiaddr to dial:</p>
        <form onSubmit={(evt) => this.dial(evt, this.state.target)}>
          <TextInput type="text" value={this.state.target} placeholder="123Foo..." onChange={(e) => {
            this.setState({
              target: e.target.value
            })
          }} />
          <Button onClick={(evt) => this.dial(evt, this.state.target)} primary={true}>Dial</Button>
        </form>
        {this.state.error != null ? <SmallError error={this.state.error} /> : undefined}
        {this.state.details != null
          ? (
          <div className='DialEvents'>
            {this.state.details}
          </div>
            )
          : undefined}
      </Panel>
    )
  }
}
