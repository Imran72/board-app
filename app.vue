<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useWebApp } from 'vue-tg';

declare global {
  interface Window {
    Telegram: any;
  }
}

const { ready, initDataUnsafe } = useWebApp();

const isUserInitialized = useState('isUserInitialized', () => false);

// Функция для извлечения данных пользователя из URL hash
const extractUserFromHash = () => {
  if (typeof window === 'undefined') return null;
  
  const hash = window.location.hash;
  if (!hash.includes('tgWebAppData=')) return null;
  
  try {
    const tgData = hash.split('tgWebAppData=')[1];
    if (!tgData) return null;
    
    const userMatch = tgData.match(/user=([^&]+)/);
    if (!userMatch) return null;
    
    const userData = JSON.parse(decodeURIComponent(userMatch[1]));
    return userData;
  } catch (e) {
    console.error('Ошибка при парсинге данных Telegram:', e);
    return null;
  }
};

onMounted(async () => {
  // Инициализируем приложение Telegram
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.disableVerticalSwipes();
    window.Telegram.WebApp.setBackgroundColor("#000000");
  }
  ready();

  // Пытаемся получить user_id из разных источников
  let userId = initDataUnsafe?.user?.id;
  let userData = initDataUnsafe?.user;
  
  // Если initDataUnsafe пустой, пробуем из URL hash
  if (!userId) {
    const hashUser = extractUserFromHash();
    if (hashUser) {
      userId = hashUser.id;
      userData = hashUser;
      console.log('Получен user_id из URL hash:', userId);
    }
  }
  
  if (userId) {
    try {
      console.log('Отправляем запрос на инициализацию пользователя:', { userId, userData });
      await $fetch('/api/users/check', {
        method: 'POST',
        body: { user_id: userId, user_data: userData }
      });
      isUserInitialized.value = true;
      console.log('✅ Пользователь успешно инициализирован, флаг установлен в true');
    } catch (error) {
      console.error('❌ Ошибка при инициализации пользователя:', error);
      isUserInitialized.value = false;
    }
  } else {
    console.error('❌ Не удалось получить user_id от Telegram.');
    console.log('initDataUnsafe:', initDataUnsafe);
    console.log('URL hash:', window.location.hash);
    isUserInitialized.value = false;
  }
});
</script>

<style>
html,
body {
  background-color: #000;
  font-family: 'Inter', sans-serif !important;
}
</style>