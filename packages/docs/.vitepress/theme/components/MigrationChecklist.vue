<script setup lang="ts">
const items = [
  { text: 'Remove', code: 'unplugin-vue-router', after: 'dependency' },
  { text: 'Update', code: 'vue-router', after: 'to v5' },
  {
    text: 'Change plugin import:',
    code: 'unplugin-vue-router/vite',
    arrow: 'vue-router/vite',
  },
  {
    text: 'Change data loader imports:',
    code: 'unplugin-vue-router/data-loaders/*',
    arrow: 'vue-router/experimental',
  },
  {
    text: 'Change utility imports:',
    code: 'unplugin-vue-router',
    arrow: 'vue-router/unplugin',
  },
  {
    text: 'Change Volar plugins:',
    code: 'unplugin-vue-router/volar/*',
    arrow: 'vue-router/volar/*',
  },
  {
    text: 'Remove',
    code: 'unplugin-vue-router/client',
    after: 'from tsconfig / env.d.ts',
  },
]
</script>

<template>
  <ul class="migration-checklist">
    <li v-for="(item, i) in items" :key="i">
      <label>
        <input type="checkbox" />
        <span>
          {{ item.text }} <code>{{ item.code }}</code>
          <template v-if="item.arrow">
            → <code>{{ item.arrow }}</code></template
          >
          <template v-if="item.after"> {{ item.after }}</template>
        </span>
      </label>
    </li>
  </ul>
</template>

<style scoped>
.migration-checklist {
  list-style: none;
  padding-left: 0;
}

.migration-checklist li {
  margin: 0.5rem 0;
}

.migration-checklist label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
}

.migration-checklist input[type='checkbox'] {
  margin-top: 0.3rem;
  cursor: pointer;
}
</style>
