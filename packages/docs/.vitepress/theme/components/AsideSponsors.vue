<script setup>
const banners = [
  {
    id: 1,
    name: 'Vue.js Certification',
    link: 'https://certificates.dev/vuejs/?friend=VUEROUTER&utm_source=affiliate&utm_medium=vuerouter&utm_campaign=VueRouter_CERT&utm_content=sidebar',
    image: '/banners/vuejs-certification.svg',
  },
  {
    id: 2,
    name: 'Mastering Pinia',
    link: 'https://masteringpinia.com/?utm_source=affiliate&utm_medium=vuerouter&utm_campaign=VueRouter_MP&utm_content=sidebar',
    image: '/banners/mastering-pinia.png',
  },
]
</script>

<template>
  <a
    v-for="banner in banners"
    :key="banner.id"
    :href="banner.link"
    target="_blank"
    :class="`banner_image_${banner.id}`"
  >
    <img :src="banner.image" :alt="banner.name" />
  </a>
</template>

<style scoped>
.banner_image_1 {
  padding: 25px 10px 0px 0px;
}

.banner_image_2 {
  padding: 15px 10px 15px 0px;
}
</style>
