import { mockWarn } from 'jest-mock-warn'
import { createMemoryHistory, createRouter, createRouterMatcher } from '../src'
import {
  defineAsyncComponent,
  defineComponent,
  FunctionalComponent,
  h,
} from 'vue'

let component = defineComponent({})

describe('warnings', () => {
  mockWarn()
  it('warns on missing name and path for redirect', async () => {
    const history = createMemoryHistory()
    const router = createRouter({
      history,
      routes: [
        { path: '/', component },
        { path: '/redirect', redirect: { params: { foo: 'f' } } },
      ],
    })
    try {
      await router.push('/redirect')
    } catch (err) {}
    expect('Invalid redirect found').toHaveBeenWarned()
  })

  it('warns when resolving a route with path and params', async () => {
    const history = createMemoryHistory()
    const router = createRouter({
      history,
      routes: [{ path: '/:p', name: 'p', component }],
    })
    router.push({ path: '/p', params: { p: 'p' } })
    expect('Path "/p" was passed with params').toHaveBeenWarned()
  })

  it('does not warn when resolving a route with path, params and name', async () => {
    const history = createMemoryHistory()
    const router = createRouter({
      history,
      routes: [{ path: '/:p', name: 'p', component }],
    })
    router.push({ path: '/p', name: 'p', params: { p: 'p' } })
    expect('Path "/" was passed with params').not.toHaveBeenWarned()
  })

  it('does not warn when redirecting from params', async () => {
    const history = createMemoryHistory()
    const router = createRouter({
      history,
      routes: [
        {
          path: '/p/:p',
          redirect: to => ({ path: '/s', query: { p: to.params.p } }),
        },
        { path: '/s', component },
      ],
    })
    router.push({ path: '/p/abc' })
    expect('was passed with params').not.toHaveBeenWarned()
  })

  it('warns if an alias is missing params', async () => {
    createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p/:c', alias: ['/:p/c'], component }],
    })
    expect(
      'Alias "/:p/c" and the original record: "/:p/:c" must have the exact same param named "c"'
    ).toHaveBeenWarned()
  })

  it('warns if a child with absolute path is missing a parent param', async () => {
    createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/:a',
          component,
          children: [
            {
              path: ':b',
              component,
              children: [{ path: '/:a/b', component }],
            },
          ],
        },
      ],
    })
    expect(
      `Absolute path "/:a/b" must have the exact same param named "b" as its parent "/:a/:b".`
    ).toHaveBeenWarned()
  })

  it('warns if an alias has a param with the same name but different', async () => {
    createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p/:c', alias: ['/:p/:c+'], component }],
    })
    expect(
      'Alias "/:p/:c+" and the original record: "/:p/:c" must have the exact same param named "c"'
    ).toHaveBeenWarned()
  })

  it('warns if an alias has extra params', async () => {
    createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p/c', alias: ['/:p/:c'], component }],
    })
    expect(
      'Alias "/:p/:c" and the original record: "/:p/c" must have the exact same param named "c"'
    ).toHaveBeenWarned()
  })

  it('warns if next is called multiple times in one navigation guard', done => {
    expect.assertions(3)
    let router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'a', component },
        { path: '/b', name: 'a', component },
      ],
    })

    router.beforeEach((to, from, next) => {
      next()
      expect('').not.toHaveBeenWarned()
      next()
      expect('called more than once').toHaveBeenWarnedTimes(1)
      next()
      expect('called more than once').toHaveBeenWarnedTimes(1)
      done()
    })

    router.push('/b')
  })

  it('warns if a non valid function is passed as a component', async () => {
    const Functional: FunctionalComponent = () => h('div', 'functional')
    // Functional must have a displayName to avoid the warning

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/foo', component: Functional }],
    })

    await expect(router.push('/foo')).resolves.toBe(undefined)
    expect('with path "/foo" is a function').toHaveBeenWarned()
  })

  it('should warn if multiple leading slashes with raw location', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component }],
    })

    await expect(router.push('//not-valid')).resolves.toBe(undefined)
    expect('cannot start with multiple slashes').toHaveBeenWarned()
  })

  it('should warn if multiple leading slashes with object location', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component }],
    })

    await expect(router.push({ path: '//not-valid' })).resolves.toBe(undefined)
    expect('cannot start with multiple slashes').toHaveBeenWarned()
  })

  it('warns if path contains the same param multiple times', () => {
    const history = createMemoryHistory()
    createRouter({
      history,
      routes: [
        {
          path: '/:id',
          component,
          children: [{ path: ':id', component }],
        },
      ],
    })
    expect(
      'duplicated params with name "id" for path "/:id/:id"'
    ).toHaveBeenWarned()
  })

  it('warns if component is a promise instead of a function that returns a promise', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      // simulates import('./component.vue')
      routes: [{ path: '/foo', component: Promise.resolve(component) }],
    })

    await expect(router.push({ path: '/foo' })).resolves.toBe(undefined)
    expect('"/foo" is a Promise instead of a function').toHaveBeenWarned()
  })

  it('warns if use defineAsyncComponent in routes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      // simulates import('./component.vue')
      routes: [
        {
          path: '/foo',
          component: defineAsyncComponent(() => Promise.resolve({})),
        },
      ],
    })
    await router.push('/foo')
    expect(`defined using "defineAsyncComponent()"`).toHaveBeenWarned()
  })

  it('warns if use defineAsyncComponent in routes only once per component', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      // simulates import('./component.vue')
      routes: [
        { path: '/', component },
        {
          path: '/foo',
          component: defineAsyncComponent(() => Promise.resolve({})),
        },
        {
          path: '/bar',
          component: defineAsyncComponent(() => Promise.resolve({})),
        },
      ],
    })
    await router.push('/foo')
    await router.push('/')
    await router.push('/foo')
    expect(`defined using "defineAsyncComponent()"`).toHaveBeenWarnedTimes(1)
    await router.push('/bar')
    expect(`defined using "defineAsyncComponent()"`).toHaveBeenWarnedTimes(2)
  })

  it('warns if no route matched', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'a', component }],
    })

    await expect(router.push('/foo')).resolves.toBe(undefined)
    expect(`No match found for location with path "/foo"`).toHaveBeenWarned()

    await expect(router.push({ path: '/foo2' })).resolves.toBe(undefined)
    expect(`No match found for location with path "/foo2"`).toHaveBeenWarned()
  })

  it('warns if next is called with the same location too many times', async () => {
    let router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'a', component },
        { path: '/b', component },
      ],
    })

    router.beforeEach(to => {
      if (to.path === '/b') return '/b'
      return
    })

    await router.push('/b').catch(() => {})
    expect(
      'Detected a possibly infinite redirection in a navigation guard when going from "/" to "/b"'
    ).toHaveBeenWarned()
  })

  it('warns if `next` is called twice', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        { path: '/foo', component },
      ],
    })
    router.beforeEach((to, from, next) => {
      next()
      next()
    })
    await router.push('/foo')
    expect(
      'It should be called exactly one time in each navigation guard'
    ).toHaveBeenWarned()
  })

  it('warns when discarding params', () => {
    const record = {
      path: '/a',
      name: 'a',
      components: {},
    }
    const matcher = createRouterMatcher([record], {})
    matcher.resolve(
      { name: 'a', params: { no: 'a', foo: '35' } },
      {
        path: '/parent/one',
        name: undefined,
        params: { old: 'one' },
        matched: [] as any,
        meta: {},
      }
    )
    expect('invalid param(s) "no", "foo" ').toHaveBeenWarned()
    // from the previous location
    expect('"one"').not.toHaveBeenWarned()
  })
})
