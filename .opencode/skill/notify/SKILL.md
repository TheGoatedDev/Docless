---
name: notify
description: >-
  Create in-app or OS notifications. Use when adding toasts, alerts,
  notify(), sonner, desktop notifications, or user-facing success/error feedback.
---

# Notifications

Always use the shared helper. Do not call `toast` from sonner or
`window.api.notify` directly from feature code.

## API

```ts
import { notify } from "@renderer/lib/notify"

notify({ title: "Saved", type: "success" })
notify({ title: "Failed", description: e.message, type: "error" })
notify({ title: "Heads up", description: "…", type: "info" })
// type?: "message" | "success" | "info" | "warning" | "error"
```

## Behavior

- App focused + visible → sonner toast
- Blurred / minimized → OS native notification (click focuses window)
- Never both for one call

## Do not

- Add a second toast library
- Bypass `notify` with raw sonner/IPC
- Build a notification store/history unless asked
