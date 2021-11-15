<template>
  <a
    id="vs"
    href="https://vueschool.io/sales/blackfriday?friend=vuerouter"
    target="_blank"
    rel="noreferrer"
  >
    <BannerCoins />
    <div class="vs-core">
      <div class="vs-logo">
        <img src="/images/vueschool/vueschool_blackfriday_logo.svg">
      </div>
      <div class="vs-slogan">
        <div class="vs-slogan-subtitle">
          Access to all Vue Courses at Vue School
        </div>
        <div class="vs-slogan-title">
          Black Friday <strong>40% OFF</strong>
        </div>
      </div>
      <div class="vs-button">
        Get Discount
      </div>
    </div>
    <div id="vs-close" class="vs-close" @click.stop.prevent="$emit('close')">
      <img src="/images/vueschool/vueschool_close.svg" alt="Close">
    </div>
  </a>
</template>

<script>
import BannerCoins from './BannerCoins.vue'

export default {
  components: {
    BannerCoins
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600&display=swap');

#vs {
  align-items: center;
  background-color: #000c19;
  box-sizing: border-box;
  color: #fff;
  display: none;
  font-family: 'Inter', Roboto, Oxygen, Fira Sans, Helvetica Neue, sans-serif;
  justify-content: center;
  position: fixed;
  padding: 0 10px;
  left: 0;
  right: 0;
  top: 0;
  z-index: 100;
  height: 5rem;
  line-height: 1;
}
#vs:hover {
  text-decoration: none;
}
@media (min-width: 680px) {
  #vs {
    height: 5rem;
    justify-content: center;
  }
}
#vs:hover .vs-core .vs-button {
  background: linear-gradient(261deg, #e61463 100%, #db5248 3%);
}
#vs .vs-core {
  display: flex;
  align-items: center;
}
#vs .vs-core .vs-slogan {
  font-family: Archivo;
  color: #fff;
  margin-left: 8px;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-slogan {
    margin-left: 24px;
  }
}
#vs .vs-core .vs-slogan .vs-slogan-subtitle {
  font-size: 12px;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-slogan .vs-slogan-subtitle {
    font-size: 14px;
  }
}
#vs .vs-core .vs-slogan .vs-slogan-title {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-slogan .vs-slogan-title {
    font-size: 18px;
  }
}
#vs .vs-core .vs-slogan .vs-slogan-title strong {
  color: #ffae29;
  font-weight: 600;
}
#vs .vs-core .vs-button {
  color: #fff;
  padding: 7px 10px;
  border-radius: 4px;
  background: linear-gradient(to left, #e61b60, #dd4a4c);
  font-weight: 600;
  white-space: nowrap;
  margin-right: 18px;
  margin-left: 16px;
  font-family: 'Archivo', sans-serif;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-button {
    margin-right: 0;
    padding: 8px 24px;
    margin-left: 32px;
  }
}
@media (min-width: 680px) {
  #vs .vs-core .vs-button {
    margin-left: 69px;
  }
}
#vs .vs-close {
  right: 6px;
  position: absolute;
}
@media (min-width: 680px) {
  #vs .vs-close {
    padding: 10px;
    right: 20px;
  }
}
#vs .vs-close:hover {
  color: #56d8ff;
}

/************************************/

.main-container.has-top-banner #vs {
  display: flex;
}

.main-container.has-top-banner {
  margin-top: 5rem;
}

.main-container.has-top-banner .nav-bar {
  margin-top: 5rem;
}

.main-container.has-top-banner .sidebar {
  margin-top: 5rem;
}

.main-container.has-top-banner .page {
  margin-top: 5rem;
}

@media (min-width: 680px) {
  .main-container.has-top-banner {
    margin-top: 5rem;
  }

  .main-container.has-top-banner .nav-bar {
    margin-top: 5rem;
  }

  .main-container.has-top-banner .sidebar {
    margin-top: 5rem;
  }

  .main-container.has-top-banner .page {
    margin-top: 5rem;
  }
}
</style>
