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


    <!-- Название мероприятия -->
    <h1 class="event-title">{{ event.event_name }}</h1>


    <p class="event-date">
      {{ capitalizeMonth(event.event_date)}},
      {{event.event_time}} GMT+3
    </p>

    <!-- Кнопки действий -->
    <div class="event-actions">
      <button class="action-button">
        <img src="/icons/save.svg" alt="Save Icon" class="button-icon" />
        Сохранить
      </button>
      <button class="action-button">
        <img src="/icons/Contact.svg" alt="Contact Icon" class="button-icon" />
        Контакт
      </button>
      <button class="action-button">
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
import { useRoute } from 'vue-router';
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



const fetchEvent = async (id : string) => {

  event.value = await loadCards(id);

};



onMounted(() => {



  fetchEvent(String(route.params.id));
});


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

const capitalizeMonth = (dateStr: string) => {

  console.log(123)
  console.log(dateStr)

  const date = new Date(dateStr);

  // Получаем полное название дня недели и месяца
  const fullWeekday = format(date, "EEEE", { locale: ru }); // "понедельник"
  const formattedDate = format(date, "d MMMM", { locale: ru }); // "1 января"

  // Делаем первую букву месяца заглавной
  const capitalizedMonth = formattedDate.replace(/\s(\p{L})/u, (match) => match.toUpperCase());

  // Получаем сокращённый день недели
  const shortWeekday = shortWeekdays[fullWeekday.toLowerCase()] || fullWeekday;

  return `${shortWeekday}, ${capitalizedMonth}`;
};



interface LoadCardResponse {
  data?: Event
  error?: string
}


// Загрузка карточек из базы данных
const loadCards = async (id : string) => {
  try {
    const response = await $fetch<LoadCardResponse>('/api/load-card-by-id', {
      method: 'POST',
      body: { id }
    })

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




</script>

<style  scoped>

/* Убираем горизонтальный скролл */
body, html {
  overflow-x: hidden; /* Запрещает горизонтальный скролл */
  width: 100vw;
}
</style>
