import type {
  ParamsFromPath,
  _StripRegex,
  _ExtractParamsOfPath,
  _RemoveUntilClosingPar,
  _ExtractModifier,
  _ModifierExtracTResult,
} from './'
import { expectType } from './'

function params<T extends string>(_path: T): ParamsFromPath<T> {
  return {} as any
}

// simple
expectType<Record<any, never>>(params('/static'))
expectType<{ id: string }>(params('/users/:id'))
// simulate a part of the string unknown at compilation time
expectType<{ id: string }>(params(`/${encodeURI('')}/:id`))
expectType<{ id: readonly [string, ...string[]] }>(params('/users/:id+'))
expectType<{ id?: string | null | undefined }>(params('/users/:id?'))
expectType<{ id?: readonly string[] | null | undefined }>(params('/users/:id*'))

expectType<Record<any, never>>(params('/hello/other/thing'))
// @ts-expect-error
expectType<{ thing: 'e' }>(params('/hello/other/thing'))

// @ts-expect-error
expectType<{ other: string }>(params('/users/:id'))
// @ts-expect-error
expectType<{ other: string }>(params('/users/static'))

// at beginning
expectType<{ id: string }>(params('/:id'))
expectType<{ id: readonly [string, ...string[]] }>(params('/:id+'))
expectType<{ id?: string | null | undefined }>(params('/:id?'))
expectType<{ id?: readonly string[] | null | undefined }>(params('/:id*'))

// with trailing path
expectType<{ id: string }>(params('/users/:id-more'))
expectType<{ id: readonly [string, ...string[]] }>(params('/users/:id+-more'))
expectType<{ id?: string | null | undefined }>(params('/users/:id?-more'))
expectType<{ id?: readonly string[] | null | undefined }>(
  params('/users/:id*-more')
)

// multiple
expectType<{ id: string; b: string }>(params('/users/:id/:b'))
expectType<{
  id: readonly [string, ...string[]]
  b: readonly [string, ...string[]]
}>(params('/users/:id+/:b+'))
expectType<{ id?: string | null | undefined; b?: string | null | undefined }>(
  params('/users/:id?-:b?')
)
expectType<{
  id?: readonly string[] | null | undefined
  b?: readonly string[] | null | undefined
}>(params('/users/:id*/:b*'))

// custom regex
expectType<{ id: string }>(params('/users/:id(one)'))
expectType<{ id: string }>(params('/users/:id(\\d+)'))
expectType<{ id: readonly string[] }>(params('/users/:id(one)+'))
expectType<{ date: string }>(params('/users/:date(\\d{4}-\\d{2}-\\d{2})'))
expectType<{ a: string }>(params('/:a(pre-(?:\\d{0,5}\\)-end)'))

expectType<{
  id: readonly [string, ...string[]]
  b: string
  c: string
  d: string
}>(params('/:id(.*)+/other/:b/:c/:d'))

// special characters
expectType<{ id: string }>(params('/:id$thing'))
expectType<{ id: string }>(params('/:id&thing'))
expectType<{ id: string }>(params('/:id!thing'))
expectType<{ id: string }>(params('/:id\\*thing'))
expectType<{ id: string }>(params('/:id\\thing'))
expectType<{ id: string }>(params("/:id'thing"))
expectType<{ id: string }>(params('/:id,thing'))
expectType<{ id: string }>(params('/:id;thing'))
expectType<{ id: string }>(params('/:id=thing'))
expectType<{ id: string }>(params('/:id@thing'))
expectType<{ id: string }>(params('/:id[thing'))
expectType<{ id: string }>(params('/:id]thing'))

function removeUntilClosingPar<S extends string>(
  _s: S
): _RemoveUntilClosingPar<S> {
  return '' as any
}

expectType<''>(removeUntilClosingPar(')'))
expectType<'+'>(removeUntilClosingPar(')+'))
expectType<'more'>(removeUntilClosingPar(')more'))
expectType<''>(removeUntilClosingPar('\\w+)'))
expectType<'/more-url'>(removeUntilClosingPar('\\w+)/more-url'))
expectType<'/:p'>(removeUntilClosingPar('\\w+)/:p'))
expectType<'+'>(removeUntilClosingPar('oe)+'))
expectType<'/:p(o)'>(removeUntilClosingPar('\\w+)/:p(o)'))
expectType<'/:p(o)'>(removeUntilClosingPar('(?:no\\)?-end)/:p(o)'))
expectType<'/:p(o(?:no\\)?-end)'>(
  removeUntilClosingPar('-end)/:p(o(?:no\\)?-end)')
)
expectType<':new(eg)other'>(removeUntilClosingPar('customr):new(eg)other'))
expectType<':new(eg)+other'>(removeUntilClosingPar('customr):new(eg)+other'))
expectType<'/:new(eg)+other'>(removeUntilClosingPar('customr)/:new(eg)+other'))
expectType<'?/:new(eg)+other'>(
  removeUntilClosingPar('customr)?/:new(eg)+other')
)

function stripRegex<S extends string>(_s: S): _StripRegex<S> {
  return '' as any
}

expectType<'+/edit/'>(stripRegex('(\\d+)+/edit/'))
expectType<'*'>(stripRegex('(.*)*'))
expectType<'?/rest'>(stripRegex('?/rest'))
expectType<'*'>(stripRegex('*'))
expectType<'-other-stuff'>(stripRegex('-other-stuff'))
expectType<'/edit'>(stripRegex('/edit'))
expectType<'?/rest/:other(.*)*'>(stripRegex('?/rest/:other(.*)*'))
expectType<'+/edit/:other(.*)*'>(stripRegex('(\\d+)+/edit/:other(.*)*'))
expectType<'?/rest/:other(.*)/more/:b(.*)'>(
  stripRegex('?/rest/:other(.*)/more/:b(.*)')
)

function extractModifier<S extends string>(_s: S): _ExtractModifier<S> {
  return {} as any
}

expectType<_ModifierExtracTResult<'', ''>>(extractModifier(''))
expectType<_ModifierExtracTResult<'', '-rest'>>(extractModifier('-rest'))
expectType<_ModifierExtracTResult<'', 'edit'>>(extractModifier('edit'))
expectType<_ModifierExtracTResult<'+', ''>>(extractModifier('+'))
expectType<_ModifierExtracTResult<'+', '/edit'>>(extractModifier('+/edit'))
expectType<_ModifierExtracTResult<'+', '/edit/:a?'>>(
  extractModifier('+/edit/:a?')
)
