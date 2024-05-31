---
layout: home

title: Vue Router
titleTemplate: The official Router for Vue.js

hero: 
  name: Vue Router
  text: The official Router for Vue.js
  tagline: Expressive, configurable and convenient routing for Vue.js
  image:
    src: /logo.svg
    alt: Vue Router
  actions:
    - theme: brand
      text: Get Started
      link: /installation
    - theme: cta vueschool
      text: Free Video Course
      link: https://vueschool.io/courses/vue-router-4-for-everyone?friend=vuerouter&utm_source=vuerouter&utm_medium=link&utm_campaign=homepage
    - theme: cta vue-mastery
      text: Get the Vue Router Cheat Sheet
      link: https://www.vuemastery.com/vue-router?coupon=ROUTER-DOCS&via=eduardo

features:
  - title: 🛣 Expressive route syntax
    details: Define static and dynamic routes with an intuitive and powerful syntax.
  - title: 🛑 Fine-grained Navigation control
    details: Intercept any navigation and precisely control its outcome.
  - title: 🧱 Component-based configuration
    details: Map each route to the component that should display.
  - title: 🔌 History modes
    details: Choose between HTML5, Hash or Memory history modes.
  - title: 🎚 Scroll control
    details: Precisely control the scroll position in every page.
  - title: 🌐 Automatic Encoding
    details: Directly use unicode characters (你好) in your code.
---

<script setup>
import HomeSponsors from './.vitepress/theme/components/HomeSponsors.vue'
import './.vitepress/theme/styles/home-links.css'
</script>

<HomeSponsors />
