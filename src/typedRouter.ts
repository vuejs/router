import { Router } from './router'

export interface Config {
  // Router: unknown
}

export type RouterTyped = Config extends Record<'Router', infer R> ? R : Router
