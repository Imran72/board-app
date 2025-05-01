<script setup lang="ts">
import { onMounted } from 'vue';

// Проверяем, есть ли Telegram WebApp API
interface TelegramWebApp {
  WebApp: {
    BackButton: {
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
    };
    close: () => void;
    MainButton: {
      hide: () => void;
    };
  };
}

const route = useRoute();
const router = useRouter();

onMounted(() => {
  if (process.client && (window as any).Telegram?.WebApp) { // process.client — чтобы убедиться, что код выполняется на клиенте (не на сервере)
    // window.Telegram?.WebApp — проверяем доступность Telegram WebApp API
    const tg = (window as any).Telegram.WebApp as TelegramWebApp['WebApp'];
    // Сохраняем Telegram WebApp API в переменной tg и явно указываем его тип
    tg.BackButton.show(); // Показываем кнопку назад в Telegram WebApp

    tg.BackButton.onClick(() => {


      const eventId = route.params.id; // Достаём id события из роута
      if (window.history.length > 1) {
        // Проверяем, есть ли история переходов, чтобы решить — возвращаться назад или закрывать WebApp
        const returnPath = route.query.from || '/'; // Берём путь точки входа
        console.log(returnPath);

        router.push({ path: (returnPath as string), query: { scrollTo: eventId } });

      } else {
        tg.close();
      }

      tg.BackButton.hide();
      // Скрываем кнопку назад, чтобы она не дублировалась после возвращения

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