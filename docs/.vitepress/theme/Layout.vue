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
    <template #sidebar-bottom>
      <div class="sponsors">
        <a
          href="https://github.com/sponsors/posva"
          target="_blank"
          rel="noopener"
          >Sponsors</a
        >

        <a
          v-for="sponsor in sponsors.gold"
          :href="sponsor.href"
          :key="sponsor.href"
          target="_blank"
          rel="noopener"
        >
          <img :src="sponsor.imgSrcLight" :alt="sponsor.alt" />
        </a>
      </div>
    </template>
  </ParentLayout>
</template>

<script>
import DefaultTheme from 'vitepress/dist/client/theme-default'
import CarbonAds from './components/CarbonAds.vue'
import BuySellAds from './components/BuySellAds.vue'
import sponsors from '../components/sponsors.json'

export default {
  name: 'Layout',

  components: {
    ParentLayout: DefaultTheme.Layout,
    CarbonAds,
    BuySellAds,
  },

  setup() {
    return { sponsors }
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

<style scoped>
.sponsors {
  padding: 0 1.5rem 2rem;
  font-size: 0.8rem;
}

.sponsors a {
  color: #999;
}

.sponsors img {
  max-width: 200px;
  max-height: 40px;
  display: block;
  margin: 1.25rem 0;
}
</style>
