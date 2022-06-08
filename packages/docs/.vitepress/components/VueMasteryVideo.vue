<template>
  <a href="#" role="button" @click.prevent="open" ref="el">
    <img :src="img" :alt="title" style="border-radius: 6px" />
  </a>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
    default: 'Get started with Vue Router',
  },
  img: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
})

const isOpened = ref(false)
const el = ref<HTMLElement>()

function open() {
  // dropped v-if/v-else way to fix autoplay issue on Chrome
  // https://github.com/vuejs/vuex/pull/1453#issuecomment-441507095
  isOpened.value = true
  const element = el.value
  if (!element || !element.parentNode) {
    return
  }
  const attrs = {
    width: '640',
    height: '360',
    frameborder: '0',
    src: props.url + '?autoplay=1',
    webkitallowfullscreen: 'true',
    mozallowfullscreen: 'true',
    allowfullscreen: 'true',
  }
  const video = document.createElement('iframe')
  for (const name in attrs) {
    video.setAttribute(name, attrs[name as keyof typeof attrs])
  }
  element.parentNode.replaceChild(video, element)
}
</script>
