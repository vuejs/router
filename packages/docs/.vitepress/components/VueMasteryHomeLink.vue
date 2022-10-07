<script setup lang="ts">
</script>

<template>
  <div class="container">
    <div class="inside">
      <a href="https://www.vuemastery.com/vue-router?coupon=ROUTER-DOCS&via=eduardo" target="_blank">
        <span class="logo-wrapper">
          <img alt="Vue Mastery Logo" width="25px" src="https://firebasestorage.googleapis.com/v0/b/vue-mastery.appspot.com/o/flamelink%2Fmedia%2Fvue-mastery-logo-small.png?alt=media&token=941fcc3a-2b6f-40e9-b4c8-56b3890da108">
        </span>
        <span class="description">
          Get the <span class="highlight">Vue Router Cheat Sheet</span> from Vue Mastery
        </span>
      </a>
    </div>
  </div>
</template>

<style scoped>

.container {
  text-align: center;
  margin-top: -30px;
}

.inside {
  width:960px;
  border-bottom: 1px solid var(--c-divider);
  padding-bottom:50px;
  margin: 0 auto;
}

a {
  background-color: rgba(27,31,35,0.05);
  border-radius: 8px;
  padding: 8px 16px 8px 8px;
}

.description {
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #2c3e50;
  margin-left:10px;
  transition: color 0.5s;
}

a:hover {
  text-decoration: none !important;
}

.description .highlight {
  color: #3eaf7c;
}

@media (max-width: 960px) {
  .inside {
    width:100%;
  }
}

@media (max-width: 420px) {   
  a {
    display:block;
    margin-left: 10px;
    margin-right: 10px;
  }
}
</style>