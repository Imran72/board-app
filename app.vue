<template>
  <!-- Корневой макет приложения -->
  <NuxtLayout>
    <!-- Отображает компонент текущей страницы -->
    <NuxtPage />
  </NuxtLayout>



<!--  <ul>-->
<!--    <li v-for="todo in todos" :key="todo.id">{{ todo.name }}</li>-->
<!--  </ul>-->



</template>

<script lang="ts" setup>

//
//import { supabase } from '../utils/supabase'
//const todos = ref([])
//
//async function getTodos() {
//  const { data } = await supabase.from('todos').select()
//  todos.value = data
//}
//
//onMounted(() => {
//  getTodos()
//})




import { onMounted } from 'vue';

// Выполняется после монтирования приложения
onMounted(() => {
  // Отключает вертикальные свайпы в Telegram
  window.Telegram.WebApp.disableVerticalSwipes();

  // Устанавливает чёрный фон для Telegram
  window.Telegram.WebApp.setBackgroundColor("#000000");
});
</script>



<style>
/* Глобальные стили: чёрный фон и современный шрифт */
html, body {
  background-color: #000; /* Чёрный фон */
  font-family: 'Inter', sans-serif !important; /* Современный шрифт */
}
</style>
