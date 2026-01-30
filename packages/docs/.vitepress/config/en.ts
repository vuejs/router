import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import typedocSidebar from '../../api/typedoc-sidebar.json'

export const META_URL = 'https://router.vuejs.org'
export const META_TITLE = 'Vue Router'
export const META_DESCRIPTION = 'The official Router for Vue.js'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: META_DESCRIPTION,
  head: [
    ['meta', { property: 'og:url', content: META_URL }],
    ['meta', { property: 'og:description', content: META_DESCRIPTION }],
    ['meta', { property: 'twitter:url', content: META_URL }],
    ['meta', { property: 'twitter:title', content: META_TITLE }],
    ['meta', { property: 'twitter:description', content: META_DESCRIPTION }],
  ],

  themeConfig: {
    editLink: {
      pattern: 'https://github.com/vuejs/router/edit/main/packages/docs/:path',
      text: 'Suggest changes to this page',
    },

    nav: [
      // { text: 'Config', link: '/config/' },
      // { text: 'Plugins', link: '/plugins/' },
      {
        text: 'Guide',
        link: '/guide/',
        activeMatch: '^/guide/',
      },
      { text: 'API', link: '/api/', activeMatch: '^/api/' },
      {
        text: 'v4.x/v5.x',
        items: [{ text: 'v3.x', link: 'https://v3.router.vuejs.org' }],
      },
      {
        text: 'Links',
        items: [
          {
            text: 'Discussions',
            link: 'https://github.com/vuejs/router/discussions',
          },
          {
            text: 'Changelog',
            link: 'https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md',
          },
          {
            text: 'Vue.js Certification',
            link: 'https://certificates.dev/vuejs/?friend=VUEROUTER&utm_source=router_vuejs&utm_medium=link&utm_campaign=router_vuejs_links&utm_content=navbar',
          },
        ],
      },
    ],

    sidebar: {
      '/api/': [
        {
          text: 'API',
          items: typedocSidebar,
        },
      ],
      // catch-all fallback
      '/': [
        {
          text: 'Setup',
          items: [
            {
              text: 'Introduction',
              link: '/introduction.html',
            },
            {
              text: 'Installation',
              link: '/installation.html',
            },
          ],
        },
        {
          text: 'Essentials',
          items: [
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
              text: 'Named Routes',
              link: '/guide/essentials/named-routes.html',
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
              text: 'Active links',
              link: '/guide/essentials/active-links.html',
            },
            {
              text: 'Different History modes',
              link: '/guide/essentials/history-mode.html',
            },
          ],
        },
        {
          text: 'Advanced',
          items: [
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
              text: 'RouterView slot',
              link: '/guide/advanced/router-view-slot.html',
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
              text: 'Typed Routes',
              link: '/guide/advanced/typed-routes.html',
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
        sidebarDataLoaders(),
        {
          text: 'Migration',
          items: [
            {
              text: 'Migrating to v5',
              link: '/guide/migration/v4-to-v5.html',
            },
            {
              text: 'Migrating from Vue 2',
              link: '/guide/migration/index.html',
            },
          ],
        },
      ],
    },
  },
}

type SidebarGroup = DefaultTheme.SidebarItem

function sidebarDataLoaders(): SidebarGroup {
  return {
    collapsed: false,
    text: 'Data Loaders',
    items: [
      {
        text: 'Introduction',
        link: '/data-loaders/',
      },
      {
        text: 'Defining Data Loaders',
        link: '/data-loaders/defining-loaders',
      },
      {
        text: 'Reloading data',
        link: '/data-loaders/reloading-data',
      },
      {
        text: 'Navigation Aware',
        link: '/data-loaders/navigation-aware',
      },
      {
        text: 'Error Handling',
        link: '/data-loaders/error-handling',
      },
      {
        text: 'Organizing Loaders',
        link: '/data-loaders/organization',
      },
      {
        text: 'Nested Loaders',
        link: '/data-loaders/nested-loaders',
      },
      {
        text: 'Cancelling a load',
        link: '/data-loaders/load-cancellation',
      },
      {
        text: 'Nuxt',
        link: '/data-loaders/nuxt',
      },
      {
        text: 'SSR',
        link: '/data-loaders/ssr',
      },

      // loaders
      {
        text: 'Basic Loader',
        link: '/data-loaders/basic/',
      },
      {
        text: 'Colada Loader',
        link: '/data-loaders/colada/',
      },

      // last
      {
        text: 'RFC',
        link: '/data-loaders/rfc',
      },
    ],
  }
}
