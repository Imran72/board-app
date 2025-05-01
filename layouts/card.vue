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
  if (process.client && (window as any).Telegram?.WebApp) {
    const tg = (window as any).Telegram.WebApp as TelegramWebApp['WebApp'];

    tg.BackButton.show();

    tg.BackButton.onClick(() => {


      const eventId = route.params.id; // Достаём id события из роута
      if (window.history.length > 1) {

        const returnPath = route.query.from || '/'; // Берём путь точки входа
        console.log(returnPath);

        router.push({ path: (returnPath as string), query: { scrollTo: eventId } });

      } else {
        tg.close();
      }

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