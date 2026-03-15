# WebHaptics

Haptic feedback for the mobile web. Supports React, Vue, and Svelte.

## Install

```sh
npm i web-haptics
```

## React

```tsx
import { useWebHaptics } from "web-haptics/react";

function App() {
  const { trigger } = useWebHaptics();

  return <button onClick={() => trigger("success")}>Tap me</button>;
}
```

## Vue

```vue
<script setup>
import { useWebHaptics } from "web-haptics/vue";

const { trigger } = useWebHaptics();
</script>

<template>
  <button @click="trigger('success')">Tap me</button>
</template>
```

## Svelte

```svelte
<script>
import { createWebHaptics } from "web-haptics/svelte";
import { onDestroy } from "svelte";

const { trigger, destroy } = createWebHaptics();
onDestroy(destroy);
</script>

<button on:click={() => trigger("success")}>Tap me</button>
```

## Vanilla

```ts
import { WebHaptics } from "web-haptics";

const haptics = new WebHaptics();
haptics.trigger("success");
```

## Built-in Presets

| Name      | Pattern                                                          | Description                    |
| --------- | ---------------------------------------------------------------- | ------------------------------ |
| `success` | `[{ duration: 50 }, { delay: 50, duration: 50 }]`               | Two taps indicating success    |
| `nudge`   | `[{ duration: 80, intensity: 0.8 }, { delay: 80, duration: 50, intensity: 0.3 }]` | Strong tap followed by a soft tap |
| `error`   | `[{ duration: 50, intensity: 0.75 }, ...]` ×3                   | Three sharp taps for errors    |
| `buzz`    | `[{ duration: 1000, intensity: 1 }]`                            | A long vibration               |

You can also pass custom patterns directly:

```ts
trigger([100, 50, 100]); // number[] shorthand (alternating on/off durations)
trigger(200); // single vibration (ms)
trigger([{ duration: 80, intensity: 0.8 }, { delay: 50, duration: 100 }]); // Vibration[]
trigger({
  pattern: [{ duration: 50 }, { delay: 50, duration: 50 }],
  description: "custom",
}); // full HapticPreset
```

## API

### `new WebHaptics(options?)`

Create a new instance.

- `options.debug` — enable audio feedback for testing on desktop (default `false`)
- `options.showSwitch` — show the haptic feedback toggle switch (default `false`)

### `trigger(input?, options?): Promise<void>`

Trigger haptic feedback.

- `input` — preset name (`"success"`), duration in ms, `number[]`, `Vibration[]`, or `HapticPreset`
- `options.intensity` — override default intensity (0–1, default `0.5`)

### `cancel()`

Stop the current pattern and cancel any ongoing vibration.

### `destroy()`

Clean up DOM elements and audio resources. Call when the instance is no longer needed.

### `setDebug(debug: boolean)`

Enable or disable debug audio feedback.

### `setShowSwitch(show: boolean)`

Show or hide the haptic feedback toggle switch.

### `WebHaptics.isSupported`

Static boolean — `true` if the device supports haptics (iPhone and Android). Returns `false` on iPad/iPadOS, desktop, and other non-mobile platforms.

## License

MIT

## Found this useful?

Follow me on [Twitter](https://twitter.com/lochieaxon).

## Other projects

You might also like:

- [Torph](https://torph.lochie.me) - Dependency-free animated text component.
- [easing.dev](https://easing.dev) - Easily create custom easing graphs.

# Acknowledgements

- Special thanks to [Alex](https://x.com/alexvanderzon) for assistance with the site design.
