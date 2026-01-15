import { describe, expect, it } from 'vitest'
import { createRoutesContext } from '../../src/unplugin/core/context'
import { resolveOptions } from '../../src/unplugin/options'
import { fileURLToPath, URL } from 'node:url'
import { normalize, join } from 'pathe'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

/**
 * This is a simple full test to check that all filenames are valid in
 * different environment (windows, mac, linux).
 */

describe('e2e routes', () => {
  it('generates the routes', async () => {
    const context = createRoutesContext(
      resolveOptions({
        // dts: join(__dirname, './.types/__types.d.ts'),
        dts: false,
        logs: false,
        watch: false,
        routesFolder: [{ src: join(__dirname, './fixtures/filenames/routes') }],
      })
    )

    await context.scanPages()
    expect(
      context
        .generateRoutes()
        .replace(
          /import\(["'](.+?)["']\)/g,
          (_, filePath) => `import('${normalize(filePath)}')`
        )
        .replace(/(import\(["'])(?:.+?)fixtures\/filenames/gi, '$1')
    ).toMatchSnapshot()
  })

  it.skip('works with mixed extensions', async () => {
    const context = createRoutesContext(
      resolveOptions({
        dts: false,
        logs: false,
        watch: false,
        routesFolder: [
          {
            src: join(__dirname, './fixtures/filenames/multi-extensions'),
            exclude: join(
              __dirname,
              './fixtures/filenames/multi-extensions/docs'
            ),
          },
          {
            src: join(__dirname, './fixtures/filenames/multi-extensions/docs'),
            extensions: ['.md', '.vue'],
            path: 'docs/[lang]/',
          },
        ],
      })
    )

    await context.scanPages()
    expect(
      context
        .generateRoutes()
        .replace(
          /import\(["'](.+?)["']\)/g,
          (_, filePath) => `import('${normalize(filePath)}')`
        )
        .replace(/(import\(["'])(?:.+?)fixtures\/filenames/gi, '$1')
    ).toMatchSnapshot()
  })
})
