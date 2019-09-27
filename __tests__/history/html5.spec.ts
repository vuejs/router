import { HTML5History } from '../../src/history/html5'
import { createDom } from '../utils'

// TODO: is it really worth testing this implementation on jest or is it
// better to directly use e2e tests instead
describe.skip('History HTMl5', () => {
  beforeAll(() => {
    createDom()
  })

  it('can be instantiated', () => {
    const history = new HTML5History()
    expect(history.location).toEqual({
      fullPath: '/',
      path: '/',
      query: {},
      hash: '',
    })
  })
})
