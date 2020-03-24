import createWebHistory from '../../src/history/html5'
import { createDom } from '../utils'

// These unit tests are supposed to tests very specific scenarios that are easier to setup
// on a unit test than an e2e tests
describe('History HTMl5', () => {
  beforeAll(() => {
    createDom()
  })

  // this problem is very common on hash history when using a regular link
  // it will push an entry into the history stack with no state.
  // When navigating back, we will try to read `state` but it will be null
  it('should not fail if an entry has an empty state', () => {
    const history = createWebHistory()
    expect(history.location).toEqual({
      fullPath: '/',
      path: '/',
      query: {},
      hash: '',
    })
  })
})
