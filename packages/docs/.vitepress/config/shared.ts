import { defineConfig, HeadConfig } from 'vitepress'
import { zhSearch } from './zh'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { ModuleResolutionKind } from 'typescript'
// TODO: simplify and only importwm from '../twoslash/files'
import { typedRouterFileAsModule } from '../twoslash-files'
import { extraFiles } from '../twoslash/files'
import llmstxt from 'vitepress-plugin-llms'

// TODO:
// export const META_IMAGE = 'https://router.vuejs.org/social.png'
export const META_IMAGE = null
export const isProduction =
  process.env.NETLIFY && process.env.CONTEXT === 'production'

if (process.env.NETLIFY) {
  console.log('Netlify build', process.env.CONTEXT)
}

const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[\u0300-\u036F]/g

/**
 * Default slugification function
 */
export const slugify = (str: string): string =>
  str
    .normalize('NFKD')
    // Remove accents
    .replace(rCombining, '')
    // Remove control characters
    .replace(rControl, '')
    // Replace special characters
    .replace(rSpecial, '-')
    // ensure it doesn't start with a number
    .replace(/^(\d)/, '_$1')

const productionHead: HeadConfig[] = [
  [
    'script',
    {
      src: 'https://cdn.usefathom.com/script.js',
      'data-site': 'RENJQDQI',
      'data-spa': 'auto',
      defer: '',
    },
  ],
]

export const sharedConfig = defineConfig({
  title: 'Vue Router',
  appearance: 'dark',

  sitemap: {
    hostname: 'https://router.vuejs.org',
  },

  markdown: {
    theme: {
      dark: 'one-dark-pro',
      light: 'github-light',
    },

    attrs: {
      leftDelimiter: '%{',
      rightDelimiter: '}%',
    },

    anchor: {
      slugify,
    },
    config: md => {
      md.use(groupIconMdPlugin)
    },
    codeTransformers: [
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            moduleResolution: ModuleResolutionKind.Bundler,
          },
          extraFiles: {
            ...extraFiles,
            'router.ts': typedRouterFileAsModule,
            // 'typed-router.d.ts': typedRouterFile,
          },
        },
      }),
    ],
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],

    [
      'meta',
      { name: 'wwads-cn-verify', content: '7e7757b1e12abcb736ab9a754ffb617a' },
    ],

    [
      'meta',
      {
        property: 'og:type',
        content: 'website',
      },
    ],

    [
      'meta',
      {
        property: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    // [
    //   'meta',
    //   {
    //     property: 'twitter:image',
    //     content: META_IMAGE,
    //   },
    // ],

    // Vue School Top banner
    [
      'script',
      {
        src: 'https://media.bitterbrains.com/main.js?from=vuerouter&type=top',
        // @ts-expect-error: vitepress bug
        async: true,
        type: 'text/javascript',
      },
    ],

    // analytics and other prod only head tags
    ...(isProduction ? productionHead : []),
  ],

  themeConfig: {
    logo: '/logo.svg',
    outline: [2, 3],

    socialLinks: [
      { icon: 'x', link: 'https://twitter.com/posva' },
      {
        icon: 'github',
        link: 'https://github.com/vuejs/router',
      },
      {
        icon: 'discord',
        link: 'https://chat.vuejs.org',
      },
    ],

    footer: {
      copyright: 'Copyright © 2014-present Evan You, Eduardo San Martin Morote',
      message: 'Released under the MIT License.',
    },

    editLink: {
      pattern: 'https://github.com/vuejs/router/edit/main/packages/docs/:path',
      text: 'Suggest changes',
    },

    search: {
      provider: 'algolia',
      options: {
        appId: 'BTNTW3I1XP',
        apiKey: '771d10c8c5cc48f7922f15048b4d931c',
        indexName: 'next_router_vuejs',
        locales: { ...zhSearch },
      },
    },

    carbonAds: {
      code: 'CEBICK3I',
      // custom: 'CEBICK3M',
      placement: 'routervuejsorg',
    },
  },
  vite: {
    plugins: [
      groupIconVitePlugin(),
      // TODO: write a proper llms.txt
      llmstxt({
        description: 'The official Router for Vue.js',
        details: `
- Type Safe routes
- File based routing
- Data Loaders for efficient data fetching
`.trim(),
        ignoreFiles: ['index.md', 'api/**/*', 'zh/**/*'],
      }),
    ],
  },
})
