import 'vue/jsx'
import {
  RouterLink,
  RouterView,
  createRouter,
  createMemoryHistory,
} from './index'
import { it, describe, expectTypeOf } from 'vitest'

describe('Components', () => {
  let router = createRouter({
    history: createMemoryHistory(),
    routes: [],
  })

  // TODO: split into multiple tests
  it('works', () => {
    // RouterLink
    // @ts-expect-error missing to
    expectError(<RouterLink />)
    // @ts-expect-error: invalid prop
    expectError(<RouterLink to="/" custom="text" />)
    // @ts-expect-error: invalid prop
    expectError(<RouterLink to="/" replace="text" />)
    expectTypeOf<JSX.Element>(<RouterLink to="/foo" replace />)
    expectTypeOf<JSX.Element>(<RouterLink to="/foo" />)
    expectTypeOf<JSX.Element>(<RouterLink class="link" to="/foo" />)
    expectTypeOf<JSX.Element>(<RouterLink to={{ path: '/foo' }} />)
    expectTypeOf<JSX.Element>(<RouterLink to={{ path: '/foo' }} custom />)

    // RouterView
    expectTypeOf<JSX.Element>(<RouterView class="view" />)
    expectTypeOf<JSX.Element>(<RouterView name="foo" />)
    expectTypeOf<JSX.Element>(<RouterView route={router.currentRoute.value} />)
  })
})
