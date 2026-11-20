import { diagnostics } from './diagnostics'

/**
 * Encoding Rules (␣ = Space)
 * - Path: ␣ " < > # ? { }
 * - Query: ␣ " < > # & =
 * - Hash: ␣ " < > `
 *
 * On top of that, the RFC3986 (https://tools.ietf.org/html/rfc3986#section-2.2)
 * defines some extra characters to be encoded. Most browsers do not encode them
 * in encodeURI https://github.com/whatwg/url/issues/369, so it may be safer to
 * also encode `!'()*`. Leaving un-encoded only ASCII alphanumeric(`a-zA-Z0-9`)
 * plus `-._~`. This extra safety should be applied to query by patching the
 * string returned by encodeURIComponent encodeURI also encodes `[\]^`. `\`
 * should be encoded to avoid ambiguity. Browsers (IE, FF, C) transform a `\`
 * into a `/` if directly typed in. The _backtick_ (`````) should also be
 * encoded everywhere because some browsers like FF encode it when directly
 * written while others don't. Safari and IE don't encode ``"<>{}``` in hash.
 */
// const EXTRA_RESERVED_RE = /[!'()*]/g
// const encodeReservedReplacer = (c: string) => '%' + c.charCodeAt(0).toString(16)

/**
 * NOTE: `replaceAll()` is not faster than `replace()` with a global RegExp.
 * Benchmarks do not show a clear benefit for these simple replacements:
 * https://github.com/mathiasbynens/string-prototype-replace-regexp-benchmark
 */
const HASH_RE = /#/g // %23
const AMPERSAND_RE = /&/g // %26
export const SLASH_RE = /\//g // %2F
const EQUAL_RE = /=/g // %3D
const IM_RE = /\?/g // %3F
export const PLUS_RE = /\+/g // %2B
/**
 * NOTE: queries follow application/x-www-form-urlencoded, like
 * `URLSearchParams`: a space is encoded as `+`, a `+` as `%2B`, and
 * `parseQuery()` decodes `+` as a space. Search engines (e.g. Chrome's omnibox)
 * create links with `+` for spaces (#561). Always writing `+` keeps the
 * encoding consistent and idempotent, even if `new URL()` writes `%20`.
 *
 * Resources:
 * - https://url.spec.whatwg.org/#urlencoded-parsing
 * - https://stackoverflow.com/questions/1634271/url-encoding-the-space-character-or-20
 */

const ENC_BRACKET_OPEN_RE = /%5B/g // [
const ENC_BRACKET_CLOSE_RE = /%5D/g // ]
const ENC_CARET_RE = /%5E/g // ^
const ENC_BACKTICK_RE = /%60/g // `
const ENC_CURLY_OPEN_RE = /%7B/g // {
const ENC_PIPE_RE = /%7C/g // |
const ENC_CURLY_CLOSE_RE = /%7D/g // }
export const ENC_SPACE_RE = /%20/g // space

/**
 * Encode characters that need to be encoded on the path, search and hash
 * sections of the URL.
 *
 * @internal
 * @param text - string to encode
 * @returns encoded string
 */
export function commonEncode(text: string | number | null | undefined): string {
  // 0 must become '0'
  return text == null
    ? ''
    : encodeURI('' + text)
        .replace(ENC_PIPE_RE, '|')
        .replace(ENC_BRACKET_OPEN_RE, '[')
        .replace(ENC_BRACKET_CLOSE_RE, ']')
}

/**
 * Encode characters that need to be encoded on the hash section of the URL.
 *
 * @param text - string to encode
 * @returns encoded string
 *
 * @internal Exposed for integrations (e.g. Nuxt). Not covered by semver.
 */
export function encodeHash(text: string): string {
  return commonEncode(text)
    .replace(ENC_CURLY_OPEN_RE, '{')
    .replace(ENC_CURLY_CLOSE_RE, '}')
    .replace(ENC_CARET_RE, '^')
}

/**
 * Encode characters that need to be encoded query values on the query
 * section of the URL.
 *
 * @param text - string to encode
 * @returns encoded string
 *
 * @internal Exposed for integrations (e.g. Nuxt). Not covered by semver.
 */
export function encodeQueryValue(text: string | number): string {
  return (
    commonEncode(text)
      // Encode the space as +, encode the + to differentiate it from the space
      .replace(PLUS_RE, '%2B')
      .replace(ENC_SPACE_RE, '+')
      .replace(HASH_RE, '%23')
      .replace(AMPERSAND_RE, '%26')
      .replace(ENC_BACKTICK_RE, '`')
      .replace(ENC_CURLY_OPEN_RE, '{')
      .replace(ENC_CURLY_CLOSE_RE, '}')
      .replace(ENC_CARET_RE, '^')
  )
}

/**
 * Like `encodeQueryValue` but also encodes the `=` character.
 *
 * @param text - string to encode
 *
 * @internal Exposed for integrations (e.g. Nuxt). Not covered by semver.
 */
export function encodeQueryKey(text: string | number): string {
  return encodeQueryValue(text).replace(EQUAL_RE, '%3D')
}

/**
 * Encode characters that need to be encoded on the path section of the URL.
 *
 * @param text - string to encode
 * @returns encoded string
 *
 * @internal Exposed for integrations (e.g. Nuxt). Not covered by semver.
 */
export function encodePath(text: string | number | null | undefined): string {
  return commonEncode(text).replace(HASH_RE, '%23').replace(IM_RE, '%3F')
}

/**
 * Encode characters that need to be encoded on the path section of the URL as a
 * param. This function encodes everything {@link encodePath} does plus the
 * slash (`/`) character. If `text` is `null` or `undefined`, returns an empty
 * string instead.
 *
 * @param text - string to encode
 * @returns encoded string
 *
 * @internal Exposed for integrations (e.g. Nuxt). Not covered by semver.
 */
export function encodeParam(text: string | number | null | undefined): string {
  return encodePath(text).replace(SLASH_RE, '%2F')
}

/**
 * Decode text using `decodeURIComponent`. Returns the original text if it
 * fails.
 *
 * @param text - string to decode
 * @returns decoded string
 *
 * @internal Exposed for integrations (e.g. Nuxt). Not covered by semver.
 */
export function decode(text: string | number): string
export function decode(text: null | undefined): null
export function decode(text: string | number | null | undefined): string | null
export function decode(
  text: string | number | null | undefined
): string | null {
  if (text == null) return null
  try {
    return decodeURIComponent('' + text)
  } catch {
    __DEV__ && diagnostics.VUE_ROUTER_R0080({ text: '' + text })
  }
  return '' + text
}
