import { MatcherName, MatcherQueryParams } from './matcher'
import { EmptyParams, MatcherParamsFormatted } from './matcher-location'
import { MatchMiss, miss } from './matchers/errors'

export interface MatcherLocation {
  /**
   * Encoded path
   */
  path: string

  /**
   * Decoded query.
   */
  query: MatcherQueryParams

  /**
   * Decoded hash.
   */
  hash: string
}

export interface OLD_MatcherPattern<TParams = MatcherParamsFormatted> {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  match(location: MatcherLocation): TParams | null

  toLocation(params: TParams): MatcherLocation
}

export interface MatcherPattern {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  path: MatcherPatternPath
  query?: MatcherPatternQuery
  hash?: MatcherPatternHash

  parent?: MatcherPattern
}

export interface MatcherPatternParams_Base<
  TIn = string,
  TOut extends MatcherParamsFormatted = MatcherParamsFormatted
> {
  match(value: TIn): TOut

  build(params: TOut): TIn
  // get: (value: MatcherQueryParamsValue) => T
  // set?: (value: T) => MatcherQueryParamsValue
  // default?: T | (() => T)
}

export interface MatcherPatternPath<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
> extends MatcherPatternParams_Base<string, TParams> {}

export class MatcherPatternPathStatic
  implements MatcherPatternPath<EmptyParams>
{
  constructor(private path: string) {}

  match(path: string): EmptyParams {
    if (path !== this.path) {
      throw miss()
    }
    return {}
  }

  build(): string {
    return this.path
  }
}
// example of a static matcher built at runtime
// new MatcherPatternPathStatic('/')

// example of a generated matcher at build time
const HomePathMatcher = {
  match: path => {
    if (path !== '/') {
      throw miss()
    }
    return {}
  },
  build: () => '/',
} satisfies MatcherPatternPath<EmptyParams>

export interface MatcherPatternQuery<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
> extends MatcherPatternParams_Base<MatcherQueryParams, TParams> {}

const PaginationQueryMatcher = {
  match: query => {
    const page = Number(query.page)
    return {
      page: Number.isNaN(page) ? 1 : page,
    }
  },
  build: params => ({ page: String(params.page) }),
} satisfies MatcherPatternQuery<{ page: number }>

export interface MatcherPatternHash<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
> extends MatcherPatternParams_Base<string, TParams> {}

const HeaderHashMatcher = {
  match: hash =>
    hash.startsWith('#')
      ? {
          header: hash.slice(1),
        }
      : {}, // null also works
  build: ({ header }) => (header ? `#${header}` : ''),
} satisfies MatcherPatternHash<{ header?: string }>

export class MatcherPatternImpl<
  PathParams extends MatcherParamsFormatted,
  QueryParams extends MatcherParamsFormatted = EmptyParams,
  HashParams extends MatcherParamsFormatted = EmptyParams
> implements OLD_MatcherPattern<PathParams & QueryParams & HashParams>
{
  parent: MatcherPatternImpl<MatcherParamsFormatted> | null = null
  children: MatcherPatternImpl<MatcherParamsFormatted>[] = []

  constructor(
    public name: MatcherName,
    private path: MatcherPatternPath<PathParams>,
    private query?: MatcherPatternQuery<QueryParams>,
    private hash?: MatcherPatternHash<HashParams>
  ) {}

  /**
   * Matches a parsed query against the matcher and all of the parents.
   * @param query - query to match
   * @returns matched
   * @throws {MatchMiss} if the query does not match
   */
  queryMatch<QParams extends QueryParams>(query: MatcherQueryParams): QParams {
    // const queryParams: QParams = {} as QParams
    const queryParams: QParams[] = []
    let current: MatcherPatternImpl<
      MatcherParamsFormatted,
      MatcherParamsFormatted,
      MatcherParamsFormatted
    > | null = this

    while (current) {
      queryParams.push(current.query?.match(query) as QParams)
      current = current.parent
    }
    // we give the later matchers precedence
    return Object.assign({}, ...queryParams.reverse())
  }

  queryBuild<QParams extends QueryParams>(params: QParams): MatcherQueryParams {
    const query: MatcherQueryParams = {}
    let current: MatcherPatternImpl<
      MatcherParamsFormatted,
      MatcherParamsFormatted,
      MatcherParamsFormatted
    > | null = this
    while (current) {
      Object.assign(query, current.query?.build(params))
      current = current.parent
    }
    return query
  }

  match<QParams extends QueryParams>(
    location: MatcherLocation
  ): (PathParams & QParams & HashParams) | null {
    try {
      const pathParams = this.path.match(location.path)
      const queryParams = this.queryMatch<QParams>(location.query)
      const hashParams = this.hash?.match(location.hash) ?? ({} as HashParams)

      return { ...pathParams, ...queryParams, ...hashParams }
    } catch (err) {}

    return null
  }

  toLocation(params: PathParams & QueryParams & HashParams): MatcherLocation {
    return {
      path: this.path.build(params),
      query: this.query?.build(params) ?? {},
      hash: this.hash?.build(params) ?? '',
    }
  }
}

// const matcher = new MatcherPatternImpl('name', HomePathMatcher, PaginationQueryMatcher, HeaderHashMatcher)
// matcher.match({ path: '/', query: {}, hash: '' })!.page
