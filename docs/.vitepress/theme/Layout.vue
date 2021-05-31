<template>
  <ParentLayout>
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
import sponsors from '../components/sponsors.json'

export default {
  name: 'Layout',

  components: {
    ParentLayout: DefaultTheme.Layout,
  },

  setup() {
    return { sponsors }
  },
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
