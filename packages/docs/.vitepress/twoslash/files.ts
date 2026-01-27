import fs from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const apiCode = fs.readFileSync(join(__dirname, './code/api.ts'), 'utf-8')

export const usersLoaderCode = `
import { defineBasicLoader } from 'vue-router/experimental'

${apiCode}

export const useUserData = defineBasicLoader((route) => getUserById(route.params.id as string))
export const useUserList = defineBasicLoader(() => getUserList())

export { User, getUserById, getUserList }
`

export const extraFiles = {
  '@/stores/index.ts': fs.readFileSync(
    join(__dirname, './code/stores.ts'),
    'utf-8'
  ),

  'shims-vue.d.ts': `
declare module '*.vue' {
  import { defineComponent } from 'vue'
  export default defineComponent({})
}
`.trimStart(),

  // 'router.ts': typedRouterFileAsModule,
  'typed-router.d.ts': fs.readFileSync(
    join(__dirname, './code/typed-router.ts'),
    'utf-8'
  ),
  'api/index.ts': apiCode,
  '../api/index.ts': apiCode,
  'loaders/users.ts': usersLoaderCode,
}
