<script setup lang="ts">

import { useWebApp } from 'vue-tg';
import { ref } from 'vue';
import { onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import './assets/styles.css';

const isUserChecked = ref(false);

// Функция для проверки и добавления пользователя в базу данных
const checkAndAddUser = async (initDataUnsafe) => {
  try {
    // Извлекаем данные пользователя из Telegram WebApp
    const userId = initDataUnsafe?.user?.id;
    const userFirstName = initDataUnsafe?.user?.first_name;
    const userLastName = initDataUnsafe?.user?.last_name;
    const userName = initDataUnsafe?.user?.username;
    const userCreatedDate = new Date().toISOString().split('T')[0]; // Текущая дата в формате YYYY-MM-DD

    const response = await fetch('/api/users/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        userFirstName: userFirstName,
        userLastName: userLastName,
        userName: userName,
        userCreatedDate: userCreatedDate}),
    });

    const result = await response.json();
    isUserChecked.value = true;

  } catch (error) {
    console.error('Ошибка при проверке пользователя:', error);
  }
};

onMounted(() => {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const {initDataUnsafe, ready} = useWebApp();
  const route = useRoute();
  const router = useRouter();

  // Уведомляем Telegram, что приложение готово к работе
  ready();

  const startapp = route.query.startapp;
  if (startapp && typeof startapp === 'string') {
    const eventId = startapp.replace('event_', '');
    if (eventId) {
      // Перенаправляем на страницу события
      router.replace(`/event/${eventId}`);
      return;
    }
  }

  const userId = initDataUnsafe?.user?.id;

  if (userId) {
    checkAndAddUser(initDataUnsafe);
  } else {
    console.error('User ID не передан Telegram');
  }
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
});

</script>

<template>
  <div>
    <Header />

    <main class="main-content">
      <NuxtPage />
    </main>

    <Footer />
  </div>
</template>

<style scoped>
</style>