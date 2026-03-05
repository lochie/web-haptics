# WebHaptics

Haptic feedback for the mobile web. Supports React, Vue, and Svelte.

## Installation

```sh
npm i web-haptics
```

## Usage

```tsx
import { trigger } from "web-haptics";

function App() {
  return <button onClick={() => trigger("success")}>Tap me</button>;
}
```

See the [package README](packages/web-haptics/README.md) for Vue, Svelte, and vanilla examples.

## Durations longer than 1000ms

This will block the main thread for the duration of the vibration pattern. Only vibration patterns longer than 1s total will block. Blocking is required as it's the only way to extend the trusted event grant of the click handler (async vibrations have expiration)

```ts
import { enableMainThreadBlocking } from "web-haptics";

enableMainThreadBlocking(true);
```

# Contributing

## Install dependencies

```sh
pnpm install:all
```

## Dev/Watch Library and Example

```sh
pnpm dev
```

## Build Library

```sh
pnpm build
```

## Found this useful?

Follow me on [Twitter](https://twitter.com/lochieaxon).

## Other projects

You might also like:

- [Torph](https://torph.lochie.me) - Dependency-free animated text component.
- [easing.dev](https://easing.dev) - Easily create custom easing graphs.

# Acknowledgements

- Special thanks to [Alex](https://x.com/alexvanderzon) for assistance with the site design.
- https://npmjs.com/package/ios-vibrator-pro-max
