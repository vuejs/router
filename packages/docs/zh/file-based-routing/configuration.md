# 配置

查看所有现有配置选项及其对应的**默认值**：

```ts
import VueRouter from 'vue-router/vite'

VueRouter({
  // 如何以及扫描哪些文件夹以查找文件
  routesFolder: [
    {
      src: 'src/pages',
      path: '',
      // 覆盖全局设置
      exclude: excluded => excluded,
      filePatterns: filePatterns => filePatterns,
      extensions: extensions => extensions,
    },
  ],

  // 哪些类型的文件应被视为页面
  extensions: ['.vue'],

  // 要包含哪些文件
  filePatterns: ['**/*'],

  // 要排除的文件
  exclude: [],

  // 生成的 d.ts 文件路径
  dts: './typed-router.d.ts',

  // 如何生成路由名称
  getRouteName: routeNode => getFileBasedRouteName(routeNode),

  // <route> 自定义块的默认语言
  routeBlockLang: 'json5',

  // 如何导入路由，也可以是字符串
  importMode: 'async',

  // 根目录
  root: process.cwd(),

  // 路径解析器的选项
  pathParser: {
    // `users.[id]` 应该被解析为 `users/:id` 吗？
    dotNesting: true,
  },

  // 单独修改路由
  async extendRoute(route) {
    // ...
  },

  // 在写入文件之前修改路由
  async beforeWriteFiles(rootRoute) {
    // ...
  },
})
```

## SSR

可能需要在 `vite.config.js` 的开发模式下将 `vue-router` 标记为 `noExternal`：

```ts{7}
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'

export default defineConfig(({ mode }) => ({
  ssr: {
    noExternal: mode === 'development' ? ['vue-router'] : [],
  },
  plugins: [VueRouter(), Vue()],
}))
```
