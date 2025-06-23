<script setup lang="ts">

// Импортируем компонент свайп-карты из папки components
import CustomSwipe from '~/components/SwipeCard.vue'

import { useRoute, useRouter } from 'vue-router';
import { onMounted } from 'vue';

const route = useRoute();
const router = useRouter();
</script>

<template>
  <section>
    <!-- Выводим компонент свайп-карты -->
    <CustomSwipe />
<!-- Отрисовывает свайп-карту, например для отображения карточек событий-->
  </section>
</template>

<style scoped>
  /* Означает, что стили (если бы они были) применяются только к этому компоненту */
</style>