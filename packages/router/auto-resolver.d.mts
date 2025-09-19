declare module 'vue-router/auto-resolver' {
  import type {
    EXPERIMENTAL_Router,
    EXPERIMENTAL_RouterOptions,
  } from 'vue-router/experimental'

  export function handleHotUpdate(router: EXPERIMENTAL_Router): void

  const resolver: EXPERIMENTAL_RouterOptions['resolver']

  export { resolver }
}
