/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { newRouter as createRouter } from '../utils'

for (const method of ['beforeEach', 'beforeResolve', 'afterEach'] as const) {
  describe(`router.${method} registration removal`, () => {
    it('removes the selected registration without changing guard order', async () => {
      const router = createRouter({
        routes: [{ path: '/foo', component: { template: '<div>Foo</div>' } }],
      })
      const calls: string[] = []
      const shared = () => {
        calls.push('shared')
      }
      router[method](shared)
      router[method](() => {
        calls.push('middle')
      })
      const removeLast = router[method](shared)

      removeLast()
      await router.push('/foo')

      expect(calls).toEqual(['shared', 'middle'])
    })

    it('does not remove another registration when cleanup is repeated', async () => {
      const router = createRouter({
        routes: [{ path: '/foo', component: { template: '<div>Foo</div>' } }],
      })
      const shared = vi.fn()
      const removeFirst = router[method](shared)
      router[method](shared)

      removeFirst()
      removeFirst()
      await router.push('/foo')

      expect(shared).toHaveBeenCalledTimes(1)
    })
  })
}
