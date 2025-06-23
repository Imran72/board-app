<template>
  <div
      v-if="event.event_banner"
      class="event-background"
      :style="{ backgroundImage: `url(${event.event_banner})` }"
  ></div>

  <div class="event-page">

    <div class="card-container">
      <div class="card">
        <img :src="event.event_banner" alt="Event Banner" class="card-image" />
      </div>
    </div>

    <h1 class="event-title">{{ event.event_name }}</h1>

    <p class="event-date">
      {{ capitalizeMonth(event.event_date)}},
      {{event.event_time}} GMT+3
    </p>

    <div class="event-actions">
      <button class="action-button">
        <img src="/icons/save.svg" alt="Save Icon" class="button-icon" />
        Сохранить
      </button>
      <button class="action-button" >
        <img src="/icons/Contact.svg" alt="Contact Icon" class="button-icon" />
        Контакт
      </button>
      <button class="action-button" @click="shareEvent(event.event_id)">
        <img src="/icons/Share.svg" alt="Share Icon" class="button-icon" />
        Поделиться
      </button>
      <button class="action-button">
        <img src="/icons/More.svg" alt="More Icon" class="button-icon" />
      </button>
    </div>

    <div class="section" >
      <p class="section-title">О событии</p>
      <hr class="divider" />
      <p class="section-content">{{ event.event_desc }}</p>
    </div>

    <div class="section">
      <p class="section-title">Ссылки</p>
      <hr class="divider" />
      <p class="section-content"></p>
    </div>

    <div class="section">
      <p class="section-title">Тэги</p>
      <hr class="divider" />
      <p class="section-content"></p>
    </div>

    <div class="section">
      <p class="section-title">Локация</p>
      <hr class="divider" />
      <p class="section-content"></p>
    </div>

  </div>
</template>

<script setup lang="ts">
import {format} from "date-fns";

definePageMeta({
  layout: 'card',
});

import './assets/event-card.css';

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {ru} from "date-fns/locale";

interface Event {
  event_id: string;
  event_name: string;
  event_host: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_banner: string;
  event_desc: string;
}

const route = useRoute();
const router = useRouter();
const event = ref<Event>({
  event_id: "",
  event_name: "",
  event_host: "",
  event_date: "2024-01-01",
  event_time: "",
  event_location: "",
  event_banner: "",
  event_desc: "",
});

const showBackButton = ref(false);
const cameFromMyEvents = ref(false);

const fetchEvent = async (id : string) => {
  event.value = await loadCards(id);
};

onMounted(() => {
  const query = route.query;
  if (query.startapp || query.tgWebAppStartParam || query.start_param) {
    showBackButton.value = true; // Показываем кнопку "Назад"
  }
  
  if (query.from === '/myEvents') {
    cameFromMyEvents.value = true;
    showBackButton.value = true;
  }
  
  // Загружаем данные события по ID из параметров маршрута
  fetchEvent(String(route.params.id));
});

const handleBack = () => {
  if (cameFromMyEvents.value) {
    // Если пришли со страницы "Мои события", возвращаемся туда
    router.push('/myEvents');
  } else {
    // Иначе возвращаемся на предыдущую страницу
    router.back();
  }
};

const shortWeekdays = {
  понедельник: "Пн",
  вторник: "Вт",
  среда: "Ср",
  четверг: "Чт",
  пятница: "Пт",
  суббота: "Сб",
  воскресенье: "Вс",
};

const capitalizeMonth = (dateStr: string) => {
  const date = new Date(dateStr);

  const fullWeekday = format(date, "EEEE", { locale: ru }); // "понедельник"
  const formattedDate = format(date, "d MMMM", { locale: ru }); // "1 января"

  const capitalizedMonth = formattedDate.replace(/\s(\p{L})/u, (match) => match.toUpperCase());

  const shortWeekday = shortWeekdays[fullWeekday.toLowerCase()] || fullWeekday;

  return `${shortWeekday}, ${capitalizedMonth}`;
};

interface LoadCardResponse {
  data?: Event
  error?: string
}

const loadCards = async (id : string) => {
  try {
    // Сначала пробуем загрузить из основной таблицы events
    let response = await $fetch<LoadCardResponse>('/api/loadCardById', {
      method: 'POST',
      body: { id }
    })

    // Если не найдено в events, пробуем загрузить из events_raw
    if (response.error) {
      response = await $fetch<LoadCardResponse>('/api/loadMyEventById', {
        method: 'POST',
        body: { id }
      })
    }

    if (response.error) {
      console.error('Ошибка загрузки карточки:', response.error)
      return null
    }

    return response.data || null
  } catch (err) {
    console.error('Неожиданная ошибка:', err)
    return null
  }
};

const shareEvent = (eventId) => {
  // Создаем URL события для Telegram WebApp
  const eventUrl = `https://t.me/Board_demo_bot/my_board_app?startapp=event_${eventId}`;
  const eventName = event.value.event_name || 'Мероприятие';
  // Обычный текст, как было раньше
  const shareText = `Посмотри это мероприятие:`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(shareText + ' ' + eventName)}`;
  window.open(shareUrl, '_blank');
};

</script>

<style scoped>
body, html {
  overflow-x: hidden; /* Запрещает горизонтальный скролл */
  width: 100vw;
}
</style>
