export const enum TokenType {
  Static,
  Param,
}

const enum TokenizerState {
  Static,
  Param,
  EscapeNext,
}

interface TokenStatic {
  type: TokenType.Static
  value: string
}

interface TokenParam {
  type: TokenType.Param
  regex?: string
  value: string
}

interface TokenParam {
  type: TokenType.Param
  regex?: string
  value: string
  optional: boolean
  repeatable: boolean
}

type Token = TokenStatic | TokenParam

// const ROOT_TOKEN: Token = {
//   type: TokenType.Static,
//   value: '/',
// }

const VALID_PARAM_RE = /[a-zA-Z0-9_]/

export function tokenizePath(path: string): Array<Token[]> {
  if (path === '/') return [[]]
  // remove the leading slash
  if (!path) throw new Error('An empty path cannot be tokenized')

  function crash(message: string) {
    throw new Error(`ERR (${state})/"${buffer}": ${message}`)
  }

  let state: TokenizerState = TokenizerState.Static
  let previousState: TokenizerState = state
  const tokens: Array<Token[]> = []
  // the segment will always be valid because we get into the initial state
  // with the leading /
  let segment!: Token[]

  function finalizeSegment() {
    if (segment) tokens.push(segment)
    segment = []
  }

  // index on the path
  let i = 0
  // char at index
  let char: string
  // buffer of the value read
  let buffer: string = ''

  function consumeBuffer() {
    if (!buffer) return

    if (state === TokenizerState.Static) {
      segment.push({
        type: TokenType.Static,
        value: buffer,
      })
    } else if (state === TokenizerState.Param) {
      segment.push({
        type: TokenType.Param,
        value: buffer,
        repeatable: char === '*' || char === '+',
        optional: char === '*' || char === '?',
      })
    } else {
      crash('Invalid state to consume buffer')
    }
    buffer = ''
  }

  function addCharToBuffer() {
    buffer += char
  }

  while (i < path.length) {
    char = path[i++]

    if (char === '\\') {
      previousState = state
      state = TokenizerState.EscapeNext
      continue
    }

    switch (state) {
      case TokenizerState.Static:
        if (char === '/') {
          if (buffer) {
            consumeBuffer()
          }
          finalizeSegment()
        } else if (char === ':') {
          consumeBuffer()
          state = TokenizerState.Param
        } else if (char === '{') {
          // TODO: handle group
        } else {
          addCharToBuffer()
        }
        break

      case TokenizerState.EscapeNext:
        addCharToBuffer()
        state = previousState
        break

      case TokenizerState.Param:
        if (char === '(') {
          // TODO: start custom regex
        } else if (VALID_PARAM_RE.test(char)) {
          addCharToBuffer()
        } else {
          consumeBuffer()
          state = TokenizerState.Static
          // go back one character if we were not modifying
          if (char !== '*' && char !== '?' && char !== '+') i--
        }
        break

      default:
        crash('Unkwnonw state')
        break
    }
  }

  consumeBuffer()
  finalizeSegment()

  return tokens
}

interface PathParser {
  re: RegExp
  score: number
  keys: string[]
}

export function tokensToRegExp(segments: Array<Token[]>): PathParser {
  let score = 0
  let pattern = '^'
  const keys: string[] = []

  for (const segment of segments) {
    pattern += '/'

    for (const token of segment) {
      if (token.type === TokenType.Static) {
        pattern += token.value
      } else if (token.type === TokenType.Param) {
        keys.push(token.value)
        pattern += `([^/]+)`
        // TODO: repeatable and others
      }
    }
  }

  pattern += '$'

  return {
    re: new RegExp(pattern),
    score,
    keys,
  }
}
