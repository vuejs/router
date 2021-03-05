<template>
  <div id="sponsors">
    <div class="inner">
      <HomeSponsorsGroup v-if="sponsors.platinum" name="Platinum" size="160" />

      <HomeSponsorsGroup v-if="sponsors.gold" name="Gold" size="140" />

      <HomeSponsorsGroup v-if="sponsors.silver" name="Silver" size="120" />

      <a
        class="become-sponsor button white"
        href="https://github.com/sponsors/posva"
        >Become a Sponsor!</a
      >
    </div>
  </div>
</template>

<script setup>
import HomeSponsorsGroup from './HomeSponsorsGroup.vue'
import sponsors from './sponsors.json'
</script>

<style>
#sponsors {
  text-align: center;
  padding: 35px 40px 45px;
  margin: 0 -2.5rem;
  background-color: #f6f6f6;
}

#sponsors h3 {
  margin: 0 0 10px;
}

#sponsors a,
#sponsors img {
  width: 100px;
  text-decoration: none;
  display: inline-block;
  vertical-align: middle;
}

#sponsors img {
  transition: all 0.3s ease;
  filter: grayscale(100%);
  opacity: 0.66;
}

#sponsors img:hover {
  filter: none;
  opacity: 1;
}

#sponsors .become-sponsor {
  margin-top: 40px;
  font-size: 0.9em;
  font-weight: 700;
  width: auto;
  background-color: transparent;
  padding: 0.75em 2em;
  border-radius: 2em;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 2px solid var(--c-text);
  color: var(--c-text);
}

#sponsors .become-sponsor:hover {
  background-color: var(--c-brand);
  border-color: var(--c-brand);
}
</style>
