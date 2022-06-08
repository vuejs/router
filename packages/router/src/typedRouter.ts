import type { Router } from './router'

/**
 * Vue Router Configuration that allows to add global types for better type support.
 *
 * @example
 *
 * ```ts
 * const router = createRouter({
 *   // ...
 *   routes: [
 *     // ...
 *   ] as const // IMPORTANT
 * })
 *
 * declare module 'vue-router' {
 *   export interface Config {
 *     // allow global functions to get a typed router
 *     Router: typeof router
 *   }
 * }
 * ```
 */
export interface Config {
  // Router: unknown
}

export type RouterTyped = Config extends Record<'Router', infer R> ? R : Router
