---
name: TanStack Start CSS injection
description: Why CSS doesn't render and how to fix it in TanStack Start SSR
---

## The Rule
`__root.tsx` MUST render a full HTML document with `HeadContent` and `Scripts` from `@tanstack/react-router`. Without `HeadContent`, Vite's CSS manifest never gets injected into `<head>` and the browser never downloads the stylesheet — regardless of whether `styles.css` is imported in the route file.

## Correct pattern

```tsx
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({ component: RootComponent })

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

**Why:** TanStack Start injects CSS via a JavaScript manifest (not a static `<link>` tag). `HeadContent` is what emits those `<link rel="stylesheet">` tags. Without it, SSR HTML has no CSS references at all.

**How to apply:** Any TanStack Start project where CSS "doesn't work" — check `__root.tsx` for `HeadContent` and `Scripts` first.

## Also note
- `@theme` / `@utility` warnings from lightningcss (via `tw-animate-css`) are harmless — CSS still processes correctly
- Screenshots of SSR pages may look unstyled if captured before JS hydration injects the stylesheet link — this is a screenshot timing artifact, not a CSS bug
- Both `HeadContent` and `Scripts` are exported from `@tanstack/react-router` (confirmed v1)
