// @ts-check
require('./helper')
const expect = require('expect')
const { HTML5History } = require('../src/history/html5')
const { Router } = require('../src/router')
const { createDom, components } = require('./utils')

function mockHistory() {
  // TODO: actually do a mock
  return new HTML5History()
}

const routes = [
  { path: '/', component: components.Home },
  { path: '/foo', component: components.Foo },
]

describe('Router', () => {
  beforeAll(() => {
    createDom()
  })

  it('can be instantiated', () => {
    const history = mockHistory()
    const router = new Router({ history, routes })
    expect(router.currentRoute).toEqual({
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
    })
  })

  it('calls history.push with router.push', async () => {
    const history = mockHistory()
    const router = new Router({ history, routes })
    jest.spyOn(history, 'push')
    await router.push('/foo')
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(history.push).toHaveBeenCalledWith({
      fullPath: '/foo',
      path: '/foo',
      query: {},
      hash: '',
    })
  })

  it('calls history.replace with router.replace', async () => {
    const history = mockHistory()
    const router = new Router({ history, routes })
    jest.spyOn(history, 'replace')
    await router.replace('/foo')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith({
      fullPath: '/foo',
      path: '/foo',
      query: {},
      hash: '',
    })
  })
})
