<script setup lang="ts">


definePageMeta({
  layout: 'header-favorites',
});


import {useRouter} from "#vue-router";
import styles from './assets/favorites.module.css';
import {onMounted, ref} from "vue";
import {useWebApp} from "vue-tg";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Event {
  event_name: string;
  event_id: string;
  event_banner: string;
  event_host: string;
  event_date: string;
  event_time: string;
  event_location: string;
}

const favorite_events = ref<Event[]>([]);

onMounted(() => {

  console.log(getComputedStyle(document.body).fontFamily);

  const {initDataUnsafe} = useWebApp();
  const userId = initDataUnsafe?.user?.id;

  loadFavorites(userId);


});

const route = useRoute();
const router = useRouter();

const goToEvent = (id: string) => {

  router.push({
        path: `/event/${id}`,
        query: { from: route.fullPath },
      }
  );
  // При клике на карточку происходит переход на страницу события, а в query добавляем, откуда пользователь пришёл.
};


interface LoadFavoritesResponse {
  data?: Event[]
  error?: string
  // Ответ может содержать либо данные, либо ошибку.
}

const loadFavorites = async (userId) => { //Асинхронная функция принимает ID пользователя.
  try {
    const response = await $fetch<LoadFavoritesResponse>('/api/loadFavorites', {
      method: 'POST',
      body: { user_id: userId }
    }) //Отправляем POST-запрос на /api/loadFavorites, передаём ID пользователя в теле запроса.
    // $fetch — это Nuxt/Fastify-хелпер для HTTP-запросов

    if (response.error) {
      console.error('Ошибка при загрузке избранного:', response.error)
      return
    }

    favorite_events.value = response.data || []
  } catch (err) {
    console.error('Ошибка запроса избранного:', err)
  }
};


// Список сокращённых дней недели
const shortWeekdays = {
  понедельник: "Пн",
  вторник: "Вт",
  среда: "Ср",
  четверг: "Чт",
  пятница: "Пт",
  суббота: "Сб",
  воскресенье: "Вс",
};

const getDateLine1 = (dateStr: string) => {
  const date = new Date(dateStr);
  const fullWeekday = format(date, 'EEEE', { locale: ru });
  const dayOfMonth = format(date, 'd');
  const shortWeekday = shortWeekdays[fullWeekday.toLowerCase()];
  return `${shortWeekday}, ${dayOfMonth}`;
};

const getDateLine2 = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = format(date, 'MMMM', { locale: ru });
  return month.charAt(0).toUpperCase() + month.slice(1);
};

</script>

<template>
  <div :class="styles.saved_events_page">
    <div :class="styles.events_container">
      <div
          :class="styles.event_card"
          v-for="(event, index) in favorite_events"
          :key="index">

        <div :class="styles.event_image" @click="goToEvent(event.event_id)">
          <img v-if="event.event_banner" :src="event.event_banner" alt="Event Banner" />
        </div>

        <div :class="styles.event_details">

          <h3 :class="styles.event_name">{{event.event_name}}</h3>
          <p :class="styles.event_host">@{{event.event_host}}</p>
          <div :class="styles.event_meta">
            <div :class="styles.event_date">
              <div :class="styles.date_section">
                <img src="/public/icons/Date.svg" alt="Date" />
                <div :class="styles.date_info">
                  <span>{{ getDateLine1(event.event_date) }}</span>
                  <span>{{ getDateLine2(event.event_date) }}</span>
                </div>
              </div>
              <div :class="styles.time_section">
                <img src="/public/icons/Time.svg" alt="Time" />
                <div :class="styles.time_info">
                  <span>{{ event.event_time }}</span>
                  <span>GMT+3</span>
                </div>
              </div>
            </div>
            <div :class="styles.event_location">
              <span :class="styles.icon">
                <img src="/icons/Location.svg" />
              </span>
              <span>{{event.event_location}}</span>
            </div>
            <div :class="styles.event_separator"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden;
}



</style>


