import {
  RouterLink,
  RouterView,
  createRouter,
  createMemoryHistory,
  expectError,
  expectType,
} from './index'

let router = createRouter({
  history: createMemoryHistory(),
  routes: [],
})

// RouterLink
// @ts-expect-error
expectError(<RouterLink />)
// @ts-expect-error
expectError(<RouterLink to="/" custom="text" />)
// @ts-expect-error
expectError(<RouterLink to="/" replace="text" />)
expectType<JSX.Element>(<RouterLink to="/foo" replace />)
expectType<JSX.Element>(<RouterLink to="/foo" />)
expectType<JSX.Element>(<RouterLink class="link" to="/foo" />)
expectType<JSX.Element>(<RouterLink to={{ path: '/foo' }} />)
expectType<JSX.Element>(<RouterLink to={{ path: '/foo' }} custom />)

// RouterView
expectType<JSX.Element>(<RouterView class="view" />)
expectType<JSX.Element>(<RouterView name="foo" />)
expectType<JSX.Element>(<RouterView route={router.currentRoute.value} />)
