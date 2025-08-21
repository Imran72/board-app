<script setup lang="ts">
import { ref } from 'vue';
import Header from '~/components/Header.vue';
import CustomSwipe from '~/components/SwipeCard.vue';

const activeFilters = ref({
  tags: [],
  dates: [],
});

const handleFiltersChanged = (filters: { tags: string[]; dates: string[] }) => {
  activeFilters.value = filters;
};
</script>

<template>
  <!-- Корневой элемент страницы -->
  <section class="page-section">
    <Header @filters-changed="handleFiltersChanged" />
    <CustomSwipe :filters="activeFilters" />
  </section>
</template>

<style scoped>
.page-section {
  /* ✅ ИЗМЕНЕНИЕ: Используем flexbox, чтобы страница гибко заполняла родительский контейнер */
  display: flex;
  flex-direction: column;
  
  /* Это свойство заставит секцию занять всё доступное вертикальное пространство 
     внутри .main-content, уважая его padding-bottom. */
  flex-grow: 1;  
  background-color: #000;
  overflow: hidden; /* Предотвращаем случайные скроллы */
}
</style>
