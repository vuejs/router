import { h } from 'vue'
import { Theme, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import AsideSponsors from './components/AsideSponsors.vue'
// import HomeSponsors from './components/HomeSponsors.vue'
// TODO: props
import TranslationStatus from 'vitepress-translation-helper/ui/TranslationStatus.vue'
import './styles/vars.css'
import './styles/sponsors.css'
import VueSchoolLink from './components/VueSchoolLink.vue'
import VueMasteryLogoLink from './components/VueMasteryLogoLink.vue'
import VueMasteryBanner from './components/VueMasteryBanner.vue'
import status from '../translation-status.json'

const i18nLabels = {
  zh: '该翻译已同步到了 ${date} 的版本，其对应的 commit hash 是 <code>${hash}</code>。',
}

const theme: Theme = {
  ...DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 'home-features-after': () => h(HomeSponsors),
      'aside-ads-before': () => h(AsideSponsors),
      'doc-before': () => h(TranslationStatus, { status, i18nLabels }),
      'layout-top': () => h(VueMasteryBanner),
    })
  },

  enhanceApp({ app }) {
    app.component('VueSchoolLink', VueSchoolLink)
    app.component('VueMasteryLogoLink', VueMasteryLogoLink)
  },

  // TODO: real date
  // setup() {
  //   const { lang } = useData()
  //   watchEffect(() => {
  //     if (typeof document !== 'undefined') {
  //       document.cookie = `nf_lang=${lang.value}; expires=Sun, 1 Jan 2023 00:00:00 UTC; path=/`
  //     }
  //   })
  // },
}

export default theme
