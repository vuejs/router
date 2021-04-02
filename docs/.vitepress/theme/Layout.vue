<template>
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
</template>

<script>
import DefaultTheme from 'vitepress/dist/client/theme-default'
import CarbonAds from './components/CarbonAds.vue'
import BuySellAds from './components/BuySellAds.vue'

export default {
  name: 'Layout',

  components: {
    ParentLayout: DefaultTheme.Layout,
    CarbonAds,
    BuySellAds,
  },
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
