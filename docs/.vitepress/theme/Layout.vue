<template>
  <div
    class="theme-container"
    :class="{ 'has-top-banner': showTopBanner }"
  >
    <BannerTop
      v-if="showTopBanner"
      @close="closeBannerTop"
    />
    <ParentLayout>
      <template #page-top-ads><span /></template>
      <template #page-top>
        <CarbonAds
          v-if="$site.themeConfig.carbonAds"
          :key="'carbon' + $page.relativePath"
          :code="$site.themeConfig.carbonAds.carbon"
          :placement="$site.themeConfig.carbonAds.placement"
        />
      </template>
      <template #page-bottom>
        <BuySellAds
          v-if="$site.themeConfig.carbonAds"
          :key="'custom' + $page.relativePath"
          :code="$site.themeConfig.carbonAds.custom"
          :placement="$site.themeConfig.carbonAds.placement"
        />
      </template>
    </ParentLayout>
  </div>
</template>

<script>
import DefaultTheme from 'vitepress/dist/client/theme-default'
import CarbonAds from './components/CarbonAds.vue'
import BuySellAds from './components/BuySellAds.vue'
import BannerTop from './components/BannerTop.vue'

export default {
  name: 'Layout',

  components: {
    ParentLayout: DefaultTheme.Layout,
    CarbonAds,
    BuySellAds,
    BannerTop
  },

  data () {
    return {
      showTopBanner: false
    }
  },

  mounted () {
    this.showTopBanner = !localStorage.getItem('VS_OFFER_BANNER_CLOSED')
  },

  methods: {
    closeBannerTop () {
      this.showTopBanner = false
      localStorage.setItem('VS_OFFER_BANNER_CLOSED', 1)
    }
  }
}
</script>

<style>
form {
  margin-block-end: 0;
}

.custom-blocks {
  overflow-x: auto;
}
</style>
