import DefaultTheme from 'vitepress/dist/client/theme-default'
import Layout from './Layout.vue'
import './styles/index.css'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    // app is the Vue 3 app instance from createApp()
    // router is VitePress' custom router (see `lib/app/router.js`)
    // siteData is a ref of current site-level metadata.
  },
}
