<template>
  <a id="vs" href="https://vueschool.io/sales/flashsale21/?friend=vuerouter" target="_blank" rel="noreferrer">
    <div class="vs-iso">
      <img src="/images/vueschool/vs-iso.svg" alt="Vue School logo">
    </div>
    <div class="vs-logo">
      <img src="/images/vueschool/vs-logo.svg" alt="Vue School logo">
    </div>
    <div class="vs-core">
      <div class="vs-illustration">
        <img src="/images/vueschool/vs-backpack.svg" alt="backpack illustration">
      </div>
      <div class="vs-slogan">
        <span class="vs-slogan-main">Flash Sale -</span> Less than <span style="color: #1fdb69">48hrs left</span> to get 20% OFF!
      </div>
      <div class="vs-button">
        GET OFFER
      </div>
    </div>
    <div
      id="vs-close"
      class="vs-close"
      @click.stop.prevent="$emit('close')">
      <img src="/images/vueschool/close.svg" alt="Close">
    </div>
  </a>
</template>

<style>
@import url("https://fonts.googleapis.com/css?family=Roboto:400,500");
#vs {
  text-decoration: none;
  align-items: center;
  background-color: #202a5a;
  background-position: top right;
  background-repeat: no-repeat;
  background-size: cover;
  box-sizing: border-box;
  color: #fff;
  display: none;
  font-family: 'Roboto', Oxygen, Fira Sans, Helvetica Neue, sans-serif;
  justify-content: center;
  position: fixed;
  padding: 0 10px;
  left: 0;
  right: 0;
  top: 0;
  z-index: 100;
  height: 3.125rem;
}
@media (min-width: 680px) {
  #vs {
    height: 5rem;
  }
}
#vs:hover .vs-core .vs-button {
  background-color: #364fde;
}
#vs .vs-iso {
  position: absolute;
  left: 20px;
  height: 26px;
}
#vs .vs-iso img {
  height: 26px;
}
@media (min-width: 680px) {
  #vs .vs-iso {
    display: none;
  }
}
#vs .vs-logo {
  position: absolute;
  display: none;
  left: 40px;
}
@media (min-width: 900px) {
  #vs .vs-logo {
    display: block;
  }
}
#vs .vs-core {
  display: flex;
  align-items: center;
}
#vs .vs-core .vs-illustration {
  display: none;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-illustration {
    display: inline-block;
    margin-right: 8px;
  }
}
@media (min-width: 900px) {
  #vs .vs-core .vs-illustration {
    margin-right: 20px;
  }
}
#vs .vs-core .vs-slogan {
  text-align: center;
  font-size: 14px;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-slogan {
    font-size: 20px;
  }
}
@media (min-width: 900px) {
  #vs .vs-core .vs-slogan {
    font-size: 22px;
  }
}
#vs .vs-core .vs-slogan .vs-slogan-main {
  font-weight: 500;
  display: none;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-slogan .vs-slogan-main {
    display: inline;
  }
}
#vs .vs-core .vs-button {
  margin-left: 8px;
  color: #fff;
  background: #667dff;
  padding: 2px;
  border-radius: 40px;
  display: none;
  padding: 17px 24px;
  font-weight: 500;
}
@media (min-width: 680px) {
  #vs .vs-core .vs-button {
    display: inline-block;
  }
}
@media (min-width: 900px) {
  #vs .vs-core .vs-button {
    margin-left: 20px;
  }
}
#vs .vs-close {
  right: 10px;
  position: absolute;
  padding: 10px;
}
@media (min-width: 680px) {
  #vs .vs-close {
    right: 0px;
  }
}
@media (min-width: 900px) {
  #vs .vs-close {
    right: 20px;
  }
}
#vs .vs-close:hover {
  color: #56d8ff;
}

/************************************/

.theme-container.has-top-banner #vs {
  display: flex;
}

.theme-container.has-top-banner {
  margin-top: 3.125rem;
}

.theme-container.has-top-banner .nav-bar {
  margin-top: 3.125rem;
}

.theme-container.has-top-banner .sidebar {
  margin-top: 3.125rem;
}

.theme-container.has-top-banner .page {
  margin-top: 3.125rem;
}

@media (min-width: 680px) {
  .theme-container.has-top-banner {
    margin-top: 5rem;
  }

  .theme-container.has-top-banner .nav-bar {
    margin-top: 5rem;
  }

  .theme-container.has-top-banner .sidebar {
    margin-top: 5rem;
  }

  .theme-container.has-top-banner .page {
    margin-top: 5rem;
  }
}
</style>
