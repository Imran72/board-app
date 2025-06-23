<script setup lang="ts">
import { useRouter } from "#vue-router";
import { onMounted, ref } from "vue";
import { useWebApp } from "vue-tg";
import styles from './assets/favorites.module.css'
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

definePageMeta({
  layout: 'header-favorites',
});

interface MyEvent {
  event_name: string;
  event_id: string;
  event_banner: string;
  event_host?: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_moderation_step: string;
}

const myEvents = ref<MyEvent[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

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


onMounted(async () => {
  const { initDataUnsafe } = useWebApp();
  const userId = initDataUnsafe?.user?.id;

  if (userId) {
    try {
      const response = await $fetch<{ data: MyEvent[], error?: string }>('/api/loadMyEvents', {
        method: 'POST',
        body: { user_id: userId }
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        myEvents.value = response.data;
      }
    } catch (error: any) {
      console.error("Error loading my events:", error);
      errorMessage.value = "Не удалось загрузить события. Попробуйте позже.";
    }
  } else {
    errorMessage.value = "Не удалось определить пользователя.";
  }
  
  isLoading.value = false;
});

const getStatusClass = (status: string) => {
  if (status === 'На модерации') return styles.status_moderation;
  if (status === 'Отклонено') return styles.status_rejected;
  if (status === 'Одобрено') return styles.status_approved;
  return '';
};

const router = useRouter();

const goToEvent = (id: string) => {
  if (!id) return;
  router.push({
    path: `/event/${id}`,
    query: { from: '/myEvents' }
  });
};
</script>

<template>
  <div :class="styles.saved_events_page">
    
    <div v-if="isLoading" :class="styles.loading">
      Загрузка ваших событий...
    </div>
    
    <div v-else-if="errorMessage" :class="styles.error_message">
      {{ errorMessage }}
    </div>
    
    <div v-else-if="myEvents.length === 0" :class="styles.no_events">
      У вас пока нет созданных событий.
    </div>
    
    <div v-else :class="styles.events_container">
      <div
          :class="styles.event_card"
          v-for="event in myEvents"
          :key="event.event_id">

        <div :class="styles.event_image" @click="goToEvent(event.event_id)">
          <img v-if="event.event_banner" :src="event.event_banner" alt="Event Banner" />
        </div>

        <div :class="styles.event_details">
          <!-- Название события -->
          <h3 :class="styles.event_name">{{ event.event_name }}</h3>

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
              <span :class="styles.icon"><img src="/icons/Location.svg" /></span>
              <span>{{ event.event_location }}</span>
            </div>
            
            <div :class="styles.event_separator"></div>
          </div>
          
          <div :class="[styles.status_badge, getStatusClass(event.event_moderation_step)]" v-if="event.event_moderation_step">
              {{ event.event_moderation_step }}
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
  overflow-x: hidden; /* Запрещаем горизонтальный скролл */
}
</style>