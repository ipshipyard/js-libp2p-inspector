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

const dialEvents: Record<string, (key: string, className: string, args: any) => ReactElement> = {
  // internal dial events
  'dial-queue:already-connected': (key, className) => <p key={key} className={className}>Already connected to this peer</p>,
  'dial-queue:add-to-dial-queue': (key, className) => <p key={key} className={className}>Adding dial to queue</p>,
  'dial-queue:already-in-dial-queue': (key, className) => <p key={key} className={className}>Dial to this peer already in queue</p>,
  'dial-queue:start-dial': (key, className) => <p key={key} className={className}>Dialing peer</p>,
  'dial-queue:calculated-addresses': (key, className, addreseses: Address[]) => (
    <>
      <p key={`${key}-1`} className={className}>Calculated addresses</p>
      <ol key={`${key}-2`} className={className}>
        {
          addreseses.map((address, index) => (
            <li key={`address-${index}`} className='calculated-address'>{address.multiaddr.toString()}</li>
          ))
        }
      </ol>
    </>
  ),
  'transport-manager:selected-transport': (key, className, transport: string) => <p key={key} className={className}>Selected transport {transport}</p>,

  // webrtc
  'webrtc:initiate-connection': (key, className) => <p key={key} className={className}>WebRTC initiating connection</p>,
  'webrtc:dial-relay': (key, className) => <p key={key} className={className}>Dialing relay</p>,
  'webrtc:reuse-relay-connection': (key, className) => <p key={key} className={className}>Already connected to relay</p>,
  'webrtc:open-signaling-stream': (key, className) => <p key={key} className={className}>Open signaling stream</p>,
  'webrtc:send-sdp-offer': (key, className) => <p key={key} className={className}>Sending SDP offer</p>,
  'webrtc:read-sdp-answer': (key, className) => <p key={key} className={className}>Reading SDP answer</p>,
  'webrtc:read-ice-candidates': (key, className) => <p key={key} className={className}>Read ICE candidates</p>,
  'webrtc:add-ice-candidate': (key, className, candidate) => <p key={key} className={className}>Add ICE candidate <span className='ice-candidate'>{candidate}</span></p>,
  'webrtc:end-of-ice-candidates': (key, className) => <p key={key} className={className}>End of ICE candidates</p>,
  'webrtc:close-signaling-stream': (key, className) => <p key={key} className={className}>Closing signaling stream</p>,

  // circuit relay
  'circuit-relay:open-connection': (key, className) => <p key={key} className={className}>Connecting to relay</p>,
  'circuit-relay:reuse-connection': (key, className) => <p key={key} className={className}>Already connected to relay</p>,
  'circuit-relay:open-hop-stream': (key, className) => <p key={key} className={className}>Opening hop stream</p>,
  'circuit-relay:write-connect-message': (key, className) => <p key={key} className={className}>Sending CONNECT</p>,
  'circuit-relay:read-connect-response': (key, className) => <p key={key} className={className}>Reading CONNECT response</p>,

  // websockets
  'websockets:open-connection': (key, className) => <p key={key} className={className}>Open connection</p>,

  // webtransport
  'webtransport:wait-for-session': (key, className) => <p key={key} className={className}>Opening session</p>,
  'webtransport:open-authentication-stream': (key, className) => <p key={key} className={className}>Open authentication stream</p>,
  'webtransport:secure-outbound-connection': (key, className) => <p key={key} className={className}>Perform Noise handshake</p>,
  'webtransport:close-authentication-stream': (key, className) => <p key={key} className={className}>Close authentication stream</p>,

  // tcp
  'tcp:open-connection': (key, className) => <p key={key} className={className}>Open connection</p>,

  // upgrader
  'upgrader:encrypt-outbound-connection': (key, className) => <p key={key} className={className}>Encrypting outbound connection</p>
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

        if (dialEvents[type] == null) {
          // eslint-disable-next-line no-console
          console.warn('No dial event handler for', type)
          return
        }

        this.setState(s => {
          return {
            details: [
              ...s.details,
              dialEvents[type](`event-${s.details.length}`, `DialEvent ${component}`, event.detail)
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
              <SmallSuccess className='DialEvent' key={`event-${s.details.length}`} message='Dial successful' />
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
          <TextInput
            type='text' value={this.state.target} placeholder='123Foo...' onChange={(e) => {
              this.setState({
                target: e.target.value
              })
            }}
          />
          <Button onClick={(evt) => this.dial(evt, this.state.target)} primary>Dial</Button>
        </form>
        {this.state.error !== '' ? <SmallError error={this.state.error} /> : undefined}
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
