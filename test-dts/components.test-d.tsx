import { expectError, expectType } from 'tsd'
import {
  RouterLink,
  RouterView,
  createRouter,
  createMemoryHistory,
} from './index'

let router = createRouter({
  history: createMemoryHistory(),
  routes: [],
})

// RouterLink
expectError(<RouterLink />)
expectError(<RouterLink to="/" custom="text" />)
expectError(<RouterLink to="/" replace="text" />)
expectType<JSX.Element>(<RouterLink to="/foo" replace />)
expectType<JSX.Element>(<RouterLink to="/foo" />)
expectType<JSX.Element>(<RouterLink to={{ path: '/foo' }} />)
expectType<JSX.Element>(<RouterLink to={{ path: '/foo' }} custom />)

// RouterView
expectType<JSX.Element>(<RouterView />)
expectType<JSX.Element>(<RouterView name="foo" />)
expectType<JSX.Element>(<RouterView route={router.currentRoute.value} />)
