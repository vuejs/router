import { RouteParams, RouteParamsRaw, expectType } from './index'

const params: RouteParams | RouteParamsRaw = { name: 'value' }
// @ts-expect-error
expectType<undefined>(params.nonExist)
// @ts-expect-error
expectType<string>(params.name)
