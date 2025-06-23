<script setup lang="ts">

import CustomSwipe from '~/components/SwipeCard.vue'

import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
</script>

<template>
  <section>
    <CustomSwipe />
  </section>
</template>

<style scoped>
</style>