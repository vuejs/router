<template>
  <a id="vs" href="https://vueschool.io/sales/summer-vue/?friend=vuerouter" target="_blank" rel="noreferrer">
    <div class="vs-iso">
      <img src="/images/vueschool/vs-iso.svg" alt="Vue School Logo">
    </div>
    <div class="vs-logo">
      <img src="/images/vueschool/vs-logo.svg" alt="Vue School Logo">
    </div>
    <div class="vs-core">
      <div class="vs-backpack">
        <img src="/images/vueschool/vs-backpack.png" alt="Backpack">
      </div>
      <div class="vs-slogan">
        Extended! <span class="vs-slogan-light">Last few hours</span> for the Vue School offer
      </div>
      <div class="vs-button">
        GET ACCESS
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
#vs {
  align-items: center;
  background-color: #202A5A;
  box-sizing: border-box;
  color: #fff;
  font-family: 'Roboto', Oxygen, Fira Sans, Helvetica Neue, sans-serif;
  justify-content: center;
  position: fixed;
  padding: 0 10px;
  left: 0;
  right: 0;
  top: 0;
  z-index: 100;
  height: 3.125rem;
  display: flex;
}

#vs:hover {
  text-decoration: none;
}

@media (min-width: 680px) {
  #vs {
    height: 5rem;
  }
}

#vs:hover .vs-core .vs-button {
  background: #f22606;
}

#vs .vs-iso {
  position: absolute;
  left: 20px;
  height: 26px;
  display: none;
}

#vs .vs-iso img {
  height: 26px;
}

@media (min-width: 680px) {
  #vs .vs-iso {
    height: 40px;
    display: inline-block;
  }

  #vs .vs-iso img {
    height: 40px;
  }
}

@media (min-width: 900px) {
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

#vs .vs-core .vs-backpack {
  margin-right: 14px;
  position: absolute;
}

#vs .vs-core .vs-backpack img {
  height: 50px;
}

@media (min-width: 680px) {
  #vs .vs-core .vs-backpack {
    position: static;
    margin-right: 0;
  }

  #vs .vs-core .vs-backpack img {
    height: 74px;
  }
}

@media (min-width: 900px) {
  #vs .vs-core .vs-backpack {
    margin-right: 14px;
  }
}

#vs .vs-core .vs-slogan {
  color: #FFF;
  font-weight: bold;
  font-size: 14px;
  text-align: center;
  padding:  0 90px;
}

@media (min-width: 680px) {
  #vs .vs-core .vs-slogan {
    padding: 0;
    text-align: left;
    margin-right: 26px;
    margin-right: 0;
    font-size: 18px;
  }
}

#vs .vs-core .vs-slogan > .vs-slogan-light {
  color: #ff5338;
  text-align: left;
}

@media (min-width: 900px) {
  #vs .vs-core .vs-slogan > .vs-slogan-light {
    text-align: center;
    display: inline;
  }
}

#vs .vs-core .vs-button {
  margin-left: 13px;
  color: #fff;
  padding: 13px 24px;
  border-radius: 40px;
  display: none;
  background: #ff5338;
  font-weight: bold;
}

@media (min-width: 680px) {
  #vs .vs-core .vs-button {
    display: inline-block;
  }
}

#vs .vs-close {
  right: 10px;
  position: absolute;
  padding: 10px;
}

@media (min-width: 680px) {
  #vs .vs-close {
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
  margin-top: 3.125rem;
}

.main-container.has-top-banner .nav-bar {
  margin-top: 3.125rem;
}

.main-container.has-top-banner .sidebar {
  margin-top: 3.125rem;
}

.main-container.has-top-banner .page {
  margin-top: 3.125rem;
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
