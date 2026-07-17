---
name: Supabase SSR lazy proxy
description: How to make @supabase/supabase-js safe to import in TanStack Start SSR on Node.js 20
---

## Rule
Never call `createClient()` at module top-level in a file that is imported during SSR.
Use a lazy Proxy singleton so `createClient` is deferred until first property access (which only happens client-side in useEffect hooks).

## Why
`@supabase/realtime-js` calls `new RealtimeClient()` inside `SupabaseClient` constructor.
`RealtimeClient._initializeOptions()` calls `getWebSocketConstructor()` which throws:
  "Node.js detected but native WebSocket not found."
Node.js 22 has native WebSocket; Node.js 20 (Replit's runtime) does not.
The error is swallowed by h3 into a generic 500 with `{"unhandled":true,"message":"HTTPError"}`.

## How to apply
```ts
let _supabase: ReturnType<typeof createClient> | undefined

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createClient(url, key, { auth: { storage: typeof window !== 'undefined' ? localStorage : undefined, persistSession: typeof window !== 'undefined', autoRefreshToken: typeof window !== 'undefined' } })
    return Reflect.get(_supabase, prop, receiver)
  },
})
```
The integration client at `src/integrations/supabase/client.ts` already uses this pattern — mirror it.
