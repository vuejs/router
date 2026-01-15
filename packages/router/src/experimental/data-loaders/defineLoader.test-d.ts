import { describe, it, expectTypeOf } from 'vitest'
import { defineBasicLoader } from './defineLoader'
import { NavigationResult } from './navigation-guard'

describe('defineBasicLoader', () => {
  interface UserData {
    id: string
    name: string
  }

  // TODO: figure a way to not pollute global types with RouteMap
  // Skipped: requires typed routes to be configured in RouteMap
  // it.todo('uses typed routes', () => {
  //   const useDataLoader = defineBasicLoader('/[name]', async route => {
  //     const user = {
  //       // @ts-expect-error: route params type not available without RouteMap config
  //       id: route.params.name as string,
  //       name: 'Edu',
  //     }
  //
  //     return user
  //   })
  //
  //   expectTypeOf<
  //     | {
  //         data: Ref<UserData>
  //         error: Ref<unknown>
  //         isLoading: Ref<boolean>
  //         reload: () => Promise<void>
  //       }
  //     | PromiseLike<UserData>
  //   >(useDataLoader())
  // })

  async function loaderUser() {
    const user: UserData = {
      id: 'one',
      name: 'Edu',
    }

    return user
  }

  it('can enforce defined data', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser)().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {})().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: false,
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        lazy: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
  })

  it('makes data possibly undefined when lazy', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { lazy: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when lazy is a function', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { lazy: () => false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when errors is not false', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: [] })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: e => e instanceof Error })().data
        .value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: () => true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('uses a default type of Error | null', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, {})().error.value
    ).toEqualTypeOf<Error | null>()
  })

  it('makes data possibly undefined when server is not true', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { server: false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('infers the returned type for data', () => {
    expectTypeOf<UserData | undefined>(
      defineBasicLoader(loaderUser, { lazy: true })().data.value
    )
    expectTypeOf<UserData | undefined>(
      defineBasicLoader(loaderUser, { lazy: () => false })().data.value
    )
  })

  it('infers the returned type for the resolved value to always be defined', async () => {
    expectTypeOf(
      await defineBasicLoader(loaderUser)()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, {})()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { lazy: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { server: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { server: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: [] })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { server: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, {
        errors: false,
        server: false,
        lazy: true,
      })()
    ).toEqualTypeOf<UserData>()
  })

  it('allows returning a Navigation Result without a type error', () => {
    expectTypeOf<UserData>(
      defineBasicLoader(async () => {
        if (Math.random()) {
          return loaderUser()
        } else {
          return new NavigationResult('/')
        }
      })().data.value
    )
    expectTypeOf(
      defineBasicLoader(async () => {
        if (Math.random()) {
          return loaderUser()
        } else {
          return new NavigationResult('/')
        }
      })()
    ).resolves.toEqualTypeOf<UserData>()
  })
})
