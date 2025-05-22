import './pubsub.css'
import { useState } from 'react'
import { Button } from '../button.js'
import { Panel } from '../panel.js'
import { SmallError, SmallSuccess } from '../status.js'
import { TextInput } from '../text-input.js'
import type { MetricsRPC } from '@ipshipyard/libp2p-inspector-metrics'
import type { Message } from '@libp2p/interface'
import type { ReactElement } from 'react'

export interface PubSubProps {
  component: string
  metrics: MetricsRPC
  pubsub: Record<string, Message[]>
}

export function PubSub ({ component, metrics, pubsub }: PubSubProps): ReactElement {
  const [topics, setTopics] = useState<string[]>([])
  const [topic, setTopic] = useState('')

  function loadTopics (): void {
    metrics.pubsub.getTopics(component)
      .then(list => {
        setTopics(list)
      })
      .catch(err => {
        console.error('could not get subs', err)
      })
  }

  loadTopics()

  return (
    <>
      <SubscribePanel component={component} metrics={metrics} subscribed={loadTopics} />
      <TopicList topics={topics} setTopic={setTopic} />
      <TopicDisplay topic={topic} component={component} metrics={metrics} messages={pubsub[topic] ?? []} />
    </>
  )
}

interface SubscribePanelOptions {
  component: string
  subscribed(): void
  metrics: MetricsRPC
}

function SubscribePanel ({ component, subscribed, metrics }: SubscribePanelOptions): ReactElement {
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState(<small>E.g. `my-topic`, etc</small>)

  function subscribe (evt: { preventDefault(): void }, topic: string): boolean {
    evt.preventDefault()

    metrics.pubsub.subscribe(component, topic)
      .then(() => {
        setResult(<SmallSuccess message="Subscribed successfully" />)
        subscribed()
      }, (err) => {
        setResult(<SmallError error={err} />)
      })

    return false
  }

  return (
    <Panel>
      <p>Subscribe to a PubSub topic</p>
      <form onSubmit={(evt) => subscribe(evt, topic)}>
        <TextInput type="text" value={topic} placeholder="Topic" onChange={(e) => { setTopic(e.target.value) }} />
        <Button onClick={(evt) => subscribe(evt, topic)} primary={true}>Subscribe</Button>
      </form>
      {result}
    </Panel>
  )
}

interface TopicListOptions {
  topics: string[]
  setTopic(topic: string): void
}

function TopicList ({ topics, setTopic }: TopicListOptions): ReactElement {
  return (
    <div>
      <ul>
        {topics.map((topic, index) => (
          <li key={`sub-${index}`} onClick={() => { setTopic(topic) }}>
            {topic}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface TopicDisplayOptions {
  component: string
  topic: string
  metrics: MetricsRPC
  messages: Message[]
}

function TopicDisplay ({ component, topic, metrics, messages }: TopicDisplayOptions): ReactElement {
  if (topic === '') {
    return <></>
  }

  const [message, setMessage] = useState('')
  const [result, setResult] = useState(<small>E.g. `hello world`, etc</small>)

  function publish (evt: { preventDefault(): void }, topic: string): boolean {
    evt.preventDefault()

    metrics.pubsub.publish(component, topic, new TextEncoder().encode(message))
      .then(() => {
        setResult(<SmallSuccess message="Published successfully" />)
      }, (err) => {
        setResult(<SmallError error={err} />)
      })

    return false
  }

  return (
    <>
      <Panel>
        <p>Publish a message</p>
        <form onSubmit={(evt) => publish(evt, topic)}>
          <TextInput type="text" value={message} placeholder="Message" onChange={(e) => { setMessage(e.target.value) }} />
          <Button onClick={(evt) => publish(evt, topic)} primary={true}>Publish</Button>
        </form>
        {result}
      </Panel>
      <Panel>
        {messages.map((message, index) => {
          if (message.type === 'signed') {
            return (
              <div key={`message-${index}`}>
                <p>From: {message.from.toString()}</p>
                <p>Seq: {message.sequenceNumber.toString()}</p>
                <p>Data: {new TextDecoder().decode(message.data)}</p>
              </div>
            )
          }

          return (
            <div key={`message-${index}`}>
              <p>Data: {new TextDecoder().decode(message.data)}</p>
            </div>
          )
        })}
      </Panel>
    </>
  )
}
