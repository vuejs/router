/** @type {import('vitepress').UserConfig} */
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
          { link: '/', text: 'Introduction' },
          { link: '/installation', text: 'Installation' },
          {
            text: 'Essentials',
            collapsable: false,
            children: [
              { link: '/guide/', text: 'Getting Started' },
              {
                link: '/guide/essentials/dynamic-matching',
                text: 'Dynamic Route Matching',
              },
              {
                link: '/guide/essentials/nested-routes',
                text: 'Nested Routes',
              },
              {
                link: '/guide/essentials/navigation',
                text: 'Programmatic Navigation',
              },
              {
                link: '/guide/essentials/named-routes',
                text: 'Named Routes',
              },
              {
                link: '/guide/essentials/named-views',
                text: 'Named Views',
              },
              {
                link: '/guide/essentials/redirect-and-alias',
                text: 'Redirect and Alias',
              },
              {
                link: '/guide/essentials/passing-props',
                text: 'Passing Props to Route Components',
              },
              {
                link: '/guide/essentials/history-mode',
                text: 'Different History modes',
              },
            ],
          },
          {
            text: 'Advanced',
            collapsable: false,
            children: [
              {
                link: '/guide/advanced/navigation-guards',
                text: 'Navigation guards',
              },
              { link: '/guide/advanced/meta', text: 'Route Meta Fields' },
              {
                link: '/guide/advanced/data-fetching',
                text: 'Data Fetching',
              },
              {
                link: '/guide/advanced/composition-api',
                text: 'Composition API',
              },
              {
                link: '/guide/advanced/transitions',
                text: 'Transitions',
              },
              {
                link: '/guide/advanced/scroll-behavior',
                text: 'Scroll Behavior',
              },
              {
                link: '/guide/advanced/lazy-loading',
                text: 'Lazy Loading Routes',
              },
              {
                link: '/guide/advanced/extending-router-link',
                text: 'Extending RouterLink',
              },
              {
                link: '/guide/advanced/navigation-failures',
                text: 'Navigation Failures',
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
