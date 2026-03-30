import { describe, it } from 'vitest'
import { createRouter, createWebHistory } from '../src'
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
})
