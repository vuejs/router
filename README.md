# vue-router [![nmp version](https://img.shields.io/npm/v/vue-router.svg)](https://npmx.dev/package/vue-router) [![test](https://github.com/vuejs/router/actions/workflows/test.yml/badge.svg)](https://github.com/vuejs/router/actions/workflows/test.yml) [![codecov](https://codecov.io/gh/vuejs/router/graph/badge.svg?token=azNM3FI0d1)](https://codecov.io/gh/vuejs/router)

> To see what versions are currently supported, please refer to the [Security Policy](./packages/router/SECURITY.md).

<h2 align="center">Supporting Vue Router</h2>

Vue Router is part of the Vue Ecosystem and is an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/posva)
- [One-time donation via PayPal](https://paypal.me/posva)

<!--sponsors start-->

<h4 align="center">Gold Sponsors</h4>
<p align="center">
    <a href="https://www.coderabbit.ai/?utm_source=vuerouter&utm_medium=sponsor" target="_blank" rel="noopener noreferrer">
    <picture>
      <source srcset="https://posva-sponsors.pages.dev/logos/coderabbitai-dark.svg" media="(prefers-color-scheme: dark)" height="72px" alt="CodeRabbit" />
      <img src="https://posva-sponsors.pages.dev/logos/coderabbitai-light.svg" height="72px" alt="CodeRabbit" />
    </picture>
  </a>
</p>

<h4 align="center">Silver Sponsors</h4>
<p align="center">
    <a href="https://www.vuemastery.com/" target="_blank" rel="noopener noreferrer">
    <picture>
      <source srcset="https://posva-sponsors.pages.dev/logos/vuemastery-dark.png" media="(prefers-color-scheme: dark)" height="42px" alt="VueMastery" />
      <img src="https://posva-sponsors.pages.dev/logos/vuemastery-light.svg" height="42px" alt="VueMastery" />
    </picture>
  </a>
    <a href="https://www.controla.ai/?utm_source=posva" target="_blank" rel="noopener noreferrer">
    <picture>
      <source srcset="https://posva-sponsors.pages.dev/logos/controla-dark.png" media="(prefers-color-scheme: dark)" height="42px" alt="Controla" />
      <img src="https://posva-sponsors.pages.dev/logos/controla-light.png" height="42px" alt="Controla" />
    </picture>
  </a>
    <a href="https://jobs.sendcloud.com" target="_blank" rel="noopener noreferrer">
    <picture>
      <source srcset="https://posva-sponsors.pages.dev/logos/sendcloud-dark.svg" media="(prefers-color-scheme: dark)" height="42px" alt="SendCloud" />
      <img src="https://posva-sponsors.pages.dev/logos/sendcloud-light.svg" height="42px" alt="SendCloud" />
    </picture>
  </a>
</p>

<h4 align="center">Bronze Sponsors</h4>
<p align="center">
    <a href="https://www.rtvision.com/" target="_blank" rel="noopener noreferrer">
    <picture>
      <source srcset="https://avatars.githubusercontent.com/u/8292810" media="(prefers-color-scheme: dark)" height="26px" alt="RTVision" />
      <img src="https://avatars.githubusercontent.com/u/8292810" height="26px" alt="RTVision" />
    </picture>
  </a>
    <a href="https://storyblok.com" target="_blank" rel="noopener noreferrer">
    <picture>
      <source srcset="https://posva-sponsors.pages.dev/logos/storyblok.png" media="(prefers-color-scheme: dark)" height="26px" alt="Storyblok" />
      <img src="https://posva-sponsors.pages.dev/logos/storyblok.png" height="26px" alt="Storyblok" />
    </picture>
  </a>
</p>

<!--sponsors end-->

---

Get started with the [documentation](https://router.vuejs.org).

## Quickstart

- In-browser [playground](https://play.vuejs.org/#eNqlVGtv2jAU/SteNgmqFRvoNk1Ziuiqat20R9VN/bJMU0gMuE1sy3YoFeK/79rOi0L7ZUIQ5z7OPfeeizdBkTCOb3UQBqyQQhm0QamiiaFnUqItmitRoN6qpL2YNwFKlIaqxouJN7QhNrf2JVJinx/zBrkP36OYI4RLTfs+3b8XouSm33sJab2j4Dio0oFfZGghc8if2MBoOZpc0jwXttiLiMCrM0v3gIM2SvDF5LxUinLjOSOZmGUYkcqHNhv0yjnwvMzzK3Ci7dbBEI8T8WRVA147ll8Zv0NGnMYBiYPJJwFndCkKGpHW/2RGMgNLk3Zm3/byIlLXjKw2u1g3jN4jUsVV7og0g4F5+Vlic0DRb7QQ6uGSaQOP48rocbtKDxo1Gz1tg650LWptqJStZbcN7cQ1lmYF6NqFpoLrShSFTne49De2vaWnGR7i3j86tiEuW4fotx/RxquLeqQHzQmgxEH4sCW/dVndQKfHbnTbgw//A79bWE0Ybbdpu486VUwapKkpJcoTvgCJjQZ5rSbeCUd4ebS440mNBGs73lNwZ2b/V6eBOljIqzYoEgkXgOBQyk0+rhxQIUTOYm3tYlhzHCyNkTokpOTyboFhgKSNmL4lGSjVsWCqi8FMiXsN51tArqSIAy60YamrdQi0ck9HHpHxjK5xsYMwhTIkoysjRK4HiWRPYe0FTt/jER63XLu+Pca2HNwNWxic0bC+c7Z4NDa7RSyn6oc0DNZ7Z3wJ3FT3X5zNqJI25NMlTe8O2G/12rdxpSgwWNFOwyZRCwrXiHVf/PxO13BunIXIyhyin3FeUy3y0nL0YR9LngHtTpxj+9ltAeOLX/pibSjXdVOWqJuGi3ercf5M6y3dE/ymM0VtHnKqcartVQV33jGyF5rPmwmVURWisVwjIMsy9HI4HH6wrgLgGB/MhDGiCNFoKNfOLpMsA7KNBarEHGDRBCXoNXwdcJWd0zn817uRy3G3cgvfEkjTtEMgREP4jCsEaOev0TdU2SFBO+/wEJ8E2395AHxh)
- Add it to an existing Vue Project:

  ```bash
  npm install vue-router@5
  ```

## Contributing

See [Contributing Guide](https://github.com/vuejs/router/blob/main/.github/contributing.md).

## Special Thanks

<a href="https://www.browserstack.com">
  <img src="https://github.com/vuejs/vue-router/raw/dev/assets/browserstack-logo-600x315.png" height="80" title="BrowserStack Logo" alt="BrowserStack Logo" />
</a>

Special thanks to [BrowserStack](https://www.browserstack.com) for letting the maintainers use their service to debug browser specific issues.
