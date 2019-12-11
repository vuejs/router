import {
  tokenizePath,
  TokenType,
  tokensToParser,
} from '../../src/matcher/tokenizer'

describe('Path parser', () => {
  describe('tokenizer', () => {
    it('root', () => {
      expect(tokenizePath('/')).toEqual([[]])
    })

    it('escapes :', () => {
      expect(tokenizePath('/\\:')).toEqual([
        [{ type: TokenType.Static, value: ':' }],
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
  })

  describe('tokensToParser', () => {
    function matchRegExp(
      expectedRe: string,
      ...args: Parameters<typeof tokensToParser>
    ) {
      const pathParser = tokensToParser(...args)
      expect(expectedRe).toBe(
        pathParser.re
          .toString()
          .replace(/(:?^\/|\/$)/g, '')
          .replace(/\\\//g, '/')
      )
    }

    it('static single', () => {
      matchRegExp('^/$', [[]])
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
      matchRegExp('^/((?:\\d+)(?:/(?:\\d+))*)?$', [
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
      matchRegExp('^/(\\d+)?$', [
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
    // end of describe
  })

  describe('parsing urls', () => {
    function matchParams(
      path: string,
      pathToTest: string,
      params: ReturnType<ReturnType<typeof tokensToParser>['parse']>
    ) {
      const pathParser = tokensToParser(tokenizePath(path))

      expect(pathParser.parse(pathToTest)).toEqual(params)
    }

    it('returns null if no match', () => {
      matchParams('/home', '/', null)
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

    it('catch all', () => {
      matchParams('/:rest(.*)', '/a/b/c', { rest: 'a/b/c' })
      matchParams('/:rest(.*)/no', '/a/b/c/no', { rest: 'a/b/c' })
    })

    it('catch all non-greedy', () => {
      matchParams('/:rest(.*?)/b/:other(.*)', '/a/b/c', {
        rest: 'a',
        other: 'c',
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
      matchParams('/:a?', '/', {
        a: '',
      })
      matchParams('/:a*', '/', {
        a: '',
      })
    })

    it('param repeatable', () => {
      matchParams('/:a+', '/one/two', {
        a: ['one', 'two'],
      })
      matchParams('/:a*', '/one/two', {
        a: ['one', 'two'],
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
      expectedUrl: string
    ) {
      const pathParser = tokensToParser(tokenizePath(path))

      expect(pathParser.stringify(params)).toEqual(expectedUrl)
    }

    it('no params one segment', () => {
      matchStringify('/home', {}, '/home')
    })

    it('single param one segment', () => {
      matchStringify('/:id', { id: 'one' }, '/one')
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

    it('optional param?', () => {
      matchStringify('/:a?/other', { a: '' }, '/other')
      matchStringify('/:a?/other', {}, '/other')
    })

    it('optional param? with static segment', () => {
      matchStringify('/b-:a?/other', { a: '' }, '/b-/other')
      matchStringify('/b-:a?/other', {}, '/b-/other')
    })

    it('optional param*', () => {
      matchStringify('/:a*/other', { a: '' }, '/other')
      matchStringify('/:a*/other', { a: [] }, '/other')
      matchStringify('/:a*/other', {}, '/other')
    })

    // end of stringifying urls
  })
})
