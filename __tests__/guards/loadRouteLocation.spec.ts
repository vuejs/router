import { isRouteComponent, loadRouteLocation } from '../../src/navigationGuards'
import { RouteRecordRaw, RouteLocationRaw } from '../../src/types'
import { components } from '../utils'
import { createMemoryHistory, createRouter } from '../../src'
import { FunctionalComponent } from 'vue'

const FunctionalHome: FunctionalComponent = () => null
FunctionalHome.displayName = 'Home'

describe('loadRouteLocation', () => {
  async function testLoadRoute(
    routes: RouteRecordRaw[],
    to: RouteLocationRaw = '/'
  ) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    const loaded = await loadRouteLocation(router.resolve(to))
    for (const record of loaded.matched) {
      for (const name in record.components) {
        const comp = record.components[name]
        expect(isRouteComponent(comp)).toBe(true)
      }
    }
  }

  it('fallthrough non promises', async () => {
    expect.assertions(3)
    await testLoadRoute([{ path: '/', component: components.Home }])
    await testLoadRoute([{ path: '/', component: FunctionalHome }])
    await testLoadRoute([
      {
        path: '/',
        components: { name: FunctionalHome },
      },
    ])
  })

  it('resolves simple promises', async () => {
    expect.assertions(3)
    await testLoadRoute([
      { path: '/', component: () => Promise.resolve(components.Home) },
    ])
    await testLoadRoute([
      { path: '/', component: () => Promise.resolve(FunctionalHome) },
    ])
    await testLoadRoute([
      {
        path: '/',
        components: { name: () => Promise.resolve(FunctionalHome) },
      },
    ])
  })

  it('works with nested routes', async () => {
    expect.assertions(4)
    await testLoadRoute([
      {
        path: '/',
        component: () => Promise.resolve(components.Home),
        children: [
          {
            path: '',
            component: () => Promise.resolve(components.Home),
            children: [
              {
                path: '',
                component: () => Promise.resolve(components.Home),
                children: [
                  {
                    path: '',
                    components: {
                      name: () => Promise.resolve(components.Home),
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
  })

  it('throws with non loadable routes', async () => {
    expect.assertions(1)
    await expect(
      testLoadRoute([{ path: '/', redirect: '/foo' }])
    ).rejects.toBeInstanceOf(Error)
  })

  it('works with nested routes with redirect', async () => {
    expect.assertions(2)
    testLoadRoute(
      [
        {
          path: '/',
          redirect: '/foo',
          children: [
            { path: 'foo', component: () => Promise.resolve(components.Home) },
          ],
        },
      ],
      '/foo'
    )
    testLoadRoute(
      [
        {
          path: '/',
          children: [
            { path: '', redirect: '/foo' },
            { path: 'foo', component: () => Promise.resolve(components.Home) },
          ],
        },
      ],
      '/foo'
    )
  })

  it('works with aliases through alias', async () => {
    expect.assertions(3)
    await testLoadRoute([
      {
        path: '/a',
        alias: '/',
        component: () => Promise.resolve(components.Home),
      },
    ])
    await testLoadRoute([
      {
        path: '/a',
        alias: '/',
        component: () => Promise.resolve(FunctionalHome),
      },
    ])
    await testLoadRoute([
      {
        path: '/a',
        alias: '/',
        components: { name: () => Promise.resolve(FunctionalHome) },
      },
    ])
  })

  it('works with aliases through original', async () => {
    expect.assertions(3)
    await testLoadRoute(
      [
        {
          path: '/a',
          alias: '/',
          component: () => Promise.resolve(components.Home),
        },
      ],
      '/a'
    )
    await testLoadRoute(
      [
        {
          path: '/a',
          alias: '/',
          component: () => Promise.resolve(FunctionalHome),
        },
      ],
      '/a'
    )
    await testLoadRoute(
      [
        {
          path: '/a',
          alias: '/',
          components: { name: () => Promise.resolve(FunctionalHome) },
        },
      ],
      '/a'
    )
  })
})
