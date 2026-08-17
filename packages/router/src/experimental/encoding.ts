import { commonEncode } from '../encoding'

// identical to the legacy encoding, re-exported so experimental code has a
// single entry point and no duplicated code in the bundle
export {
  commonEncode,
  decode,
  encodeParam,
  encodePath,
  encodeQueryKey,
  encodeQueryValue,
  PLUS_RE,
  SLASH_RE,
} from '../encoding'

const ENC_PERCENT_RE = /%25/g // %
const ENC_CARET_RE = /%5E/g // ^
const ENC_CURLY_OPEN_RE = /%7B/g // {
const ENC_CURLY_CLOSE_RE = /%7D/g // }

/**
 * Encode characters that need to be encoded on the hash section of the URL.
 * Like setting `url.hash`: existing percent encoded sequences and lone `%` are
 * kept as they are, which makes this function idempotent and never decoding.
 *
 * @param text - string to encode
 * @returns encoded string
 */
export function encodeHash(text: string): string {
  return (
    commonEncode(text)
      // restore every original %, so pre-encoded sequences pass through
      .replace(ENC_PERCENT_RE, '%')
      .replace(ENC_CURLY_OPEN_RE, '{')
      .replace(ENC_CURLY_CLOSE_RE, '}')
      .replace(ENC_CARET_RE, '^')
  )
}
