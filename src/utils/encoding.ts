import { warn } from 'vue'

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

const RE_MAP = {
  '#': /#/g,
  '&': /&/g,
  '/': /\//g,
  '=': /=/g,
  '?': /\?/g,
}

const ENC_RE_MAP = {
  '[': /%5B/g,
  ']': /%5D/g,
  '^': /%5E/g,
  '`': /%60/g,
  '{': /%7B/g,
  '|': /%7C/g,
  '}': /%7D/g,
}
const ENC_MAP = {
  '#': '%23',
  '&': '%26',
  '/': '%2F',
  '=': '%3D',
  '?': '%3F',
}

function commonEncode(text: string | number): string {
  return encodeURI('' + text)
    .replace(ENC_RE_MAP['|'], '|')
    .replace(ENC_RE_MAP['['], '[')
    .replace(ENC_RE_MAP[']'], ']')
}

export function encodeHash(text: string): string {
  return commonEncode(text)
    .replace(ENC_RE_MAP['{'], '{')
    .replace(ENC_RE_MAP['}'], '}')
    .replace(ENC_RE_MAP['^'], '^')
}

export function encodeQueryProperty(text: string | number): string {
  return commonEncode(text)
    .replace(RE_MAP['#'], ENC_MAP['#'])
    .replace(RE_MAP['&'], ENC_MAP['&'])
    .replace(RE_MAP['='], ENC_MAP['='])
    .replace(ENC_RE_MAP['`'], '`')
    .replace(ENC_RE_MAP['{'], '{')
    .replace(ENC_RE_MAP['}'], '}')
    .replace(ENC_RE_MAP['^'], '^')
}

export function encodePath(text: string): string {
  return commonEncode(text)
    .replace(RE_MAP['#'], ENC_MAP['#'])
    .replace(RE_MAP['?'], ENC_MAP['?'])
}

export function encodeParam(text: string): string {
  return encodePath(text)
    .replace(RE_MAP['/'], ENC_MAP['/'])
}

export function decode(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch (err) {
    __DEV__ && warn(`Error decoding "${text}". Using original value`)
  }
  return text
}
