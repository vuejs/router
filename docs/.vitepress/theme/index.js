import DefaultTheme from 'vitepress/dist/client/theme-default'
import Bit from '../components/Bit.vue'
import ExampleButton from '../components/ExamplePreviewBarButton.vue'

/** @type {import('vitepress').Theme} */
const config = {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('Bit', Bit)
    app.component('ExampleButton', ExampleButton)
  },
}

export default config
