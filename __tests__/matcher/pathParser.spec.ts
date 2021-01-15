import { tokenizePath, TokenType } from '../../src/matcher/pathTokenizer'
import { tokensToParser } from '../../src/matcher/pathParserRanker'

describe('Path parser', () => {
  describe('tokenizer', () => {
    it('root', () => {
      expect(tokenizePath('/')).toEqual([
        [{ type: TokenType.Static, value: '' }],
      ])
    })

    it('empty', () => {
      expect(tokenizePath('')).toEqual([[]])
    })

    it('not start with /', () => {
      expect(() => tokenizePath('a')).toThrowError(`"a" should be "/a"`)
    })

    it('escapes :', () => {
      expect(tokenizePath('/\\:')).toEqual([
        [{ type: TokenType.Static, value: ':' }],
      ])
    })

    it('escapes {', () => {
      expect(tokenizePath('/\\{')).toEqual([
        [{ type: TokenType.Static, value: '{' }],
      ])
    })

    // not sure how useful this is and if it's worth supporting because of the
    // cost to support the ranking as well
    it.skip('groups', () => {
      expect(tokenizePath('/one{-b_:id}')).toEqual([
        [
          { type: TokenType.Static, value: 'one' },
          {
            type: TokenType.Group,
            groups: [
              { type: TokenType.Static, value: '-b_' },
              { type: TokenType.Param, value: 'id' },
            ],
          },
        ],
      ])
    })

    // same as above
    it.skip('escapes } inside group', () => {
      expect(tokenizePath('/{\\{}')).toEqual([
        [{ type: TokenType.Static, value: '{' }],
      ])
    })

    it('escapes ( inside custom re', () => {
      expect(tokenizePath('/:a(\\))')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'a',
            regexp: ')',
            optional: false,
            repeatable: false,
          },
        ],
      ])
    })

    it('static single', () => {
      expect(tokenizePath('/home')).toEqual([
        [{ type: TokenType.Static, value: 'home' }],
      ])
    })

    it('static multiple', () => {
      expect(tokenizePath('/one/two/three')).toEqual([
        [{ type: TokenType.Static, value: 'one' }],
        [{ type: TokenType.Static, value: 'two' }],
        [{ type: TokenType.Static, value: 'three' }],
      ])
    })

    it('param single', () => {
      expect(tokenizePath('/:id')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param custom re', () => {
      expect(tokenizePath('/:id(\\d+)')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param custom re followed by static', () => {
      expect(tokenizePath('/:id(\\d+)hey')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: false,
          },
          {
            type: TokenType.Static,
            value: 'hey',
          },
        ],
      ])
    })

    it('param custom re followed by new segment', () => {
      expect(tokenizePath('/:id(\\d+)/new')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: false,
          },
        ],
        [
          {
            type: TokenType.Static,
            value: 'new',
          },
        ],
      ])
    })

    it('param custom re followed by param without regex', () => {
      expect(tokenizePath('/:one(\\d+)/:two')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'one',
            regexp: '\\d+',
            repeatable: false,
            optional: false,
          },
        ],
        [
          {
            type: TokenType.Param,
            value: 'two',
            regexp: '',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param custom re?', () => {
      expect(tokenizePath('/:id(\\d+)?')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: true,
          },
        ],
      ])
    })

    it('param custom re? followed by static', () => {
      expect(tokenizePath('/:id(\\d+)?hey')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: true,
          },
          {
            type: TokenType.Static,
            value: 'hey',
          },
        ],
      ])
    })

    it('param custom re? followed by new segment', () => {
      expect(tokenizePath('/:id(\\d+)?/new')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: true,
          },
        ],
        [
          {
            type: TokenType.Static,
            value: 'new',
          },
        ],
      ])
    })

    it('param single?', () => {
      expect(tokenizePath('/:id?')).toEqual([
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '',
            repeatable: false,
            optional: true,
          },
        ],
      ])
    })

    it('param single+', () => {
      expect(tokenizePath('/:id+')).toMatchObject([
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: true,
            optional: false,
          },
        ],
      ])
    })

    it('param single*', () => {
      expect(tokenizePath('/:id*')).toMatchObject([
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: true,
            optional: true,
          },
        ],
      ])
    })

    it('param multiple', () => {
      expect(tokenizePath('/:id/:other')).toMatchObject([
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: false,
            optional: false,
          },
        ],
        [
          {
            type: TokenType.Param,
            value: 'other',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param multiple together', () => {
      expect(tokenizePath('/:id:other:more')).toMatchObject([
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: false,
            optional: false,
          },
          {
            type: TokenType.Param,
            value: 'other',
            repeatable: false,
            optional: false,
          },
          {
            type: TokenType.Param,
            value: 'more',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param with static in between', () => {
      expect(tokenizePath('/:id-:other')).toMatchObject([
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: false,
            optional: false,
          },
          {
            type: TokenType.Static,
            value: '-',
          },
          {
            type: TokenType.Param,
            value: 'other',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param with static beginning', () => {
      expect(tokenizePath('/hey-:id')).toMatchObject([
        [
          {
            type: TokenType.Static,
            value: 'hey-',
          },
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param with static end', () => {
      expect(tokenizePath('/:id-end')).toMatchObject([
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: false,
            optional: false,
          },
          {
            type: TokenType.Static,
            value: '-end',
          },
        ],
      ])
    })
    // end of describe token
  })

  describe('tokensToParser', () => {
    function matchRegExp(
      expectedRe: string,
      ...args: Parameters<typeof tokensToParser>
    ) {
      const pathParser = tokensToParser(...args)
      const options = args[1] || {}
      expect(
        pathParser.re
          .toString()
          // remove the starting and ending slash of RegExp as well as any modifier
          // /^\\/home$/i -> ^\\@home$
          .replace(/(:?^\/|\/\w*$)/g, '')
          // remove escaped / to make it easier to write in tests
          .replace(/\\\//g, '/')
          // only check the trailing slash if we provided a strict option
          .replace(/\/\?\$?$/, 'strict' in options ? '$&' : '$')
      ).toBe(expectedRe)
    }

    it('static single', () => {
      matchRegExp('^/?$', [[]], { strict: false })
      matchRegExp('^/$', [[]], { strict: true })
    })

    it('regex special characters', () => {
      matchRegExp('^/foo\\+\\.\\*\\?$', [
        [{ type: TokenType.Static, value: 'foo+.*?' }],
      ])
      matchRegExp('^/foo\\$\\^$', [
        [{ type: TokenType.Static, value: 'foo$^' }],
      ])
      matchRegExp('^/foo\\[ea\\]$', [
        [{ type: TokenType.Static, value: 'foo[ea]' }],
      ])
      matchRegExp('^/foo\\(e|a\\)$', [
        [{ type: TokenType.Static, value: 'foo(e|a)' }],
      ])
      matchRegExp('^/(\\d+)\\{2\\}$', [
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: false,
          },
          { type: TokenType.Static, value: '{2}' },
        ],
      ])
    })

    it('strict /', () => {
      matchRegExp('^/$', [[{ type: TokenType.Static, value: '' }]], {
        strict: true,
      })
    })

    it('static single', () => {
      matchRegExp('^/home$', [[{ type: TokenType.Static, value: 'home' }]])
    })

    it('static multiple', () => {
      matchRegExp('^/home/other$', [
        [{ type: TokenType.Static, value: 'home' }],
        [{ type: TokenType.Static, value: 'other' }],
      ])
    })

    it('param single', () => {
      matchRegExp('^/([^/]+?)$', [
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param multiple', () => {
      matchRegExp('^/([^/]+?)/([^/]+?)$', [
        [
          {
            type: TokenType.Param,
            value: 'id',
            repeatable: false,
            optional: false,
          },
        ],
        [
          {
            type: TokenType.Param,
            value: 'two',
            repeatable: false,
            optional: false,
          },
        ],
      ])
    })

    it('param*', () => {
      matchRegExp('^(?:/((?:\\d+)(?:/(?:\\d+))*))?$', [
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: true,
            optional: true,
          },
        ],
      ])
    })

    it('param?', () => {
      matchRegExp(
        '^(?:/(\\d+))?/?$',
        [
          [
            {
              type: TokenType.Param,
              value: 'id',
              regexp: '\\d+',
              repeatable: false,
              optional: true,
            },
          ],
        ],
        { strict: false }
      )
    })

    it('static and param?', () => {
      matchRegExp('^/ab(?:/(\\d+))?$', [
        [
          {
            type: TokenType.Static,
            value: 'ab',
          },
        ],
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: false,
            optional: true,
          },
        ],
      ])
    })

    it('param+', () => {
      matchRegExp('^/((?:\\d+)(?:/(?:\\d+))*)$', [
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: true,
            optional: false,
          },
        ],
      ])
    })

    it('static and param+', () => {
      matchRegExp('^/ab/((?:\\d+)(?:/(?:\\d+))*)$', [
        [
          {
            type: TokenType.Static,
            value: 'ab',
          },
        ],
        [
          {
            type: TokenType.Param,
            value: 'id',
            regexp: '\\d+',
            repeatable: true,
            optional: false,
          },
        ],
      ])
    })
    // end of describe
  })

  describe('parsing urls', () => {
    function matchParams(
      path: string,
      pathToTest: string,
      params: ReturnType<ReturnType<typeof tokensToParser>['parse']>,
      options?: Parameters<typeof tokensToParser>[1]
    ) {
      const pathParser = tokensToParser(tokenizePath(path), options)

      expect(pathParser.parse(pathToTest)).toEqual(params)
    }

    it('returns null if no match', () => {
      matchParams('/home', '/', null)
    })

    it('allows an empty root', () => {
      matchParams('', '/', {})
    })

    it('makes the difference between "" and "/" when strict', () => {
      matchParams('/foo', '/foo/', null, { strict: true })
      matchParams('/foo/', '/foo', null, { strict: true })
    })

    it('allows a trailing slash', () => {
      matchParams('/home', '/home/', {})
      matchParams('/a/b', '/a/b/', {})
    })

    it('enforces a trailing slash', () => {
      matchParams('/home/', '/home', null, { strict: true })
    })

    it('allow a trailing slash in repeated params', () => {
      matchParams('/a/:id+', '/a/b/c/d/', { id: ['b', 'c', 'd'] })
      matchParams('/a/:id*', '/a/b/c/d/', { id: ['b', 'c', 'd'] })
      matchParams('/a/:id*', '/a/', { id: '' })
      matchParams('/a/:id*', '/a', { id: '' })
    })

    it('allow no slash', () => {
      matchParams('/home', '/home/', null, { strict: true })
      matchParams('/home', '/home', {}, { strict: true })
    })

    it('is insensitive by default', () => {
      matchParams('/home', '/HOMe', {})
    })

    it('can be sensitive', () => {
      matchParams('/home', '/HOMe', null, { sensitive: true })
      matchParams('/home', '/home', {}, { sensitive: true })
    })

    it('can not match the beginning', () => {
      matchParams('/home', '/other/home', null, { start: true })
      matchParams('/home', '/other/home', {}, { start: false })
    })

    it('can not match the end', () => {
      matchParams('/home', '/home/other', null, { end: true })
      matchParams('/home', '/home/other', {}, { end: false })
    })

    it('should not match optional params + static without leading slash', () => {
      matchParams('/a/:p?-b', '/a-b', null)
      matchParams('/a/:p?-b', '/a/-b', { p: '' })
      matchParams('/a/:p?-b', '/a/e-b', { p: 'e' })
    })

    it('returns an empty object with no keys', () => {
      matchParams('/home', '/home', {})
    })

    it('param single', () => {
      matchParams('/:id', '/a', { id: 'a' })
    })

    it('param combined', () => {
      matchParams('/hey:a', '/heyedu', {
        a: 'edu',
      })
    })

    // TODO: better syntax? like /a/{b-:param}+
    // also to allow repeatable because otherwise groups are meaningless
    it('groups (extract a part of the param)', () => {
      matchParams('/a/:a(?:b-([^/]+\\)?)', '/a/b-one', {
        a: 'one',
      })
      matchParams('/a/:a(?:b-([^/]+\\)?)', '/a/b-', {
        a: '',
      })
      // non optional
      matchParams('/a/:a(?:b-([^/]+\\))', '/a/b-one', {
        a: 'one',
      })
    })

    it('catch all', () => {
      matchParams('/:rest(.*)', '/a/b/c', { rest: 'a/b/c' })
      matchParams('/:rest(.*)/no', '/a/b/c/no', { rest: 'a/b/c' })
    })

    it('catch all non-greedy', () => {
      matchParams('/:rest(.*?)/b/:other(.*)', '/a/b/c/b/d', {
        rest: 'a',
        other: 'c/b/d',
      })
    })

    it('param multiple', () => {
      matchParams('/:a-:b-:c', '/one-two-three', {
        a: 'one',
        b: 'two',
        c: 'three',
      })
    })

    it('param optional', () => {
      matchParams('/:a?', '/one', { a: 'one' })
      matchParams('/:a*', '/one', { a: ['one'] })
    })

    it('empty param optional', () => {
      matchParams('/:a?', '/', { a: '' })
      matchParams('/:a*', '/', { a: '' })
    })

    it('static then empty param optional', () => {
      matchParams('/a/:a?', '/a', { a: '' })
      matchParams('/a/:a?', '/a/a', { a: 'a' })
      matchParams('/a/:a?', '/a/a/', { a: 'a' })
      matchParams('/a/:a?', '/a/', { a: '' })
      matchParams('/a/:a*', '/a', { a: '' })
      matchParams('/a/:a*', '/a/', { a: '' })
    })

    it('static then param optional', () => {
      matchParams('/one/:a?', '/one/two', { a: 'two' })
      matchParams('/one/:a?', '/one/', { a: '' })
      // can only match one time
      matchParams('/one/:a?', '/one/two/three', null)
      matchParams('/one/:a*', '/one/two', { a: ['two'] })
    })

    it('param optional followed by static', () => {
      matchParams('/:a?/one', '/two/one', { a: 'two' })
      // since the first one is optional
      matchParams('/:a?/one', '/one', { a: '' })
      matchParams('/:a?/one', '/two', null)
      // can only match one time
      matchParams('/:a?/one', '/two/three/one', null)
      matchParams('/:a*/one', '/two/one', { a: ['two'] })
    })

    it('param repeatable', () => {
      matchParams('/:a+', '/one/two', {
        a: ['one', 'two'],
      })
      matchParams('/:a*', '/one/two', {
        a: ['one', 'two'],
      })
    })

    it('param repeatable with static', () => {
      matchParams('/one/:a+', '/one/two', {
        a: ['two'],
      })
      matchParams('/one/:a+', '/one/two/three', {
        a: ['two', 'three'],
      })
      matchParams('/one/:a*', '/one/two', {
        a: ['two'],
      })
      matchParams('/one/:a*', '/one/two/three', {
        a: ['two', 'three'],
      })
    })

    // end of parsing urls
  })

  describe('generating urls', () => {
    function matchStringify(
      path: string,
      params: Exclude<
        ReturnType<ReturnType<typeof tokensToParser>['parse']>,
        null
      >,
      expectedUrl: string,
      options?: Parameters<typeof tokensToParser>[1]
    ) {
      const pathParser = tokensToParser(tokenizePath(path), options)

      expect(pathParser.stringify(params)).toEqual(expectedUrl)
    }

    it('no params one segment', () => {
      matchStringify('/home', {}, '/home')
    })

    it('works with trailing slash', () => {
      matchStringify('/home/', {}, '/home/')
      matchStringify('/home/', {}, '/home/', { strict: true })
    })

    it('single param one segment', () => {
      matchStringify('/:id', { id: 'one' }, '/one')
    })

    it('params with custom regexp', () => {
      matchStringify('/:id(\\d+)-:w(\\w+)', { id: '2', w: 'hey' }, '/2-hey')
    })

    it('multiple param one segment', () => {
      matchStringify('/:a-:b', { a: 'one', b: 'two' }, '/one-two')
    })

    it('repeatable params+', () => {
      matchStringify('/:a+', { a: ['one', 'two'] }, '/one/two')
    })

    it('repeatable params+ with extra segment', () => {
      matchStringify('/:a+/other', { a: ['one', 'two'] }, '/one/two/other')
    })

    it('repeatable params*', () => {
      matchStringify('/:a*', { a: ['one', 'two'] }, '/one/two')
    })

    it('static then optional param?', () => {
      matchStringify('/a/:a?', { a: '' }, '/a')
      matchStringify('/a/:a?', {}, '/a')
    })

    it('optional param?', () => {
      matchStringify('/:a?/other', { a: '' }, '/other')
      matchStringify('/:a?/other', {}, '/other')
    })

    it('optional param? with static segment', () => {
      matchStringify('/b-:a?/other', { a: '' }, '/b-/other')
      matchStringify('/b-:a?/other', {}, '/b-/other')
    })

    it('starting optional param? with static segment should not drop the initial /', () => {
      matchStringify('/a/:a?-other/other', { a: '' }, '/a/-other/other')
      matchStringify('/a/:a?-other/other', {}, '/a/-other/other')
      matchStringify('/a/:a?-other/other', { a: 'p' }, '/a/p-other/other')
    })

    it('optional param*', () => {
      matchStringify('/:a*/other', { a: '' }, '/other')
      matchStringify('/:a*/other', { a: [] }, '/other')
      matchStringify('/:a*/other', {}, '/other')
    })

    // end of generating urls
  })
})
