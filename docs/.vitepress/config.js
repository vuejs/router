/** @typedef {import('vitepress').UserConfig} UserConfig */

/** @type {UserConfig['head']} */
const head = []

if (process.env.NODE_ENV === 'production') {
  head.push([
    'script',
    {
      src: 'https://unpkg.com/thesemetrics@latest',
      async: '',
    },
  ])
}

/** @type {UserConfig} */
const config = {
  lang: 'en-US',
  title: 'Vue Router',
  description: 'The official router for Vue.js.',
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Vue Router',
      description: 'The official router for Vue.js.',
    },
    '/es/': {
      lang: 'es-ES',
      title: 'Vue Router',
      description: 'El router oficial par Vue.js',
    },
  },
  head,
  // serviceWorker: true,
  themeConfig: {
    // algolia: {
    //   apiKey: 'f854bb46d3de7eeb921a3b9173bd0d4c',
    //   indexName: 'vue-router-next',
    // },

    repo: 'vuejs/vue-router-next',
    docsRepo: 'vuejs/vue-router-next',
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,

    carbonAds: {
      carbon: 'CEBICK3I',
      custom: 'CEBICK3M',
      placement: 'routervuejsorg',
    },

    algolia: {
      apiKey: '07ed552fc16926cc57c9eb0862c1a7f9',
      indexName: 'next_router_vuejs',
      algoliaOptions: { facetFilters: ['tags:$TAGS'] },
    },

    locales: {
      // English
      '/': {
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
            text: 'Changelog',
            link:
              'https://github.com/vuejs/vue-router-next/blob/master/CHANGELOG.md',
          },
        ],

        sidebar: [
          {
            text: 'Introduction',
            link: '/',
          },
          {
            text: 'Installation',
            link: '/installation',
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
                link: '/guide/essentials/dynamic-matching',
              },
              {
                text: "Routes' Matching Syntax",
                link: '/guide/essentials/route-matching-syntax',
              },
              {
                text: 'Nested Routes',
                link: '/guide/essentials/nested-routes',
              },
              {
                text: 'Programmatic Navigation',
                link: '/guide/essentials/navigation',
              },
              {
                text: 'Named Routes',
                link: '/guide/essentials/named-routes',
              },
              {
                text: 'Named Views',
                link: '/guide/essentials/named-views',
              },
              {
                text: 'Redirect and Alias',
                link: '/guide/essentials/redirect-and-alias',
              },
              {
                text: 'Passing Props to Route Components',
                link: '/guide/essentials/passing-props',
              },
              {
                text: 'Different History modes',
                link: '/guide/essentials/history-mode',
              },
            ],
          },
          {
            text: 'Advanced',
            collapsable: false,
            children: [
              {
                text: 'Navigation guards',
                link: '/guide/advanced/navigation-guards',
              },
              {
                text: 'Route Meta Fields',
                link: '/guide/advanced/meta',
              },
              {
                text: 'Data Fetching',
                link: '/guide/advanced/data-fetching',
              },
              {
                text: 'Composition API',
                link: '/guide/advanced/composition-api',
              },
              {
                text: 'Transitions',
                link: '/guide/advanced/transitions',
              },
              {
                text: 'Scroll Behavior',
                link: '/guide/advanced/scroll-behavior',
              },
              {
                text: 'Lazy Loading Routes',
                link: '/guide/advanced/lazy-loading',
              },
              {
                text: 'Extending RouterLink',
                link: '/guide/advanced/extending-router-link',
              },
              {
                text: 'Navigation Failures',
                link: '/guide/advanced/navigation-failures',
              },
            ],
          },
          {
            text: 'Migrating from Vue 2',
            link: '/guide/migration/',
          },
        ],
      },
    },

    '/es/': {
      nav: [
        {
          text: 'Guía',
          link: '/guide/',
        },
        {
          text: 'API',
          link: '/api/',
        },
        {
          text: 'Cambios',
          link:
            'https://github.com/vuejs/vue-router-next/blob/master/CHANGELOG.md',
        },
      ],
    },
  },
}

module.exports = config
