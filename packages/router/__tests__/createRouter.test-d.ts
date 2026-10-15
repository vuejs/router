import { describe, it } from 'vitest'
import { createRouter } from '../src/router'
import { createWebHistory } from '../src/history/html5'
import { createMemoryHistory } from '../src/history/memory'
import { parseQuery } from '../src/query'
import { experimental_parseQuery } from '../src/experimental/query'
import { defineComponent, h } from 'vue'

describe('createRouter', () => {
  const component = defineComponent({})

  const WithProps = defineComponent({
    props: {
      id: {
        type: String,
        required: true,
      },
    },
  })

  const Foo = defineComponent({
    props: {
      test: String,
    },
    setup() {
      return {
        title: 'homepage',
      }
    },
    render() {
      return h('div', `${this.title}: ${this.test}`)
    },
  })

  it('works', () => {
    createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component },
        { path: '/foo', component: Foo },
        { path: '/', component: WithProps },
      ],
      parseQuery: _search => ({}),
      stringifyQuery: _query => '',
      strict: true,
      end: true,
      sensitive: true,
      scrollBehavior(_to, _from, _savedPosition) {},
    })
  })

  describe('parseQuery', () => {
    it('accepts the exported parseQuery', () => {
      createRouter({
        history: createMemoryHistory(),
        routes: [],
        parseQuery,
      })
    })

    it('accepts parsers returning scalar, null and array values', () => {
      createRouter({
        history: createMemoryHistory(),
        routes: [],
        parseQuery: search => ({ a: search, b: ['x', null], c: null }),
      })
    })

    it('accepts the experimental parseQuery', () => {
      createRouter({
        history: createMemoryHistory(),
        routes: [],
        parseQuery: experimental_parseQuery,
      })
    })
  })
})
