import { defineConfig, UserConfig } from 'vitepress'

const head: UserConfig['head'] = [
  ['link', { rel: 'icon', href: `/logo.png` }],
  [
    'meta',
    { name: 'wwads-cn-verify', content: '7e7757b1e12abcb736ab9a754ffb617a' },
  ],
]

if (process.env.NODE_ENV === 'production') {
  head.push([
    'script',
    {
      src: 'https://unpkg.com/thesemetrics@latest',
      async: '',
    },
  ])
}

const config = defineConfig({
  lang: 'en-US',
  title: 'Vue Router',
  description: 'The official router for Vue.js.',
  head,
  // serviceWorker: true,

  locales: {
    '/': {
      lang: 'en-US',
      title: 'Vue Router',
      description: 'The official router for Vue.js.',
    },
    '/zh/': {
      lang: 'zh-CN',
      title: 'Vue Router',
      description: 'Vue.js 的官方路由',
    },
  },

  themeConfig: {
    repo: 'vuejs/router',
    docsRepo: 'vuejs/router',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    editLinkText: 'Suggest changes to this page',

    carbonAds: {
      carbon: 'CEBICK3I',
      custom: 'CEBICK3M',
      placement: 'routervuejsorg',
    },

    algolia: {
      apiKey: '07ed552fc16926cc57c9eb0862c1a7f9',
      // TODO: upgrade this once it works
      // appId: 'BTNTW3I1XP',
      // apiKey: '771d10c8c5cc48f7922f15048b4d931c',
      indexName: 'next_router_vuejs',
      // searchParameters: {
      //   facetFilters: ['tags:guide,api,migration'],
      // },
    },

    locales: {
      // English
      '/': {
        label: 'English',
        selectText: 'Languages',
        nav: [
          {
            text: 'Guide',
            link: '/guide/',
          },
          {
            text: 'API Reference',
            link: '/api/',
          },
          {
            text: 'v4.x',
            items: [{ text: 'v3.x', link: 'https://router.vuejs.org' }],
          },
          {
            text: 'Changelog',
            link: 'https://github.com/vuejs/router/blob/main/CHANGELOG.md',
          },
        ],

        sidebar: [
          {
            text: 'Introduction',
            link: '/introduction.html',
          },
          {
            text: 'Installation',
            link: '/installation.html',
          },
          {
            text: 'Essentials',
            collapsable: false,
            children: [
              {
                text: 'Getting Started',
                link: '/guide/',
              },
              {
                text: 'Dynamic Route Matching',
                link: '/guide/essentials/dynamic-matching.html',
              },
              {
                text: "Routes' Matching Syntax",
                link: '/guide/essentials/route-matching-syntax.html',
              },
              {
                text: 'Nested Routes',
                link: '/guide/essentials/nested-routes.html',
              },
              {
                text: 'Programmatic Navigation',
                link: '/guide/essentials/navigation.html',
              },
              {
                text: 'Named Routes',
                link: '/guide/essentials/named-routes.html',
              },
              {
                text: 'Named Views',
                link: '/guide/essentials/named-views.html',
              },
              {
                text: 'Redirect and Alias',
                link: '/guide/essentials/redirect-and-alias.html',
              },
              {
                text: 'Passing Props to Route Components',
                link: '/guide/essentials/passing-props.html',
              },
              {
                text: 'Different History modes',
                link: '/guide/essentials/history-mode.html',
              },
            ],
          },
          {
            text: 'Advanced',
            collapsable: false,
            children: [
              {
                text: 'Navigation guards',
                link: '/guide/advanced/navigation-guards.html',
              },
              {
                text: 'Route Meta Fields',
                link: '/guide/advanced/meta.html',
              },
              {
                text: 'Data Fetching',
                link: '/guide/advanced/data-fetching.html',
              },
              {
                text: 'Composition API',
                link: '/guide/advanced/composition-api.html',
              },
              {
                text: 'Transitions',
                link: '/guide/advanced/transitions.html',
              },
              {
                text: 'Scroll Behavior',
                link: '/guide/advanced/scroll-behavior.html',
              },
              {
                text: 'Lazy Loading Routes',
                link: '/guide/advanced/lazy-loading.html',
              },
              {
                text: 'Extending RouterLink',
                link: '/guide/advanced/extending-router-link.html',
              },
              {
                text: 'Navigation Failures',
                link: '/guide/advanced/navigation-failures.html',
              },
              {
                text: 'Dynamic Routing',
                link: '/guide/advanced/dynamic-routing.html',
              },
            ],
          },
          {
            text: 'Migrating from Vue 2',
            link: '/guide/migration/index.html',
          },
        ],
      },
      // 简体中文
      '/zh/': {
        label: '中文',
        selectText: '选择语言',
        nav: [
          {
            text: '教程',
            link: '/zh/guide/',
          },
          {
            text: 'API 参考',
            link: '/zh/api/',
          },
          {
            text: 'v4.x',
            items: [{ text: 'v3.x', link: 'https://router.vuejs.org/zh' }],
          },
          {
            text: '更新日志',
            link: 'https://github.com/vuejs/router/blob/main/CHANGELOG.md',
          },
        ],

        sidebar: [
          {
            text: '介绍',
            link: '/zh/introduction.html',
          },
          {
            text: '安装',
            link: '/zh/installation.html',
          },
          {
            text: '基础',
            collapsable: false,
            children: [
              {
                text: '入门',
                link: '/zh/guide/',
              },
              {
                text: '动态路由匹配',
                link: '/zh/guide/essentials/dynamic-matching.html',
              },
              {
                text: '路由的匹配语法',
                link: '/zh/guide/essentials/route-matching-syntax.html',
              },
              {
                text: '嵌套路由',
                link: '/zh/guide/essentials/nested-routes.html',
              },
              {
                text: '编程式导航',
                link: '/zh/guide/essentials/navigation.html',
              },
              {
                text: '命名路由',
                link: '/zh/guide/essentials/named-routes.html',
              },
              {
                text: '命名视图',
                link: '/zh/guide/essentials/named-views.html',
              },
              {
                text: '重定向和别名',
                link: '/zh/guide/essentials/redirect-and-alias.html',
              },
              {
                text: '路由组件传参',
                link: '/zh/guide/essentials/passing-props.html',
              },
              {
                text: '不同的历史记录模式',
                link: '/zh/guide/essentials/history-mode.html',
              },
            ],
          },
          {
            text: '进阶',
            collapsable: false,
            children: [
              {
                text: '导航守卫',
                link: '/zh/guide/advanced/navigation-guards.html',
              },
              {
                text: '路由元信息',
                link: '/zh/guide/advanced/meta.html',
              },
              {
                text: '数据获取',
                link: '/zh/guide/advanced/data-fetching.html',
              },
              {
                text: '组合式 API',
                link: '/zh/guide/advanced/composition-api.html',
              },
              {
                text: '过渡动效',
                link: '/zh/guide/advanced/transitions.html',
              },
              {
                text: '滚动行为',
                link: '/zh/guide/advanced/scroll-behavior.html',
              },
              {
                text: '路由懒加载',
                link: '/zh/guide/advanced/lazy-loading.html',
              },
              {
                text: '扩展 RouterLink',
                link: '/zh/guide/advanced/extending-router-link.html',
              },
              {
                text: '导航故障',
                link: '/zh/guide/advanced/navigation-failures.html',
              },
              {
                text: '动态路由',
                link: '/zh/guide/advanced/dynamic-routing.html',
              },
            ],
          },
          {
            text: '从 Vue2 迁移',
            link: '/zh/guide/migration/index.html',
          },
        ],
      },
    },
  },
})

export default config
