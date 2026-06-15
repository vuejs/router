import type { SFCBlock } from '@vue/compiler-sfc'
import { parse as parseSFC } from '@vue/compiler-sfc'
import type { ResolvedOptions } from '../options'
import JSON5 from 'json5'
import { parse as parseYaml } from 'yaml'
import { diagnostics } from '../diagnostics'
import type { DefinePageQueryParamOptions } from '../../experimental/runtime'
import type { RouteRecordRaw } from '../../types'

export function getRouteBlock(
  path: string,
  content: string,
  options: ResolvedOptions
) {
  const parsedSFC = parseSFC(content, { pad: 'space' }).descriptor
  const blockStr = parsedSFC?.customBlocks.find(b => b.type === 'route')

  if (blockStr) return parseCustomBlock(blockStr, path, options)
}

export interface CustomRouteBlock extends Partial<
  Omit<
    RouteRecordRaw,
    'components' | 'component' | 'children' | 'beforeEnter' | 'name' | 'alias'
  >
> {
  name?: string | undefined | false

  alias?: string[]

  params?: {
    /**
     * Override the parser for a given path param. Set to `null` to remove a
     * filename-based parser (e.g. revert `[id=int]` back to no parser).
     */
    path?: Record<string, string | null>

    /**
     * Declare query params for the route. The value is either a parser name
     * or an options object with `parser`, `format`, `default`, and `required`.
     */
    query?: Record<string, string | CustomRouteBlockQueryParamOptions>
  }
}

export interface CustomRouteBlockQueryParamOptions {
  parser?: string
  format?: DefinePageQueryParamOptions['format']
  // TODO: queryKey?: string
  default?: string
  required?: boolean
}

function parseCustomBlock(
  block: SFCBlock,
  filePath: string,
  options: ResolvedOptions
): CustomRouteBlock | void {
  const lang = block.lang ?? options.routeBlockLang

  if (lang === 'json5') {
    try {
      return JSON5.parse(block.content)
    } catch (err: any) {
      diagnostics.VR_B0012({
        type: block.type,
        filePath,
        message: err.message,
      })
    }
  } else if (lang === 'json') {
    try {
      return JSON.parse(block.content)
    } catch (err: any) {
      diagnostics.VR_B0013({
        type: block.type,
        filePath,
        message: err.message,
      })
    }
  } else if (lang === 'yaml' || lang === 'yml') {
    try {
      return parseYaml(block.content)
    } catch (err: any) {
      diagnostics.VR_B0014({
        type: block.type,
        filePath,
        message: err.message,
      })
    }
  } else {
    diagnostics.VR_B0015({ lang, type: block.type, filePath })
  }
}
