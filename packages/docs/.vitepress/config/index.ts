import { defineConfig } from 'vitepress'
import { enConfig } from './en'
import { sharedConfig } from './shared'
import { zhConfig } from './zh'

export default defineConfig({
  ...sharedConfig,

  locales: {
    root: { label: 'English', lang: 'en-US', link: '/', ...enConfig },
    zh: { label: '简体中文', lang: 'zh-CN', link: '/zh/', ...zhConfig },
    ko: { label: '한국어', lang: 'ko-KR', link: 'https://router.vuejs.kr/' },
    pt: { label: 'Português', lang: 'pt-PT', link: 'https://vue-router-docs-pt.netlify.app/' },
    ru: { label: 'Русский', lang: 'ru-RU', link: 'https://vue-router-ru.netlify.app' },
  },
})
