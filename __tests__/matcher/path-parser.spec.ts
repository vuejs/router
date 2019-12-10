import {
  tokenizePath,
  TokenType,
  tokensToRegExp,
} from '../../src/matcher/tokenizer'

describe('Path parser', () => {
  describe('tokenizer', () => {
    it('root', () => {
      expect(tokenizePath('/')).toEqual([[]])
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

  describe('tokensToRegexp', () => {
    function matchRegExp(
      expectedRe: string,
      ...args: Parameters<typeof tokensToRegExp>
    ) {
      const pathParser = tokensToRegExp(...args)
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
})
