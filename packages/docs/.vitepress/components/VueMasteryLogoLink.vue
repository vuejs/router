<script setup lang="ts">
const props = defineProps<{
  for: string,
}>()

const links = {
  'vue-router-cheat-sheet': 'https://www.vuemastery.com/vue-router/?coupon=ROUTER-DOCS&via=eduardo'
}

const link = links[props.for]

const forVueRouterCheatSheet = props.for === 'vue-router-cheat-sheet'
</script>

<template>
  <a :href="link" target="_blank">
    <span class="logo-wrapper">
      <img alt="Vue Mastery Logo" width="25px" src="https://storage.googleapis.com/vue-mastery.appspot.com/flamelink/media/vue-mastery-logo.png">
    </span>
    <span v-if="forVueRouterCheatSheet" class="description">
      Get the <span>Vue Router Cheat Sheet</span> from Vue Mastery
    </span>
  </a>
</template>

<style scoped>
a {
  background-color: rgba(27,31,35,0.05);
  border-radius: 8px;
  padding: 8px 16px 8px 8px;
  transition: color 0.5s, background-color 0.5s;
  display: flex;
  align-items: center;
  margin-top:10px;
  margin-bottom:10px;
}

.description {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #2c3e50;
  margin: 0 0 0 16px;
  transition: color 0.5s;
}

a:hover {
  text-decoration: none !important;
}

.description span {
  color: #3eaf7c;
}

.logo-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-wrapper img {
  width: 25px;
  object-fit: contain;
}

@media (max-width: 576px) {

  .description {
    font-size: 12px;
    line-height: 18px;
  }
  .logo-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
  }
}
</style>