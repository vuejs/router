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
expectType<JSX.Element>(<RouterLink to="/foo" replace />)
expectType<JSX.Element>(<RouterLink to="/foo" />)
expectType<JSX.Element>(<RouterLink to={{ path: '/foo' }} />)

// RouterView
expectType<JSX.Element>(<RouterView />)
expectType<JSX.Element>(<RouterView name="foo" />)
expectType<JSX.Element>(<RouterView route={router.currentRoute.value} />)
