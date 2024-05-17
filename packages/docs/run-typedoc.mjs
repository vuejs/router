import path from 'node:path'
import { createTypeDocApp } from './typedoc-markdown.mjs'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

createTypeDocApp({
  name: 'API Documentation',
  tsconfig: path.resolve(__dirname, './typedoc.tsconfig.json'),
  // entryPointStrategy: 'packages',
  categorizeByGroup: true,
  githubPages: false,
  disableSources: true,
  plugin: ['typedoc-plugin-markdown'],
  entryPoints: [path.resolve(__dirname, '../router/src/index.ts')],
}).then(app => app.build())
