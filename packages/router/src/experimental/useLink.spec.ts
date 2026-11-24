/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { RouterView } from '../RouterView'
import { useLink, type UseLinkOptions } from './RouterLink'
import { createLinkTestRouter } from '../tests/link-router'

enableAutoUnmount(afterEach)

const Page = defineComponent({ render: () => h('p', 'page') })
const Layout = defineComponent({ render: () => h(RouterView) })

async function withLink(options: UseLinkOptions, initial = '/') {
  let link!: ReturnType<typeof useLink>
  const router = createLinkTestRouter({ Page, Layout })
  await router.push(initial)
  mount(
    defineComponent({
      setup() {
        link = useLink(options)
        return () => null
      },
    }),
    { global: { plugins: [router] } }
  )
  return { link, router }
}

describe('experimental useLink', () => {
  it('follows a getter "to"', async () => {
    const id = ref(1)
    const { link } = await withLink({
      to: () => ({ name: 'user', params: { id: id.value } }),
    })
    expect(link.href.value).toBe('/users/1')
    id.value = 2
    expect(link.href.value).toBe('/users/2')
  })

  it('follows a ref "to"', async () => {
    const to = ref('/about')
    const { link } = await withLink({ to }, '/about')
    expect(link.isExactActive.value).toBe(true)
    to.value = '/'
    expect(link.isActive.value).toBe(false)
  })

  it('navigates when navigate() is called without an event', async () => {
    const { link, router } = await withLink({ to: '/about' })
    await link.navigate()
    expect(router.currentRoute.value.path).toBe('/about')
  })
})
