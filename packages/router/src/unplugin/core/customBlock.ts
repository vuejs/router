import { SFCBlock, parse as parseSFC } from '@vue/compiler-sfc'
import { ResolvedOptions } from '../options'
import JSON5 from 'json5'
import { parse as parseYaml } from 'yaml'
import { warn } from './utils'
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
    path?: Record<string, string>

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
      warn(
        `Invalid JSON5 format of <${block.type}> content in ${filePath}\n${err.message}`
      )
    }
  } else if (lang === 'json') {
    try {
      return JSON.parse(block.content)
    } catch (err: any) {
      warn(
        `Invalid JSON format of <${block.type}> content in ${filePath}\n${err.message}`
      )
    }
  } else if (lang === 'yaml' || lang === 'yml') {
    try {
      return parseYaml(block.content)
    } catch (err: any) {
      warn(
        `Invalid YAML format of <${block.type}> content in ${filePath}\n${err.message}`
      )
    }
  } else {
    warn(
      `Language "${lang}" for <${block.type}> is not supported. Supported languages are: json5, json, yaml, yml. Found in in ${filePath}.`
    )
  }
}
