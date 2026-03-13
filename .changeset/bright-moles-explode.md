---
"web-haptics": patch
---

Fix `WebHaptics.isSupported` so it treats touch fallback devices like iPhone as supported, and add `WebHaptics.supportsVibrationApi` for callers that need the narrower `navigator.vibrate` signal.
