import 'vue/jsx'
import {
  RouterLink,
  RouterView,
  createRouter,
  createMemoryHistory,
} from './index'
import { expectTypeOf } from 'vitest'

let router = createRouter({
  history: createMemoryHistory(),
  routes: [],
})

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
