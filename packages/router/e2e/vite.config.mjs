// these are require syntax
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, join, dirname } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import history from 'connect-history-api-fallback'
// and these are the same with import

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {string[]} */
const examples = []
fs.readdirSync(__dirname).forEach(dir => {
  const fullDir = join(__dirname, dir)
  const entry = join(fullDir, 'index.ts')
  if (fs.statSync(fullDir).isDirectory() && fs.existsSync(entry)) {
    examples.push(dir)
  }
})

// https://vitejs.dev/config/
/**
 *
 * @param {Record<string, string>} env
 * @returns
 */
const config = env => {
  return defineConfig({
    root: resolve(__dirname),
    resolve: {
      alias: {
        vue: resolve(__dirname, '../node_modules/vue/dist/vue.esm-bundler.js'),
        'vue-router': join(__dirname, '..', 'src'),
      },
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: ['.ts', '.tsx', '.js', '.vue'],
    },
    build: {
      outDir: join(__dirname, '__build__'),
      // publicPath: '/',
      rollupOptions: {
        output: {
          file: '[name].js',
          chunkFileNames: '[id].chunk.js',
        },
        plugins: [],
        input: examples.reduce(
          (entries, name) => {
            entries[name] = resolve(__dirname, name, 'index.html')
            return entries
          },
          /** @type {Record<string, string>} */
          { index: resolve(__dirname, 'index.html') }
        ),
      },
    },
    plugins: [
      vue(),
      {
        name: 'custom history',
        configureServer({ middlewares }) {
          middlewares.use(
            history({
              // verbose: true,
              rewrites: [
                ...examples.map(name => ({
                  from: new RegExp(`^/${name}/.*$`),
                  to({ parsedUrl }) {
                    // console.log('checking for', parsedUrl.pathname)
                    const filePath = join(__dirname, parsedUrl.pathname)
                    if (
                      fs.existsSync(filePath) &&
                      !fs.statSync(filePath).isDirectory()
                    ) {
                      // console.log('\t', parsedUrl.pathname)
                      return parsedUrl.pathname
                    } else {
                      // console.log('\t', `/${name}/index.html`)
                      return `/${name}/index.html`
                    }
                  },
                  // to: `/${name}/index.html`,
                })),
                {
                  from: /^\/@.*$/,
                  to({ parsedUrl }) {
                    // console.log('bypassing', parsedUrl.pathname, parsedUrl.href)
                    return parsedUrl.href
                  },
                },
              ],
            })
          )
        },
      },
    ],
    define: {
      __DEV__: JSON.stringify(!env.prod),
      __CI__: JSON.stringify(process.env.CI || false),
      __BROWSER__: 'true',
      'process.env': {
        NODE_ENV: JSON.stringify(env.prod ? 'production' : 'development'),
      },
    },
  })
}

export default config
