/**
 * Encoding Rules
 * ␣ = Space
 * Path: ␣ " < > # ? { }
 * Query: ␣ " < > # & =
 * Hash: ␣ " < > `
 *
 * On top of that the RFC3986 (https://tools.ietf.org/html/rfc3986#section-2.2) defines some extra characters to be encoded. Most browsers do not encode them in encodeURI https://github.com/whatwg/url/issues/369 so it may be safer to also encode !'()*. Leaving unencoded only ASCII alphanum plus -._~
 * This extra safety should be applied to query by patching the string returned by encodeURIComponent
 * encodeURI also encodes [\]^
 * \ should be encoded to avoid ambiguity. Browsers (IE, FF, C) transform a \ into a / if directly typed in
 * ` should also be encoded everywhere because some browsers like FF encode it when directly written while others don't
 * Safari and IE don't encode "<>{}` in hash
 */
// const EXTRA_RESERVED_RE = /[!'()*]/g
// const encodeReservedReplacer = (c: string) => '%' + c.charCodeAt(0).toString(16)

const HASH_RE = /#/g // %23
const AMPERSAND_RE = /&/g // %26
const EQUAL_RE = /=/g // %3D
const IM_RE = /\?/g // %3F
const SLASH_RE = /\//g // %2F

const ENC_BRACKET_OPEN_RE = /%5B/g // [
const ENC_BRACKET_CLOSE_RE = /%5D/g // ]
const ENC_CARET_RE = /%5E/g // ^
const ENC_CURLY_OPEN_RE = /%7B/g // {
const ENC_PIPE_RE = /%7C/g // |
const ENC_CURLY_CLOSE_RE = /%7D/g // }
const ENC_BACKTICK_RE = /%60/g // `

function commonEncode(text: string): string {
  return encodeURI(text)
    .replace(ENC_PIPE_RE, '|')
    .replace(ENC_BRACKET_OPEN_RE, '[')
    .replace(ENC_BRACKET_CLOSE_RE, ']')
}

export function encodeHash(text: string): string {
  return commonEncode(text)
    .replace(ENC_CURLY_OPEN_RE, '{')
    .replace(ENC_CURLY_CLOSE_RE, '}')
    .replace(ENC_CARET_RE, '^')
}

export function encodeQueryProperty(text: string): string {
  return commonEncode(text)
    .replace(HASH_RE, '%23')
    .replace(AMPERSAND_RE, '%26')
    .replace(EQUAL_RE, '%3D')
    .replace(ENC_BACKTICK_RE, '`')
    .replace(ENC_CURLY_OPEN_RE, '{')
    .replace(ENC_CURLY_CLOSE_RE, '}')
    .replace(ENC_CARET_RE, '^')
}

export function encodeParam(text: string): string {
  return commonEncode(text)
    .replace(SLASH_RE, '%2F')
    .replace(HASH_RE, '%23')
    .replace(IM_RE, '%3F')
}

export const decode = decodeURIComponent
