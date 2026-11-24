import { describe, it } from 'vitest'

// Limitations found on 2026-11-24 with vue 3.6.0-rc.16:
// - There is no Vapor runtime on the server: it renders Vapor components as
//   VDOM instances and calls their `ssrRender`. The Vapor RouterView and
//   RouterLink return DOM blocks from `setup()`, so the server must render the
//   VDOM ones.
// - The `ssrRender` of Vapor SFCs uses Vapor fragment markers (`<!--{-->`).
//   Compile test templates with `vapor: true` and `ssr: true`, otherwise the
//   markers are VDOM ones (`<!--[-->`) and hydration passes by accident.
// - Default RouterView: its root is a dynamic component, so Vapor hydration
//   expects `<!--{-->...<!--}-->` around the view. The VDOM RouterView does
//   not render it, and a VDOM render function cannot (several root nodes add
//   `<!--[-->`). Only an `ssrRender` with the `vue/server-renderer` helpers
//   can, which needs a server-only entry.
// - RouterView v-slot: in a Vapor parent, the server renders the slot as an
//   outlet (`<!--[-->...<!--]-->`), but the Vapor RouterView calls the slot
//   directly. `createSlot()` would match it. RouterLink `custom` had the same
//   problem.
// - Hydration works for RouterLink and for views with a single root.
describe('Vapor SSR hydration', () => {
  it.todo('hydrates nested views and links rendered by the server')
  it.todo('hydrates the v-slot of RouterView')
})
