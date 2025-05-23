# @ipshipyard/libp2p-inspector-metrics

[![codecov](https://img.shields.io/codecov/c/github/ipshipyard/js-libp2p-inspector.svg?style=flat-square)](https://codecov.io/gh/ipshipyard/js-libp2p-inspector)
[![CI](https://img.shields.io/github/actions/workflow/status/ipshipyard/js-libp2p-inspector/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipshipyard/js-libp2p-inspector/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Collect libp2p metrics and send them to browser DevTools

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

Configure your browser-based libp2p node with DevTools metrics:

```typescript
import { createLibp2p } from 'libp2p'
import { inspectorMetrics } from '@ipshipyard/libp2p-inspector-metrics'

const node = await createLibp2p({
  metrics: inspectorMetrics()
})
```

Then use the [DevTools plugin](https://github.com/ipfs-shipyard/js-libp2p-devtools)
for Chrome or Firefox to inspect the state of your running node.

# Install

```console
$ npm i @ipshipyard/libp2p-inspector-metrics
```

## Browser `<script>` tag

Loading this module through a script tag will make its exports available as `IpshipyardLibp2pInspectorMetrics` in the global namespace.

```html
<script src="https://unpkg.com/@ipshipyard/libp2p-inspector-metrics/dist/index.min.js"></script>
```

> Collect libp2p metrics and send them to an inspector

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipshipyard/js-libp2p-inspector/blob/main/packages/libp2p-inspector-metrics/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipshipyard/js-libp2p-inspector/blob/main/packages/libp2p-inspector-metrics/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
