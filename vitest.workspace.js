import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    extends: './packages/router/vitest.config.ts',
    test: {
      name: 'router',
      root: './packages/router',
    },
  },
])
