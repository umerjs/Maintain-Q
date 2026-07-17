---
name: TanStack Start CSS injection pattern
description: How CSS is loaded in this project and why SSR screenshots look unstyled
---

## Rule
Do not assume missing CSS because screenshots look unstyled. TanStack Start (dev mode) injects
`<link>` tags via JavaScript (`$_TSR.router` manifest) after the initial HTML is served.
SSR output has Tailwind class names on elements but no static `<link rel="stylesheet">` in `<head>`.

## Why
The `@lovable.dev/vite-tanstack-config` plugin manages CSS injection via TanStack Start's
virtual `/@tanstack-start/styles.css` endpoint. The link is added by the client entry script.

## How to apply
- Import `../styles.css` (or `./styles.css`) in `__root.tsx` to register it with the Vite pipeline
- Real browsers see styled pages once JS hydrates (fast)
- Headless screenshots (taken immediately on page load) show raw HTML before hydration
- If CSS genuinely breaks, check that `src/styles.css` has `@import "tailwindcss"` at top
