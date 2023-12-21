import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://router.vuejs.org'
export const META_TITLE = 'Vue Router'
export const META_DESCRIPTION = 'مسیریاب رسمی برای Vue.js'

export const faConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
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
      text: 'پیشنهاد تغییرات در این صفحه',
    },

    nav: [
      // { text: 'Config', link: '/config/' },
      // { text: 'Plugins', link: '/plugins/' },
      {
        text: 'راهنما',
        link: '/fa/guide/',
        activeMatch: '^/fa/guide/',
      },
      { text: 'API', link: '/fa/api/', activeMatch: '^/fa/api/' },
      {
        text: 'v4.x',
        items: [{ text: 'v3.x', link: 'https://v3.router.vuejs.org/fa' }],
      },
      {
        text: 'پیوند‌ها',
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
            link: 'https://certification.vuejs.org/?friend=VUEROUTER',
          },
        ],
      },
    ],

    sidebar: {
      // catch-all fallback
      '/': [
        {
          text: 'آغاز',
          items: [
            {
              text: 'معرفی',
              link: '/fa/introduction.html',
            },
            {
              text: 'نصب',
              link: '/fa/installation.html',
            },
          ],
        },
        {
          text: 'الزامات',
          collapsible: false,
          items: [
            {
              text: 'شروع شدن',
              link: '/fa/guide/',
            },
            {
              text: 'تطبیق مسیر به صورت پویا',
              link: '/fa/guide/essentials/dynamic-matching.html',
            },
            {
              text: 'نحو تطبیق مسیرها',
              link: '/fa/guide/essentials/route-matching-syntax.html',
            },
            {
              text: 'مسیرهای تو در تو',
              link: '/fa/guide/essentials/nested-routes.html',
            },
            {
              text: 'مسیریابی به صورت برنامه‌ای',
              link: '/fa/guide/essentials/navigation.html',
            },
            {
              text: 'مسیرهای نام‌گذاری‌شده',
              link: '/fa/guide/essentials/named-routes.html',
            },
            {
              text: 'View های نام‌گذاری‌شده',
              link: '/fa/guide/essentials/named-views.html',
            },
            {
              text: 'ریدایرکت و مخفف',
              link: '/fa/guide/essentials/redirect-and-alias.html',
            },
            {
              text: 'ارسال پراپ‌ها به کامپوننت مسیرها',
              link: '/fa/guide/essentials/passing-props.html',
            },
            {
              text: 'حالت‌های متفاوت هیستوری',
              link: '/fa/guide/essentials/history-mode.html',
            },
          ],
        },
        {
          text: 'پیشرفته',
          collapsible: false,
          items: [
            {
              text: 'گاردهای مسیریابی',
              link: '/fa/guide/advanced/navigation-guards.html',
            },
            {
              text: 'فیلدهای متا',
              link: '/fa/guide/advanced/meta.html',
            },
            {
              text: 'واکشی داده (Data Fetching)',
              link: '/fa/guide/advanced/data-fetching.html',
            },
            {
              text: 'Composition API',
              link: '/fa/guide/advanced/composition-api.html',
            },
            {
              text: 'RouterView اسلات',
              link: '/fa/guide/advanced/router-view-slot.html',
            },
            {
              text: 'ترنزیشن‌ها',
              link: '/fa/guide/advanced/transitions.html',
            },
            {
              text: 'رفتار اسکرول',
              link: '/fa/guide/advanced/scroll-behavior.html',
            },
            {
              text: 'مسیرهای تنبل(Lazy Loading)',
              link: '/fa/guide/advanced/lazy-loading.html',
            },
            {
              text: 'مسیرهای تایپ‌گذاری‌شده',
              link: '/fa/guide/advanced/typed-routes.html',
            },
            {
              text: 'گسترش RouterLink',
              link: '/fa/guide/advanced/extending-router-link.html',
            },
            {
              text: 'خطاهای Navigation',
              link: '/fa/guide/advanced/navigation-failures.html',
            },
            {
              text: 'مسیریابی پویا',
              link: '/fa/guide/advanced/dynamic-routing.html',
            },
          ],
        },
        {
          items: [
            {
              text: 'مهاجرت از Vue 2',
              link: '/fa/guide/migration/index.html',
            },
          ],
        },
      ],

      '/fa/api/': [
        {
          text: 'packages',
          items: [{ text: 'vue-router', link: '/fa/api/' }],
        },
      ],
    },
  },
}
