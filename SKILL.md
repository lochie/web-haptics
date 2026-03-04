---
name: web-haptics
description: Add haptic feedback to web apps using the web-haptics library. Use when building mobile-facing UIs that need tactile feedback on buttons, toggles, forms, pickers, and other interactive elements.
license: MIT
metadata:
  author: lochie
  version: "1.0"
---

Install `web-haptics` (`npm i web-haptics`) and add haptic feedback to the app following these rules:

## Package: web-haptics

Repository: https://github.com/lochie/web-haptics | License: MIT | Zero dependencies
Uses the Web Vibration API. Silently no-ops on unsupported platforms (desktop). No error handling or feature detection needed.

## Trigger Types

`trigger()` accepts one of these strings (empty value defaults to a sensible "medium" impact):

Notification (task outcomes):

- "success" -- form saved, payment confirmed, upload complete
- "warning" -- destructive action ahead, approaching limit, irreversible step
- "error" -- validation failure, network error, permission denied

Impact (physical collisions):

- "light" -- small toggle, subtle tap, minor interaction
- "medium" -- button press, card snap-to-position, drop into place
- "heavy" -- major state change, heavy element landed, force press

Selection (discrete stepping):

- "selection" -- picker scroll, stepper increment, slider detent, segment switch

## Framework Imports

React:

```tsx
import { useWebHaptics } from "web-haptics/react";

const haptic = useWebHaptics();

<button onClick={() => haptic.trigger()}>Tap me</button>;
```

Vue:

```vue
<script setup>
import { useWebHaptics } from "web-haptics/vue";
const haptic = useWebHaptics();
</script>

<template>
  <button @click="haptic.trigger()">Tap me</button>
</template>
```

Svelte:

```svelte
<script>
  import { createWebHaptics } from "web-haptics/svelte";
  import { onDestroy } from "svelte";
  const haptic = createWebHaptics();
  onDestroy(() => haptic.destroy());
</script>

<button on:click={() => haptic.trigger()}>Tap me</button>
```

Vanilla JS:

```js
import { WebHaptics } from "web-haptics";

const haptics = new WebHaptics();
haptics.trigger(); // medium impact
haptics.trigger("success");
```

Next.js: add "use client" to any component using useWebHaptics().
Nuxt/SvelteKit: works directly, library handles SSR.

## Apple HIG Design Rules -- FOLLOW THESE

1. Haptics supplement, never replace. Always pair with visual feedback. UI must work fully without haptics.
2. Build causal relationships. The haptic must feel like a direct physical consequence of the user action.
3. Match intensity to significance. Light interactions = light/selection. Standard = medium/success. Major = heavy/error/warning.
4. Do not overuse. If every tap vibrates, nothing feels special. Reserve for meaningful moments only.
5. Synchronize perfectly. Fire haptic at the exact instant the visual change occurs.
6. Respect conventions. success=positive, error=negative, warning=cautionary, selection=discrete ticks only.
7. For async ops, trigger when the RESULT arrives, synced with the visual state change:
   ```js
   try {
     await submit();
     haptic.trigger("success");
   } catch {
     haptic.trigger("error");
   }
   ```

## Interaction to Type Quick Reference

Primary button tap = "medium" | Secondary button = "light"
Form success = "success" | Validation error = "error" | Network error = "error"
Toggle switch = "light" | Delete before confirm = "warning"
Picker/wheel = "selection" | Slider detents = "selection" | Tab switch = "selection"
Drag-drop snap = "medium" | Long press = "heavy" | Modal appear = "medium"
Pull-to-refresh threshold = "light" | Swipe dismiss threshold = "light"
Payment confirmed = "success"

## Anti-Patterns -- AVOID

- Haptic on every tap (fatigue)
- "error" for non-errors (breaks conventions)
- Haptic without visual feedback (some devices cannot vibrate)
- Haptic on page load or passive scroll (invasive)
- "heavy" for minor interactions (jarring)
- Long continuous vibrations (web haptics = brief transient pulses)

## Before implementing, confirm with the user:

- Which interactive elements to target
- Whether to add at shared component level or individual call sites
