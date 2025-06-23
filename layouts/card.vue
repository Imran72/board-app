<script setup lang="ts">

import { onMounted } from 'vue';


interface TelegramWebApp {
  WebApp: {
    BackButton: {
      show: () => void; // Показать кнопку "Назад"
      hide: () => void; // Скрыть кнопку "Назад"
      onClick: (callback: () => void) => void;
    };
    close: () => void;
    MainButton: {
      hide: () => void;
    };
  };
}

const route = useRoute(); // Доступ к текущему маршруту и его параметрам
const router = useRouter(); // Доступ к роутеру для программной навигации

onMounted(() => {
  // Проверяем, что код выполняется на клиенте и доступен Telegram WebApp API
  if (process.client && (window as any).Telegram?.WebApp) {
    // Получаем доступ к Telegram WebApp API
    const tg = (window as any).Telegram.WebApp as TelegramWebApp['WebApp'];
    
    // Показываем кнопку "Назад" в Telegram WebApp
    tg.BackButton.show();

    // Устанавливаем обработчик клика на кнопку "Назад"
    tg.BackButton.onClick(() => {
      // Проверяем, есть ли параметр fromShare=true в URL
      if (route.query.fromShare === 'true') {
        // Если пользователь пришел по прямой ссылке, ведем на главную
        router.push('/');
      } 
      // Проверяем, пришел ли пользователь со страницы "Мои события"
      else if (route.query.from === '/myEvents') {
        // Возвращаемся на страницу "Мои события"
        router.push('/myEvents');
      } 
      // Проверяем, есть ли история переходов в браузере
      else if (window.history.length > 1) {
        // Если есть история, возвращаемся назад
        const returnPath = route.query.from || '/';
        router.push({ path: (returnPath as string) });
      } 
      // В остальных случаях закрываем приложение
      else {
        tg.close();
      }

      // Скрываем кнопку "Назад" после обработки клика
      tg.BackButton.hide();
    });
  } else {
    console.error('Telegram WebApp API недоступен');
  }
});

</script>

<template>
  <NuxtPage />
</template>

<style scoped>
</style>