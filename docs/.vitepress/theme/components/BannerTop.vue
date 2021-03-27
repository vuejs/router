<template>
  <a id="vs" href="https://vueschool.io/the-vuejs-master-class/?friend=vuerouter#plans" target="_blank" rel="noreferrer">
    <div class="vs-iso">
      <img src="/images/vueschool/vs-iso.svg" alt="Vue School Logo">
    </div>
    <div class="vs-logo">
      <img src="/images/vueschool/vs-logo.svg" alt="Vue School Logo">
    </div>
    <div class="vs-core">
      <div class="vs-slogan">
        <div class="vs-slogan-up">
           LEARN VUE AT VUE SCHOOL
        </div>
        <div class="vs-slogan-down">
          Register today and get <strong>20% OFF</strong>
        </div>
      </div>
      <div class="vs-button">
        <div class="vs-button-inside">
          <img src="/images/vueschool/learn-more.svg" alt="Learn More">
        </div>
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
  background-color: #1e204d;
  background-position: top right;
  background-repeat: no-repeat;
  background-size: cover;
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
  background-image: url("/images/vueschool/vs-banner-bg-mobile-2.svg");
  height: 3.125rem;
  display: flex;
}

#vs:hover {
  text-decoration: none;
}

@media (min-width: 680px) {
  #vs {
    height: 5rem;
    background-image: url("/images/vueschool/vs-banner-bg-tablet-2.svg");
  }
}

@media (min-width: 900px) {
  #vs {
    background-image: url("/images/vueschool/vs-banner-bg-desktop-2.svg");
  }
}

#vs:hover .vs-core .vs-button .vs-button-inside {
  background: linear-gradient(#ed81eb, #d457d0);
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
    left: 40px;
    height: 40px;
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

#vs .vs-core .vs-slogan {
  text-align: center;
}

#vs .vs-core .vs-slogan .vs-slogan-up {
  color: #47b785;
  font-size: 14px;
  font-weight: bold;
}

@media (min-width: 680px) {
  #vs .vs-core .vs-slogan .vs-slogan-up {
    font-size: 18px;
  }
}

#vs .vs-core .vs-slogan .vs-slogan-down {
  color: #fff;
  font-size: 12px;
  padding-top: 2px;
}

@media (min-width: 680px) {
  #vs .vs-core .vs-slogan .vs-slogan-down {
    font-size: 16px;
  }
}

#vs .vs-core .vs-slogan .vs-slogan-down strong {
  color: #fff;
  font-weight: bold;
}

#vs .vs-core .vs-button {
  margin-left: 43px;
  color: #fff;
  background: linear-gradient(to bottom, #b349b0, #dc61da);
  padding: 2px;
  border-radius: 40px;
  display: none;
}

@media (min-width: 680px) {
  #vs .vs-core .vs-button {
    display: inline-block;
  }
}

#vs .vs-core .vs-button .vs-button-inside {
  border-radius: 40px;
  background: linear-gradient(#dc61da, #b349b0);
  transition: all 0.25s ease-in;
  padding: 12px 24px 8px;
  line-height: 0;
}

@media (min-width: 680px) {
  #vs .vs-core .vs-button .vs-button-inside {
    padding: 12px 24px 8px;
  }
}

#vs .vs-core .vs-button.vs-button-alt {
  background: linear-gradient(to bottom, #ffcc38, #ffd13d);
}

#vs .vs-core .vs-button.vs-button-alt .vs-button-inside {
  background: linear-gradient(to bottom, #ffe24f, #ffa40e);
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
