# @ipshipyard/libp2p-inspector

[![codecov](https://img.shields.io/codecov/c/github/ipshipyard/js-libp2p-inspector.svg?style=flat-square)](https://codecov.io/gh/ipshipyard/js-libp2p-inspector)
[![CI](https://img.shields.io/github/actions/workflow/status/ipshipyard/js-libp2p-inspector/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipshipyard/js-libp2p-inspector/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Inspect a running libp2p node

# About

<!--

!IMPORTANT!

Everything in this README between "# About" and "# Install" is automatically
generated and will be overwritten the next time the doc generator is run.

To make changes to this section, please update the @packageDocumentation section
of src/index.js or src/index.ts

To experiment with formatting, please run "npm run docs" from the root of this
repo and examine the changes made.

-->

An electron app that bundles @ipshipyard/libp2p-inspector-ui for use with
libp2p nodes running under Node.js or (eventually) in browsers.

![libp2p-inspector running in Electron](https://github.com/ipshipyard/js-libp2p-inspector/blob/main/assets/electron.png?raw=true)

## Installation instructions

### 1. libp2p configuration

Configure `@ipshipyard/libp2p-inspector-metrics` as your metrics implementation:

```ts
import { createLibp2p } from 'libp2p'
import { inspectorMetrics } from '@ipshipyard/libp2p-inspector-metrics'

const node = await createLibp2p({
  metrics: inspectorMetrics(),
  //... other options her
})
```

### 2. Install the inspector

```console
$ npm i -g @ipshipyard/libp2p-inspector
```

### 3. Run

```console
$ libp2p-inspector
```

Local libp2p nodes running the `@ipshipyard/libp2p-inspector-metrics` metrics
implementation will advertise themselves via MDNS and should appear in the
app.

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipshipyard/js-libp2p-inspector/blob/main/packages/libp2p-inspector/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipshipyard/js-libp2p-inspector/blob/main/packages/libp2p-inspector/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
