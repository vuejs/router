import { describe, it, expectTypeOf } from 'vitest'
import { defineQueryOptions } from '@pinia/colada'
import { defineColadaLoader } from './defineColadaLoader'
import { NavigationResult } from './navigation-guard'

describe('defineColadaLoader', () => {
  interface UserData {
    id: string
    name: string
  }

  async function query() {
    const user: UserData = {
      id: 'one',
      name: 'Edu',
    }

    return user
  }
  const queryOptions = () => ({ key: ['id'], query })

  it('can enforce defined data', () => {
    expectTypeOf(
      defineColadaLoader(queryOptions)().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader(queryOptions, {
        errors: false,
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader(queryOptions, {
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader(queryOptions, {
        errors: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader(queryOptions, {
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader(queryOptions, {
        lazy: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
  })

  it('makes data possibly undefined when lazy', () => {
    expectTypeOf(
      defineColadaLoader(queryOptions, { lazy: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when lazy is a function', () => {
    expectTypeOf(
      defineColadaLoader(queryOptions, { lazy: () => false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when errors is not false', () => {
    expectTypeOf(
      defineColadaLoader(queryOptions, { errors: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineColadaLoader(queryOptions, { errors: [] })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineColadaLoader(queryOptions, { errors: e => e instanceof Error })()
        .data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineColadaLoader(queryOptions, {
        errors: e => typeof e == 'object' && e != null,
      })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('error is typed to Error by default', () => {
    expectTypeOf(
      defineColadaLoader(queryOptions)().error.value
    ).toEqualTypeOf<Error | null>()
  })

  it('makes data possibly undefined when server is not true', () => {
    expectTypeOf(
      defineColadaLoader(queryOptions, { server: false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('infers the returned type for data', () => {
    expectTypeOf<UserData | undefined>(
      defineColadaLoader(queryOptions, { lazy: true })().data.value
    )
    expectTypeOf<UserData | undefined>(
      defineColadaLoader(queryOptions, { lazy: () => false })().data.value
    )
  })

  it('infers the returned type for the resolved value to always be defined', async () => {
    expectTypeOf(
      await defineColadaLoader(queryOptions)()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { lazy: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { server: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { server: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { errors: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { errors: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { errors: [] })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { errors: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, { server: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(queryOptions, {
        errors: false,
        server: false,
        lazy: true,
      })()
    ).toEqualTypeOf<UserData>()
  })

  it('allows returning a Navigation Result without a type error', () => {
    expectTypeOf<UserData>(
      defineColadaLoader(() => ({
        key: ['id'],
        query: async () => {
          if (Math.random()) {
            return query()
          } else {
            return new NavigationResult('/')
          }
        },
      }))().data.value
    )
    expectTypeOf(
      defineColadaLoader(() => ({
        key: ['id'],
        query: async () => {
          if (Math.random()) {
            return query()
          } else {
            return new NavigationResult('/')
          }
        },
      }))()
    ).resolves.toEqualTypeOf<UserData>()
  })

  it('accepts query options from defineQueryOptions()', async () => {
    const userQuery = defineQueryOptions((id: string) => ({
      key: ['users', id],
      query: async (): Promise<UserData> => ({ id, name: 'Edu' }),
    }))
    expectTypeOf(
      defineColadaLoader(to => userQuery(to.path))().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader(to => userQuery(to.path))()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader('/users/[id]', to => userQuery(to.path))().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader('/users/[id]', to => userQuery(to.path), {
        lazy: true,
      })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('passes the navigation and query signals', () => {
    defineColadaLoader((_to, navigation) => {
      expectTypeOf(navigation.signal).toEqualTypeOf<AbortSignal | undefined>()
      return {
        key: ['id'],
        query: ({ signal }) => {
          expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
          return query()
        },
      }
    })
  })
})
