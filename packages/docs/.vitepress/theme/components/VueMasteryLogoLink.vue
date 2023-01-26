<template>
  <a
    href="https://www.vuemastery.com/vue-router?coupon=ROUTER-DOCS&via=eduardo"
    target="_blank"
  >
    <span class="logo-wrapper">
      <img
        alt="Vue Mastery Logo"
        width="25px"
        src="https://firebasestorage.googleapis.com/v0/b/vue-mastery.appspot.com/o/flamelink%2Fmedia%2Fvue-mastery-logo-small.png?alt=media&token=941fcc3a-2b6f-40e9-b4c8-56b3890da108"
      />
    </span>
    <span class="description">
      Get the <span>Vue Router Cheat Sheet</span> from Vue Mastery
    </span>
  </a>
</template>

<style scoped>
a {
  background-color: var(--vp-c-bg-alt);
  border-radius: 8px;
  padding: 8px 16px 8px 8px;
  transition: color 0.5s, background-color 0.5s;
  display: flex;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.description {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: var(--vp-c-text-1);
  margin: 0 0 0 16px;
  transition: color 0.5s;
}

a:hover {
  text-decoration: none !important;
}

.description span {
  color: var(--vp-c-brand);
}

.logo-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--vp-c-bg-soft);
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
