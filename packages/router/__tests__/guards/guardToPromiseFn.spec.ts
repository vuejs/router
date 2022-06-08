import { guardToPromiseFn } from '../../src/navigationGuards'
import { START_LOCATION_NORMALIZED } from '../../src/types'
import { ErrorTypes } from '../../src/errors'
import { mockWarn } from 'jest-mock-warn'

// stub those two
const to = START_LOCATION_NORMALIZED
const from = {
  ...START_LOCATION_NORMALIZED,
  path: '/other',
  fullPath: '/other',
}

describe('guardToPromiseFn', () => {
  mockWarn()
  it('calls the guard with to, from and, next', async () => {
    expect.assertions(2)
    const spy = jest.fn((to, from, next) => next())
    await expect(guardToPromiseFn(spy, to, from)()).resolves.toEqual(undefined)
    expect(spy).toHaveBeenCalledWith(to, from, expect.any(Function))
  })

  it('resolves if next is called with no arguments', async () => {
    expect.assertions(1)
    await expect(
      guardToPromiseFn((to, from, next) => next(), to, from)()
    ).resolves.toEqual(undefined)
  })

  it('resolves if next is called with true', async () => {
    expect.assertions(1)
    await expect(
      guardToPromiseFn((to, from, next) => next(true), to, from)()
    ).resolves.toEqual(undefined)
  })

  it('rejects if next is called with false', async () => {
    expect.assertions(1)
    try {
      await guardToPromiseFn((to, from, next) => next(false), to, from)()
    } catch (err) {
      expect(err).toMatchObject({
        from,
        to,
        type: ErrorTypes.NAVIGATION_ABORTED,
      })
    }
  })

  it('rejects if next is called with a string location', async () => {
    expect.assertions(1)
    try {
      await guardToPromiseFn((to, from, next) => next('/new'), to, from)()
    } catch (err) {
      expect(err).toMatchObject({
        from: to,
        to: '/new',
        type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
      })
    }
  })

  it('rejects if next is called with an object location', async () => {
    expect.assertions(1)
    let redirectTo = { path: '/new' }
    try {
      await guardToPromiseFn((to, from, next) => next(redirectTo), to, from)()
    } catch (err) {
      expect(err).toMatchObject({
        from: to,
        to: redirectTo,
        type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
      })
    }
  })

  it('rejects if next is called with an error', async () => {
    expect.assertions(1)
    let error = new Error('nope')
    await expect(
      guardToPromiseFn((to, from, next) => next(error), to, from)()
    ).rejects.toBe(error)
  })

  it('rejects if guard rejects a Promise', async () => {
    expect.assertions(1)
    await expect(
      guardToPromiseFn(
        async (to, from, next) => {
          throw new Error()
        },
        to,
        from
      )()
    ).rejects.toThrowError()
  })

  it('rejects if guard throws an error', async () => {
    expect.assertions(1)
    let error = new Error('nope')
    await expect(
      guardToPromiseFn(
        (to, from, next) => {
          throw error
        },
        to,
        from
      )()
    ).rejects.toBe(error)
  })

  describe('no next argument', () => {
    it('rejects if returns false', async () => {
      expect.assertions(1)
      try {
        await guardToPromiseFn((to, from) => false, to, from)()
      } catch (err) {
        expect(err).toMatchObject({
          from,
          to,
          type: ErrorTypes.NAVIGATION_ABORTED,
        })
      }
    })

    it('resolves no value is returned', async () => {
      expect.assertions(1)
      await expect(
        guardToPromiseFn((to, from) => {}, to, from)()
      ).resolves.toEqual(undefined)
    })

    it('resolves if true is returned', async () => {
      expect.assertions(1)
      await expect(
        guardToPromiseFn((to, from) => true, to, from)()
      ).resolves.toEqual(undefined)
    })

    it('rejects if false is returned', async () => {
      expect.assertions(1)
      try {
        await guardToPromiseFn((to, from) => false, to, from)()
      } catch (err) {
        expect(err).toMatchObject({
          from,
          to,
          type: ErrorTypes.NAVIGATION_ABORTED,
        })
      }
    })

    it('rejects if async false is returned', async () => {
      expect.assertions(1)
      try {
        await guardToPromiseFn(async (to, from) => false, to, from)()
      } catch (err) {
        expect(err).toMatchObject({
          from,
          to,
          type: ErrorTypes.NAVIGATION_ABORTED,
        })
      }
    })

    it('rejects if a string location is returned', async () => {
      expect.assertions(1)
      try {
        await guardToPromiseFn((to, from) => '/new', to, from)()
      } catch (err) {
        expect(err).toMatchObject({
          from: to,
          to: '/new',
          type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
        })
      }
    })

    it('rejects if an object location is returned', async () => {
      expect.assertions(1)
      let redirectTo = { path: '/new' }
      try {
        await guardToPromiseFn((to, from) => redirectTo, to, from)()
      } catch (err) {
        expect(err).toMatchObject({
          from: to,
          to: redirectTo,
          type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
        })
      }
    })

    it('rejects if an error is returned', async () => {
      expect.assertions(1)
      let error = new Error('nope')
      await expect(
        guardToPromiseFn((to, from) => error, to, from)()
      ).rejects.toBe(error)
    })

    it('rejects if guard rejects a Promise', async () => {
      expect.assertions(1)
      let error = new Error('nope')
      await expect(
        guardToPromiseFn(
          async (to, from) => {
            throw error
          },
          to,
          from
        )()
      ).rejects.toBe(error)
    })

    it('rejects if guard throws an error', async () => {
      let error = new Error('nope')
      await expect(
        guardToPromiseFn(
          (to, from) => {
            throw error
          },
          to,
          from
        )()
      ).rejects.toBe(error)
    })
  })

  it('warns if guard resolves without calling next', async () => {
    expect.assertions(2)
    await expect(
      guardToPromiseFn(
        async (to, from, next) => {
          // oops not called next
        },
        to,
        from
      )()
    ).rejects.toThrowError()
    expect('callback was never called').toHaveBeenWarned()
  })

  it('does not warn if guard rejects without calling next', async () => {
    expect.assertions(2)
    await expect(
      guardToPromiseFn(
        async (to, from, next) => {
          // oops not called next
          throw new Error('nope')
        },
        to,
        from
      )()
    ).rejects.toThrowError()
    expect('callback was never called').not.toHaveBeenWarned()
  })

  it('warns if guard returns without calling next', async () => {
    expect.assertions(2)
    await expect(
      guardToPromiseFn((to, from, next) => false, to, from)()
    ).rejects.toThrowError()
    expect('callback was never called').toHaveBeenWarned()
  })

  it('does not warn if guard returns undefined', async () => {
    expect.assertions(2)
    await expect(
      guardToPromiseFn(
        (to, from, next) => {
          // there could be a callback somewhere
          setTimeout(next, 10)
        },
        to,
        from
      )()
    ).resolves.toEqual(undefined)

    expect('callback was never called').not.toHaveBeenWarned()
  })
})
