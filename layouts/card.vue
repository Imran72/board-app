<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { usePendingFavorite } from '~/composables/usePendingFavorite';
import { useWebApp } from "vue-tg";
import { useRouter } from 'vue-router'; 

interface TelegramWebApp {
  WebApp: {
    BackButton: {
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
    close: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: TelegramWebApp;
  }
}

const router = useRouter(); 
const pendingAction = usePendingFavorite();
const { initDataUnsafe } = useWebApp();

const handleBackClick = async () => {
  console.log('BackButton: Кнопка "Назад" нажата');
  console.log('BackButton: Текущий маршрут:', router.currentRoute.value.path);
  console.log('BackButton: История браузера:', window.history.state);
  
  if (pendingAction.value && pendingAction.value.eventId && pendingAction.value.action) {
    const userId = initDataUnsafe?.user?.id;
    if (userId) {
      const payload = {
        user_id: userId,
        event_id: pendingAction.value.eventId,
        action: pendingAction.value.action,
      };
      
      $fetch('/api/toggleFavorite', {
        method: 'POST',
        body: payload
      }).catch(err => {
        console.error("Ошибка отложенного сохранения:", err.data || err);
      });
    }
    pendingAction.value = { eventId: null, action: null };
  }

  // Проверяем, находимся ли мы на странице редактирования события
  const currentRoute = router.currentRoute.value;
  if (currentRoute.path === '/addEvent') {
    console.log('BackButton: Находимся на странице /addEvent');
    
    // Проверяем, есть ли ID редактируемого события в localStorage
    const editingEventId = localStorage.getItem('editingEventId');
    console.log('BackButton: ID редактируемого события:', editingEventId);
    
    if (editingEventId) {
      // Возвращаемся к редактируемому событию
      console.log('BackButton: Возвращаемся к редактируемому событию:', editingEventId);
      
      // Добавляем небольшую задержку для стабилизации базы данных
      console.log('BackButton: Добавляем задержку 1 секунду для стабилизации БД...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push(`/event/${editingEventId}`);
      return;
    }
    
    // Если не редактируем, проверяем историю браузера
    if (window.history.state.back) {
      console.log('BackButton: Возвращаемся по истории браузера');
      router.back();
    } else {
      // Если истории нет, возвращаемся на главную
      console.log('BackButton: Возвращаемся на главную');
      router.push('/');
    }
  } else if (currentRoute.path.startsWith('/event/')) {
    // Находимся на странице события - возвращаемся к главному меню
    console.log('BackButton: Находимся на странице события, возвращаемся к главному меню');
    console.log('BackButton: Переходим на главную страницу (/)');
    router.push('/');
  } else if (currentRoute.path === '/') {
    // Находимся на главной странице - ничего не делаем
    console.log('BackButton: Находимся на главной странице, кнопка "Назад" не активна');
    return;
  } else if (window.history.state.back) {
    // Проверяем, есть ли куда возвращаться в истории
    console.log('BackButton: Возвращаемся по истории браузера');
    router.back();
  } else {
    // Если истории нет (пришли по прямой ссылке), переходим на главную
    console.log('BackButton: История пуста, переходим на главную');
    router.push('/');
  }
};

onMounted(() => {
  if (process.client && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Показываем кнопку "Назад" только если мы не на главной странице
    const currentRoute = router.currentRoute.value;
    if (currentRoute.path !== '/') {
      console.log('BackButton: Показываем кнопку "Назад" для маршрута:', currentRoute.path);
      tg.BackButton.show();
      tg.BackButton.onClick(handleBackClick);
    } else {
      console.log('BackButton: Скрываем кнопку "Назад" на главной странице');
      tg.BackButton.hide();
    }
  }
});

// Следим за изменениями маршрута
watch(() => router.currentRoute.value.path, (newPath) => {
  if (process.client && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    if (newPath === '/') {
      console.log('BackButton: Маршрут изменился на главную, скрываем кнопку "Назад"');
      tg.BackButton.hide();
    } else {
      console.log('BackButton: Маршрут изменился на:', newPath, 'показываем кнопку "Назад"');
      tg.BackButton.show();
      tg.BackButton.onClick(handleBackClick);
    }
  }
});

onUnmounted(() => {
  if (process.client && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.BackButton.offClick(handleBackClick);
    tg.BackButton.hide();
  }
});
</script>

<style scoped></style>