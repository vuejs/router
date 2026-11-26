/**
 * @vitest-environment happy-dom
 */
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createRouter } from '../../router'
import { createMemoryHistory } from '../../history/memory'
import { DataLoaderPlugin } from './navigation-guard'
import { defineBasicLoader } from './defineLoader'
import { mockWarn } from '../../tests/vitest-mock-warn'
import { delay } from '../../tests/utils'

// browsers have no AsyncLocalStorage: the loader context is a global
const getBuiltinModule = vi.hoisted(() => {
  const original = (globalThis as any).process.getBuiltinModule
  ;(globalThis as any).process.getBuiltinModule = undefined
  return original
})

afterAll(() => {
  ;(globalThis as any).process.getBuiltinModule = getBuiltinModule
})

mockWarn()
enableAutoUnmount(afterEach)
beforeAll(() => vi.useFakeTimers())
afterAll(() => vi.useRealTimers())

// https://github.com/vuejs/router/issues/2684
it('does not leak the context of a suspended lazy loader to components', async () => {
  const parentSpy = vi.fn(async () => {
    await delay(5)
    return 'parent'
  })
  const useParent = defineBasicLoader(parentSpy, { lazy: true })
  const childSpy = vi.fn(async () => {
    const parent = await useParent()
    // components can mount while the loader waits
    await delay(10)
    return `${parent},child`
  })
  const useChild = defineBasicLoader(childSpy, { lazy: true })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      {
        path: '/fetch',
        meta: { loaders: [useParent, useChild] },
        component: { render: () => null },
      },
    ],
  })
  const LateComponent = defineComponent({
    setup() {
      const { data: parent } = useParent()
      const { data } = useChild()
      return () => h('p', `${parent.value}|${data.value}`)
    },
  })
  const showLate = ref(false)
  const wrapper = mount(() => showLate.value && h(LateComponent), {
    global: { plugins: [[DataLoaderPlugin, { router }], router] },
  })

  await router.push('/fetch')
  // the parent resolved and the child is waiting
  await vi.advanceTimersByTimeAsync(5)
  showLate.value = true
  await nextTick()

  expect(parentSpy).toHaveBeenCalledTimes(1)
  expect(childSpy).toHaveBeenCalledTimes(1)
  expect('has itself as parent').not.toHaveBeenWarned()

  await vi.advanceTimersByTimeAsync(10)
  expect(wrapper.text()).toBe('parent|parent,child')
})
