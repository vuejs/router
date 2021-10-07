<template>
  <div class="main-container">
    <ParentLayout>
      <template #sidebar-top>
        <div class="sponsors sponsors-top">
          <span>Platinum Sponsors</span>

          <a
            v-for="sponsor in sponsors.platinum"
            :href="sponsor.href"
            :key="sponsor.href"
            target="_blank"
            rel="noopener"
          >
            <img :src="sponsor.imgSrcLight" :alt="sponsor.alt" />
          </a>
        </div>
      </template>

      <template #sidebar-bottom>
        <div class="sponsors">
          <span>Sponsors</span>

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
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/dist/client/theme-default'
import sponsors from '../components/sponsors.json'

export default {
  name: 'Layout',
  components: {
    ParentLayout: DefaultTheme.Layout
  },
  data() {
    return {
      sponsors
    }
  }
}
</script>

<style>
td code {
  white-space: nowrap;
}

form {
  margin-block-end: 0;
}

.custom-blocks {
  overflow-x: auto;
}
</style>

<style scoped>
.sponsors {
  margin: 0 0 1rem 1.35rem;
}

.sponsors-top {
  margin-top: 1rem;
  /* workaround padding in vitepress */
  margin-bottom: -2rem;
}

.sponsors > span {
  /* margin: 1.25rem 0; */
  display: block;
  color: #999;
  font-size: 0.8rem;
}

.sponsors a:last-child {
  margin-bottom: 20px;
}
.sponsors a:first-child {
  margin-top: 18px;
}

.sponsors a {
  margin-top: 10px;
  width: 125px;
  display: block;
}
</style>
