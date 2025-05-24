/**
 * @packageDocumentation
 *
 * An electron app that bundles @ipshipyard/libp2p-inspector-ui for use with
 * libp2p nodes running under Node.js or (eventually) in browsers.
 *
 * ![libp2p-inspector running in Electron](https://github.com/ipshipyard/js-libp2p-inspector/blob/main/assets/electron.png?raw=true)
 *
 * ## Installation instructions
 *
 * ### 1. libp2p configuration
 *
 * Configure `@ipshipyard/libp2p-inspector-metrics` as your metrics implementation:
 *
 * ```ts
 * import { createLibp2p } from 'libp2p'
 * import { inspectorMetrics } from '@ipshipyard/libp2p-inspector-metrics'
 *
 * const node = await createLibp2p({
 *   metrics: inspectorMetrics(),
 *   //... other options her
 * })
 * ```
 *
 * ### 2. Install the inspector
 *
 * ```console
 * $ npm i -g @ipshipyard/libp2p-inspector
 * ```
 *
 * ### 3. Run
 *
 * ```console
 * $ libp2p-inspector
 * ```
 *
 * Local libp2p nodes running the `@ipshipyard/libp2p-inspector-metrics` metrics
 * implementation will advertise themselves via MDNS and should appear in the
 * app.
 */

export {}
