<script setup>
// Импортируем необходимые функции из Vue 3 Composition API
import { ref, watch} from 'vue';
// Импортируем функции для работы с маршрутизацией
import { useRoute, useRouter } from 'vue-router';
// Импортируем CSS модуль для стилизации компонента
import styles from './assets/headerFavorites.module.css';

// Создаем реактивную переменную для отслеживания активной вкладки
// По умолчанию активна вкладка 'favorites' (Сохраненные)
const activeTab = ref('favorites');

// Получаем объекты для работы с маршрутизацией
const route = useRoute(); // Доступ к текущему маршруту
const router = useRouter(); // Доступ к роутеру для навигации

// Функция для установки активной вкладки и перехода на соответствующую страницу
const setActiveTab = (tab) => {
  activeTab.value = tab; // Обновляем активную вкладку
  router.push({ path: `/${tab}` }); // Переходим на страницу с соответствующим путем
};

// Функция для проверки, является ли вкладка активной
// Возвращает true, если переданная вкладка совпадает с активной
const isActiveTab = (tab) => activeTab.value === tab;

// Следим за изменением маршрута с помощью watch
// Это нужно для синхронизации состояния вкладок при прямом переходе по URL
watch(
    () => route.path, // Отслеживаем изменения в пути маршрута
    (newPath) => {
      // Если путь начинается с '/myEvents', устанавливаем активную вкладку 'myEvents'
      if (newPath.startsWith('/myEvents')) {
        activeTab.value = 'myEvents';
      } else {
        // В остальных случаях устанавливаем активную вкладку 'favorites'
        activeTab.value = 'favorites';
      }
    },
    { immediate: true } // Запускаем watcher сразу при монтировании компонента
);

</script>

<template>
  <div :class="styles.header">
    <!-- Контейнер для вкладок -->
    <div :class="styles.tabs">
      <span
          :class="[styles.tab, isActiveTab('favorites') ? styles.activeTab : '']"
          @click="setActiveTab('favorites')"
      >Сохраненные</span>

      <span
          :class="[styles.tab, isActiveTab('myEvents') ? styles.activeTab : '']"
          @click="setActiveTab('myEvents')"
      >Мои события</span>
    </div>
  </div>
</template>


