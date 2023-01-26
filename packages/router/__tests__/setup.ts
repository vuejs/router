import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
// @ts-expect-error: ok
global.TextDecoder = TextDecoder
