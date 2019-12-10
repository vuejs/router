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
            repeatable: false,
            optional: true,
          },
        ],
      ])
    })

    it('param single+', () => {
      expect(tokenizePath('/:id+')).toEqual([
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
      expect(tokenizePath('/:id*')).toEqual([
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
      expect(tokenizePath('/:id/:other')).toEqual([
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

    it('param with static in between', () => {
      expect(tokenizePath('/:id-:other')).toEqual([
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
      expect(tokenizePath('/hey-:id')).toEqual([
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
      expect(tokenizePath('/:id-end')).toEqual([
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
        pathParser.re.toString().replace(/(:?^\/|\\|\/$)/g, '')
      )
    }

    it('static', () => {
      matchRegExp('^/home$', [[{ type: TokenType.Static, value: 'home' }]])
    })

    it('param simple', () => {
      matchRegExp('^/([^/]+)$', [
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
  })
})
