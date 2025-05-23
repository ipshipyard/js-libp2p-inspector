import { Component } from 'react'
import { getBytes } from '../../utils/get-bytes.js'
import { Button } from '../button.js'
import { Panel } from '../panel.js'
import { SmallError, SmallSuccess } from '../status.js'
import { TextInput } from '../text-input.js'
import type { MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { FormEvent, JSX } from 'react'

export interface PutProps {
  metrics: MetricsRPC
}

export interface PutState {
  key: string
  value: string
  error: string
  details: JSX.Element[]
}

export class Put extends Component<PutProps, PutState> {
  constructor (props: PutProps) {
    super(props)

    this.state = {
      key: '',
      value: '',
      error: '',
      details: []
    }
  }

  componentDidMount (): void {
    this.setState({
      key: '',
      value: '',
      error: '',
      details: []
    })
  }

  private put (evt: FormEvent | Event, key: string, value: string): boolean {
    evt.preventDefault()

    this.setState({
      error: '',
      details: []
    })

    Promise.resolve()
      .then(async () => {
        await this.props.metrics.contentRouting.put(getBytes(key), getBytes(value), {
          onProgress: (event) => {
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

        this.setState(s => {
          return {
            error: '',
            details: [
              ...s.details,
              <SmallSuccess key={`event-${s.details.length}`} message='Get successful' />
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

  render (): JSX.Element {
    return (
      <Panel>
        <p>Enter a multibase encoded key and value store in the routing:</p>
        <form onSubmit={(evt) => this.put(evt, this.state.key, this.state.value)}>
          <TextInput
            type='text' value={this.state.key} placeholder='mKey...' onChange={(e) => {
              this.setState({
                key: e.target.value
              })
            }}
          />
          <TextInput
            type='text' value={this.state.value} placeholder='mValue...' onChange={(e) => {
              this.setState({
                value: e.target.value
              })
            }}
          />
          <Button onClick={(evt) => this.put(evt, this.state.key, this.state.value)} primary>Get</Button>
        </form>
        {this.state.error ? <SmallError error={this.state.error} /> : undefined}
        {this.state.details}
      </Panel>
    )
  }
}
