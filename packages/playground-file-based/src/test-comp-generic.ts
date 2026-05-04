import type { RouteMap, RouteParams } from 'vue-router'

type __VLS_PrettifyLocal<T> = (T extends any
  ? { [K in keyof T]: T[K] }
  : { [K in keyof T as K]: T[K] }) & {}

type RouteNameStatic = {
  [Name in keyof RouteMap]: keyof RouteParams<Name> extends never ? Name : never
}[keyof RouteMap]

const __VLS_export = <Name extends keyof RouteMap>(
  __VLS_props: NonNullable<Awaited<typeof __VLS_setup>>['props'],
  __VLS_ctx?: __VLS_PrettifyLocal<
    Pick<NonNullable<Awaited<typeof __VLS_setup>>, 'attrs' | 'emit' | 'slots'>
  >,
  __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>['expose'],
  __VLS_setup = (async () => {
    type __VLS_Props = Name extends RouteNameStatic
      ? {
          route: Name
          params?: never
        }
      : {
          route: Name
          params: RouteParams<Name>
        }
    type __VLS_PublicProps = __VLS_Props
    // let __VLS_intrinsics!: import('vue/jsx-runtime').JSX.IntrinsicElements
    // __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({})
    return {} as {
      props: import('vue').PublicProps &
        __VLS_PrettifyLocal<__VLS_PublicProps> &
        (typeof globalThis extends { __VLS_PROPS_FALLBACK: infer P } ? P : {})
      expose: (exposed: {}) => void
      attrs: any
      slots: {}
      emit: {}
    }
  })()
) => ({}) as import('vue').VNode & { __ctx?: Awaited<typeof __VLS_setup> }

export default {} as typeof __VLS_export
