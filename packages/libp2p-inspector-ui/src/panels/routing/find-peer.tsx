import { peerIdFromString } from '@libp2p/peer-id'
import { Component } from 'react'
import { Button } from '../button.js'
import { Panel } from '../panel.js'
import { SmallError, SmallSuccess } from '../status.js'
import { TextInput } from '../text-input.js'
import type { MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { PeerId } from '@libp2p/interface'
import type { FormEvent, ReactElement, JSX } from 'react'

export interface FindPeerProps {
  metrics: MetricsRPC
}

export interface FindPeerState {
  target: string
  error: string
  details: JSX.Element[]
}

export class FindPeer extends Component<FindPeerProps, FindPeerState> {
  constructor (props: FindPeerProps) {
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

  private findPeer (evt: FormEvent | Event, arg0: string): boolean {
    evt.preventDefault()

    this.setState({
      error: '',
      details: []
    })

    arg0 = arg0?.trim()

    if (arg0 == null || arg0 === '') {
      this.setState({
        error: 'Please enter a key'
      })

      return false
    }

    let peerId: PeerId

    try {
      peerId = peerIdFromString(arg0)
    } catch {
      this.setState({
        error: 'PeerId invalid'
      })

      return false
    }

    this.props.metrics.peerRouting.findPeer(peerId, {
      onProgress: (event) => {
        console.info('incoming on progress event', event)

        let message: string = event.type

        if (event.type === 'dial:already-connected') {
          message = 'Already connected to this peer'
        } else if (event.type === 'dial:add-to-dial-queue') {
          message = 'Adding dial to queue'
        } else if (event.type === 'dial:already-in-dial-queue') {
          message = 'Dial to this peer already in queue'
        } else if (event.type === 'dial:calculate-addresses') {
          message = 'Calculating addresses'
        } else if (event.type === 'dial:selected-transport') {
          message = `Selected transport ${event.detail}`
        }

        this.setState(s => {
          return {
            details: [
              ...s.details,
              <p key={`event-${s.details.length}`}>{message}</p>
            ]
          }
        })
      }
    })
      .then((peerInfo) => {
        this.setState(s => {
          return {
            error: '',
            details: [
              ...s.details,
              <pre key='results'><code>{JSON.stringify(peerInfo, null, 2)}</code></pre>,
              <SmallSuccess key={`event-${s.details.length}`} message={'Get successful'} />
            ]
          }
        })
      })
      .catch(err => {
        this.setState(s => {
          return {
            details: [
              ...s.details,
              <SmallError key={`event-${s.details.length}`} error={err} />
            ]
          }
        })
      })

    return false
  }

  render (): ReactElement {
    return (
      <Panel>
        <p>Enter a PeerId:</p>
        <form onSubmit={(evt) => this.findPeer(evt, this.state.target)}>
          <TextInput type="text" value={this.state.target} placeholder="123Foo..." onChange={(e) => {
            this.setState({
              target: e.target.value
            })
          }} />
          <Button onClick={(evt) => this.findPeer(evt, this.state.target)} primary={true}>Get</Button>
        </form>
        {this.state.error != null ? <SmallError error={this.state.error} /> : undefined}
        {this.state.details}
      </Panel>
    )
  }
}
